# Crypto Prediction Model Comparison Report

**Generated**: 2025-12-09 01:31:06

## Summary

| Rank | Model | Avg MAPE | Std Dev | Avg MAE | Avg RMSE | Avg Time |
|------|-------|----------|---------|---------|----------|----------|
| 🏆 1 | **XGBoost** | 2.83% | ±1.39% | $2761.88 | $3299.35 | 1.13s |
|    2 | **Ensemble** | 3.54% | ±1.92% | $3591.37 | $4028.29 | 0.00s |
|    3 | **LSTM** | 4.20% | ±2.40% | $4288.60 | $4659.89 | 30.69s |
|    4 | **Enhanced Prophet** | 4.22% | ±2.39% | $4356.51 | $4784.02 | 0.76s |
|    5 | **ARIMA** | 4.22% | ±2.39% | $4356.51 | $4784.02 | 4.27s |

## Recommendation

Based on MAPE (Mean Absolute Percentage Error), the **XGBoost** model performs best with an average error of 2.83%.

### Model Comparison

#### XGBoost
- **MAPE**: 2.83% (±1.39%)
- **MAE**: $2761.88
- **Training Time**: 1.13s per forecast

#### Ensemble
- **MAPE**: 3.54% (±1.92%)
- **MAE**: $3591.37
- **Training Time**: 0.00s per forecast

#### LSTM
- **MAPE**: 4.20% (±2.40%)
- **MAE**: $4288.60
- **Training Time**: 30.69s per forecast

#### Enhanced Prophet
- **MAPE**: 4.22% (±2.39%)
- **MAE**: $4356.51
- **Training Time**: 0.76s per forecast

#### ARIMA
- **MAPE**: 4.22% (±2.39%)
- **MAE**: $4356.51
- **Training Time**: 4.27s per forecast


## Conclusion

The **XGBoost** model is recommended for integration into CryptoBeacon's prediction system.

### Current vs Best Model

| Metric | Current (Prophet) | Best (XGBoost) | Improvement |
|--------|-------------------|---------------------|-------------|
| MAPE | 4.22% | 2.83% | 32.9% better |
