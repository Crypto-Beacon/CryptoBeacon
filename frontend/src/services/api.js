import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export default api;

export const getPortfolio = () => api.get('/portfolio');
export const addTransaction = (transaction) => api.post('/portfolio', transaction);
export const deletePortfolioItem = (itemId) => api.delete(`/portfolio/${itemId}`);
export const getForecast = (symbol) => api.get(`/intelligence/forecast/${symbol}`);
export const getNews = (symbol) => api.get(`/intelligence/news?coin=${symbol || ''}`);
export const getWatchlist = () => api.get('/watchlist');
export const addToWatchlist = (symbol) => api.post('/watchlist/add', { symbol });
export const removeFromWatchlist = (symbol) => api.post('/watchlist/remove', { symbol });
export const sendPortfolioReport = () => api.post('/portfolio/send-report');

