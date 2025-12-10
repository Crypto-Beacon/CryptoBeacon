import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';

const ForecastChart = ({ forecast, labels, currentPrice, predictedPrice, changePercent, historicalPrices, loading }) => {
    const [showPredictions, setShowPredictions] = useState(true);

    if (loading) {
        return (
            <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-6"></div>
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
        );
    }

    // Generate day labels for historical data (past 7 days)
    const getDayLabel = (daysAgo) => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    // Generate future date labels for forecast
    const getFutureLabel = (daysAhead) => {
        const date = new Date();
        date.setDate(date.getDate() + daysAhead);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Prepare combined chart data
    const historicalData = (historicalPrices || []).map((price, index) => ({
        day: getDayLabel(historicalPrices.length - 1 - index),
        price: price,
        type: 'history',
        historicalPrice: price,
        forecastPrice: null,
    }));

    const forecastData = (forecast || []).map((price, index) => ({
        day: getFutureLabel(index + 1),  // +1, +2, +3... days from today
        price: showPredictions ? price : null,
        type: 'forecast',
        historicalPrice: index === 0 ? historicalPrices?.[historicalPrices.length - 1] : null,
        forecastPrice: showPredictions ? price : null,
    }));

    // Combine data: history first, then forecast
    const chartData = [
        ...historicalData,
        {
            day: 'Today',
            price: currentPrice,
            historicalPrice: currentPrice,
            forecastPrice: showPredictions ? forecast?.[0] : null,
            type: 'transition'
        },
        ...forecastData.slice(1),
    ];

    const formatPrice = (value) => {
        if (value === null || value === undefined) return '';
        if (value >= 1000) {
            return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (value >= 1) {
            return '$' + value.toFixed(2);
        } else {
            return '$' + value.toFixed(6);
        }
    };

    const isPositive = changePercent >= 0;

    // Calculate 7-day historical change
    const historicalChange = historicalPrices?.length >= 2
        ? ((currentPrice - historicalPrices[0]) / historicalPrices[0]) * 100
        : 0;
    const isHistoricalPositive = historicalChange >= 0;

    // Calculate dynamic Y-axis domain
    const allPrices = chartData
        .map(d => d.price)
        .filter(p => p !== null && p !== undefined);

    // Default to strict padding if we have data, otherwise fallback
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 100;

    // Add 5% padding
    const padding = (maxPrice - minPrice) * 0.05;
    // If flat line (max === min), add small padding
    const paramPadding = padding === 0 ? maxPrice * 0.01 : padding;

    const yDomain = [
        minPrice - paramPadding,
        maxPrice + paramPadding
    ];

    return (
        <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            {/* Header with Toggle */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-text">Price Chart</h3>
                <button
                    onClick={() => setShowPredictions(!showPredictions)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${showPredictions
                        ? 'bg-primary/10 border border-primary/30 text-primary'
                        : 'bg-gray-100 border border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                        }`}
                >
                    {showPredictions ? <Eye size={14} /> : <EyeOff size={14} />}
                    {showPredictions ? 'Hide Prediction' : 'Show Prediction'}
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Historical Change */}
                <div>
                    <p className="text-gray-500 text-xs mb-1">7-Day Change</p>
                    <div className="flex items-center gap-1">
                        {isHistoricalPositive ? (
                            <TrendingUp size={16} className="text-green-500" />
                        ) : (
                            <TrendingDown size={16} className="text-red-500" />
                        )}
                        <span className={`text-lg font-bold ${isHistoricalPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isHistoricalPositive ? '+' : ''}{historicalChange.toFixed(1)}%
                        </span>
                    </div>
                </div>

                {/* Predicted Change (only if showing predictions) */}
                {showPredictions && (
                    <div>
                        <p className="text-gray-500 text-xs mb-1">Predicted (Next 7 Days)</p>
                        <div className="flex items-center gap-1">
                            {isPositive ? (
                                <TrendingUp size={16} className="text-primary" />
                            ) : (
                                <TrendingDown size={16} className="text-red-500" />
                            )}
                            <span className={`text-lg font-bold ${isPositive ? 'text-primary' : 'text-red-500'}`}>
                                {isPositive ? '+' : ''}{changePercent?.toFixed(1)}%
                            </span>
                            <span className="text-gray-500 text-xs ml-1">
                                → {formatPrice(predictedPrice)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <defs>
                            <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                        />
                        <YAxis
                            hide={true}
                            domain={yDomain}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            formatter={(value, name) => {
                                if (value === null || value === undefined) return [null, null];
                                const label = name === 'historicalPrice' ? 'Actual' : 'Predicted';
                                return [formatPrice(value), label];
                            }}
                        />

                        {/* Historical Prices (Blue) */}
                        <Area
                            type="monotone"
                            dataKey="historicalPrice"
                            stroke="#60a5fa"
                            strokeWidth={2}
                            fill="url(#historyGradient)"
                            connectNulls
                        />

                        {/* Forecast Prices (Green, dashed) */}
                        {showPredictions && (
                            <Area
                                type="monotone"
                                dataKey="forecastPrice"
                                stroke="#10b981"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fill="url(#forecastGradient)"
                                connectNulls
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-blue-400"></div>
                    <span className="text-gray-400">Historical (7 Days)</span>
                </div>
                {showPredictions && (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-primary" style={{ borderTop: '2px dashed #10b981' }}></div>
                        <span className="text-gray-400">Forecast (7 Days)</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForecastChart;
