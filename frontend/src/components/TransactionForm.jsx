import React, { useState } from 'react';
import { addTransaction } from '../services/api';

const TransactionForm = ({ onTransactionAdded }) => {
    const [formData, setFormData] = useState({
        coin_symbol: '',
        buy_price: '',
        quantity: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Ensure types are correct for Pydantic (float)
            const payload = {
                coin_symbol: formData.coin_symbol.toUpperCase(),
                buy_price: parseFloat(formData.buy_price),
                quantity: parseFloat(formData.quantity),
            };
            await addTransaction(payload);
            setFormData({ coin_symbol: '', buy_price: '', quantity: '' });
            if (onTransactionAdded) onTransactionAdded();
        } catch (err) {
            setError('Failed to add transaction. Please check inputs.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6">Add Transaction</h3>
            {error && <p className="text-danger mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-text-muted text-sm font-medium mb-1">Coin Symbol</label>
                    <input
                        type="text"
                        name="coin_symbol"
                        value={formData.coin_symbol}
                        onChange={handleChange}
                        placeholder="e.g. BTC"
                        className="w-full bg-background text-white rounded p-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                    />
                </div>
                <div>
                    <label className="block text-text-muted text-sm font-medium mb-1">Quantity</label>
                    <input
                        type="number"
                        step="any"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full bg-background text-white rounded p-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                    />
                </div>
                <div>
                    <label className="block text-text-muted text-sm font-medium mb-1">Buy Price (USD)</label>
                    <input
                        type="number"
                        step="any"
                        name="buy_price"
                        value={formData.buy_price}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full bg-background text-white rounded p-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-primary hover:bg-primary/90 text-background font-bold py-2 px-4 rounded transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {loading ? 'Adding...' : 'Add Transaction'}
                </button>
            </form>
        </div>
    );
};

export default TransactionForm;
