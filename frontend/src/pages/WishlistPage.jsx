import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Power, Settings, Star, Trash2, Search } from 'lucide-react';
import { getWatchlist, removeFromWatchlist } from '../services/api';
import { useBinanceWebSocket } from '../hooks/useBinanceWebSocket';
import SearchBar from '../components/SearchBar';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import CoinIcon from '../components/CoinIcon';
import UserButton from '../components/UserButton';
import { getCoinName } from '../services/cryptoService';

// Market cap estimates (in billions) - for display purposes
const MARKET_CAPS = {
    BTC: '1.35T',
    ETH: '427.8B',
    SOL: '76.4B',
    DOGE: '22.9B',
    ADA: '15.9B',
    XRP: '45.2B',
    DOT: '8.5B',
    AVAX: '14.2B',
    MATIC: '5.8B',
    LINK: '9.1B',
    LTC: '6.2B',
    BNB: '89.3B',
};

// Generate chart image based on price trend
const getChartImage = (change) => {
    // Using placeholder chart images - in production, these would be actual mini charts
    if (change >= 0) {
        return 'data:image/svg+xml,' + encodeURIComponent(`
      <svg width="120" height="60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="greenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#00FF88;stop-opacity:0.3"/>
            <stop offset="100%" style="stop-color:#00FF88;stop-opacity:0"/>
          </linearGradient>
        </defs>
        <path d="M0,50 Q20,45 40,35 T80,20 T120,10" stroke="#00FF88" stroke-width="2" fill="none"/>
        <path d="M0,50 Q20,45 40,35 T80,20 T120,10 L120,60 L0,60 Z" fill="url(#greenGrad)"/>
      </svg>
    `);
    } else {
        return 'data:image/svg+xml,' + encodeURIComponent(`
      <svg width="120" height="60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="redGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#FF4D4D;stop-opacity:0.3"/>
            <stop offset="100%" style="stop-color:#FF4D4D;stop-opacity:0"/>
          </linearGradient>
        </defs>
        <path d="M0,10 Q20,15 40,25 T80,40 T120,50" stroke="#FF4D4D" stroke-width="2" fill="none"/>
        <path d="M0,10 Q20,15 40,25 T80,40 T120,50 L120,60 L0,60 Z" fill="url(#redGrad)"/>
      </svg>
    `);
    }
};

