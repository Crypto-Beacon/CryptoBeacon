from fastapi import APIRouter, Depends, HTTPException
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..database import get_database
from ..models.portfolio import PortfolioItemCreate, PortfolioItemResponse, PortfolioItemInDB
from ..models.user import UserInDB
from .auth import get_current_user
from ..services.auth_service import send_weekly_report_email
import httpx
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/portfolio",
    tags=["portfolio"],
    responses={404: {"description": "Not found"}},
)

async def get_binance_7d_prices(symbol: str) -> dict:
    """
    Fetch 7-day historical prices from Binance public API.
    Returns dict with 'price_7d_ago' and 'current_price'.
    """
    try:
        async with httpx.AsyncClient() as client:
            # Get current price
            ticker_url = f"https://api.binance.com/api/v3/ticker/price?symbol={symbol}USDT"
            current_resp = await client.get(ticker_url, timeout=10)
            
            if current_resp.status_code != 200:
                return None
                
            current_price = float(current_resp.json()["price"])
            
            # Get 7-day historical klines (1 day interval)
            end_time = int(datetime.now().timestamp() * 1000)
            start_time = int((datetime.now() - timedelta(days=7)).timestamp() * 1000)
            
            klines_url = f"https://api.binance.com/api/v3/klines?symbol={symbol}USDT&interval=1d&startTime={start_time}&endTime={end_time}&limit=7"
            klines_resp = await client.get(klines_url, timeout=10)
            
            if klines_resp.status_code != 200 or not klines_resp.json():
                return {"current_price": current_price, "price_7d_ago": current_price}
            
            klines = klines_resp.json()
            # First kline's open price is the price 7 days ago
            price_7d_ago = float(klines[0][1]) if klines else current_price
            
            return {
                "current_price": current_price,
                "price_7d_ago": price_7d_ago
            }
    except Exception as e:
        print(f"Error fetching Binance data for {symbol}: {e}")
        return None

@router.get("/", response_model=List[PortfolioItemResponse])
async def read_portfolio(current_user: UserInDB = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    items = []
    cursor = db.portfolio.find({"user_id": str(current_user.id)})
    async for document in cursor:
        items.append(PortfolioItemResponse(**document))
    return items

@router.post("/", response_model=PortfolioItemResponse)
async def add_portfolio_item(item: PortfolioItemCreate, current_user: UserInDB = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    item_dict = item.dict()
    item_dict["user_id"] = str(current_user.id)
    
    new_item = await db.portfolio.insert_one(item_dict)
    created_item = await db.portfolio.find_one({"_id": new_item.inserted_id})
    return PortfolioItemResponse(**created_item)

@router.delete("/{item_id}")
async def delete_portfolio_item(item_id: str, current_user: UserInDB = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    from bson import ObjectId
    
    # Validate ObjectId format
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item ID format")
    
    # Find and verify ownership
    item = await db.portfolio.find_one({"_id": obj_id})
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    if item.get("user_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")
    
    # Delete the item
    await db.portfolio.delete_one({"_id": obj_id})
    return {"message": "Portfolio item deleted successfully"}

@router.post("/send-report")
async def send_portfolio_report(current_user: UserInDB = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Send a 7-day portfolio performance report to the user's email.
    Uses Binance public API for historical data.
    """
    # Fetch user's portfolio
    cursor = db.portfolio.find({"user_id": str(current_user.id)})
    portfolio_items = await cursor.to_list(length=None)
    
    if not portfolio_items:
        raise HTTPException(status_code=400, detail="No portfolio items to report")
    
    total_value_now = 0.0
    total_value_7d_ago = 0.0
    total_cost = 0.0
    
    coin_performances = []
    
    for item in portfolio_items:
        symbol = item["coin_symbol"]
        quantity = item["quantity"]
        buy_price = item["buy_price"]
        
        # Get prices from Binance
        prices = await get_binance_7d_prices(symbol)
        
        if not prices:
            continue
        
        current_price = prices["current_price"]
        price_7d_ago = prices["price_7d_ago"]
        
        # Calculate values
        value_now = current_price * quantity
        value_7d_ago = price_7d_ago * quantity
        cost = buy_price * quantity
        
        total_value_now += value_now
        total_value_7d_ago += value_7d_ago
        total_cost += cost
        
        # 7-day change for this coin
        if price_7d_ago > 0:
            change_7d = ((current_price - price_7d_ago) / price_7d_ago) * 100
        else:
            change_7d = 0
        
        coin_performances.append({
            "symbol": symbol,
            "change_7d": change_7d,
            "current_price": current_price
        })
    
    if not coin_performances:
        raise HTTPException(status_code=500, detail="Could not fetch price data")
    
    # Calculate overall stats
    total_pl = total_value_now - total_cost
    pl_percent = (total_pl / total_cost * 100) if total_cost > 0 else 0
    
    # Weekly change (value now vs 7 days ago)
    weekly_change = total_value_now - total_value_7d_ago
    weekly_change_percent = ((total_value_now - total_value_7d_ago) / total_value_7d_ago * 100) if total_value_7d_ago > 0 else 0
    
    # Sort by 7-day performance
    coin_performances.sort(key=lambda x: x["change_7d"], reverse=True)
    
    top = coin_performances[0]
    worst = coin_performances[-1]
    
    report_data = {
        "total_value": total_value_now,
        "total_pl": total_pl,
        "pl_percent": pl_percent,
        "top_coin": top["symbol"],
        "top_perf": round(top["change_7d"], 2),
        "worst_coin": worst["symbol"],
        "worst_perf": round(worst["change_7d"], 2)
    }
    
    # Send email
    success = await send_weekly_report_email(current_user.email, current_user.username, report_data)
    
    if success:
        return {"message": "Portfolio report sent to your email!"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email")
