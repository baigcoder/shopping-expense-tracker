// Currency Service - Multi-currency support with exchange rates
// Supports auto-detection, conversion, and formatting

interface CurrencyInfo {
    code: string;
    symbol: string;
    name: string;
    locale: string;
}

interface ExchangeRates {
    base: string;
    rates: Record<string, number>;
    lastUpdated: number;
}

// Currency data by country code
const CURRENCY_BY_COUNTRY: Record<string, CurrencyInfo> = {
    // Asia
    'PK': { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', locale: 'en-PK' },
    'IN': { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
    'BD': { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', locale: 'bn-BD' },
    'AE': { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
    'SA': { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', locale: 'ar-SA' },
    'CN': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
    'JP': { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
    'KR': { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
    'SG': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
    'MY': { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY' },
    'ID': { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID' },
    'TH': { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH' },
    'PH': { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'en-PH' },
    'VN': { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', locale: 'vi-VN' },

    // Europe
    'GB': { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
    'DE': { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
    'FR': { code: 'EUR', symbol: '€', name: 'Euro', locale: 'fr-FR' },
    'IT': { code: 'EUR', symbol: '€', name: 'Euro', locale: 'it-IT' },
    'ES': { code: 'EUR', symbol: '€', name: 'Euro', locale: 'es-ES' },
    'NL': { code: 'EUR', symbol: '€', name: 'Euro', locale: 'nl-NL' },
    'CH': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
    'SE': { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
    'NO': { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO' },
    'DK': { code: 'DKK', symbol: 'kr', name: 'Danish Krone', locale: 'da-DK' },
    'PL': { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', locale: 'pl-PL' },
    'RU': { code: 'RUB', symbol: '₽', name: 'Russian Ruble', locale: 'ru-RU' },
    'TR': { code: 'TRY', symbol: '₺', name: 'Turkish Lira', locale: 'tr-TR' },

    // Americas
    'US': { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
    'CA': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
    'MX': { code: 'MXN', symbol: '$', name: 'Mexican Peso', locale: 'es-MX' },
    'BR': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
    'AR': { code: 'ARS', symbol: '$', name: 'Argentine Peso', locale: 'es-AR' },
    'CO': { code: 'COP', symbol: '$', name: 'Colombian Peso', locale: 'es-CO' },
    'CL': { code: 'CLP', symbol: '$', name: 'Chilean Peso', locale: 'es-CL' },

    // Oceania
    'AU': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
    'NZ': { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ' },

    // Africa
    'ZA': { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
    'NG': { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
    'EG': { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', locale: 'ar-EG' },
    'KE': { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', locale: 'en-KE' },
};

// All supported currencies for dropdown
export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
    { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
    { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
    { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', locale: 'en-PK' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', locale: 'ar-SA' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', locale: 'bn-BD' },
];

// Default currency
const DEFAULT_CURRENCY: CurrencyInfo = { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' };

// Store detected currency and exchange rates
let detectedCurrency: CurrencyInfo | null = null;
let exchangeRates: ExchangeRates | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ================================
// EXCHANGE RATE FUNCTIONS
// ================================

// Fetch exchange rates from API
export const fetchExchangeRates = async (baseCurrency: string = 'USD'): Promise<ExchangeRates | null> => {
    // Check cache first
    const cached = getCachedRates();
    if (cached && cached.base === baseCurrency && Date.now() - cached.lastUpdated < CACHE_DURATION) {
        return cached;
    }

    try {
        // Using free ExchangeRate-API (1500 requests/month free)
        const response = await fetch(
            `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch exchange rates');
        }

        const data = await response.json();

        exchangeRates = {
            base: baseCurrency,
            rates: data.rates,
            lastUpdated: Date.now()
        };

        // Cache in localStorage
        localStorage.setItem('cashly_exchange_rates', JSON.stringify(exchangeRates));
        console.log('💱 Exchange rates updated:', Object.keys(data.rates).length, 'currencies');

        return exchangeRates;
    } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        return getCachedRates() || getFallbackRates(baseCurrency);
    }
};

// Get cached rates from localStorage
const getCachedRates = (): ExchangeRates | null => {
    try {
        const cached = localStorage.getItem('cashly_exchange_rates');
        if (cached) {
            return JSON.parse(cached);
        }
    } catch { }
    return null;
};

// Fallback rates (approximate, for offline use)
const getFallbackRates = (base: string): ExchangeRates => {
    const fallbackToUSD: Record<string, number> = {
        USD: 1, EUR: 0.92, GBP: 0.79, PKR: 278, INR: 83,
        AED: 3.67, SAR: 3.75, CAD: 1.36, AUD: 1.53,
        CNY: 7.24, JPY: 149, SGD: 1.34, MYR: 4.47, BDT: 110
    };

    if (base === 'USD') {
        return { base: 'USD', rates: fallbackToUSD, lastUpdated: Date.now() };
    }

    // Convert fallback rates to new base
    const baseToUSD = fallbackToUSD[base] || 1;
    const rates: Record<string, number> = {};
    for (const [currency, usdRate] of Object.entries(fallbackToUSD)) {
        rates[currency] = usdRate / baseToUSD;
    }
    rates[base] = 1;

    return { base, rates, lastUpdated: Date.now() };
};

// Convert amount between currencies
export const convertCurrency = async (
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<number> => {
    if (fromCurrency === toCurrency) return amount;

    // Get or fetch exchange rates
    let rates = exchangeRates;
    if (!rates || rates.base !== fromCurrency) {
        rates = await fetchExchangeRates(fromCurrency);
    }

    if (!rates || !rates.rates[toCurrency]) {
        // Try with USD as intermediary
        const usdRates = await fetchExchangeRates('USD');
        if (usdRates) {
            const fromRate = usdRates.rates[fromCurrency] || 1;
            const toRate = usdRates.rates[toCurrency] || 1;
            return amount * (toRate / fromRate);
        }
        return amount; // Return original if conversion fails
    }

    return amount * rates.rates[toCurrency];
};

// Sync conversion (uses cached rates)
export const convertCurrencySync = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
): number => {
    if (fromCurrency === toCurrency) return amount;

    const rates = exchangeRates || getCachedRates() || getFallbackRates('USD');

    if (rates.base === fromCurrency && rates.rates[toCurrency]) {
        return amount * rates.rates[toCurrency];
    }

    // Use USD as intermediary
    const fromRate = rates.rates[fromCurrency] || 1;
    const toRate = rates.rates[toCurrency] || 1;
    return amount * (toRate / fromRate);
};

// Get exchange rate between two currencies
export const getExchangeRate = async (
    fromCurrency: string,
    toCurrency: string
): Promise<number> => {
    if (fromCurrency === toCurrency) return 1;

    const rates = await fetchExchangeRates(fromCurrency);
    return rates?.rates[toCurrency] || 1;
};

// Detect currency from amount string (e.g., "$100", "€50", "Rs 500")
export const detectCurrencyFromString = (amountStr: string): { currency: string; amount: number } | null => {
    const patterns: Record<string, RegExp> = {
        'USD': /^\$\s*([\d,]+\.?\d*)/,
        'EUR': /^€\s*([\d,]+\.?\d*)/,
        'GBP': /^£\s*([\d,]+\.?\d*)/,
        'PKR': /^Rs\.?\s*([\d,]+\.?\d*)/i,
        'INR': /^₹\s*([\d,]+\.?\d*)/,
        'JPY': /^¥\s*([\d,]+\.?\d*)/,
    };

    for (const [currency, pattern] of Object.entries(patterns)) {
        const match = amountStr.match(pattern);
        if (match) {
            return {
                currency,
                amount: parseFloat(match[1].replace(/,/g, ''))
            };
        }
    }

    return null;
};

// Auto-convert foreign transaction to user's currency
export const autoConvertTransaction = async (
    amount: number,
    sourceCurrency: string
): Promise<{ amount: number; converted: number; rate: number } | null> => {
    const userCurrency = getUserCurrency().code;

    if (sourceCurrency === userCurrency) {
        return null; // No conversion needed
    }

    const rate = await getExchangeRate(sourceCurrency, userCurrency);
    const converted = amount * rate;

    return {
        amount,
        converted,
        rate
    };
};

// ================================
// REGION DETECTION
// ================================

// Detect user's country from timezone or browser settings
export const detectUserCountry = (): string => {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const timezoneCountryMap: Record<string, string> = {
            'Asia/Karachi': 'PK', 'Asia/Lahore': 'PK',
            'Asia/Kolkata': 'IN', 'Asia/Mumbai': 'IN',
            'Asia/Dhaka': 'BD', 'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA',
            'Asia/Shanghai': 'CN', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR',
            'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY',
            'Asia/Jakarta': 'ID', 'Asia/Bangkok': 'TH',
            'Asia/Manila': 'PH', 'Asia/Ho_Chi_Minh': 'VN',
            'Europe/London': 'GB', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR',
            'Europe/Rome': 'IT', 'Europe/Madrid': 'ES', 'Europe/Amsterdam': 'NL',
            'Europe/Zurich': 'CH', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO',
            'Europe/Copenhagen': 'DK', 'Europe/Warsaw': 'PL',
            'Europe/Moscow': 'RU', 'Europe/Istanbul': 'TR',
            'America/New_York': 'US', 'America/Los_Angeles': 'US',
            'America/Chicago': 'US', 'America/Toronto': 'CA',
            'America/Vancouver': 'CA', 'America/Mexico_City': 'MX',
            'America/Sao_Paulo': 'BR', 'America/Buenos_Aires': 'AR',
            'America/Bogota': 'CO', 'America/Santiago': 'CL',
            'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
            'Pacific/Auckland': 'NZ',
            'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG',
            'Africa/Cairo': 'EG', 'Africa/Nairobi': 'KE',
        };

        for (const [tz, country] of Object.entries(timezoneCountryMap)) {
            if (timezone.includes(tz.split('/')[1])) {
                return country;
            }
        }

        const language = navigator.language || 'en-US';
        const langCountry = language.split('-')[1]?.toUpperCase();
        if (langCountry && CURRENCY_BY_COUNTRY[langCountry]) {
            return langCountry;
        }

        return 'US';
    } catch {
        return 'US';
    }
};

// ================================
// CURRENCY FORMATTING
// ================================

// Get currency info for user's region
export const getUserCurrency = (): CurrencyInfo => {
    if (detectedCurrency) return detectedCurrency;

    const country = detectUserCountry();
    detectedCurrency = CURRENCY_BY_COUNTRY[country] || DEFAULT_CURRENCY;

    console.log(`🌍 Detected region: ${country}, Currency: ${detectedCurrency.code}`);
    return detectedCurrency;
};

// Format amount with user's currency
export const formatCurrency = (amount: number, currencyCode?: string): string => {
    const currency = currencyCode
        ? SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || getUserCurrency()
        : getUserCurrency();

    try {
        return new Intl.NumberFormat(currency.locale, {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currency.symbol}${amount.toLocaleString()}`;
    }
};

// Format compact (e.g., $1.2K, $3.5M)
export const formatCompact = (amount: number): string => {
    const currency = getUserCurrency();

    if (amount >= 1000000) {
        return `${currency.symbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `${currency.symbol}${(amount / 1000).toFixed(1)}K`;
    }
    return `${currency.symbol}${amount}`;
};

// Get just the symbol
export const getCurrencySymbol = (currencyCode?: string): string => {
    if (currencyCode) {
        const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
        return currency?.symbol || currencyCode;
    }
    return getUserCurrency().symbol;
};

// Get currency code
export const getCurrencyCode = (): string => {
    return getUserCurrency().code;
};

// Get full currency info
export const getCurrencyInfo = (): CurrencyInfo => {
    return getUserCurrency();
};

// Set currency manually (for user preference)
export const setCurrency = (currencyCode: string): void => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    if (currency) {
        detectedCurrency = currency;
        localStorage.setItem('user_currency', currencyCode);
        // Fetch new exchange rates for this currency
        fetchExchangeRates(currencyCode);
    }
};

// Load saved currency preference
export const loadSavedCurrency = (): void => {
    const saved = localStorage.getItem('user_currency');
    if (saved) {
        const currency = SUPPORTED_CURRENCIES.find(c => c.code === saved);
        if (currency) {
            detectedCurrency = currency;
        }
    }
};

// Initialize on load
loadSavedCurrency();

// Export all functions
export const currencyService = {
    // Formatting
    formatCurrency,
    formatCompact,
    getCurrencySymbol,
    getCurrencyCode,
    getCurrencyInfo,
    setCurrency,
    detectUserCountry,
    SUPPORTED_CURRENCIES,

    // Conversion
    fetchExchangeRates,
    convertCurrency,
    convertCurrencySync,
    getExchangeRate,
    detectCurrencyFromString,
    autoConvertTransaction
};

export default currencyService;

