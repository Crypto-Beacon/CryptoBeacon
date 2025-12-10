
import sys
import os
import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
import warnings

# Add parent dir to path to import app modules
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "../../"))
sys.path.append(backend_dir)

try:
    from app.intelligence.forecast import generate_forecast
except ImportError:
    print("Error: Could not import generate_forecast. Make sure you are running from the backend directory or have pythonpath set.")
    sys.exit(1)

def evaluate_model(symbol="BTC-USD", days_to_predict=7, test_samples=5):
    print(f"\n--- Starting Evaluation for {symbol} ---")
    
    # 1. Fetch Historical Data (Last 365 days)
    print("Fetching historical data...")
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    
    try:
        data = yf.download(symbol, start=start_date, end=end_date, progress=False)
        if hasattr(data, "columns") and isinstance(data.columns, pd.MultiIndex):
             # Handle new yfinance format if needed, though 'Close' usually works directly
             prices = data["Close"].iloc[:, 0].tolist() # Take first column if multi-index
        else:
             prices = data["Close"].tolist()
             
        if not prices:
            print("Error: No data fetched.")
            return
            
        print(f"Fetched {len(prices)} data points.")
        
    except Exception as e:
        print(f"Error fetching data: {e}")
        return

    # 2. Run Rolling Evaluation
    maes = []
    rmses = []
    mapes = []
    
    # We will pick 'test_samples' random start points in the last 60 days to test
    # ensuring we have at least 7 days of "future" data for each point.
    
    valid_range_start = len(prices) - 60
    if valid_range_start < 100:
        valid_range_start = 100 # Ensure enough training data
        
    indices = np.linspace(valid_range_start, len(prices) - days_to_predict - 1, test_samples, dtype=int)
    
    print("\nRunning Forecasts:")
    print(f"{'Run':<5} | {'Actual Price (Day 7)':<25} | {'Predicted (Day 7)':<20} | {'Error %':<10}")
    print("-" * 75)
    
    for i, idx in enumerate(indices):
        # Train data: everything up to idx
        train_data = prices[:idx]
        
        # Actual future data
        actual_future = prices[idx : idx + days_to_predict]
        
        # Generate Forecast
        # Note: generate_forecast might print "Prophet failed" or similar warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            # We assume generate_forecast handles 7 days by default or we pass it
            forecast = generate_forecast(train_data, days=days_to_predict)
            
        if not forecast:
            print(f"Run {i+1}: No forecast generated.")
            continue
            
        # Compare
        # We focus on the last day (Day 7) for a point-comparison, 
        # but MAE/RMSE should be over the whole 7-day curve.
        
        # Metrics for this sample (7-day horizon)
        sample_mae = np.mean(np.abs(np.array(actual_future) - np.array(forecast)))
        sample_rmse = np.sqrt(np.mean((np.array(actual_future) - np.array(forecast))**2))
        sample_mape = np.mean(np.abs((np.array(actual_future) - np.array(forecast)) / np.array(actual_future))) * 100
        
        maes.append(sample_mae)
        rmses.append(sample_rmse)
        mapes.append(sample_mape)
        
        last_actual = actual_future[-1]
        last_pred = forecast[-1]
        error_pct = abs((last_actual - last_pred) / last_actual) * 100
        
        print(f"{i+1:<5} | ${last_actual:<23.2f} | ${last_pred:<18.2f} | {error_pct:<8.2f}%")

    # 3. Aggregate Results
    if not maes:
        print("\nNo successful runs.")
        return

    avg_mae = np.mean(maes)
    avg_rmse = np.mean(rmses)
    avg_mape = np.mean(mapes)

    # Write to file
    with open("results.txt", "w", encoding="utf-8") as f:
        f.write(f"Run Time: {datetime.now()}\n")
        f.write("\n--- Summary Statistics (7-Day Forecast) ---\n")
        f.write(f"Mean Absolute Error (MAE): ${avg_mae:.2f}\n")
        f.write(f"Root Mean Sq Error (RMSE): ${avg_rmse:.2f}\n")
        f.write(f"Mean Abs % Error (MAPE):   {avg_mape:.2f}%\n")
        
        try:
            import prophet
            f.write("\n[System Check] 'prophet' library is installed.\n")
        except ImportError:
            f.write("\n[System Check] 'prophet' library is NOT installed. Using fallback.\n")
            
    print("Results written to results.txt")

if __name__ == "__main__":
    evaluate_model()
