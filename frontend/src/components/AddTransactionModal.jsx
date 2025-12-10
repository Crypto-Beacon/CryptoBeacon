import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Calendar } from 'lucide-react';
import { addTransaction } from '../services/api';
import { fetchAllCoins, getCoinBySymbol } from '../services/cryptoService';

const AddTransactionModal = ({ isOpen, onClose, onTransactionAdded, initialCoin = null }) => {
    const [formData, setFormData] = useState({
        coin_symbol: '',
        coin_name: '',
        quantity: '',
        buy_price: '',
        transaction_date: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCoinDropdown, setShowCoinDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [allCoins, setAllCoins] = useState([]);
    const [coinsLoading, setCoinsLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch all coins when modal opens
    useEffect(() => {
        if (isOpen && allCoins.length === 0) {
            setCoinsLoading(true);
            fetchAllCoins()
                .then(coins => setAllCoins(coins))
                .catch(err => console.error('Failed to load coins:', err))
                .finally(() => setCoinsLoading(false));
        }
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Filter coins based on search
    const filteredCoins = searchQuery.trim()
        ? allCoins.filter(
            (coin) =>
                coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                coin.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 50)
        : allCoins.slice(0, 50); // Show top 50 by default

    // Calculate total value
    const totalValue = (parseFloat(formData.quantity) || 0) * (parseFloat(formData.buy_price) || 0);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowCoinDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset form when modal opens, pre-select coin if initialCoin is provided
    useEffect(() => {
        if (isOpen) {
            // Find the coin or create a placeholder
            const preselectedCoin = initialCoin
                ? getCoinBySymbol(allCoins, initialCoin)
                : null;

            setFormData({
                coin_symbol: preselectedCoin ? preselectedCoin.symbol : '',
                coin_name: preselectedCoin ? preselectedCoin.name : '',
                quantity: '',
                buy_price: '',
                transaction_date: new Date().toISOString().split('T')[0],
            });
            setError(null);
            setSearchQuery('');
        }
    }, [isOpen, initialCoin, allCoins]);

    const handleCoinSelect = (coin) => {
        setFormData({
            ...formData,
            coin_symbol: coin.symbol,
            coin_name: coin.name,
        });
        setSearchQuery('');
        setShowCoinDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.coin_symbol) {
            setError('Please select a coin');
            return;
        }
        if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
            setError('Please enter a valid quantity');
            return;
        }
        if (!formData.buy_price || parseFloat(formData.buy_price) <= 0) {
            setError('Please enter a valid price');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                coin_symbol: formData.coin_symbol.toUpperCase(),
                buy_price: parseFloat(formData.buy_price),
                quantity: parseFloat(formData.quantity),
            };

            await addTransaction(payload);

            if (onTransactionAdded) {
                onTransactionAdded();
            }
            onClose();
        } catch (err) {
            setError('Failed to add transaction. Please try again.');
            console.error('Transaction error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-card border border-gray-200 dark:border-primary/20 rounded-xl shadow-2xl shadow-primary/5 dark:shadow-primary/10">
                {/* Header */}
                <div className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-text">Add New Transaction</h2>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                Enter the details of your latest crypto purchase or sale.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-primary/20" />

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 pt-5 space-y-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Coin Selector */}
                    <div ref={dropdownRef}>
                        <label className="block text-text font-medium mb-2">Coin</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowCoinDropdown(!showCoinDropdown)}
                                className="w-full flex items-center justify-between bg-gray-50 dark:bg-[#0d2a23] border border-gray-200 dark:border-primary/30 rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            >
                                <span className={formData.coin_symbol ? 'text-text' : 'text-gray-500'}>
                                    {formData.coin_symbol
                                        ? `${formData.coin_name} (${formData.coin_symbol})`
                                        : 'Search coin (e.g. Ethereum)'
                                    }
                                </span>
                                <ChevronDown size={20} className="text-primary" />
                            </button>

                            {/* Dropdown */}
                            {showCoinDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-card dark:bg-[#0d2a23] border border-gray-200 dark:border-primary/30 rounded-lg shadow-xl z-10 max-h-60 overflow-hidden">
                                    {/* Search Input */}
                                    <div className="p-2 border-b border-primary/20">
                                        <input
                                            placeholder="Search coins..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-[#0a1f1a] border border-gray-200 dark:border-primary/20 rounded-lg px-3 py-2 text-text dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                            autoFocus
                                        />
                                    </div>

                                    {/* Coin List */}
                                    <div className="max-h-44 overflow-y-auto">
                                        {filteredCoins.length === 0 ? (
                                            <div className="px-4 py-3 text-gray-500 text-sm">No coins found</div>
                                        ) : (
                                            filteredCoins.map((coin) => (
                                                <button
                                                    key={coin.symbol}
                                                    type="button"
                                                    onClick={() => handleCoinSelect(coin)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-primary/10 transition-colors text-left"
                                                >
                                                    <span className="text-text dark:text-white font-medium">{coin.name}</span>
                                                    <span className="text-gray-500 text-sm">{coin.symbol}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quantity and Price Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-text font-medium mb-2">Quantity</label>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="0.00"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-[#0d2a23] border border-gray-200 dark:border-primary/30 rounded-lg px-4 py-3 text-text dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-text font-medium mb-2">Price per Coin</label>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="$2,000.00"
                                value={formData.buy_price}
                                onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-[#0d2a23] border border-gray-200 dark:border-primary/30 rounded-lg px-4 py-3 text-text dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Transaction Date */}
                    <div>
                        <label className="block text-text font-medium mb-2">Transaction Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={formData.transaction_date}
                                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-[#0d2a23] border border-gray-200 dark:border-primary/30 rounded-lg px-4 py-3 text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none [color-scheme:light] dark:[color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-primary/20" />

                    {/* Total Value */}
                    <div className="flex items-center justify-between py-1">
                        <span className="text-primary text-sm">Total Value</span>
                        <span className="text-text font-semibold">
                            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-primary/20" />

                    {/* Buttons */}
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-[#1a3330] dark:hover:bg-[#234540] text-gray-700 dark:text-white font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-8 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? 'Adding...' : 'Add Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTransactionModal;
