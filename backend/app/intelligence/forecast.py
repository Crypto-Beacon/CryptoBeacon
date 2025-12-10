"""
Cryptocurrency Price Forecasting Module
========================================
Generates 7-day price forecasts using the best-performing model from comparison.

Primary: XGBoost with Feature Engineering (MAPE: 2.83%)
Fallback: Prophet (MAPE: 4.22%)
Secondary Fallback: Exponential smoothing
"""

import pandas as pd
import numpy as np
from typing import List, Tuple
import warnings


def _calculate_scale_factor(prices: List[float]) -> float:
    """
    Calculate optimal scale factor for low-value coins.
    Scales prices to a range that models can process accurately.
    
    Returns scale factor (1 if no scaling needed).
    """
    if not prices:
        return 1.0
    
    avg_price = np.mean(prices)
    
    # If average price is already in good range (>$0.01), no scaling needed
    if avg_price >= 0.01:
        return 1.0
    
    # Calculate scale factor to bring prices to ~$10 range
    # This preserves relative changes while avoiding precision issues
    target_price = 10.0
    scale_factor = target_price / avg_price if avg_price > 0 else 1.0
    
    # Round to nearest power of 10 for cleaner math
    scale_factor = 10 ** round(np.log10(scale_factor))
    
    return scale_factor


def _scale_prices(prices: List[float], scale_factor: float) -> List[float]:
    """Scale prices up by the given factor."""
    return [p * scale_factor for p in prices]


def _descale_prices(prices: List[float], scale_factor: float) -> List[float]:
    """Descale prices back to original magnitude."""
    return [p / scale_factor for p in prices]


def generate_forecast(prices: List[float], days: int = 7) -> List[float]:
    """
    Takes a list of historical prices and returns a forecast.
    Uses XGBoost as primary, Ensemble as fallback, LSTM as final.
    
    Automatically handles low-value coins (like SHIB, PEPE) with dynamic scaling.
    
    Args:
        prices: List of historical float prices.
        days: Number of days to forecast.

    Returns:
        List of forecasted prices.
    """
    if not prices:
        return []
    
    if len(prices) < 30:  # Need enough data for LSTM lookback
        return _simple_fallback(prices, days)
    
    # Calculate scale factor for low-value coins
    scale_factor = _calculate_scale_factor(prices)
    
    # Scale prices if needed (for coins like SHIB with prices < $0.01)
    if scale_factor > 1:
        print(f"Low-value coin detected, scaling prices by {scale_factor:,.0f}x")
        scaled_prices = _scale_prices(prices, scale_factor)
    else:
        scaled_prices = prices
    
    # Try XGBoost first (best performer - 2.83% MAPE)
    try:
        forecast = _xgboost_forecast(scaled_prices, days)
        # Descale if we scaled earlier
        return _descale_prices(forecast, scale_factor) if scale_factor > 1 else forecast
    except Exception as e:
        print(f"XGBoost failed, trying Ensemble: {e}")
    
    # Fallback to Ensemble (3.54% MAPE)
    try:
        forecast = _ensemble_forecast(scaled_prices, days)
        return _descale_prices(forecast, scale_factor) if scale_factor > 1 else forecast
    except Exception as e:
        print(f"Ensemble failed, trying LSTM: {e}")
    
    # Final fallback - LSTM (4.20% MAPE)
    try:
        forecast = _lstm_forecast(scaled_prices, days)
        return _descale_prices(forecast, scale_factor) if scale_factor > 1 else forecast
    except Exception as e:
        print(f"LSTM failed, using simple fallback: {e}")
        forecast = _simple_fallback(scaled_prices, days)
        return _descale_prices(forecast, scale_factor) if scale_factor > 1 else forecast



