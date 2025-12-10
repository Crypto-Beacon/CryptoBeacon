from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
import httpx
from typing import Optional
from datetime import datetime
from ..database import get_database
from ..config import settings
from ..routers.auth import get_current_user

router = APIRouter()

# Crypto name mapping for common cryptocurrencies
CRYPTO_NAMES = {
    "BTC": "Bitcoin",
    "ETH": "Ethereum",
    "USDT": "Tether",
    "SOL": "Solana",
    "BNB": "BNB",
    "XRP": "Ripple",
    "USDC": "USDCoin",
    "ADA": "Cardano",
    "AVAX": "Avalanche",
    "DOGE": "Dogecoin",
    "DOT": "Polkadot",
    "MATIC": "Polygon",
    "SHIB": "Shiba Inu",
    "LTC": "Litecoin",
    "TRX": "TRON",
    "LINK": "Chainlink",
    "UNI": "Uniswap",
    "ATOM": "Cosmos",
    "XLM": "Stellar",
    "ETC": "Ethereum Classic",
    "APT": "Aptos",
    "ARB": "Arbitrum",
    "OP": "Optimism",
    "NEAR": "NEAR Protocol",
    "FIL": "Filecoin",
}


@router.get("/symbols")
async def get_crypto_symbols(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Get list of all available cryptocurrency symbols from Binance.
    Public endpoint - no authentication required for search functionality.
    Cached for 24 hours to reduce API calls.
    """
    # Check cache first
    cached = await db.symbols_cache.find_one({"_id": "binance_symbols"})
    
    if cached:
        # Check if cache is still valid (24 hours)
        age_seconds = (datetime.utcnow() - cached.get("fetched_at", datetime.min)).total_seconds()
        if age_seconds < 86400:  # 24 hours
            return {"symbols": cached.get("symbols", [])}
    
    # Fetch fresh data from Binance
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.binance.com/api/v3/exchangeInfo",
                timeout=15.0
            )
            response.raise_for_status()
            data = response.json()
            
            # Filter USDT pairs and extract symbols
            symbols = []
            seen = set()
            
            for s in data.get("symbols", []):
                if s.get("quoteAsset") == "USDT" and s.get("status") == "TRADING":
                    base = s.get("baseAsset")
                    if base and base not in seen:
                        seen.add(base)
                        name = CRYPTO_NAMES.get(base, base)
                        # Use CoinCap CDN for icons (more reliable)
                        icon = f"https://assets.coincap.io/assets/icons/{base.lower()}@2x.png"
                        
                        symbols.append({
                            "symbol": base,
                            "name": name,
                            "icon": icon
                        })
            
            # Sort alphabetically by name
            symbols.sort(key=lambda x: x["name"])
            
            # Cache in MongoDB
            await db.symbols_cache.update_one(
                {"_id": "binance_symbols"},
                {
                    "$set": {
                        "symbols": symbols,
                        "fetched_at": datetime.utcnow()
                    }
                },
                upsert=True
            )
            
            return {"symbols": symbols}
            
    except Exception as e:
        # Return basic list if Binance API fails
        basic_symbols = [
            {"symbol": k, "name": v, "icon": f"https://ui-avatars.com/api/?name={k}&background=1a1a1a&color=10b981"}
            for k, v in CRYPTO_NAMES.items()
        ]
        return {"symbols": basic_symbols, "error": str(e)}


@router.delete("/symbols/refresh")
async def refresh_symbols_cache(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Clear the symbols cache to force a refresh on next request.
    """
    result = await db.symbols_cache.delete_one({"_id": "binance_symbols"})
    return {"message": "Cache cleared", "deleted": result.deleted_count > 0}

@router.get("/{symbol}")
async def get_crypto_details(symbol: str, current_user = Depends(get_current_user)):
    """
    Get detailed information for a specific cryptocurrency.
    Uses Binance 24hr ticker API for comprehensive market data.
    """
    symbol = symbol.upper()
    
    # Icon map for well-known coins
    icon_map = {
        "BTC": "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
        "ETH": "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
        "USDT": "https://assets.coingecko.com/coins/images/325/small/Tether.png",
        "BNB": "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
        "SOL": "https://assets.coingecko.com/coins/images/4128/small/solana.png",
        "XRP": "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
        "USDC": "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
        "ADA": "https://assets.coingecko.com/coins/images/975/small/cardano.png",
        "AVAX": "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
        "DOGE": "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
        "DOT": "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
        "MATIC": "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
        "SHIB": "https://assets.coingecko.com/coins/images/11939/small/shiba.png",
        "LTC": "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
        "LINK": "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
    }
    
    # Handle stablecoins specially (they don't have XXXUSDT pairs)
    if symbol in ["USDT", "USDC", "DAI", "BUSD", "TUSD"]:
        return {
            "symbol": symbol,
            "name": CRYPTO_NAMES.get(symbol, symbol),
            "icon": icon_map.get(symbol, f"https://ui-avatars.com/api/?name={symbol}&background=1a1a1a&color=10b981&bold=true"),
            "price": 1.00,
            "priceChange": 0.00,
            "priceChangePercent": 0.00,
            "high24h": 1.001,
            "low24h": 0.999,
            "open24h": 1.00,
            "volume": 0,
            "quoteVolume": 0,
            "bidPrice": 1.00,
            "askPrice": 1.00,
            "tradeCount": 0,
            "weightedAvgPrice": 1.00,
            "isStablecoin": True
        }
    
    trading_pair = f"{symbol}USDT"
    url = f"https://api.binance.com/api/v3/ticker/24hr?symbol={trading_pair}"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            
            if response.status_code == 400:
                raise HTTPException(status_code=404, detail=f"Cryptocurrency {symbol} not found")
            
            response.raise_for_status()
            data = response.json()
            
            return {
                "symbol": symbol,
                "name": CRYPTO_NAMES.get(symbol, symbol),
                "icon": icon_map.get(symbol, f"https://ui-avatars.com/api/?name={symbol}&background=1a1a1a&color=10b981&bold=true"),
                
                # Price Data
                "price": float(data["lastPrice"]),
                "priceChange": float(data["priceChange"]),
                "priceChangePercent": float(data["priceChangePercent"]),
                
                # 24h Range
                "high24h": float(data["highPrice"]),
                "low24h": float(data["lowPrice"]),
                "open24h": float(data["openPrice"]),
                
                # Volume
                "volume": float(data["volume"]),
                "quoteVolume": float(data["quoteVolume"]),
                
                # Order Book
                "bidPrice": float(data["bidPrice"]),
                "askPrice": float(data["askPrice"]),
                
                # Trade Stats
                "tradeCount": int(data["count"]),
                
                # Weighted Average
                "weightedAvgPrice": float(data["weightedAvgPrice"]),
            }
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Binance API timeout")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Binance API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch crypto data: {str(e)}")


