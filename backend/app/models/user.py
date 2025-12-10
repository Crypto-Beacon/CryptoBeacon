from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, values):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string"}

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str # Allowing login by username for now, or email if preferred
    password: str

class UserDelete(BaseModel):
    password: str

class UserInDB(UserBase):
    id: Optional[str] = Field(alias="_id", default=None)
    password_hash: str
    is_verified: bool = False
    watchlist: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(UserBase):
    id: Optional[str] = Field(alias="_id", default=None)
    is_verified: bool
    watchlist: List[str]

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class OTPVerify(BaseModel):
    email: EmailStr
    otp_code: str
