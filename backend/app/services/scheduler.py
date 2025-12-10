import yfinance as yf
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.jobstores.mongodb import MongoDBJobStore
from pymongo import MongoClient
from ..database import db
from ..config import settings
from .auth_service import send_weekly_report_email
import asyncio

# Setup Persistent Job Store using standard PyMongo (APScheduler requirement)
# This allows the scheduler to remember missed jobs across restarts.
jobstores = {
    'default': MongoDBJobStore(client=MongoClient(settings.MONGO_URI), database=settings.DB_NAME, collection='scheduled_jobs')
}

scheduler = AsyncIOScheduler(jobstores=jobstores)

async def get_current_price(symbol: str, price_cache: dict) -> float:
    """Fetch price from yfinance with caching throughout the job execution."""
    if symbol in price_cache:
        return price_cache[symbol]
    
    try:
        # Try crypto format first
        ticker = yf.Ticker(f"{symbol}-USD")
        history = ticker.history(period="1d")
        
        if history.empty:
            # Try raw symbol
            ticker = yf.Ticker(symbol)
            history = ticker.history(period="1d")
            
        if not history.empty:
            price = history['Close'].iloc[-1]
            price_cache[symbol] = price
            return price
    except Exception as e:
        print(f"Error fetching price for {symbol}: {e}")
        
    return 0.0

async def weekly_report_job():
    print("----- Starting Weekly Report Job -----")
    database = db.get_db()
    users_cursor = database.users.find({})
    
    price_cache = {}
    
    async for user in users_cursor:
        try:
            if not user.get("is_verified"):
                continue
                
            user_id = str(user["_id"])
            email = user.get("email")
            username = user.get("username", "User")
            
            if not email:
                continue

            # Fetch portfolio
            portfolio_cursor = database.portfolio.find({"user_id": user_id})
            portfolio_items = await portfolio_cursor.to_list(length=None)
            
            if not portfolio_items:
                continue
                
            total_value = 0.0
            total_cost = 0.0
            
            coin_performances = []
            
            for item in portfolio_items:
                symbol = item["coin_symbol"]
                quantity = item["quantity"]
                buy_price = item["buy_price"]
                
                current_price = await get_current_price(symbol, price_cache)
                
                # Calculate Values
                item_value = current_price * quantity
                item_cost = buy_price * quantity
                
                total_value += item_value
                total_cost += item_cost
                
                # Performance for this coin
                if item_cost > 0:
                    pnl_percent = ((item_value - item_cost) / item_cost) * 100
                    coin_performances.append({
                        "symbol": symbol,
                        "pnl_percent": pnl_percent
                    })
            
            # Overall Stats
            total_pl = total_value - total_cost
            pl_percent = (total_pl / total_cost * 100) if total_cost > 0 else 0
            
            # Find top and worst performers
            top_coin = "N/A"
            top_perf = 0.0
            worst_coin = "N/A"
            worst_perf = 0.0
            
            if coin_performances:
                coin_performances.sort(key=lambda x: x["pnl_percent"], reverse=True)
                top = coin_performances[0]
                worst = coin_performances[-1]
                
                top_coin = top["symbol"]
                top_perf = round(top["pnl_percent"], 2)
                
                worst_coin = worst["symbol"]
                worst_perf = round(worst["pnl_percent"], 2)
            
            report_data = {
                "total_value": total_value,
                "total_pl": total_pl,
                "pl_percent": pl_percent,
                "top_coin": top_coin,
                "top_perf": top_perf,
                "worst_coin": worst_coin,
                "worst_perf": worst_perf
            }
            
            # Send Email
            await send_weekly_report_email(email, username, report_data)
            print(f"Sent weekly report to {email}")
            
        except Exception as e:
            print(f"Error processing weekly report for user {user.get('_id')}: {e}")

    print("----- Weekly Report Job Completed -----")

def start_scheduler():
    # Run every Sunday at 9:00 AM
    # coalesce=True ensures that if multiple executions were missed,
    # only ONE job runs (the latest), ignoring all previous missed runs.
    # misfire_grace_time=None means: always run missed jobs, no time limit.
    scheduler.add_job(
        weekly_report_job,
        CronTrigger(day_of_week='sun', hour=9, minute=0),
        id='weekly_report',
        replace_existing=True,
        coalesce=True,
        misfire_grace_time=None
    )
    scheduler.start()
    print("Scheduler started (Persistent Mode with Coalesce).")

