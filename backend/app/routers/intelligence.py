from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import yfinance as yf
from ..intelligence.forecast import generate_forecast
from ..intelligence.news_agent import fetch_market_news, summarize_articles

router = APIRouter(
    prefix="/intelligence",
    tags=["intelligence"],
    responses={404: {"description": "Not found"}},
)

@router.get("/forecast/{symbol}")
async def get_forecast(symbol: str, days: int = 7):
    # Adjust symbol for yfinance (assuming crypto)
    # Most common crypto tickers on Yahoo Finance format: BTC-USD, ETH-USD
    ticker_symbol = f"{symbol.upper()}-USD"
    
    try:
        # Fetch 6 months of data
        ticker = yf.Ticker(ticker_symbol)
        hist = ticker.history(period="6mo")
        
        if hist.empty:
            # Fallback for standard tickers or try without -USD if needed
            ticker = yf.Ticker(symbol.upper())
            hist = ticker.history(period="6mo")
        
        if hist.empty:
             # Just return empty forecast instead of 404 to prevent UI crashes if yahoo fails
             # or maybe mock data? existing frontend handles errors relatively gracefully?
             # Let's throw 404 but with a clear message
             raise HTTPException(status_code=404, detail=f"No data found for symbol {symbol}")
             
        prices = hist['Close'].tolist()
        
        # Generate forecast
        forecast_values = generate_forecast(prices, days)
        
        # Prepare response
        return {
            "symbol": symbol,
            "forecast": forecast_values
        }
        
    except Exception as e:
        print(f"Error generating forecast: {e}")
        # Return mock data for demo purposes if API fails?
        # For now, let's allow the error to bubble up
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/news")
async def get_news(coin: Optional[str] = Query(None)):
    try:
        query = coin if coin else "crypto"
        # Fetch news
        articles = fetch_market_news(query=query)
        
        # Generate AI summary
        summary = summarize_articles(articles)
        
        return {
            "symbol": coin,
            "summary": summary,
            "articles": articles
        }
    except Exception as e:
        print(f"Error fetching news: {e}")
        raise HTTPException(status_code=500, detail=str(e))
