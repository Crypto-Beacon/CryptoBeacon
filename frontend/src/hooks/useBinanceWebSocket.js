import { useEffect, useRef, useState, useCallback } from 'react';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
const BINANCE_REST_URL = 'https://api.binance.com/api/v3';

export const useBinanceWebSocket = (symbols) => {
    const [prices, setPrices] = useState({});
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);

    // Fetch initial prices via REST API (immediate, reliable)
    const fetchInitialPrices = useCallback(async (symbolList) => {
        if (!symbolList || symbolList.length === 0) return;

        try {
            const symbolsWithUsdt = symbolList
                .filter(s => s && typeof s === 'string')
                .map(s => `${s.toUpperCase()}USDT`);

            // Fetch all prices at once
            const response = await fetch(`${BINANCE_REST_URL}/ticker/price`);
            const allPrices = await response.json();

            const priceMap = {};
            allPrices.forEach(item => {
                if (symbolsWithUsdt.includes(item.symbol)) {
                    priceMap[item.symbol] = parseFloat(item.price);
                }
            });

            setPrices(prev => ({ ...prev, ...priceMap }));
        } catch (error) {
            console.error('Failed to fetch initial prices:', error);
        }
    }, []);

    useEffect(() => {
        if (!symbols || symbols.length === 0) return;

        // Fetch initial prices immediately via REST
        fetchInitialPrices(symbols);

        // Create stream names using miniTicker (more reliable than trade)
        // miniTicker updates every second for all symbols
        const streams = symbols
            .filter(s => s && typeof s === 'string')
            .map((s) => `${s.toLowerCase()}usdt@miniTicker`)
            .join('/');

        const url = `${BINANCE_WS_URL}/${streams}`;

        const connect = () => {
            ws.current = new WebSocket(url);

            ws.current.onopen = () => {
                console.log('Connected to Binance WebSocket');
            };

            ws.current.onmessage = (event) => {
                const message = JSON.parse(event.data);
                // miniTicker: s = symbol, c = close price (current price)
                if (message.e === '24hrMiniTicker') {
                    setPrices((prev) => ({
                        ...prev,
                        [message.s]: parseFloat(message.c),
                    }));
                }
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket Error:', error);
            };

            ws.current.onclose = () => {
                console.log('WebSocket closed, reconnecting in 3s...');
                // Auto-reconnect after 3 seconds
                reconnectTimeout.current = setTimeout(() => {
                    connect();
                }, 3000);
            };
        };

        connect();

        return () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [JSON.stringify(symbols), fetchInitialPrices]);

    return prices;
};
