from fastapi import APIRouter, Depends, HTTPException, Body
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from ..database import get_database
from ..models.user import UserInDB
from .auth import get_current_user
from pydantic import BaseModel

class WatchlistItem(BaseModel):
    symbol: str

router = APIRouter(
    prefix="/watchlist",
    tags=["watchlist"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=list[str])
async def get_watchlist(current_user: UserInDB = Depends(get_current_user)):
    # Handle case where user doesn't have watchlist field (older users)
    return current_user.watchlist if current_user.watchlist else []

@router.post("/add")
async def add_to_watchlist(item: WatchlistItem, current_user: UserInDB = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    user_watchlist = current_user.watchlist or []
    if item.symbol not in user_watchlist:
        # Convert string id back to ObjectId for MongoDB query
        user_id = ObjectId(current_user.id) if current_user.id else None
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid user ID")
        await db.users.update_one({"_id": user_id}, {"$addToSet": {"watchlist": item.symbol}})
        return {"message": f"Added {item.symbol} to watchlist", "action": "added", "item": item.symbol}
    return {"message": f"{item.symbol} already in watchlist", "action": "none", "item": item.symbol}

@router.post("/remove")
async def remove_from_watchlist(item: WatchlistItem, current_user: UserInDB = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    user_watchlist = current_user.watchlist or []
    if item.symbol in user_watchlist:
        # Convert string id back to ObjectId for MongoDB query
        user_id = ObjectId(current_user.id) if current_user.id else None
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid user ID")
        await db.users.update_one({"_id": user_id}, {"$pull": {"watchlist": item.symbol}})
        return {"message": f"Removed {item.symbol} from watchlist", "action": "removed", "item": item.symbol}
    return {"message": f"{item.symbol} not in watchlist", "action": "none", "item": item.symbol}

