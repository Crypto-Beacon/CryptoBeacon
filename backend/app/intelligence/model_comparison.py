"""
Crypto Prediction Model Comparison Script
==========================================
Compares 5 different prediction approaches for cryptocurrency forecasting:
1. Enhanced Prophet (with optimized hyperparameters)
2. ARIMA (Auto-ARIMA with pmdarima)
3. LSTM Neural Network (TensorFlow/Keras)
4. XGBoost with Feature Engineering
5. Ensemble (Weighted combination)

Run: python -m app.intelligence.model_comparison
"""

import os
import sys
import warnings
import time
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import numpy as np
import pandas as pd

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logs

# Add parent dir to path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "../../"))
sys.path.append(backend_dir)


class ModelEvaluator:
    """Base class with common evaluation utilities."""
    
    def __init__(self, prices: List[float], test_days: int = 7):
        self.prices = np.array(prices)
        self.test_days = test_days
        
    def calculate_metrics(self, actual: np.ndarray, predicted: np.ndarray) -> Dict[str, float]:
        """Calculate MAE, RMSE, and MAPE."""
        actual = np.array(actual)
        predicted = np.array(predicted)
        
        mae = np.mean(np.abs(actual - predicted))
        rmse = np.sqrt(np.mean((actual - predicted) ** 2))
        mape = np.mean(np.abs((actual - predicted) / actual)) * 100
        
        return {"MAE": mae, "RMSE": rmse, "MAPE": mape}


# ============================================================================
# MODEL 1: Enhanced Prophet
# ============================================================================
class EnhancedProphetModel:
    """Prophet with optimized hyperparameters for crypto."""
    
    def __init__(self):
        self.model = None
        self.name = "Enhanced Prophet"
        
    def fit_predict(self, train_prices: List[float], days: int = 7) -> List[float]:
        try:
            from prophet import Prophet
            
            # Create DataFrame with dates
            dates = pd.date_range(end=pd.Timestamp.now(), periods=len(train_prices))
            df = pd.DataFrame({'ds': dates, 'y': train_prices})
            
            # Optimized hyperparameters for crypto
            self.model = Prophet(
                daily_seasonality=True,         # Crypto trades 24/7
                weekly_seasonality=True,        # Weekend effects
                yearly_seasonality=True,        
                changepoint_prior_scale=0.25,   # More flexible for volatile markets
                seasonality_prior_scale=15.0,   # Stronger seasonality
                seasonality_mode='multiplicative',  # Better for volatile assets
                changepoint_range=0.9,          # Allow changes near end of data
                n_changepoints=30,              # More change points
            )
            
            # Add custom crypto seasonality (hourly patterns matter less for daily)
            self.model.add_seasonality(
                name='monthly',
                period=30.5,
                fourier_order=5
            )
            
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                self.model.fit(df)
            
            future = self.model.make_future_dataframe(periods=days)
            forecast = self.model.predict(future)
            
            predictions = forecast.tail(days)['yhat'].tolist()
            
            # Anchor to current price
            current = train_prices[-1]
            offset = current - predictions[0]
            predictions = [p + offset for p in predictions]
            
            return predictions
            
        except Exception as e:
            print(f"Enhanced Prophet error: {e}")
            return [train_prices[-1]] * days


# ============================================================================
# MODEL 2: ARIMA
# ============================================================================
class ARIMAModel:
    """Auto-ARIMA model for time series forecasting."""
    
    def __init__(self):
        self.model = None
        self.name = "ARIMA"
        
    def fit_predict(self, train_prices: List[float], days: int = 7) -> List[float]:
        try:
            from pmdarima import auto_arima
            
            # Auto-ARIMA finds optimal (p,d,q) parameters
            self.model = auto_arima(
                train_prices,
                start_p=1, start_q=1,
                max_p=5, max_q=5,
                m=7,  # Weekly seasonality
                d=None,  # Auto-determine differencing
                seasonal=True,
                stepwise=True,
                suppress_warnings=True,
                error_action='ignore',
                trace=False,
                n_fits=20
            )
            
            predictions = self.model.predict(n_periods=days)
            return predictions.tolist()
            
        except Exception as e:
            print(f"ARIMA error: {e}")
            return [train_prices[-1]] * days


