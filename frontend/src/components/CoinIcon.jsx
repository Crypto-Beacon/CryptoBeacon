import React, { useState } from 'react';

/**
 * CoinIcon component with multi-CDN fallback chain
 * Tries multiple icon sources in order until one loads successfully
 */

// CDN URL generators in priority order
const getIconUrls = (symbol) => {
    const sym = symbol?.toUpperCase() || '';
    const symLower = symbol?.toLowerCase() || '';

    return [
        // 1. CryptoIcons GitHub CDN (500+ icons, reliable, no rate limits)
        `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symLower}.png`,

        // 2. CoinCap (good coverage)
        `https://assets.coincap.io/assets/icons/${symLower}@2x.png`,

        // 3. CryptoLogos.cc (high quality)
        `https://cryptologos.cc/logos/${symLower}-${symLower}-logo.png`,

        // 4. Alternative CryptoLogos pattern
        `https://cryptologos.cc/logos/${symLower}-logo.png`,

        // 5. CoinIcons CDN
        `https://coinicons-api.vercel.app/api/icon/${symLower}`,
    ];
};

// Generate placeholder URL as final fallback
const getPlaceholderUrl = (symbol) => {
    const colors = {
        BTC: 'f7931a',
        ETH: '627eea',
        SOL: '00ffa3',
        ADA: '0033ad',
        DOGE: 'c2a633',
        XRP: '23292f',
        DOT: 'e6007a',
        AVAX: 'e84142',
        MATIC: '8247e5',
        LINK: '2a5ada',
        LTC: 'bfbbbb',
        BNB: 'f3ba2f',
    };
    const bgColor = colors[symbol?.toUpperCase()] || '1a1a1a';
    return `https://ui-avatars.com/api/?name=${symbol}&background=${bgColor}&color=fff&bold=true&size=128`;
};

const CoinIcon = ({ symbol, size = 24, className = '' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [usePlaceholder, setUsePlaceholder] = useState(false);

    const iconUrls = getIconUrls(symbol);

    const handleError = () => {
        if (currentIndex < iconUrls.length - 1) {
            // Try next CDN
            setCurrentIndex(prev => prev + 1);
        } else {
            // All CDNs failed, use placeholder
            setUsePlaceholder(true);
        }
    };

    const currentUrl = usePlaceholder
        ? getPlaceholderUrl(symbol)
        : iconUrls[currentIndex];

    return (
        <img
            src={currentUrl}
            alt={symbol}
            className={`object-contain ${className}`}
            style={{ width: size, height: size }}
            onError={handleError}
            loading="lazy"
        />
    );
};

// Export helper function for non-component usage
export const getCoinIconUrl = (symbol) => getIconUrls(symbol)[0];
export const getCoinPlaceholder = getPlaceholderUrl;

export default CoinIcon;
