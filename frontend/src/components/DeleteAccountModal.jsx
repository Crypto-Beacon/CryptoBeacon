import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DeleteAccountModal = ({ isOpen, onClose }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleDelete = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            // axios.delete supports a body via the 'data' option or 'data' property in config
            await axios.delete('http://localhost:8000/auth/delete-account', {
                headers: { Authorization: `Bearer ${token}` },
                data: { password } // Matches UserDelete model
            });

            // Clear local storage
            localStorage.removeItem('token');

            // Redirect to login or home
            navigate('/login');
            window.location.reload(); // Force reload to clear state
        } catch (err) {
            console.error('Delete error:', err);
            setError(err.response?.data?.detail || 'Failed to delete account. Check your password.');
        } finally {
            setLoading(false);
        }
    };

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
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card w-full max-w-md rounded-2xl border border-danger/30 shadow-2xl overflow-hidden"
                >
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 text-danger">
                                <div className="p-2 bg-danger/10 rounded-lg">
                                    <AlertTriangle size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-white">Delete Account</h2>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                            This action is <span className="text-danger font-semibold">permanent</span> and cannot be undone.
                            All your data including portfolio, watchlist, and settings will be permanently erased.
                        </p>

                        <form onSubmit={handleDelete} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-background border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-danger focus:ring-1 focus:ring-danger transition-colors"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !password}
                                    className="flex-1 px-4 py-2.5 bg-danger hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Delete Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DeleteAccountModal;
