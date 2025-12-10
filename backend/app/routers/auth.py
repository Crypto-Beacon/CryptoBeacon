from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr
from ..database import get_database
from ..models.user import UserCreate, UserResponse, UserInDB, Token, OTPVerify, TokenData, UserDelete
from ..services.auth_service import get_password_hash, verify_password, create_access_token, generate_otp, send_otp_email, send_goodbye_email
from ..config import settings
from datetime import timedelta, datetime

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Request model for resending OTP
class ResendOTPRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncIOMotorDatabase = Depends(get_database)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": token_data.username})
    if user is None:
        raise credentials_exception
    user["_id"] = str(user["_id"])
    return UserInDB(**user)

@router.post("/register")
async def register(user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Step 1 of registration: Store user in pending_registrations and send OTP.
    User is NOT created in the main users collection until OTP is verified.
    """
    # Check if email already exists in verified users
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if username already exists in verified users
    existing_username = await db.users.find_one({"username": user.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Check if there's already a pending registration for this email
    existing_pending = await db.pending_registrations.find_one({"email": user.email})
    if existing_pending:
        # Delete the old pending registration to allow re-registration
        await db.pending_registrations.delete_one({"_id": existing_pending["_id"]})

    # Generate OTP
    otp = generate_otp()

    # Store in pending_registrations (not users)
    pending_data = {
        "email": user.email,
        "username": user.username,
        "password_hash": get_password_hash(user.password),
        "otp_code": otp,
        "created_at": datetime.utcnow()
    }
    await db.pending_registrations.insert_one(pending_data)

    # Send OTP email
    await send_otp_email(user.email, otp)

    return {"message": "OTP sent to your email. Please verify to complete registration.", "email": user.email}

@router.post("/verify-registration")
async def verify_registration(otp_data: OTPVerify, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Step 2 of registration: Verify OTP and create the actual user account.
    """
    # Find the pending registration
    pending = await db.pending_registrations.find_one({"email": otp_data.email})
    if not pending:
        raise HTTPException(status_code=400, detail="No pending registration found for this email")

    # Check if OTP matches
    if pending["otp_code"] != otp_data.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    # Check if OTP is expired (10 minutes)
    otp_age = datetime.utcnow() - pending["created_at"]
    if otp_age.total_seconds() > 600:  # 10 minutes
        await db.pending_registrations.delete_one({"_id": pending["_id"]})
        raise HTTPException(status_code=400, detail="OTP has expired. Please register again.")

    # Create the actual user in the users collection
    user_dict = {
        "email": pending["email"],
        "username": pending["username"],
        "password_hash": pending["password_hash"],
        "is_verified": True,
        "created_at": datetime.utcnow(),
        "watchlist": []
    }

    new_user = await db.users.insert_one(user_dict)
    
    # Delete the pending registration
    await db.pending_registrations.delete_one({"_id": pending["_id"]})

    return {"message": "Email verified successfully. You can now log in."}

@router.post("/resend-otp")
async def resend_otp(request: ResendOTPRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Resend OTP for a pending registration.
    """
    # Find the pending registration
    pending = await db.pending_registrations.find_one({"email": request.email})
    if not pending:
        raise HTTPException(status_code=400, detail="No pending registration found for this email")

    # Generate new OTP
    new_otp = generate_otp()

    # Update the pending registration with new OTP and reset timestamp
    await db.pending_registrations.update_one(
        {"_id": pending["_id"]},
        {"$set": {"otp_code": new_otp, "created_at": datetime.utcnow()}}
    )

    # Send new OTP email
    await send_otp_email(request.email, new_otp)

    return {"message": "New OTP sent to your email."}

@router.post("/verify-otp")
async def verify_otp(otp_data: OTPVerify, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Legacy endpoint - redirects to verify-registration for backwards compatibility.
    """
    return await verify_registration(otp_data, db)

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Initiate password reset: Check if user exists, generate OTP, and send email.
    """
    user = await db.users.find_one({"email": request.email})
    if not user:
        # For security, we might want to return 200 even if user doesn't exist,
        # but for this project's user-friendliness, we'll return 404/400.
        raise HTTPException(status_code=404, detail="Email not registered")

    # Generate OTP
    otp = generate_otp()

    # Store/Update in password_resets collection
    # Upsert to handle multiple requests
    reset_data = {
        "email": request.email,
        "otp_code": otp,
        "created_at": datetime.utcnow()
    }
    
    await db.password_resets.update_one(
        {"email": request.email},
        {"$set": reset_data},
        upsert=True
    )

    # Send OTP email
    await send_otp_email(request.email, otp)

    return {"message": "Password reset code sent to your email."}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Verify OTP and update password.
    """
    # Check for reset request
    reset_request = await db.password_resets.find_one({"email": request.email})
    if not reset_request:
        raise HTTPException(status_code=400, detail="No password reset request found for this email")

    # Check OTP
    if reset_request["otp_code"] != request.otp_code:
        raise HTTPException(status_code=400, detail="Invalid code")

    # Check Expiry (e.g., 15 mins)
    otp_age = datetime.utcnow() - reset_request["created_at"]
    if otp_age.total_seconds() > 900:
        await db.password_resets.delete_one({"_id": reset_request["_id"]})
        raise HTTPException(status_code=400, detail="Code expired. Please request a new one.")

    # Update Password
    new_hash = get_password_hash(request.new_password)
    await db.users.update_one(
        {"email": request.email},
        {"$set": {"password_hash": new_hash}}
    )

    # Clean up reset request
    await db.password_resets.delete_one({"_id": reset_request["_id"]})

    return {"message": "Password updated successfully. You can now login."}


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncIOMotorDatabase = Depends(get_database)):
    # Try to find user by username first, then by email
    user = await db.users.find_one({"username": form_data.username})
    if not user:
        # If not found by username, try email
        user = await db.users.find_one({"email": form_data.username})
    
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("is_verified", False):
         raise HTTPException(status_code=400, detail="User not verified")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.delete("/delete-account")
async def delete_account(user_delete: UserDelete, current_user: UserInDB = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    # Verify password
    if not verify_password(user_delete.password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    from bson import ObjectId
    user_id = ObjectId(current_user.id)
    
    # Send Goodbye Email
    await send_goodbye_email(current_user.email, current_user.username)

    # 1. Delete associated portfolio items
    # Note: portfolio stores user_id as string
    await db.portfolio.delete_many({"user_id": str(current_user.id)})
    
    # 2. Delete user document (includes watchlist and profile)
    result = await db.users.delete_one({"_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete account")
        
    return {"message": "Account deleted successfully"}