def _xgboost_forecast(prices: List[float], days: int) -> List[float]:
    """
    XGBoost-based forecasting with feature engineering.
    Best performing model (MAPE: 2.83%).
    """
    import xgboost as xgb
    
    def create_features(prices_arr: np.ndarray) -> pd.DataFrame:
        """Create lagged features and technical indicators."""
        df = pd.DataFrame({'price': prices_arr})
        
        # Lagged features
        for lag in [1, 3, 7, 14, 21]:
            df[f'lag_{lag}'] = df['price'].shift(lag)
        
        # Moving averages
        for window in [7, 14, 21]:
            df[f'sma_{window}'] = df['price'].rolling(window=window).mean()
            df[f'ema_{window}'] = df['price'].ewm(span=window).mean()
        
        # Momentum
        df['momentum_7'] = df['price'] - df['price'].shift(7)
        df['momentum_14'] = df['price'] - df['price'].shift(14)
        
        # Volatility
        df['volatility_7'] = df['price'].rolling(window=7).std()
        df['volatility_14'] = df['price'].rolling(window=14).std()
        
        # Returns
        df['returns_1'] = df['price'].pct_change(1)
        df['returns_7'] = df['price'].pct_change(7)
        
        # Price ratios
        df['price_to_sma7'] = df['price'] / df['sma_7']
        df['price_to_sma14'] = df['price'] / df['sma_14']
        
        return df
    
    # Create features
    df = create_features(np.array(prices))
    df = df.dropna()
    
    # Target is next day's price
    df['target'] = df['price'].shift(-1)
    df = df.dropna()
    
    # Split features and target
    feature_cols = [c for c in df.columns if c not in ['price', 'target']]
    X = df[feature_cols].values
    y = df['target'].values
    
    # Train XGBoost
    model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbosity=0
    )
    
    model.fit(X, y)
    
    # Predict iteratively
    predictions = []
    current_prices = list(prices)
    
    for _ in range(days):
        temp_df = create_features(np.array(current_prices))
        temp_df = temp_df.dropna()
        
        if len(temp_df) == 0:
            predictions.append(current_prices[-1])
            continue
            
        last_features = temp_df[feature_cols].iloc[-1:].values
        next_pred = float(model.predict(last_features)[0])
        predictions.append(next_pred)
        current_prices.append(next_pred)
    
    # Anchor to current price to connect forecast with historical chart
    current_price = prices[-1]
    predicted_start = predictions[0]
    offset = current_price - predicted_start
    predictions = [p + offset for p in predictions]
    
    return predictions


def _prophet_forecast(prices: List[float], days: int) -> List[float]:
    """
    Prophet-based forecasting with optimized hyperparameters.
    Fallback model (MAPE: 4.22%).
    """
    from prophet import Prophet
    
    # Create DataFrame with dates
    dates = pd.date_range(end=pd.Timestamp.now(), periods=len(prices))
    df = pd.DataFrame({'ds': dates, 'y': prices})
    
    # Optimized hyperparameters
    model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=True,
        changepoint_prior_scale=0.25,
        seasonality_prior_scale=15.0,
        seasonality_mode='multiplicative',
        changepoint_range=0.9,
        n_changepoints=30,
    )
    
    model.add_seasonality(name='monthly', period=30.5, fourier_order=5)
    
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        model.fit(df)
    
    future = model.make_future_dataframe(periods=days)
    forecast = model.predict(future)
    
    predictions = forecast.tail(days)['yhat'].tolist()
    
    # Anchor to current price
    current = prices[-1]
    offset = current - predictions[0]
    predictions = [p + offset for p in predictions]
    
    return predictions


def _lstm_forecast(prices: List[float], days: int, lookback: int = 30) -> List[float]:
    """
    LSTM Deep Learning model for sequence prediction.
    Final fallback (MAPE: 4.20%).
    """
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from sklearn.preprocessing import MinMaxScaler
    
    # Suppress TF logs
    tf.get_logger().setLevel('ERROR')
    
    # Scale data
    data = np.array(prices).reshape(-1, 1)
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(data)
    
    # Create sequences
    def create_sequences(data_arr, lb):
        X, y = [], []
        for i in range(lb, len(data_arr)):
            X.append(data_arr[i - lb:i])
            y.append(data_arr[i])
        return np.array(X), np.array(y)
    
    X, y = create_sequences(scaled_data.flatten(), lookback)
    X = X.reshape((X.shape[0], X.shape[1], 1))
    
    # Build LSTM model
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=(lookback, 1)),
        Dropout(0.2),
        LSTM(32, return_sequences=False),
        Dropout(0.2),
        Dense(16, activation='relu'),
        Dense(1)
    ])
    
    model.compile(optimizer='adam', loss='mse')
    model.fit(X, y, epochs=50, batch_size=16, verbose=0)
    
    # Predict future days
    predictions = []
    current_sequence = scaled_data[-lookback:].flatten()
    
    for _ in range(days):
        input_seq = current_sequence.reshape((1, lookback, 1))
        next_pred = model.predict(input_seq, verbose=0)[0, 0]
        predictions.append(next_pred)
        current_sequence = np.append(current_sequence[1:], next_pred)
    
    # Inverse transform
    predictions = scaler.inverse_transform(
        np.array(predictions).reshape(-1, 1)
    ).flatten().tolist()
    
    # Anchor to current price to connect forecast with historical chart
    current_price = prices[-1]
    predicted_start = predictions[0]
    offset = current_price - predicted_start
    predictions = [p + offset for p in predictions]
    
    return predictions

