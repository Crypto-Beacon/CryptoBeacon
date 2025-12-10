from fastapi import APIRouter, HTTPException
import httpx
from typing import List
import json

router = APIRouter()

# Top 12 cryptocurrencies with Binance trading pair symbols (no stablecoins)
TOP_CRYPTOS = [
    {"symbol": "BTCUSDT", "name": "Bitcoin", "displaySymbol": "BTC"},
    {"symbol": "ETHUSDT", "name": "Ethereum", "displaySymbol": "ETH"},
    {"symbol": "SOLUSDT", "name": "Solana", "displaySymbol": "SOL"},
    {"symbol": "BNBUSDT", "name": "BNB", "displaySymbol": "BNB"},
    {"symbol": "XRPUSDT", "name": "Ripple", "displaySymbol": "XRP"},
    {"symbol": "ADAUSDT", "name": "Cardano", "displaySymbol": "ADA"},
    {"symbol": "AVAXUSDT", "name": "Avalanche", "displaySymbol": "AVAX"},
    {"symbol": "DOGEUSDT", "name": "Dogecoin", "displaySymbol": "DOGE"},
    {"symbol": "DOTUSDT", "name": "Polkadot", "displaySymbol": "DOT"},
    {"symbol": "MATICUSDT", "name": "Polygon", "displaySymbol": "MATIC"},
    {"symbol": "LINKUSDT", "name": "Chainlink", "displaySymbol": "LINK"},
    {"symbol": "LTCUSDT", "name": "Litecoin", "displaySymbol": "LTC"}
]

@router.get("/prices")
async def get_crypto_prices():
    """
    Fetch top 10 cryptocurrency prices from Binance public API.
    No API key required - free and unlimited for basic ticker data.
    """
    try:
        async with httpx.AsyncClient() as client:
            # Fetch all tickers at once (more efficient)
            response = await client.get(
                "https://api.binance.com/api/v3/ticker/24hr",
                timeout=10.0
            )
            response.raise_for_status()
            all_tickers = response.json()
            
            # Create a lookup map by symbol
            price_map = {}
            for item in all_tickers:
                price_map[item["symbol"]] = {
                    "price": float(item["lastPrice"]),
                    "change24h": float(item["priceChangePercent"])
                }
            
            # Format response with crypto metadata
            result = []
            
            # Add cryptos from the lookup
            for crypto in TOP_CRYPTOS:
                symbol = crypto["symbol"]
                if symbol in price_map:
                    result.append({
                        "id": crypto["displaySymbol"].lower(),
                        "symbol": crypto["displaySymbol"],
                        "name": crypto["name"],
                        "price": price_map[symbol]["price"],
                        "change24h": price_map[symbol]["change24h"]
                    })
            
            return result
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Binance API timeout")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Binance API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch prices: {str(e)}")

