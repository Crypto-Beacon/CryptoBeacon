import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Plus, TrendingUp, TrendingDown, RefreshCw, Star, ArrowUpDown, Lock, Settings, Check } from 'lucide-react';
import ForecastChart from '../components/ForecastChart';
import NewsSummaryCard from '../components/NewsSummaryCard';
import Toast from '../components/Toast';
import CoinIcon from '../components/CoinIcon';
import SearchBar from '../components/SearchBar';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import UserButton from '../components/UserButton';
import { getCoinName } from '../services/cryptoService';

const CryptoDetailPage = () => {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const [cryptoData, setCryptoData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [forecastLoading, setForecastLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [removeLoading, setRemoveLoading] = useState(false);

    const token = localStorage.getItem('token');

    // Check if coin is already in watchlist
    useEffect(() => {
        const checkWatchlist = async () => {
            if (!token) return;
            try {
                const response = await axios.get('http://localhost:8000/watchlist', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const watchlist = Array.isArray(response.data) ? response.data : (response.data?.watchlist || []);
                setIsInWatchlist(watchlist.includes(symbol.toUpperCase()));
            } catch (err) {
                console.error('Failed to check watchlist:', err);
            }
        };
        checkWatchlist();
    }, [symbol, token]);

    // Fetch crypto details
    useEffect(() => {
        let isInitialLoad = true;

        const fetchCryptoDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/crypto/${symbol}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCryptoData(response.data);
                setLoading(false);
                setError(null); // Clear any previous errors on success
            } catch (err) {
                console.error('Failed to fetch crypto details:', err);
                // Only set error on initial load, not on refresh failures
                if (isInitialLoad) {
                    setError(err.response?.data?.detail || 'Failed to load cryptocurrency data');
                    setLoading(false);
                }
                // On refresh failures, keep the existing data
            }
            isInitialLoad = false;
        };

        if (token) {
            fetchCryptoDetails();
            // Refresh price every 15 seconds (less aggressive)
            const interval = setInterval(fetchCryptoDetails, 15000);
            return () => clearInterval(interval);
        }
    }, [symbol, token]);

    // Fetch forecast data
    useEffect(() => {
        const fetchForecast = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/crypto/${symbol}/forecast`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setForecastData(response.data);
                setForecastLoading(false);
            } catch (err) {
                console.error('Failed to fetch forecast:', err);
                setForecastLoading(false);
            }
        };

        if (token) {
            fetchForecast();
        }
    }, [symbol, token]);

    const formatPrice = (price) => {
        if (!price) return '$0.00';
        if (price >= 1000) {
            return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (price >= 1) {
            return '$' + price.toFixed(2);
        } else {
            return '$' + price.toFixed(6);
        }
    };

    const formatVolume = (volume) => {
        if (!volume) return '0';
        if (volume >= 1e9) {
            return (volume / 1e9).toFixed(2) + 'B';
        } else if (volume >= 1e6) {
            return (volume / 1e6).toFixed(2) + 'M';
        } else if (volume >= 1e3) {
            return (volume / 1e3).toFixed(2) + 'K';
        }
        return volume.toFixed(2);
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        return num.toLocaleString('en-US');
    };

    const handleAddToWatchlist = async () => {
        try {
            await axios.post('http://localhost:8000/watchlist/add',
                { symbol: symbol.toUpperCase() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsInWatchlist(true);
            setToast({ visible: true, message: `${symbol.toUpperCase()} added to watchlist!`, type: 'success' });
        } catch (err) {
            setToast({ visible: true, message: err.response?.data?.detail || 'Failed to add to watchlist', type: 'error' });
        }
    };

    const handleRemoveFromWatchlist = async () => {
        setRemoveLoading(true);
        try {
            await axios.post('http://localhost:8000/watchlist/remove',
                { symbol: symbol.toUpperCase() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsInWatchlist(false);
            setShowRemoveModal(false);
            setToast({ visible: true, message: `${symbol.toUpperCase()} removed from watchlist`, type: 'success' });
        } catch (err) {
            setToast({ visible: true, message: err.response?.data?.detail || 'Failed to remove from watchlist', type: 'error' });
        } finally {
            setRemoveLoading(false);
        }
    };

    const handleWatchlistClick = () => {
        if (isInWatchlist) {
            setShowRemoveModal(true);
        } else {
            handleAddToWatchlist();
        }
    };

    const handleTrade = () => {
        // Navigate to portfolio with trade param to auto-open transaction modal
        navigate(`/portfolio?trade=${symbol.toUpperCase()}`);
    };

    if (error) {
        const isAuthError = error.toLowerCase().includes('credential') || error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('401');

        return (
            <div className="min-h-screen bg-background text-text">
                {/* Header */}
                <header className="border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="text-primary">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                                    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold">CryptoBeacon</span>
                        </Link>
                    </div>
                </header>

                {/* Access Restricted Content */}
                <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 73px)' }}>
                    <div className="text-center">
                        {isAuthError ? (
                            <>
                                <div className="flex justify-center mb-6">
                                    <Lock size={48} className="text-gray-400" />
                                </div>
                                <h1 className="text-4xl font-bold text-text mb-4">Access Restricted</h1>
                                <p className="text-gray-600 dark:text-gray-400 mb-8">You need to be logged in to access this page.</p>
                                <Link
                                    to="/login"
                                    className="inline-block px-12 py-4 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg transition-colors text-lg"
                                >
                                    Go to Login Page
                                </Link>
                            </>
                        ) : (
                            <>
                                <p className="text-red-500 mb-4">{error}</p>
                                <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const isPositive = cryptoData?.priceChangePercent >= 0;

    return (
        <div className="min-h-screen bg-background text-text">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="text-primary">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                                    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold">CryptoBeacon</span>
                        </Link>

                        {/* Search Bar - Center */}
                        <div className="flex-1 max-w-lg mx-8">
                            <SearchBar />
                        </div>
                        {/* Right Side Actions */}
                        <div className="flex items-center gap-3">
                            <Link to="/wishlist" className="p-2 bg-card border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-primary" title="Watchlist">
                                <Star size={18} />
                            </Link>
                            <UserButton />
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm mb-6">
                    <Link to="/" className="text-primary hover:underline flex items-center gap-1">
                        <ChevronLeft size={16} />
                        Home
                    </Link>
                    <span className="text-gray-500">/</span>
                    <span className="text-text">{cryptoData?.name || symbol} ({symbol?.toUpperCase()}) Details</span>
                </div>

                {/* Hero Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        {/* Crypto Icon */}
                        {loading ? (
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                <CoinIcon symbol={symbol} size={40} />
                            </div>
                        )}

                        {/* Name and Price */}
                        <div>
                            {loading ? (
                                <div className="animate-pulse">
                                    <div className="h-8 bg-gray-700 rounded w-40 mb-2"></div>
                                    <div className="h-6 bg-gray-700 rounded w-32 mb-1"></div>
                                    <div className="h-4 bg-gray-700 rounded w-48"></div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-2xl font-bold text-text">
                                        {cryptoData?.name} ({symbol?.toUpperCase()})
                                    </h1>
                                    <p className="text-3xl font-bold text-text mt-1">
                                        {formatPrice(cryptoData?.price)}
                                    </p>
                                    <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                        {isPositive ? '+' : ''}{cryptoData?.priceChangePercent?.toFixed(2)}% ({formatPrice(Math.abs(cryptoData?.priceChange || 0))}) in last 24h
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleTrade}
                            className="px-6 py-2 bg-card border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 text-text font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            <ArrowUpDown size={18} />
                            Trade
                        </button>
                        <button
                            onClick={handleWatchlistClick}
                            className={`px-6 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${isInWatchlist
                                ? 'bg-card border border-primary text-primary hover:bg-primary/10'
                                : 'bg-primary hover:bg-primary/90 text-black'
                                }`}
                        >
                            {isInWatchlist ? <Check size={18} /> : <Star size={18} />}
                            {isInWatchlist ? 'Wishlisted' : 'Add to Watchlist'}
                        </button>
                    </div>
                </div>

                {/* Market Stats Grid */}
                {!loading && cryptoData && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                            <p className="text-gray-500 text-xs mb-1">24h High</p>
                            <p className="text-text font-semibold">{formatPrice(cryptoData?.high24h)}</p>
                        </div>
                        <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                            <p className="text-gray-500 text-xs mb-1">24h Low</p>
                            <p className="text-text font-semibold">{formatPrice(cryptoData?.low24h)}</p>
                        </div>
                        <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                            <p className="text-gray-500 text-xs mb-1">24h Volume</p>
                            <p className="text-text font-semibold">{formatVolume(cryptoData?.volume)} {symbol?.toUpperCase()}</p>
                        </div>
                        <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                            <p className="text-gray-500 text-xs mb-1">Quote Volume</p>
                            <p className="text-text font-semibold">${formatVolume(cryptoData?.quoteVolume)}</p>
                        </div>
                        <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                            <p className="text-gray-500 text-xs mb-1">Trades (24h)</p>
                            <p className="text-text font-semibold">{formatNumber(cryptoData?.tradeCount)}</p>
                        </div>
                        <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                            <p className="text-gray-500 text-xs mb-1">Bid / Ask</p>
                            <p className="text-text font-semibold text-xs">
                                {formatPrice(cryptoData?.bidPrice)} / {formatPrice(cryptoData?.askPrice)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Forecast and News Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Forecast Chart */}
                    <ForecastChart
                        forecast={forecastData?.forecast}
                        labels={forecastData?.labels}
                        currentPrice={forecastData?.currentPrice}
                        predictedPrice={forecastData?.predictedPrice}
                        changePercent={forecastData?.changePercent}
                        historicalPrices={forecastData?.historicalPrices}
                        loading={forecastLoading}
                    />

                    {/* News Summary - handles its own data loading */}
                    <NewsSummaryCard symbol={symbol} />
                </div>
            </main>

            {/* Toast Notification */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast({ ...toast, visible: false })}
            />

            {/* Remove from Watchlist Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={showRemoveModal}
                onClose={() => setShowRemoveModal(false)}
                onConfirm={handleRemoveFromWatchlist}
                coinSymbol={symbol?.toUpperCase()}
                coinName={getCoinName(symbol)}
                loading={removeLoading}
            />
        </div>
    );
};

export default CryptoDetailPage;