def _ensemble_forecast(prices: List[float], days: int) -> List[float]:
    """
    Ensemble model combining multiple forecasts.
    Fallback model (MAPE: 3.54%).
    """
    predictions_list = []
    weights = []
    
    # Try Prophet
    try:
        prophet_pred = _prophet_forecast(prices, days)
        predictions_list.append(prophet_pred)
        weights.append(0.4)  # Higher weight - good accuracy
    except:
        pass
    
    # Try ARIMA
    try:
        from pmdarima import auto_arima
        model = auto_arima(
            prices,
            start_p=1, start_q=1,
            max_p=3, max_q=3,
            seasonal=False,
            stepwise=True,
            suppress_warnings=True,
            error_action='ignore',
            trace=False,
            n_fits=10
        )
        arima_pred = model.predict(n_periods=days).tolist()
        predictions_list.append(arima_pred)
        weights.append(0.35)
    except:
        pass
    
    # Add simple forecast as baseline
    try:
        simple_pred = _simple_fallback(prices, days)
        predictions_list.append(simple_pred)
        weights.append(0.25)
    except:
        pass
    
    if not predictions_list:
        return [prices[-1]] * days
    
    # Normalize weights
    total_weight = sum(weights[:len(predictions_list)])
    weights = [w / total_weight for w in weights[:len(predictions_list)]]
    
    # Weighted average
    ensemble = []
    for day in range(days):
        day_pred = sum(
            predictions_list[i][day] * weights[i]
            for i in range(len(predictions_list))
        )
        ensemble.append(day_pred)
    
    # Anchor to current price to connect forecast with historical chart
    current_price = prices[-1]
    predicted_start = ensemble[0]
    offset = current_price - predicted_start
    ensemble = [p + offset for p in ensemble]
    
    return ensemble


def _simple_fallback(prices: List[float], days: int) -> List[float]:
    """
    Simple exponential smoothing fallback for edge cases.
    Used when primary models fail or insufficient data.
    """
    if len(prices) < 2:
        return [prices[-1]] * days
    
    current_price = prices[-1]
    window = min(14, len(prices))
    recent_prices = prices[-window:]
    
    # Weighted trend calculation
    x = np.arange(len(recent_prices))
    weights = np.exp(np.linspace(0, 1, len(recent_prices)))
    coefficients = np.polyfit(x, recent_prices, 1, w=weights)
    slope = coefficients[0] * 0.6  # Dampen
    
    # Generate forecast
    forecast = []
    last_price = current_price
    
    for i in range(days):
        trend_change = slope * (1 - 0.05 * i)
        next_price = last_price + trend_change
        next_price = max(next_price, current_price * 0.8)
        next_price = min(next_price, current_price * 1.2)
        forecast.append(next_price)
        last_price = next_price
    
    return forecast


def _calculate_moving_average(prices: List[float], window: int = 7) -> float:
    """Calculate simple moving average."""
    if len(prices) < window:
        return np.mean(prices)
    return np.mean(prices[-window:])


def _calculate_ema(prices: List[float], span: int = 7) -> float:
    """Calculate exponential moving average."""
    if len(prices) < 2:
        return prices[-1]
    
    series = pd.Series(prices)
    ema = series.ewm(span=span, adjust=False).mean()
    return ema.iloc[-1]
