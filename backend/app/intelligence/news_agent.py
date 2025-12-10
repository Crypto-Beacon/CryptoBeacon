import os
import requests
import google.generativeai as genai
from typing import List, Dict

def get_api_keys():
    """Get API keys from environment or config."""
    try:
        from ..config import settings
        return settings.NEWSDATA_API_KEY, settings.GEMINI_API_KEY
    except:
        return os.getenv("NEWSDATA_API_KEY"), os.getenv("GEMINI_API_KEY")

def fetch_market_news(query: str = "crypto") -> List[Dict]:
    """
    Fetches news from NewsData.io.
    """
    NEWSDATA_API_KEY, _ = get_api_keys()
    
    if not NEWSDATA_API_KEY:
        print("Error: NEWSDATA_API_KEY not found.")
        return []

    url = "https://newsdata.io/api/1/news"
    params = {
        "apikey": NEWSDATA_API_KEY,
        "q": query,
        "language": "en",
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") == "success" and "results" in data:
            return data["results"] or []
        else:
            print(f"NewsData API response: {data.get('status', 'unknown')}")
            return []
            
    except Exception as e:
        print(f"Error fetching news: {e}")
        return []

def summarize_articles(articles: List[Dict]) -> str:
    """
    Summarizes a list of articles using Google's Gemini API.
    """
    _, GEMINI_API_KEY = get_api_keys()
    
    if not GEMINI_API_KEY:
        return "Error: GEMINI_API_KEY not found."

    if not articles:
        return "No articles to summarize."

    # Prepare the prompt
    articles_text = ""
    for i, article in enumerate(articles[:5]):
        title = article.get("title", "No Title")
        description = article.get("description") or article.get("content") or "No Description"
        articles_text += f"{i+1}. {title}\nSummary: {description}\n\n"

    prompt = f"""
    You are a professional financial analyst. Summarize the following market news into a concise briefing.
    Highlight key trends and sentiment. Keep it under 100 words.
    
    Articles:
    {articles_text}
    
    Summary:
    """

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating summary: {e}")
        return f"Failed to generate summary: {str(e)}"