# ============================================================================
# MODEL 3: LSTM Neural Network
# ============================================================================
class LSTMModel:
    """LSTM Deep Learning model for sequence prediction."""
    
    def __init__(self, lookback: int = 30):
        self.model = None
        self.lookback = lookback
        self.scaler = None
        self.name = "LSTM"
        
    def _create_sequences(self, data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Create sequences for LSTM training."""
        X, y = [], []
        for i in range(self.lookback, len(data)):
            X.append(data[i - self.lookback:i])
            y.append(data[i])
        return np.array(X), np.array(y)
    
    def fit_predict(self, train_prices: List[float], days: int = 7) -> List[float]:
        try:
            import tensorflow as tf
            from tensorflow.keras.models import Sequential
            from tensorflow.keras.layers import LSTM, Dense, Dropout
            from sklearn.preprocessing import MinMaxScaler
            
            # Suppress TF logs
            tf.get_logger().setLevel('ERROR')
            
            # Scale data
            data = np.array(train_prices).reshape(-1, 1)
            self.scaler = MinMaxScaler(feature_range=(0, 1))
            scaled_data = self.scaler.fit_transform(data)
            
            # Create training sequences
            X, y = self._create_sequences(scaled_data.flatten())
            X = X.reshape((X.shape[0], X.shape[1], 1))
            
            # Build LSTM model
            self.model = Sequential([
                LSTM(64, return_sequences=True, input_shape=(self.lookback, 1)),
                Dropout(0.2),
                LSTM(32, return_sequences=False),
                Dropout(0.2),
                Dense(16, activation='relu'),
                Dense(1)
            ])
            
            self.model.compile(optimizer='adam', loss='mse')
            
            # Train (silent)
            self.model.fit(X, y, epochs=50, batch_size=16, verbose=0)
            
            # Predict future days iteratively
            predictions = []
            current_sequence = scaled_data[-self.lookback:].flatten()
            
            for _ in range(days):
                input_seq = current_sequence.reshape((1, self.lookback, 1))
                next_pred = self.model.predict(input_seq, verbose=0)[0, 0]
                predictions.append(next_pred)
                current_sequence = np.append(current_sequence[1:], next_pred)
            
            # Inverse transform
            predictions = self.scaler.inverse_transform(
                np.array(predictions).reshape(-1, 1)
            ).flatten().tolist()
            
            return predictions
            
        except Exception as e:
            print(f"LSTM error: {e}")
            return [train_prices[-1]] * days


# ============================================================================
# MODEL 4: XGBoost with Feature Engineering
# ============================================================================
class XGBoostModel:
    """XGBoost with technical indicator features."""
    
    def __init__(self):
        self.model = None
        self.name = "XGBoost"
        
    def _create_features(self, prices: np.ndarray) -> pd.DataFrame:
        """Create lagged features and technical indicators."""
        df = pd.DataFrame({'price': prices})
        
        # Lagged features
        for lag in [1, 3, 7, 14, 21]:
            df[f'lag_{lag}'] = df['price'].shift(lag)
        
        # Moving averages
        for window in [7, 14, 21]:
            df[f'sma_{window}'] = df['price'].rolling(window=window).mean()
            df[f'ema_{window}'] = df['price'].ewm(span=window).mean()
        
        # Price momentum
        df['momentum_7'] = df['price'] - df['price'].shift(7)
        df['momentum_14'] = df['price'] - df['price'].shift(14)
        
        # Volatility (rolling std)
        df['volatility_7'] = df['price'].rolling(window=7).std()
        df['volatility_14'] = df['price'].rolling(window=14).std()
        
        # Returns
        df['returns_1'] = df['price'].pct_change(1)
        df['returns_7'] = df['price'].pct_change(7)
        
        # Price ratios
        df['price_to_sma7'] = df['price'] / df['sma_7']
        df['price_to_sma14'] = df['price'] / df['sma_14']
        
        return df
    
    def fit_predict(self, train_prices: List[float], days: int = 7) -> List[float]:
        try:
            import xgboost as xgb
            
            # Create features
            df = self._create_features(np.array(train_prices))
            df = df.dropna()
            
            # Target is next day's price
            df['target'] = df['price'].shift(-1)
            df = df.dropna()
            
            # Split features and target
            feature_cols = [c for c in df.columns if c not in ['price', 'target']]
            X = df[feature_cols].values
            y = df['target'].values
            
            # Train XGBoost
            self.model = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                verbosity=0
            )
            
            self.model.fit(X, y)
            
            # Predict iteratively
            predictions = []
            current_prices = list(train_prices)
            
            for _ in range(days):
                # Get features for last sequence
                temp_df = self._create_features(np.array(current_prices))
                temp_df = temp_df.dropna()
                
                if len(temp_df) == 0:
                    predictions.append(current_prices[-1])
                    continue
                    
                last_features = temp_df[feature_cols].iloc[-1:].values
                next_pred = self.model.predict(last_features)[0]
                predictions.append(next_pred)
                current_prices.append(next_pred)
            
            return predictions
            
        except Exception as e:
            print(f"XGBoost error: {e}")
            return [train_prices[-1]] * days


# ============================================================================
# MODEL 5: Ensemble
# ============================================================================
class EnsembleModel:
    """Weighted ensemble of multiple models."""
    
    def __init__(self):
        self.models = {}
        self.weights = {}
        self.name = "Ensemble"
        
    def fit_predict(self, train_prices: List[float], days: int = 7,
                    model_predictions: Dict[str, List[float]] = None) -> List[float]:
        """
        Combine predictions from multiple models using inverse-error weighting.
        If model_predictions is provided, use those. Otherwise, train all models.
        """
        try:
            if model_predictions is None or len(model_predictions) == 0:
                # Train all models if not provided
                model_predictions = {}
                
                # Prophet
                prophet = EnhancedProphetModel()
                model_predictions['Prophet'] = prophet.fit_predict(train_prices, days)
                
                # ARIMA
                arima = ARIMAModel()
                model_predictions['ARIMA'] = arima.fit_predict(train_prices, days)
                
                # XGBoost (skip LSTM for speed in ensemble)
                xgb_model = XGBoostModel()
                model_predictions['XGBoost'] = xgb_model.fit_predict(train_prices, days)
            
            # Equal weighting (can be optimized with validation data)
            n_models = len(model_predictions)
            weights = {name: 1.0 / n_models for name in model_predictions}
            
            # Weighted average
            predictions = []
            for day in range(days):
                day_pred = sum(
                    model_predictions[name][day] * weights[name]
                    for name in model_predictions
                    if day < len(model_predictions[name])
                )
                predictions.append(day_pred)
            
            return predictions
            
        except Exception as e:
            print(f"Ensemble error: {e}")
            return [train_prices[-1]] * days


# ============================================================================
# MAIN COMPARISON RUNNER
# ============================================================================
def fetch_historical_data(symbol: str = "BTC-USD", days: int = 365) -> List[float]:
    """Fetch historical price data using yfinance."""
    import yfinance as yf
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    print(f"Fetching {days} days of {symbol} data...")
    data = yf.download(symbol, start=start_date, end=end_date, progress=False)
    
    if hasattr(data, "columns") and isinstance(data.columns, pd.MultiIndex):
        prices = data["Close"].iloc[:, 0].tolist()
    else:
        prices = data["Close"].tolist()
    
    print(f"Fetched {len(prices)} data points.")
    return prices


def run_comparison(prices: List[float], test_samples: int = 5, 
                   forecast_days: int = 7) -> Dict[str, Dict]:
    """Run rolling evaluation on all models."""
    
    evaluator = ModelEvaluator(prices, forecast_days)
    
    # Model instances
    models = {
        "Enhanced Prophet": EnhancedProphetModel(),
        "ARIMA": ARIMAModel(),
        "LSTM": LSTMModel(lookback=30),
        "XGBoost": XGBoostModel(),
        "Ensemble": EnsembleModel(),
    }
    
    # Results storage
    results = {name: {"MAE": [], "RMSE": [], "MAPE": [], "time": []} 
               for name in models}
    
    # Determine evaluation points (last 60 days, ensuring enough training data)
    valid_start = max(100, len(prices) - 60)
    indices = np.linspace(valid_start, len(prices) - forecast_days - 1, 
                          test_samples, dtype=int)
    
    print(f"\n{'='*70}")
    print(f"Running {test_samples} rolling evaluations with {forecast_days}-day forecasts")
    print(f"{'='*70}\n")
    
    for i, idx in enumerate(indices):
        print(f"\n--- Evaluation {i+1}/{test_samples} (using {idx} training points) ---")
        
        train_data = prices[:idx]
        actual = np.array(prices[idx:idx + forecast_days])
        
        model_preds = {}  # Store for ensemble
        
        for name, model in models.items():
            if name == "Ensemble":
                continue  # Run ensemble separately with other predictions
                
            start_time = time.time()
            
            try:
                pred = model.fit_predict(train_data, forecast_days)
                pred = np.array(pred[:len(actual)])  # Ensure same length
                
                elapsed = time.time() - start_time
                metrics = evaluator.calculate_metrics(actual, pred)
                
                results[name]["MAE"].append(metrics["MAE"])
                results[name]["RMSE"].append(metrics["RMSE"])
                results[name]["MAPE"].append(metrics["MAPE"])
                results[name]["time"].append(elapsed)
                
                model_preds[name] = pred.tolist()
                
                print(f"  {name:<20} MAPE: {metrics['MAPE']:.2f}%  "
                      f"MAE: ${metrics['MAE']:.2f}  Time: {elapsed:.2f}s")
                
            except Exception as e:
                print(f"  {name:<20} ERROR: {e}")
        
        # Run ensemble with collected predictions
        if model_preds:
            start_time = time.time()
            ensemble = models["Ensemble"]
            
            # Use Prophet, ARIMA, and XGBoost for ensemble (skip LSTM - already computed)
            ensemble_input = {k: v for k, v in model_preds.items() 
                            if k in ["Enhanced Prophet", "ARIMA", "XGBoost"]}
            
            pred = ensemble.fit_predict(train_data, forecast_days, ensemble_input)
            pred = np.array(pred[:len(actual)])
            
            elapsed = time.time() - start_time
            metrics = evaluator.calculate_metrics(actual, pred)
            
            results["Ensemble"]["MAE"].append(metrics["MAE"])
            results["Ensemble"]["RMSE"].append(metrics["RMSE"])
            results["Ensemble"]["MAPE"].append(metrics["MAPE"])
            results["Ensemble"]["time"].append(elapsed)
            
            print(f"  {'Ensemble':<20} MAPE: {metrics['MAPE']:.2f}%  "
                  f"MAE: ${metrics['MAE']:.2f}  Time: {elapsed:.2f}s")
    
    return results


def generate_report(results: Dict[str, Dict], output_path: str = None) -> str:
    """Generate a markdown comparison report."""
    
    # Calculate averages
    summary = {}
    for name, metrics in results.items():
        if metrics["MAPE"]:
            summary[name] = {
                "Avg MAPE": np.mean(metrics["MAPE"]),
                "Std MAPE": np.std(metrics["MAPE"]),
                "Avg MAE": np.mean(metrics["MAE"]),
                "Avg RMSE": np.mean(metrics["RMSE"]),
                "Avg Time": np.mean(metrics["time"]),
            }
    
    # Sort by MAPE (lower is better)
    sorted_models = sorted(summary.items(), key=lambda x: x[1]["Avg MAPE"])
    best_model = sorted_models[0][0]
    
    # Generate report
    report = f"""# Crypto Prediction Model Comparison Report

**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary

| Rank | Model | Avg MAPE | Std Dev | Avg MAE | Avg RMSE | Avg Time |
|------|-------|----------|---------|---------|----------|----------|
"""
    
    for rank, (name, stats) in enumerate(sorted_models, 1):
        indicator = "🏆" if rank == 1 else "  "
        report += f"| {indicator} {rank} | **{name}** | {stats['Avg MAPE']:.2f}% | ±{stats['Std MAPE']:.2f}% | ${stats['Avg MAE']:.2f} | ${stats['Avg RMSE']:.2f} | {stats['Avg Time']:.2f}s |\n"
    
    report += f"""
## Recommendation

Based on MAPE (Mean Absolute Percentage Error), the **{best_model}** model performs best with an average error of {summary[best_model]['Avg MAPE']:.2f}%.

### Model Comparison

"""
    
    # Add per-model analysis
    for name, stats in sorted_models:
        improvement = ((summary[sorted_models[-1][0]]['Avg MAPE'] - stats['Avg MAPE']) 
                       / summary[sorted_models[-1][0]]['Avg MAPE'] * 100)
        report += f"#### {name}\n"
        report += f"- **MAPE**: {stats['Avg MAPE']:.2f}% (±{stats['Std MAPE']:.2f}%)\n"
        report += f"- **MAE**: ${stats['Avg MAE']:.2f}\n"
        report += f"- **Training Time**: {stats['Avg Time']:.2f}s per forecast\n\n"
    
    report += f"""
## Conclusion

The **{best_model}** model is recommended for integration into CryptoBeacon's prediction system.

### Current vs Best Model

| Metric | Current (Prophet) | Best ({best_model}) | Improvement |
|--------|-------------------|---------------------|-------------|
"""
    
    # Compare to baseline if we have Prophet results
    if "Enhanced Prophet" in summary:
        prophet_mape = summary.get("Enhanced Prophet", {}).get("Avg MAPE", 4.64)
        best_mape = summary[best_model]["Avg MAPE"]
        improvement = (prophet_mape - best_mape) / prophet_mape * 100
        
        report += f"| MAPE | {prophet_mape:.2f}% | {best_mape:.2f}% | {improvement:.1f}% better |\n"
    
    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"\nReport saved to: {output_path}")
    
    return report, best_model


if __name__ == "__main__":
    print("=" * 70)
    print("CRYPTO PREDICTION MODEL COMPARISON")
    print("=" * 70)
    
    # Fetch data
    prices = fetch_historical_data("BTC-USD", days=365)
    
    if len(prices) < 100:
        print("ERROR: Insufficient data fetched.")
        sys.exit(1)
    
    # Run comparison
    results = run_comparison(prices, test_samples=5, forecast_days=7)
    
    # Generate report
    output_dir = os.path.dirname(os.path.abspath(__file__))
    report_path = os.path.join(output_dir, "model_comparison_report.md")
    
    report, best_model = generate_report(results, report_path)
    
    print("\n" + "=" * 70)
    print("COMPARISON COMPLETE")
    print("=" * 70)
    print(f"\n🏆 BEST MODEL: {best_model}")
    print(f"📄 Full report: {report_path}")