@router.get("/{symbol}/forecast")
async def get_crypto_forecast(symbol: str, current_user = Depends(get_current_user)):
    """
    Get 7-day price forecast for a cryptocurrency.
    Uses historical data from Binance and Prophet/linear extrapolation for prediction.
    """
    symbol = symbol.upper()
    
    # Handle stablecoins - always $1
    if symbol in ["USDT", "USDC", "DAI", "BUSD", "TUSD"]:
        return {
            "symbol": symbol,
            "currentPrice": 1.00,
            "predictedPrice": 1.00,
            "changePercent": 0.0,
            "forecast": [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
            "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "historicalPrices": [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
            "isStablecoin": True
        }
    
    trading_pair = f"{symbol}USDT"
    
    # Get historical klines (candlestick data) from Binance
    # We'll get 30 days of daily data for the forecast model
    url = f"https://api.binance.com/api/v3/klines?symbol={trading_pair}&interval=1d&limit=30"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            
            if response.status_code == 400:
                raise HTTPException(status_code=404, detail=f"Cryptocurrency {symbol} not found")
            
            response.raise_for_status()
            klines = response.json()
            
            # Extract closing prices from klines
            # Kline format: [open_time, open, high, low, close, volume, ...]
            prices = [float(k[4]) for k in klines]  # Index 4 is close price
            
            if len(prices) < 7:
                raise HTTPException(status_code=400, detail="Insufficient historical data for forecast")
            
            # Import forecasting function
            from ..intelligence.forecast import generate_forecast
            
            # Generate 7-day forecast
            forecast = generate_forecast(prices, days=7)
            
            current_price = prices[-1]
            predicted_price = forecast[-1] if forecast else current_price
            change_percent = ((predicted_price - current_price) / current_price) * 100 if current_price > 0 else 0
            
            return {
                "symbol": symbol,
                "currentPrice": current_price,
                "predictedPrice": predicted_price,
                "changePercent": round(change_percent, 2),
                "forecast": forecast,
                "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                "historicalPrices": prices[-7:],  # Last 7 days for context
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate forecast: {str(e)}")


@router.get("/{symbol}/news/status")
async def get_news_cache_status(
    symbol: str, 
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Check if cached news exists for this cryptocurrency.
    Returns cache status without making any API calls.
    """
    symbol = symbol.upper()
    
    # Check for cached news
    cached = await db.news_cache.find_one({"symbol": symbol})
    
    if cached:
        fetched_at = cached.get("fetched_at")
        article_count = len(cached.get("articles", []))
        
        # Check if cache is still valid (within 24 hours)
        if fetched_at:
            age_seconds = (datetime.utcnow() - fetched_at).total_seconds()
            is_expired = age_seconds > 86400  # 24 hours
            
            return {
                "symbol": symbol,
                "has_cache": True,
                "is_expired": is_expired,
                "article_count": article_count,
                "fetched_at": fetched_at.isoformat(),
                "age_hours": round(age_seconds / 3600, 1)
            }
    
    return {
        "symbol": symbol,
        "has_cache": False,
        "is_expired": True,
        "article_count": 0,
        "fetched_at": None,
        "age_hours": None
    }


@router.get("/{symbol}/news")
async def get_cached_news(
    symbol: str, 
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get cached news for a cryptocurrency.
    Does NOT make any API calls - only returns cached data.
    """
    symbol = symbol.upper()
    crypto_name = CRYPTO_NAMES.get(symbol, symbol)
    
    # Get cached news
    cached = await db.news_cache.find_one({"symbol": symbol})
    
    if cached and cached.get("articles"):
        return {
            "symbol": symbol,
            "name": crypto_name,
            "articles": cached.get("articles", []),
            "fetched_at": cached.get("fetched_at").isoformat() if cached.get("fetched_at") else None,
            "from_cache": True
        }
    
    # No cache found
    return {
        "symbol": symbol,
        "name": crypto_name,
        "articles": [],
        "fetched_at": None,
        "from_cache": False,
        "message": "No cached news. Click 'Load News' to fetch."
    }


@router.post("/{symbol}/news/fetch")
async def fetch_fresh_news(
    symbol: str, 
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Fetch fresh news from NewsData API and cache it.
    This is the only endpoint that makes external API calls.
    Cache is stored for 24 hours.
    """
    symbol = symbol.upper()
    crypto_name = CRYPTO_NAMES.get(symbol, symbol)
    
    try:
        from ..intelligence.news_agent import fetch_market_news
        
        # Fetch news from API
        articles = fetch_market_news(query=crypto_name)
        
        if not articles:
            articles = fetch_market_news(query=symbol)
        
        # Format articles (without AI summary - that's on-demand)
        formatted_articles = []
        for article in articles[:5]:  # Limit to 5 articles
            formatted_articles.append({
                "title": article.get("title", "No Title"),
                "description": article.get("description") or article.get("content", "")[:200],
                "source": article.get("source_id", "Unknown"),
                "date": article.get("pubDate", "")[:10] if article.get("pubDate") else "",
                "link": article.get("link", "")
            })
        
        # Cache in MongoDB
        await db.news_cache.update_one(
            {"symbol": symbol},
            {
                "$set": {
                    "symbol": symbol,
                    "crypto_name": crypto_name,
                    "articles": formatted_articles,
                    "fetched_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return {
            "symbol": symbol,
            "name": crypto_name,
            "articles": formatted_articles,
            "fetched_at": datetime.utcnow().isoformat(),
            "from_cache": False,
            "message": "Fresh news fetched and cached for 24 hours."
        }
        
    except Exception as e:
        return {
            "symbol": symbol,
            "name": crypto_name,
            "articles": [],
            "error": str(e)
        }


@router.post("/{symbol}/summarize")
async def summarize_crypto_news(
    symbol: str, 
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Generate an AI summary for the crypto's cached news using Gemini.
    Requires news to be loaded first.
    """
    symbol = symbol.upper()
    crypto_name = CRYPTO_NAMES.get(symbol, symbol)
    
    try:
        from ..intelligence.news_agent import summarize_articles
        
        # Get cached articles from MongoDB
        cached = await db.news_cache.find_one({"symbol": symbol})
        
        if not cached or not cached.get("articles"):
            return {
                "symbol": symbol,
                "summary": "No cached news found. Please click 'Load News' first."
            }
            
        articles = cached.get("articles", [])
        
        # Generate AI summary using Gemini
        summary = summarize_articles(articles[:5])
        
        return {
            "symbol": symbol,
            "name": crypto_name,
            "summary": summary
        }
        
        
    except Exception as e:
        return {
            "symbol": symbol,
            "summary": f"Failed to generate summary: {str(e)}"
        }