const WishlistPage = () => {
    const [watchlist, setWatchlist] = useState([]);
    const [priceChanges, setPriceChanges] = useState({});
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const navigate = useNavigate();

    // Fetch watchlist data
    const fetchWatchlist = async () => {
        try {
            const response = await getWatchlist();
            // Backend returns list of symbols directly, not wrapped in an object
            const watchlistItems = Array.isArray(response.data) ? response.data : (response.data?.watchlist || []);
            setWatchlist(watchlistItems);

            // Fetch 24h price changes for each coin
            const changes = {};
            for (const symbol of watchlistItems) {
                try {
                    const tickerRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`);
                    const tickerData = await tickerRes.json();
                    changes[symbol] = parseFloat(tickerData.priceChangePercent) || 0;
                } catch (e) {
                    changes[symbol] = 0;
                }
            }
            setPriceChanges(changes);
        } catch (error) {
            console.error('Failed to fetch watchlist:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWatchlist();
    }, []);

    // Get live prices
    const prices = useBinanceWebSocket(watchlist);

    // Handle remove from watchlist
    const handleRemove = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await removeFromWatchlist(deleteTarget);
            setShowDeleteModal(false);
            setDeleteTarget(null);
            fetchWatchlist();
        } catch (error) {
            console.error('Failed to remove from watchlist:', error);
        } finally {
            setDeleteLoading(false);
        }
    };

    // Open confirmation modal
    const confirmRemove = (symbol) => {
        setDeleteTarget(symbol);
        setShowDeleteModal(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const formatPrice = (price) => {
        if (!price) return '-';
        if (price >= 1000) {
            return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (price >= 1) {
            return `$${price.toFixed(2)}`;
        } else {
            return `$${price.toFixed(4)}`;
        }
    };

    const formatChange = (change) => {
        if (change === undefined || change === null) return '-';
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(2)}%`;
    };

    // Focus the search bar input
    const focusSearchBar = () => {
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text">
            {/* Navigation Header */}
            <header className="border-b border-gray-800/20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <div className="text-primary">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                                    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                                </svg>
                            </div>
                            <span className="text-lg font-semibold tracking-tight">CryptoBeacon</span>
                        </Link>

                        {/* Search Bar - Center */}
                        <div className="flex-1 max-w-lg mx-8">
                            <SearchBar />
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-3">
                            <UserButton />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Page Header */}
                <h1 className="text-3xl font-bold tracking-tight mb-8">My Watchlist</h1>

                {/* Watchlist Table */}
                <div className="bg-card border border-gray-800/20 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800/50">
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Coin</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">24h Change</th>
                                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">24h Chart</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Market Cap</th>
                                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/30">
                            {watchlist.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-16 text-gray-500">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center">
                                                <Star size={32} className="text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-medium text-gray-400">Your watchlist is empty</p>
                                                <p className="text-sm text-gray-600 mt-1">Search for cryptocurrencies to add them to your watchlist</p>
                                            </div>
                                            <button
                                                onClick={focusSearchBar}
                                                className="mt-2 px-6 py-2 bg-primary hover:bg-primary/90 text-black font-semibold rounded-full transition-colors text-sm flex items-center gap-2"
                                            >
                                                <Search size={16} />
                                                Search to Add
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                watchlist.map((symbol, index) => {
                                    const coinName = getCoinName(symbol);
                                    const currentPrice = prices[`${symbol}USDT`] || 0;
                                    const change = priceChanges[symbol] || 0;
                                    const marketCap = MARKET_CAPS[symbol] || 'N/A';

                                    return (
                                        <tr
                                            key={symbol}
                                            className="hover:bg-gray-100 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                            onClick={() => navigate(`/crypto/${symbol}`)}
                                        >
                                            {/* Coin */}
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center">
                                                        <CoinIcon symbol={symbol} size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-text">{coinName}</p>
                                                        <p className="text-sm text-gray-500">{symbol}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Price */}
                                            <td className="px-6 py-5">
                                                <p className="font-medium text-text">{formatPrice(currentPrice)}</p>
                                            </td>

                                            {/* 24h Change */}
                                            <td className="px-6 py-5">
                                                <p className={`font-medium ${change >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                                    {formatChange(change)}
                                                </p>
                                            </td>

                                            {/* 24h Chart */}
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    <div className="w-28 h-14 rounded-lg overflow-hidden bg-gray-900/50">
                                                        <img
                                                            src={getChartImage(change)}
                                                            alt="24h chart"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Market Cap */}
                                            <td className="px-6 py-5 text-right">
                                                <p className="font-medium text-gray-300">${marketCap}</p>
                                            </td>

                                            {/* Star/Remove */}
                                            <td className="px-6 py-5 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        confirmRemove(symbol);
                                                    }}
                                                    className="text-primary hover:text-red-500 transition-colors p-1"
                                                    title="Remove from watchlist"
                                                >
                                                    <Star size={20} fill="currentColor" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Navigation Links */}
                <div className="mt-8 flex justify-center gap-4">
                    <Link
                        to="/portfolio"
                        className="px-6 py-3 bg-card border border-gray-700/50 hover:border-primary/50 text-text font-medium rounded-lg transition-colors"
                    >
                        View Portfolio
                    </Link>
                    <button
                        onClick={focusSearchBar}
                        className="px-6 py-3 bg-card border border-gray-700/50 hover:border-primary/50 text-text font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Search size={16} />
                        Search to Add
                    </button>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDeleteTarget(null);
                }}
                onConfirm={handleRemove}
                coinSymbol={deleteTarget}
                coinName={deleteTarget ? getCoinName(deleteTarget) : ''}
                loading={deleteLoading}
                source="watchlist"
            />
        </div>
    );
};

export default WishlistPage;
