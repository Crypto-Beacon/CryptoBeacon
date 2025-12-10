import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Power,
    TrendingUp,
    Brain,
    Newspaper,
    Shield,
    ChevronDown,
    BarChart3,
    Zap,
    Lock,
    Eye,
    Sparkles,
    ArrowRight,
    Star
} from 'lucide-react';
import axios from 'axios';
import SearchBar from '../components/SearchBar';
import CoinIcon from '../components/CoinIcon';
import UserButton from '../components/UserButton';
import Toast from '../components/Toast';

// Top 10 cryptocurrencies with Binance trading pair symbols (no stablecoins)
const TOP_CRYPTOS = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', displaySymbol: 'BTC' },
    { symbol: 'ETHUSDT', name: 'Ethereum', displaySymbol: 'ETH' },
    { symbol: 'SOLUSDT', name: 'Solana', displaySymbol: 'SOL' },
    { symbol: 'BNBUSDT', name: 'BNB', displaySymbol: 'BNB' },
    { symbol: 'XRPUSDT', name: 'Ripple', displaySymbol: 'XRP' },
    { symbol: 'ADAUSDT', name: 'Cardano', displaySymbol: 'ADA' },
    { symbol: 'AVAXUSDT', name: 'Avalanche', displaySymbol: 'AVAX' },
    { symbol: 'DOGEUSDT', name: 'Dogecoin', displaySymbol: 'DOGE' },
    { symbol: 'DOTUSDT', name: 'Polkadot', displaySymbol: 'DOT' },
    { symbol: 'MATICUSDT', name: 'Polygon', displaySymbol: 'MATIC' }
];

// Section configuration for navigation
const SECTIONS = [
    { id: 'hero', label: 'Welcome' },
    { id: 'market', label: 'Markets' },
    { id: 'forecast', label: 'Forecasting' },
    { id: 'news', label: 'AI News' },
    { id: 'security', label: 'Security' }
];

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};

