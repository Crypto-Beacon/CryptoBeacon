import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils'; // Assuming cn utility is created

const PortfolioTable = ({ portfolio, prices }) => {
    const calculatePnL = (item) => {
        const currentPrice = prices[`${item.coin_symbol}USDT`] || 0;
        if (!currentPrice) return null;
        const value = currentPrice * item.quantity;
        const cost = item.buy_price * item.quantity;
        const pnl = value - cost;
        const pnlPercent = (pnl / cost) * 100;
        return { value, pnl, pnlPercent };
    };

    return (
        <div className="overflow-x-auto bg-card rounded-lg shadow-lg">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="uppercase tracking-wider border-b-2 border-gray-200 dark:border-white/10 bg-card">
                    <tr>
                        <th scope="col" className="px-6 py-4 text-text-muted font-bold">Asset</th>
                        <th scope="col" className="px-6 py-4 text-text-muted font-bold">Quantity</th>
                        <th scope="col" className="px-6 py-4 text-text-muted font-bold">Avg. Buy Price</th>
                        <th scope="col" className="px-6 py-4 text-text-muted font-bold">Current Price</th>
                        <th scope="col" className="px-6 py-4 text-text-muted font-bold">Value</th>
                        <th scope="col" className="px-6 py-4 text-text-muted font-bold">PnL</th>
                    </tr>
                </thead>
                <tbody>
                    {portfolio.map((item) => {
                        const stats = calculatePnL(item);
                        const currentPrice = prices[`${item.coin_symbol}USDT`];

                        return (
                            <tr key={item._id || item.id} className="border-b border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 transition">
                                <td className="px-6 py-4 text-text font-medium">{item.coin_symbol}</td>
                                <td className="px-6 py-4 text-text-muted">{item.quantity}</td>
                                <td className="px-6 py-4 text-text-muted">${item.buy_price.toFixed(2)}</td>
                                <td className="px-6 py-4 text-text-muted">
                                    {currentPrice ? `$${currentPrice.toFixed(2)}` : 'Loading...'}
                                </td>
                                <td className="px-6 py-4 text-text-muted">
                                    {stats ? `$${stats.value.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    {stats ? (
                                        <div className={cn("flex items-center gap-1", stats.pnl >= 0 ? "text-success" : "text-danger")}>
                                            {stats.pnl >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                            <span>${Math.abs(stats.pnl).toFixed(2)} ({stats.pnlPercent.toFixed(2)}%)</span>
                                        </div>
                                    ) : (
                                        <span className="text-text-muted">-</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {portfolio.length === 0 && (
                        <tr>
                            <td colSpan="6" className="text-center py-8 text-text-muted">
                                No assets in portfolio. Add a transaction to get started.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PortfolioTable;
