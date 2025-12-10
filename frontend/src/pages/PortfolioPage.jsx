import React, { useEffect, useState } from 'react'; // Force Rebuild
import { Link, useNavigate } from 'react-router-dom';
import { Power, Settings, Plus, Trash2, Star, Mail } from 'lucide-react';
import { getPortfolio, deletePortfolioItem, sendPortfolioReport } from '../services/api';
import { useBinanceWebSocket } from '../hooks/useBinanceWebSocket';
import AddTransactionModal from '../components/AddTransactionModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import CoinIcon from '../components/CoinIcon';
import SearchBar from '../components/SearchBar';
import UserButton from '../components/UserButton';
import { getCoinName } from '../services/cryptoService';

const PortfolioPage = () => {
    const [portfolio, setPortfolio] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [tradeCoin, setTradeCoin] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportMessage, setReportMessage] = useState(null);
    const navigate = useNavigate();

    // Check for trade query param to auto-open transaction modal
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tradeSymbol = params.get('trade');
        if (tradeSymbol) {
            setTradeCoin(tradeSymbol.toUpperCase());
            setShowTransactionModal(true);
            // Clear the query param from URL without reload
            window.history.replaceState({}, '', '/portfolio');
        }
    }, []);

    // Fetch portfolio data
    const fetchPortfolio = async () => {
        try {
            const response = await getPortfolio();
            setPortfolio(response.data || []);
        } catch (error) {
            console.error('Failed to fetch portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolio();
    }, []);

    // Get unique symbols for WebSocket
    const symbols = [...new Set(portfolio.map(item => item.coin_symbol))];
    const prices = useBinanceWebSocket(symbols);

    // Calculate totals
    const calculateStats = () => {
        let totalValue = 0;
        let totalCost = 0;

        portfolio.forEach(item => {
            const currentPrice = prices[`${item.coin_symbol}USDT`] || 0;
            totalValue += currentPrice * item.quantity;
            totalCost += item.buy_price * item.quantity;
        });

        const weeklyPL = totalValue - totalCost;
        const weeklyPLPercent = totalCost > 0 ? ((weeklyPL / totalCost) * 100) : 0;

        return { totalValue, weeklyPL, weeklyPLPercent };
    };

    const stats = calculateStats();

    // Calculate individual asset P&L
    const calculateAssetPnL = (item) => {
        const currentPrice = prices[`${item.coin_symbol}USDT`] || 0;
        if (!currentPrice) return null;

        const cost = item.buy_price * item.quantity;
        const value = currentPrice * item.quantity;
        const pnl = value - cost;
        const pnlPercent = cost > 0 ? ((pnl / cost) * 100) : 0;

        return { currentPrice, value, pnl, pnlPercent };
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
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
            <header className="border-b border-gray-200 dark:border-gray-800/20">
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
                            <Link to="/wishlist" className="p-2 bg-card border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/20 transition-colors text-text-muted hover:text-primary" title="Watchlist">
                                <Star size={18} />
                            </Link>
                            <UserButton />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Portfolio Summary</h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={async () => {
                                setReportLoading(true);
                                setReportMessage(null);
                                try {
                                    const res = await sendPortfolioReport();
                                    setReportMessage({ type: 'success', text: res.data.message });
                                } catch (err) {
                                    setReportMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to send report' });
                                } finally {
                                    setReportLoading(false);
                                }
                            }}
                            disabled={reportLoading || portfolio.length === 0}
                            className="flex items-center gap-2 bg-card border border-gray-200 dark:border-gray-700 hover:border-primary text-text font-medium px-5 py-2.5 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Mail size={18} />
                            <span>{reportLoading ? 'Sending...' : 'Email Report'}</span>
                        </button>
                        <button
                            onClick={() => setShowTransactionModal(true)}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-semibold px-5 py-2.5 rounded-full transition-all duration-200 shadow-lg shadow-primary/20"
                        >
                            <Plus size={18} />
                            <span>Add Transaction</span>
                        </button>
                    </div>
                </div>
                {reportMessage && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${reportMessage.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {reportMessage.text}
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* Total Portfolio Balance */}
                    <div className="bg-card border border-gray-200 dark:border-gray-800/20 rounded-xl p-6">
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Portfolio Balance</p>
                        <h2 className="text-4xl font-bold tracking-tight">
                            ${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                    </div>

                    {/* Weekly P/L */}
                    <div className="bg-card border border-gray-200 dark:border-gray-800/50 rounded-xl p-6">
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Weekly P/L</p>
                        <h2 className={`text-4xl font-bold tracking-tight ${stats.weeklyPL >= 0 ? 'text-primary' : 'text-red-500'}`}>
                            {stats.weeklyPL >= 0 ? '+' : ''}${Math.abs(stats.weeklyPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                        <p className={`text-sm mt-1 ${stats.weeklyPLPercent >= 0 ? 'text-primary' : 'text-red-500'}`}>
                            {stats.weeklyPLPercent >= 0 ? '+' : ''}{stats.weeklyPLPercent.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* My Assets */}
                <section>
                    <h2 className="text-xl font-bold mb-6">My Assets</h2>

                    <div className="bg-card border border-gray-200 dark:border-gray-800/50 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800/50">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Coin</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Holdings</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg. Buy Price</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Price</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Profit/Loss</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/30">
                                {portfolio.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 text-gray-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800/50 rounded-full flex items-center justify-center">
                                                    <Plus size={24} className="text-gray-600" />
                                                </div>
                                                <p>No assets in your portfolio yet.</p>
                                                <button
                                                    onClick={() => setShowTransactionModal(true)}
                                                    className="text-primary hover:underline text-sm font-medium"
                                                >
                                                    Add your first transaction →
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    portfolio.map((item, index) => {
                                        const assetStats = calculateAssetPnL(item);
                                        const holdingValue = item.buy_price * item.quantity;

                                        return (
                                            <tr
                                                key={item._id || index}
                                                className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                                                onClick={() => navigate(`/crypto/${item.coin_symbol}`)}
                                            >
                                                {/* Coin */}
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                                                            <CoinIcon symbol={item.coin_symbol} size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-text">{item.coin_symbol}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-500">{getCoinName(item.coin_symbol)}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Holdings */}
                                                <td className="px-6 py-5 text-center">
                                                    <p className="font-medium text-text">
                                                        {item.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })} {item.coin_symbol}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-500">
                                                        ${holdingValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </td>

                                                {/* Avg. Buy Price */}
                                                <td className="px-6 py-5 text-center text-gray-700 dark:text-gray-300">
                                                    ${item.buy_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>

                                                {/* Current Price */}
                                                <td className="px-6 py-5 text-center text-gray-700 dark:text-gray-300">
                                                    {assetStats ?
                                                        `$${assetStats.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                        : <span className="text-gray-500">Loading...</span>
                                                    }
                                                </td>

                                                {/* Profit/Loss */}
                                                <td className="px-6 py-5 text-center">
                                                    {assetStats ? (
                                                        <div className={assetStats.pnl >= 0 ? 'text-primary' : 'text-red-500'}>
                                                            <p className="font-semibold">
                                                                {assetStats.pnl >= 0 ? '+' : '-'}${Math.abs(assetStats.pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                            <p className="text-sm opacity-80">
                                                                {assetStats.pnlPercent >= 0 ? '+' : ''}{assetStats.pnlPercent.toFixed(2)}%
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">-</span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-5 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteTarget(item);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Remove asset"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {/* Add Transaction Modal */}
            <AddTransactionModal
                isOpen={showTransactionModal}
                onClose={() => {
                    setShowTransactionModal(false);
                    setTradeCoin(null);
                }}
                onTransactionAdded={fetchPortfolio}
                initialCoin={tradeCoin}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDeleteTarget(null);
                }}
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    setDeleteLoading(true);
                    try {
                        await deletePortfolioItem(deleteTarget._id);
                        setShowDeleteModal(false);
                        setDeleteTarget(null);
                        fetchPortfolio();
                    } catch (error) {
                        console.error('Failed to delete item:', error);
                    } finally {
                        setDeleteLoading(false);
                    }
                }}
                coinSymbol={deleteTarget?.coin_symbol}
                coinName={deleteTarget ? getCoinName(deleteTarget.coin_symbol) : ''}
                loading={deleteLoading}
            />
        </div>
    );
};

export default PortfolioPage;
