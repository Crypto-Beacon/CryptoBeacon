import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import axios from 'axios';

const RECENT_SEARCHES_KEY = 'cryptobeacon_recent_searches';
const MAX_RECENT_SEARCHES = 5;

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [symbols, setSymbols] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [loading, setLoading] = useState(true);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Load symbols on mount
    useEffect(() => {
        const fetchSymbols = async () => {
            try {
                const response = await axios.get('http://localhost:8000/crypto/symbols');
                setSymbols(response.data.symbols || []);
            } catch (err) {
                console.error('Failed to fetch symbols:', err);
            }
            setLoading(false);
        };

        fetchSymbols();

        // Load recent searches from localStorage
        const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    // Filter results based on query
    useEffect(() => {
        if (!query.trim()) {
            setFilteredResults([]);
            setSelectedIndex(-1);
            return;
        }

        const q = query.toLowerCase();
        const filtered = symbols.filter(s =>
            s.symbol.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q)
        ).slice(0, 10);

        setFilteredResults(filtered);
        setSelectedIndex(-1);
    }, [query, symbols]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                inputRef.current && !inputRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (crypto) => {
        // Add to recent searches
        const newRecent = [
            crypto,
            ...recentSearches.filter(r => r.symbol !== crypto.symbol)
        ].slice(0, MAX_RECENT_SEARCHES);

        setRecentSearches(newRecent);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecent));

        // Navigate to crypto page
        navigate(`/crypto/${crypto.symbol}`);
        setQuery('');
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        const results = query.trim() ? filteredResults : recentSearches;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSelect(results[selectedIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    const showDropdown = isOpen && (query.trim() || recentSearches.length > 0);

    return (
        <div className="relative w-full max-w-md">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search cryptocurrencies..."
                    className="w-full pl-10 pr-10 py-2.5 bg-card border border-gray-200 dark:border-gray-800 rounded-lg text-text placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(''); setFilteredResults([]); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden"
                >
                    {/* Recent Searches Header */}
                    {!query.trim() && recentSearches.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={12} />
                                Recent Searches
                            </span>
                            <button
                                onClick={clearRecentSearches}
                                className="text-xs text-gray-500 hover:text-primary"
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    {/* Results List */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-3 text-gray-500 text-sm">Loading...</div>
                        ) : query.trim() && filteredResults.length === 0 ? (
                            <div className="px-4 py-3 text-gray-500 text-sm">No results found</div>
                        ) : (
                            (query.trim() ? filteredResults : recentSearches).map((crypto, index) => (
                                <button
                                    key={crypto.symbol}
                                    onClick={() => handleSelect(crypto)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors ${selectedIndex === index ? 'bg-gray-100 dark:bg-gray-800/50' : ''
                                        }`}
                                >
                                    <img
                                        src={crypto.icon}
                                        alt={crypto.symbol}
                                        className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800"
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${crypto.symbol}&background=1a1a1a&color=10b981&size=32`;
                                        }}
                                    />
                                    <div className="flex-1 text-left">
                                        <p className="text-text font-medium">{crypto.name}</p>
                                        <p className="text-gray-500 text-sm">{crypto.symbol}</p>
                                    </div>
                                    <TrendingUp size={16} className="text-gray-600" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
