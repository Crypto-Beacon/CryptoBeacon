import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, coinSymbol, coinName, loading, source = 'portfolio' }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm mx-4 bg-card border border-red-200 dark:border-red-500/30 rounded-xl shadow-2xl shadow-red-500/10 dark:shadow-red-500/10">
                {/* Header */}
                <div className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                                <AlertTriangle size={24} className="text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-text">Remove Asset</h2>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">This action cannot be undone</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Are you sure you want to remove <span className="text-text font-semibold">{coinName || coinSymbol}</span> ({coinSymbol}) from your {source}?
                    </p>

                    {/* Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-[#1a3330] dark:hover:bg-[#234540] text-gray-700 dark:text-white font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? 'Removing...' : 'Remove'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
