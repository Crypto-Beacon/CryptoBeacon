import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, Loader2, Newspaper, RefreshCw, Clock, Download } from 'lucide-react';
import axios from 'axios';

const NewsSummaryCard = ({ symbol }) => {
    const [articles, setArticles] = useState([]);
    const [cacheStatus, setCacheStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [aiSummary, setAiSummary] = useState(null);
    const [summarizing, setSummarizing] = useState(false);
    const token = localStorage.getItem('token');

    // Check cache status on mount
    useEffect(() => {
        const checkCacheStatus = async () => {
            try {
                const response = await axios.get(
                    `http://localhost:8000/crypto/${symbol}/news/status`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setCacheStatus(response.data);

                // If we have valid cache, load it
                if (response.data.has_cache && !response.data.is_expired) {
                    loadCachedNews();
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to check cache status:', err);
                setLoading(false);
            }
        };

        if (token && symbol) {
            checkCacheStatus();
        }
    }, [symbol, token]);

    // Load cached news (no API call)
    const loadCachedNews = async () => {
        try {
            const response = await axios.get(
                `http://localhost:8000/crypto/${symbol}/news`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setArticles(response.data.articles || []);
        } catch (err) {
            console.error('Failed to load cached news:', err);
        }
        setLoading(false);
    };

    // Fetch fresh news (makes API call)
    const fetchFreshNews = async () => {
        setFetching(true);
        setAiSummary(null); // Clear previous summary
        try {
            const response = await axios.post(
                `http://localhost:8000/crypto/${symbol}/news/fetch`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setArticles(response.data.articles || []);
            setCacheStatus({
                has_cache: true,
                is_expired: false,
                article_count: response.data.articles?.length || 0,
                age_hours: 0
            });
        } catch (err) {
            console.error('Failed to fetch news:', err);
        }
        setFetching(false);
    };

    // Generate AI summary
    const handleGenerateSummary = async () => {
        if (articles.length === 0) return;

        setSummarizing(true);
        try {
            const response = await axios.post(
                `http://localhost:8000/crypto/${symbol}/summarize`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAiSummary(response.data.summary);
        } catch (err) {
            console.error('Failed to generate summary:', err);
            setAiSummary('Failed to generate summary. Please try again.');
        }
        setSummarizing(false);
    };

    if (loading) {
        return (
            <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4 animate-pulse"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
        );
    }

    const hasNews = articles.length > 0;
    const needsRefresh = cacheStatus?.is_expired && cacheStatus?.has_cache;
    const noCache = !cacheStatus?.has_cache;

    return (
        <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Newspaper size={20} className="text-primary" />
                    <h3 className="text-xl font-bold text-text">Latest News</h3>
                </div>

                <div className="flex items-center gap-2">
                    {/* Refresh/Load Button */}
                    {(noCache || needsRefresh) && (
                        <button
                            onClick={fetchFreshNews}
                            disabled={fetching}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-black text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {fetching ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Download size={14} />
                            )}
                            {fetching ? 'Loading...' : noCache ? 'Load News' : 'Refresh'}
                        </button>
                    )}

                    {/* AI Summary Button - only when news loaded */}
                    {hasNews && (
                        <button
                            onClick={handleGenerateSummary}
                            disabled={summarizing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                            {summarizing ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Sparkles size={14} />
                            )}
                            {summarizing ? 'Generating...' : 'AI Summary'}
                        </button>
                    )}
                </div>
            </div>

            {/* Cache Status */}
            {cacheStatus?.has_cache && cacheStatus?.age_hours !== null && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Clock size={12} />
                    <span>
                        Cached {cacheStatus.age_hours < 1 ? 'just now' : `${cacheStatus.age_hours}h ago`}
                        {cacheStatus.is_expired && ' (expired)'}
                    </span>
                </div>
            )}

            {/* AI Summary Section */}
            {aiSummary && (
                <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-primary" />
                        <span className="text-primary text-sm font-medium">AI-Generated Summary</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{aiSummary}</p>
                </div>
            )}

            {/* News Articles */}
            {hasNews ? (
                <div className="space-y-4">
                    {articles.map((article, index) => (
                        <div key={index} className="border-b border-gray-200 dark:border-gray-800 last:border-0 pb-4 last:pb-0">
                            <h4 className="text-text font-semibold text-sm mb-2 leading-tight">
                                {article.title}
                            </h4>
                            {article.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 leading-relaxed line-clamp-2">
                                    {article.description}
                                </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="text-primary">{article.source}</span>
                                {article.date && (
                                    <>
                                        <span>•</span>
                                        <span>{article.date}</span>
                                    </>
                                )}
                                {article.link && (
                                    <a
                                        href={article.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-auto text-gray-400 hover:text-primary transition-colors"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Newspaper size={32} className="text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No news loaded yet.</p>
                    <p className="text-gray-600 text-xs mt-1">
                        {noCache ? 'Click "Load News" to fetch latest articles.' : 'Cache expired. Click "Refresh" to update.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default NewsSummaryCard;
