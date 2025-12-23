// Exchange Rate Service - Fetch live currency rates
// Uses Frankfurter API (free, no API key required)
// Caches rates for 24 hours to minimize API calls

import { getCurrencyCode, getCurrencyInfo } from './currencyService';

interface ExchangeRate {
    currency: string;
    code: string;
    rate: number;
    change?: number; // % change from yesterday
    flag: string;
}

interface CachedRates {
    rates: Record<string, number>;
    timestamp: number;
    baseCurrency: string;
}

// Cache settings
const CACHE_KEY = 'finzen_exchange_rates';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Currency display config
const DISPLAY_CURRENCIES = [
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
    { code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦' },
    { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
];

/**
 * Get cached rates from localStorage
 */
const getCachedRates = (): CachedRates | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const data: CachedRates = JSON.parse(cached);

        // Check if cache is still valid
        if (Date.now() - data.timestamp > CACHE_TTL) {
            console.log('💱 Exchange rate cache expired');
            return null;
        }

        return data;
    } catch {
        return null;
    }
};

/**
 * Save rates to localStorage cache
 */
const cacheRates = (rates: Record<string, number>, baseCurrency: string): void => {
    try {
        const data: CachedRates = {
            rates,
            timestamp: Date.now(),
            baseCurrency
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        console.log('💾 Exchange rates cached');
    } catch (error) {
        console.error('Failed to cache exchange rates:', error);
    }
};

/**
 * Fetch live exchange rates from Frankfurter API
 */
export const fetchExchangeRates = async (): Promise<ExchangeRate[]> => {
    const userCurrency = getCurrencyCode();

    // Check cache first
    const cached = getCachedRates();
    if (cached && cached.baseCurrency === userCurrency) {
        console.log('✅ Using cached exchange rates');
        return formatRates(cached.rates, userCurrency);
    }

    console.log('💱 Fetching live exchange rates...');

    try {
        // Frankfurter provides rates with EUR as base
        // We need to convert to user's currency
        const response = await fetch(
            `https://api.frankfurter.app/latest?from=${userCurrency}&to=USD,GBP,SAR,CNY,EUR,AED`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch exchange rates');
        }

        const data = await response.json();

        // Cache the response
        cacheRates(data.rates, userCurrency);

        return formatRates(data.rates, userCurrency);

    } catch (error) {
        console.error('❌ Exchange rate fetch failed:', error);

        // Return fallback rates for Pakistan (PKR)
        if (userCurrency === 'PKR') {
            return getFallbackRates('PKR');
        }

        // Return empty for other currencies
        return [];
    }
};

/**
 * Format rates for display
 */
const formatRates = (rates: Record<string, number>, baseCurrency: string): ExchangeRate[] => {
    const result: ExchangeRate[] = [];

    for (const currency of DISPLAY_CURRENCIES) {
        // Skip if same as user currency
        if (currency.code === baseCurrency) continue;

        const rate = rates[currency.code];
        if (rate) {
            // Invert the rate (API gives how much foreign = 1 local)
            // We want how much local = 1 foreign
            const invertedRate = 1 / rate;

            result.push({
                currency: currency.name,
                code: currency.code,
                rate: invertedRate,
                flag: currency.flag,
                change: getRandomChange() // Simulated for now
            });
        }
    }

    return result.slice(0, 4); // Return top 4
};

/**
 * Get simulated change % (in production, compare with yesterday's rate)
 */
const getRandomChange = (): number => {
    return parseFloat((Math.random() * 0.4 - 0.2).toFixed(2)); // -0.2% to +0.2%
};

/**
 * Fallback rates for Pakistan (PKR) when API fails
 * Updated periodically with approximate market rates
 */
const getFallbackRates = (currency: string): ExchangeRate[] => {
    if (currency !== 'PKR') return [];

    return [
        { currency: 'US Dollar', code: 'USD', rate: 278.50, flag: '🇺🇸', change: 0.15 },
        { currency: 'British Pound', code: 'GBP', rate: 352.20, flag: '🇬🇧', change: -0.08 },
        { currency: 'Saudi Riyal', code: 'SAR', rate: 74.25, flag: '🇸🇦', change: 0.12 },
        { currency: 'Chinese Yuan', code: 'CNY', rate: 38.65, flag: '🇨🇳', change: 0.05 },
    ];
};

/**
 * Get last update time from cache
 */
export const getLastUpdateTime = (): string => {
    const cached = getCachedRates();
    if (!cached) return 'Never';

    const diff = Date.now() - cached.timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
};

/**
 * Force refresh rates (ignores cache)
 */
export const forceRefreshRates = async (): Promise<ExchangeRate[]> => {
    localStorage.removeItem(CACHE_KEY);
    return fetchExchangeRates();
};

/**
 * Get user's currency symbol
 */
export const getUserCurrencySymbol = (): string => {
    return getCurrencyInfo().symbol;
};

export default {
    fetchExchangeRates,
    getLastUpdateTime,
    forceRefreshRates,
    getUserCurrencySymbol
};
