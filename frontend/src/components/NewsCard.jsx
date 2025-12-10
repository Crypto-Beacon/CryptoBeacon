import React from 'react';
import { Newspaper, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const NewsCard = ({ news }) => {
    // Mock data if no news provided
    const newsItem = news || {
        title: "Market Analysis: Bitcoin Surges Past Resistance",
        summary: "Bitcoin has shown strong momentum, breaking through key resistance levels. AI analysis suggests a bullish trend for the coming week driven by institutional adoption news.",
        sentiment: "positive", // positive, negative, neutral
        source: "CryptoDaily",
        time: "2 hours ago"
    };

    const getSentimentIcon = (sentiment) => {
        switch (sentiment) {
            case 'positive': return <TrendingUp className="text-success" />;
            case 'negative': return <TrendingDown className="text-danger" />;
            default: return <AlertCircle className="text-yellow-500" />;
        }
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return 'border-l-4 border-l-success';
            case 'negative': return 'border-l-4 border-l-danger';
            default: return 'border-l-4 border-l-yellow-500';
        }
    };

    return (
        <div className={cn("bg-card p-6 rounded-lg shadow-lg hover:bg-white/5 transition", getSentimentColor(newsItem.sentiment))}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-text-muted text-sm">
                    <Newspaper size={16} />
                    <span>{newsItem.source}</span>
                    <span>•</span>
                    <span>{newsItem.time}</span>
                </div>
                {getSentimentIcon(newsItem.sentiment)}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{newsItem.title}</h3>
            <p className="text-text-muted text-sm leading-relaxed">
                {newsItem.summary}
            </p>
        </div>
    );
};

export default NewsCard;
