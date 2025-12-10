import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { addToWatchlist } from '../services/api';

const GlobalSearch = ({ onAdd }) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!query) return;

        setLoading(true);
        try {
            const symbol = query.toUpperCase();
            await addToWatchlist(symbol);
            onAdd(); // Trigger refresh in parent
            setQuery('');
        } catch (error) {
            console.error("Failed to add to watchlist", error);
            // Ideally show a toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleAdd} className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search coin (e.g. BTC, ETH)..."
                    className="w-full bg-card text-white pl-10 pr-12 py-2 rounded-full border border-white/10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
                <button
                    type="submit"
                    disabled={!query || loading}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary/90 text-background p-1 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Add to Watchlist"
                >
                    <Plus size={16} />
                </button>
            </div>
        </form>
    );
};

export default GlobalSearch;