const HomePage = () => {
    const [cryptoData, setCryptoData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('hero');
    const [watchlist, setWatchlist] = useState([]);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const containerRef = useRef(null);
    const token = localStorage.getItem('token');

    // Fetch user's watchlist
    useEffect(() => {
        const fetchWatchlist = async () => {
            if (!token) return;
            try {
                const response = await axios.get('http://localhost:8000/watchlist', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const items = Array.isArray(response.data) ? response.data : (response.data?.watchlist || []);
                setWatchlist(items);
            } catch (err) {
                console.error('Failed to fetch watchlist:', err);
            }
        };
        fetchWatchlist();
    }, [token]);

    // Toggle watchlist for a coin
    const toggleWatchlist = async (symbol, e) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();

        if (!token) {
            setToast({ visible: true, message: 'Please log in to use watchlist', type: 'error' });
            return;
        }

        const isInWatchlist = watchlist.includes(symbol);

        try {
            if (isInWatchlist) {
                await axios.post('http://localhost:8000/watchlist/remove',
                    { symbol },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setWatchlist(prev => prev.filter(s => s !== symbol));
                setToast({ visible: true, message: `${symbol} removed from watchlist`, type: 'success' });
            } else {
                await axios.post('http://localhost:8000/watchlist/add',
                    { symbol },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setWatchlist(prev => [...prev, symbol]);
                setToast({ visible: true, message: `${symbol} added to watchlist!`, type: 'success' });
            }
        } catch (err) {
            setToast({ visible: true, message: err.response?.data?.detail || 'Failed to update watchlist', type: 'error' });
        }
    };

    // Scroll to section helper
    const scrollToSection = useCallback((id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Navigate to adjacent section
    const navigateSection = useCallback((direction) => {
        const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
        const nextIndex = direction === 'next'
            ? Math.min(currentIndex + 1, SECTIONS.length - 1)
            : Math.max(currentIndex - 1, 0);
        scrollToSection(SECTIONS[nextIndex].id);
    }, [activeSection, scrollToSection]);

    // Intersection Observer to track active section
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { threshold: 0.5 }
        );

        SECTIONS.forEach(section => {
            const element = document.getElementById(section.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case 'ArrowDown':
                case 'PageDown':
                    e.preventDefault();
                    navigateSection('next');
                    break;
                case 'ArrowUp':
                case 'PageUp':
                    e.preventDefault();
                    navigateSection('prev');
                    break;
                case 'Home':
                    e.preventDefault();
                    scrollToSection('hero');
                    break;
                case 'End':
                    e.preventDefault();
                    scrollToSection('security');
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigateSection, scrollToSection]);

    // Fetch crypto prices
    useEffect(() => {
        const fetchCryptoPrices = async () => {
            try {
                const response = await axios.get('http://localhost:8000/market/prices');
                setCryptoData(response.data.slice(0, 10));
                setLoading(false);
            } catch (backendError) {
                console.warn('Backend API failed, falling back to direct Binance:', backendError);
                try {
                    const validSymbols = TOP_CRYPTOS.map(c => c.symbol);
                    const symbolsParam = JSON.stringify(validSymbols);
                    const response = await axios.get(
                        `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`
                    );
                    const priceMap = {};
                    response.data.forEach(item => {
                        priceMap[item.symbol] = {
                            price: parseFloat(item.lastPrice),
                            change24h: parseFloat(item.priceChangePercent)
                        };
                    });
                    const data = TOP_CRYPTOS.map(crypto => {
                        const priceData = priceMap[crypto.symbol] || { price: 0, change24h: 0 };
                        return {
                            id: crypto.displaySymbol.toLowerCase(),
                            symbol: crypto.displaySymbol,
                            name: crypto.name,
                            price: priceData.price,
                            change24h: priceData.change24h
                        };
                    });
                    setCryptoData(data);
                } catch (fallbackError) {
                    console.error('All APIs failed:', fallbackError);
                    setCryptoData(TOP_CRYPTOS.map(crypto => ({
                        id: crypto.displaySymbol.toLowerCase(),
                        symbol: crypto.displaySymbol,
                        name: crypto.name,
                        price: 0,
                        change24h: 0
                    })));
                }
                setLoading(false);
            }
        };

        fetchCryptoPrices();
        const interval = setInterval(fetchCryptoPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    const formatPrice = (price) => {
        if (price >= 1000) {
            return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (price >= 1) {
            return price.toFixed(2);
        } else {
            return price.toFixed(4);
        }
    };

    const formatChange = (change) => {
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(2)}%`;
    };

    return (
        <div ref={containerRef} className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-background text-text">
            {/* Navigation Dots */}
            <nav className="fixed right-12 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-end gap-4">
                {SECTIONS.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className="group flex items-center justify-end"
                        aria-label={`Go to ${section.label}`}
                    >
                        {/* Text Label - appears on hover */}
                        <span className={`mr-3 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 origin-right scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 ${activeSection === section.id
                            ? 'bg-primary text-black'
                            : 'bg-card border border-gray-200 dark:border-gray-800 text-text-muted'
                            }`}>
                            {section.label}
                        </span>
                        {/* Dot */}
                        <span className={`rounded-full transition-all duration-300 ${activeSection === section.id
                            ? 'w-3 h-3 bg-primary shadow-lg shadow-primary/50'
                            : 'w-2 h-2 bg-gray-600 group-hover:w-3 group-hover:h-3 group-hover:bg-gray-400'
                            }`} />
                    </button>
                ))}
            </nav>
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800/50">
                <div className="max-w-7xl mx-auto px-6 py-3">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="text-primary">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* Outer circle with gap */}
                                    <path
                                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                    {/* Inner circle with gap */}
                                    <path
                                        d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                    {/* Center dot */}
                                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold">CryptoBeacon</span>
                        </Link>
                        <div className="flex-1 max-w-lg mx-8 hidden sm:block">
                            <SearchBar />
                        </div>
                        <div className="flex items-center gap-3">
                            <UserButton />
                        </div>
                    </div>
                </div>
            </header>

            {/* Section 1: Welcome / Hero */}
            <section
                id="hero"
                className="snap-section h-screen flex flex-col items-center justify-center relative overflow-hidden"
            >
                {/* Background Glow Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-1000" />
                </div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ margin: "-100px" }}
                    variants={staggerContainer}
                    className="text-center z-10 px-6"
                >
                    <motion.div variants={fadeInUp} className="mb-6">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-medium">
                            <Sparkles size={16} />
                            AI-Powered Crypto Intelligence
                        </span>
                    </motion.div>

                    <motion.h1
                        variants={fadeInUp}
                        className="text-5xl md:text-7xl font-bold mb-6 text-text"
                    >
                        Navigate Crypto<br />
                        <span className="text-primary">With Confidence</span>
                    </motion.h1>

                    <motion.p
                        variants={fadeInUp}
                        className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10"
                    >
                        Track markets, predict trends, and get AI-curated news insights.
                        Your all-in-one platform for smarter cryptocurrency decisions.
                    </motion.p>

                    <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/portfolio"
                            className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-black font-bold rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 flex items-center gap-2"
                        >
                            Get Started
                            <ArrowRight size={20} />
                        </Link>
                        <button
                            onClick={() => scrollToSection('market')}
                            className="px-8 py-4 bg-black/5 dark:bg-white/5 border border-gray-300 dark:border-gray-700 hover:border-gray-500 text-text font-semibold rounded-xl transition-colors flex items-center gap-2"
                        >
                            Explore Markets
                            <TrendingUp size={20} />
                        </button>
                    </motion.div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2"
                >
                    <button
                        onClick={() => scrollToSection('market')}
                        className="flex flex-col items-center gap-2 text-gray-500 hover:text-primary transition-colors"
                    >
                        <span className="text-sm">Scroll to explore</span>
                        <ChevronDown size={24} className="animate-bounce" />
                    </button>
                </motion.div>
            </section>

            {/* Section 2: Market Overview - Top 10 Cryptos */}
            <section
                id="market"
                className="snap-section h-screen flex flex-col items-center justify-center py-20 px-6 overflow-y-auto"
            >
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ margin: "-100px" }}
                    variants={staggerContainer}
                    className="max-w-7xl w-full"
                >
                    <motion.div variants={fadeInUp} className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-full text-secondary text-sm font-medium mb-4">
                            <BarChart3 size={16} />
                            Live Market Data
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Top 10 Cryptocurrencies</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-xl mx-auto">
                            Real-time prices updated every 10 seconds from global exchanges.
                        </p>
                    </motion.div>

                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="bg-card border border-gray-200 dark:border-gray-800 rounded-xl p-5 animate-pulse">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-3"></div>
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            variants={staggerContainer}
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                        >
                            {cryptoData.map((crypto, index) => {
                                const isInWatchlist = watchlist.includes(crypto.symbol);
                                return (
                                    <motion.div key={crypto.id} variants={scaleIn}>
                                        <Link
                                            to={`/crypto/${crypto.symbol}`}
                                            className="bg-card border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer block group relative"
                                        >
                                            {/* Watchlist Star Button */}
                                            <button
                                                onClick={(e) => toggleWatchlist(crypto.symbol, e)}
                                                className={`absolute top-3 right-3 p-1.5 rounded-full transition-all ${isInWatchlist
                                                    ? 'text-yellow-400 hover:bg-yellow-400/10'
                                                    : 'text-gray-600 hover:text-yellow-400 hover:bg-gray-800'
                                                    }`}
                                                title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                                            >
                                                <Star size={16} fill={isInWatchlist ? 'currentColor' : 'none'} />
                                            </button>

                                            <div className="flex items-center gap-2 mb-3 pr-8">
                                                <CoinIcon symbol={crypto.symbol} size={28} className="rounded-full" />
                                                <div>
                                                    <span className="text-sm font-semibold text-white">{crypto.symbol}</span>
                                                    <p className="text-xs text-gray-500">{crypto.name}</p>
                                                </div>
                                            </div>
                                            <p className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                                                ${formatPrice(crypto.price)}
                                            </p>
                                            <p className={`text-sm font-medium ${crypto.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {formatChange(crypto.change24h)}
                                            </p>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    <motion.div variants={fadeInUp} className="text-center mt-10">
                        <Link
                            to="/wishlist"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                            <Star size={18} />
                            View Your Watchlist
                            <ArrowRight size={16} />
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {/* Section 3: Forecasting Technology */}
            <section
                id="forecast"
                className="snap-section h-screen flex flex-col items-center justify-center py-20 px-6 overflow-y-auto bg-gradient-to-b from-background via-card/30 to-background"
            >
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ margin: "-100px" }}
                    variants={staggerContainer}
                    className="max-w-6xl w-full"
                >
                    <motion.div variants={fadeInUp} className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-sm font-medium mb-4">
                            <Brain size={16} />
                            AI-Powered Predictions
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Forecasting Technology</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                            Our advanced machine learning models analyze historical data to predict future price movements.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <motion.div
                            variants={scaleIn}
                            className="bg-card/50 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center hover:border-purple-500/50 transition-all group"
                        >
                            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <TrendingUp size={32} className="text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-text">XGBoost Model</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Our primary forecasting engine uses XGBoost with technical indicators for 7-day price predictions.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={scaleIn}
                            className="bg-card/50 backdrop-blur border border-gray-800 rounded-2xl p-8 text-center hover:border-purple-500/50 transition-all group"
                        >
                            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <BarChart3 size={32} className="text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-text">Multi-Model Fallback</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Prophet, LSTM, and ensemble models provide backup predictions if the primary model encounters issues.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={scaleIn}
                            className="bg-card/50 backdrop-blur border border-gray-800 rounded-2xl p-8 text-center hover:border-purple-500/50 transition-all group"
                        >
                            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Zap size={32} className="text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-text">Low-Value Coin Support</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Dynamic scaling ensures accurate predictions for coins with very small values like SHIB or PEPE.
                            </p>
                        </motion.div>
                    </div>

                    <motion.div variants={fadeInUp} className="text-center mt-12">
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                            <span className="text-3xl font-bold text-purple-400">97.17%</span>
                            <span className="text-gray-400 text-sm text-left">Prediction<br />Accuracy</span>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Section 4: AI News Insights */}
            <section
                id="news"
                className="snap-section h-screen flex flex-col items-center justify-center py-12 px-6 overflow-y-auto"
            >
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ margin: "-100px" }}
                    variants={staggerContainer}
                    className="max-w-6xl w-full"
                >
                    <motion.div variants={fadeInUp} className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-4">
                            <Newspaper size={16} />
                            Smart News Aggregation
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">AI-Curated News</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                            Stay informed with news tailored to your portfolio. Our AI summarizes articles so you get key insights fast.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-6 items-center">
                        <motion.div variants={fadeInUp} className="space-y-4">
                            <div className="flex items-start gap-4 p-6 bg-card/50 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500/30 transition-all">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Sparkles size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold mb-2">Coin-Specific News</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        Get news articles specifically about the cryptocurrencies in your watchlist or portfolio.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-6 bg-card/50 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500/30 transition-all">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Brain size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold mb-2">AI Summarization</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        Long articles are distilled into concise summaries using advanced NLP, saving you precious time.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-6 bg-card/50 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500/30 transition-all">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Eye size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold mb-2">On-Demand Fetching</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        Click to load fresh news for any cryptocurrency. Results are cached for 24 hours.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={scaleIn}
                            className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-gray-200 dark:border-gray-800 rounded-2xl p-8"
                        >
                            {/* Actual Features */}
                            <h4 className="text-lg font-bold mb-6 text-center">Powered By</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-card/50 border border-gray-700 rounded-xl">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Newspaper size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-sm">NewsData.io API</h5>
                                        <p className="text-gray-500 text-xs">Real-time crypto news fetched on demand for any coin</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-card/50 border border-gray-700 rounded-xl">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Brain size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-sm">Google Gemini AI</h5>
                                        <p className="text-gray-500 text-xs">Articles summarized into concise market briefings</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-card/50 border border-gray-700 rounded-xl">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Zap size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-sm">24-Hour Caching</h5>
                                        <p className="text-gray-500 text-xs">News cached to reduce API calls and improve speed</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* Section 5: Security */}
            <section
                id="security"
                className="snap-section h-screen flex flex-col items-center justify-center py-12 px-6 overflow-y-auto bg-gradient-to-b from-background via-card/30 to-background"
            >
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ margin: "-100px" }}
                    variants={staggerContainer}
                    className="max-w-6xl w-full"
                >
                    <motion.div variants={fadeInUp} className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-medium mb-4">
                            <Shield size={16} />
                            Enterprise-Grade Security
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Your Data is Safe</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                            We use industry-leading security practices to ensure your portfolio data and personal information are protected.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <motion.div
                            variants={scaleIn}
                            className="bg-card/50 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center hover:border-primary/50 transition-all"
                        >
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Lock size={28} className="text-primary" />
                            </div>
                            <h4 className="font-bold mb-2">End-to-End Encryption</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">All data is encrypted in transit and at rest using AES-256.</p>
                        </motion.div>

                        <motion.div
                            variants={scaleIn}
                            className="bg-card/50 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center hover:border-primary/50 transition-all"
                        >
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Shield size={28} className="text-primary" />
                            </div>
                            <h4 className="font-bold mb-2">Secure Authentication</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">JWT tokens with OTP verification for account security.</p>
                        </motion.div>

                        <motion.div
                            variants={scaleIn}
                            className="bg-card/50 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center hover:border-primary/50 transition-all"
                        >
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Eye size={28} className="text-primary" />
                            </div>
                            <h4 className="font-bold mb-2">No Wallet Access</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">We never ask for or store your private keys or wallet access.</p>
                        </motion.div>

                        <motion.div
                            variants={scaleIn}
                            className="bg-card/50 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center hover:border-primary/50 transition-all"
                        >
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Zap size={28} className="text-primary" />
                            </div>
                            <h4 className="font-bold mb-2">Secure APIs</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">All external API connections use HTTPS with certificate pinning.</p>
                        </motion.div>
                    </div>

                    {/* Final CTA */}
                    <motion.div variants={fadeInUp} className="text-center mt-10">
                        <h3 className="text-2xl font-bold mb-3">Ready to Start?</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Join thousands of traders using CryptoBeacon to make smarter decisions.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/wishlist"
                                className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-black font-bold rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 flex items-center gap-2"
                            >
                                View Watchlist
                                <ArrowRight size={20} />
                            </Link>
                            <Link
                                to="/portfolio"
                                className="px-8 py-4 bg-black/5 dark:bg-white/5 border border-gray-300 dark:border-gray-700 hover:border-gray-500 text-text font-semibold rounded-xl transition-colors"
                            >
                                Manage Portfolio
                            </Link>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="snap-section min-h-[200px] border-t border-gray-200 dark:border-gray-800 py-10 bg-background">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-primary to-primary/60 p-2 rounded-lg">
                                <Power size={18} className="text-black" strokeWidth={2.5} />
                            </div>
                            <span className="text-lg font-bold">CryptoBeacon</span>
                        </div>
                        <p className="text-gray-500 text-sm">
                            © 2025 CryptoBeacon. All Rights Reserved.
                        </p>
                        <nav className="flex items-center gap-6">
                            <Link to="/about" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                                About
                            </Link>
                            <Link to="/terms" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                                Terms of Service
                            </Link>
                            <Link to="/contact" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                                Contact
                            </Link>
                        </nav>
                    </div>
                </div>
            </footer>

            {/* Toast Notification */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast({ ...toast, visible: false })}
            />
        </div>
    );
};

export default HomePage;
