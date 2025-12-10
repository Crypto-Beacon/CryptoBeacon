import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_path = os.path.join(backend_dir, '.env')
load_dotenv(env_path)
print(f"Loading .env from: {env_path}")

# Add the backend directory to sys.path so we can import app.intelligence
# assuming we are running from project root or backend/app/intelligence
try:
    # Attempt to locate the 'backend' directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.abspath(os.path.join(current_dir, "../..")) # Adjust based on location: backend/app/intelligence -> ... -> backend
    sys.path.append(backend_dir)
except Exception as e:
    print(f"Error setting up path: {e}")

def test_forecasting():
    print("\n--- Testing Forecasting ---")
    try:
        from app.intelligence.forecast import generate_forecast
        
        # Sample data: ascending price trend
        prices = [100.0, 102.0, 104.0, 103.0, 105.0, 107.0, 110.0, 112.0, 115.0, 118.0]
        print(f"Input prices: {prices}")
        
        prediction = generate_forecast(prices, days=3)
        print(f"Forecast (3 days): {prediction}")
        
        if len(prediction) == 3:
            print("SUCCESS: Forecast generated correct number of days.")
        else:
            print("FAILURE: Forecast length mismatch.")
            
    except ImportError as e:
        print(f"ImportError: {e}")
        print("Make sure 'prophet' and 'pandas' are installed.")
    except Exception as e:
        print(f"Error during forecasting test: {e}")

def test_news_agent():
    print("\n--- Testing News Agent ---")
    try:
        from app.intelligence.news_agent import fetch_market_news, summarize_articles
        
        # Check for API keys
        if not os.getenv("NEWSDATA_API_KEY"):
            print("WARNING: NEWSDATA_API_KEY not set. Fetch might fail or return empty.")
        if not os.getenv("GEMINI_API_KEY"):
            print("WARNING: GEMINI_API_KEY not set. Summarization might fail.")

        # Test Fetch
        print("Fetching news (Simulated if keys missing/invalid)...")
        news = fetch_market_news(query="crypto")
        print(f"Fetched {len(news)} articles.")
        
        if not news:
            # Mock data for summarization test if fetch failed (likely due to missing key)
            print("Using mock data for summarization test.")
            news = [
                {"title": "Bitcoin Hits New High", "description": "Bitcoin rallied to a new all-time high today amidst positive regulatory news."},
                {"title": "Ethereum Upgrade Successful", "description": "The latest Ethereum network upgrade has successfully reduced gas fees."},
            ]
        
        # Test Summarization
        print("Summarizing articles...")
        summary = summarize_articles(news)
        print("Summary Result:")
        print(summary)
        
        if summary and "Error" not in summary:
             print("SUCCESS: Summarization module returned a result.")
        else:
             print("INFO: Summarization returned an error or warning (expected if no keys).")

    except ImportError as e:
        print(f"ImportError: {e}")
        print("Make sure 'requests' and 'google-generativeai' are installed.")
    except Exception as e:
        print(f"Error during news agent test: {e}")

if __name__ == "__main__":
    test_forecasting()
    test_news_agent()
