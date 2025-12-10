import React, { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';

const Watchlist = ({ watchlistData, onRemove, prices }) => {
    // watchlistData is an array of strings (symbols) passed from parent

    if (!watchlistData || watchlistData.length === 0) {
        return (
            <div className="bg-card p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Star className="text-primary" /> Watchlist
                </h3>
                <p className="text-text-muted text-sm">No favorites yet. Use search to add some!</p>
            </div>
        );
    }

    return (
        <div className="bg-card p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Star className="text-primary" /> Watchlist
            </h3>
            <div className="space-y-3">
                {watchlistData.map((symbol) => {
                    const currentPrice = prices[`${symbol}USDT`];

                    return (
                        <div key={symbol} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition">
                            <div className="flex flex-col">
                                <span className="font-bold text-white">{symbol}</span>
                                <span className="text-xs text-text-muted">USDT</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-white font-mono font-medium">
                                        {currentPrice ? `$${currentPrice.toFixed(2)}` : '...'}
                                    </div>
                                </div>

                                <button
                                    onClick={() => onRemove(symbol)}
                                    className="text-text-muted hover:text-danger conversion"
                                    title="Remove from Watchlist"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Watchlist;
