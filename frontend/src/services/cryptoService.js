// Crypto service - fetches all available cryptocurrencies from Binance
// This provides a unified source of crypto data for all components

// Cache for coin data
let cachedCoins = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Popular coins with full names (fallback and supplementary data)
const COIN_NAMES = {
    BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', BNB: 'BNB',
    XRP: 'Ripple', ADA: 'Cardano', AVAX: 'Avalanche', DOGE: 'Dogecoin',
    DOT: 'Polkadot', MATIC: 'Polygon', LINK: 'Chainlink', LTC: 'Litecoin',
    SHIB: 'Shiba Inu', TRX: 'TRON', ATOM: 'Cosmos', UNI: 'Uniswap',
    XLM: 'Stellar', BCH: 'Bitcoin Cash', NEAR: 'NEAR Protocol', APT: 'Aptos',
    CRV: 'Curve DAO', AAVE: 'Aave', MKR: 'Maker', SNX: 'Synthetix',
    COMP: 'Compound', LDO: 'Lido DAO', ARB: 'Arbitrum', OP: 'Optimism',
    IMX: 'Immutable X', SUSHI: 'SushiSwap', '1INCH': '1inch',
    SAND: 'The Sandbox', MANA: 'Decentraland', AXS: 'Axie Infinity',
    GALA: 'Gala', ENJ: 'Enjin Coin', ILV: 'Illuvium',
    FIL: 'Filecoin', THETA: 'Theta Network', VET: 'VeChain',
    ALGO: 'Algorand', ICP: 'Internet Computer', FTM: 'Fantom',
    HBAR: 'Hedera', EOS: 'EOS', EGLD: 'MultiversX', XTZ: 'Tezos',
    PEPE: 'Pepe', FLOKI: 'Floki', WIF: 'dogwifhat', BONK: 'Bonk',
    RUNE: 'THORChain', INJ: 'Injective', SUI: 'Sui', SEI: 'Sei',
    FET: 'Fetch.ai', RENDER: 'Render', GRT: 'The Graph', QNT: 'Quant',
    ZEC: 'Zcash', XMR: 'Monero', CAKE: 'PancakeSwap', CRO: 'Cronos',
    STX: 'Stacks', TAO: 'Bittensor', TIA: 'Celestia', JUP: 'Jupiter',
    PYTH: 'Pyth Network', W: 'Wormhole', STRK: 'Starknet', BLUR: 'Blur',
    JASMY: 'JasmyCoin', OCEAN: 'Ocean Protocol', ROSE: 'Oasis Network',
    KSM: 'Kusama', FLOW: 'Flow', NEO: 'Neo', KAVA: 'Kava',
    ZIL: 'Zilliqa', CHZ: 'Chiliz', HOT: 'Holo', BAT: 'Basic Attention Token',
    RNDR: 'Render Token', GMT: 'STEPN', APE: 'ApeCoin', LRC: 'Loopring',
    DYDX: 'dYdX', YFI: 'yearn.finance', WAVES: 'Waves', DASH: 'Dash',
    MINA: 'Mina', IOTA: 'IOTA', ZRX: '0x', ENS: 'Ethereum Name Service',
    CELO: 'Celo', QTUM: 'Qtum', ONE: 'Harmony', ICX: 'ICON',
    ANKR: 'Ankr', SKL: 'SKALE', STORJ: 'Storj', RVN: 'Ravencoin',
    ONT: 'Ontology', SC: 'Siacoin', AUDIO: 'Audius', CKB: 'Nervos Network',
    GLM: 'Golem', RSR: 'Reserve Rights', BAND: 'Band Protocol',
    WOO: 'WOO Network', CELR: 'Celer Network', OGN: 'Origin Protocol',
    NKN: 'NKN', CTSI: 'Cartesi', AGIX: 'SingularityNET', AR: 'Arweave',
};

// Get coin name by symbol
export const getCoinName = (symbol) => {
    const upperSymbol = symbol?.toUpperCase();
    return COIN_NAMES[upperSymbol] || upperSymbol || 'Unknown';
};

// Fetch all available coins from Binance
export const fetchAllCoins = async (forceRefresh = false) => {
    // Return cached data if valid
    if (!forceRefresh && cachedCoins && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return cachedCoins;
    }

    try {
        const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
        const data = await response.json();

        // Filter USDT trading pairs and extract unique base assets
        const seenSymbols = new Set();
        const coins = data.symbols
            .filter(s =>
                s.quoteAsset === 'USDT' &&
                s.status === 'TRADING' &&
                !seenSymbols.has(s.baseAsset)
            )
            .map(s => {
                seenSymbols.add(s.baseAsset);
                return {
                    symbol: s.baseAsset,
                    name: getCoinName(s.baseAsset),
                    pair: s.symbol,
                };
            })
            .sort((a, b) => {
                // Prioritize coins with known names
                const aHasName = COIN_NAMES[a.symbol] ? 0 : 1;
                const bHasName = COIN_NAMES[b.symbol] ? 0 : 1;
                if (aHasName !== bHasName) return aHasName - bHasName;
                return a.symbol.localeCompare(b.symbol);
            });

        // Cache the result
        cachedCoins = coins;
        cacheTimestamp = Date.now();

        console.log(`Loaded ${coins.length} cryptocurrencies from Binance`);
        return coins;

    } catch (error) {
        console.error('Failed to fetch coins from Binance:', error);
        // Return fallback list using COIN_NAMES
        return Object.entries(COIN_NAMES).map(([symbol, name]) => ({
            symbol,
            name,
            pair: `${symbol}USDT`,
        }));
    }
};

// Search coins by query
export const searchCoins = (coins, query) => {
    if (!query || !query.trim()) return coins.slice(0, 50); // Return top 50 if no query

    const lowerQuery = query.toLowerCase().trim();
    return coins.filter(coin =>
        coin.symbol.toLowerCase().includes(lowerQuery) ||
        coin.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 50); // Limit results
};

// Get coin by symbol
export const getCoinBySymbol = (coins, symbol) => {
    if (!symbol) return null;
    const upperSymbol = symbol.toUpperCase();
    return coins.find(c => c.symbol.toUpperCase() === upperSymbol) || {
        symbol: upperSymbol,
        name: getCoinName(upperSymbol),
        pair: `${upperSymbol}USDT`,
    };
};

export default {
    fetchAllCoins,
    searchCoins,
    getCoinName,
    getCoinBySymbol,
    COIN_NAMES,
};
