// Currency Service - Auto-detect region and format currency

interface CurrencyInfo {
    code: string;
    symbol: string;
    name: string;
    locale: string;
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

// Default currency
const DEFAULT_CURRENCY: CurrencyInfo = { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' };

// Store detected currency
let detectedCurrency: CurrencyInfo | null = null;

// Detect user's country from timezone or browser settings
export const detectUserCountry = (): string => {
    try {
        // Try to get from timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Map common timezones to countries
        const timezoneCountryMap: Record<string, string> = {
            'Asia/Karachi': 'PK',
            'Asia/Lahore': 'PK',
            'Asia/Kolkata': 'IN',
            'Asia/Mumbai': 'IN',
            'Asia/Dhaka': 'BD',
            'Asia/Dubai': 'AE',
            'Asia/Riyadh': 'SA',
            'Asia/Shanghai': 'CN',
            'Asia/Tokyo': 'JP',
            'Asia/Seoul': 'KR',
            'Asia/Singapore': 'SG',
            'Asia/Kuala_Lumpur': 'MY',
            'Asia/Jakarta': 'ID',
            'Asia/Bangkok': 'TH',
            'Asia/Manila': 'PH',
            'Asia/Ho_Chi_Minh': 'VN',
            'Europe/London': 'GB',
            'Europe/Berlin': 'DE',
            'Europe/Paris': 'FR',
            'Europe/Rome': 'IT',
            'Europe/Madrid': 'ES',
            'Europe/Amsterdam': 'NL',
            'Europe/Zurich': 'CH',
            'Europe/Stockholm': 'SE',
            'Europe/Oslo': 'NO',
            'Europe/Copenhagen': 'DK',
            'Europe/Warsaw': 'PL',
            'Europe/Moscow': 'RU',
            'Europe/Istanbul': 'TR',
            'America/New_York': 'US',
            'America/Los_Angeles': 'US',
            'America/Chicago': 'US',
            'America/Toronto': 'CA',
            'America/Vancouver': 'CA',
            'America/Mexico_City': 'MX',
            'America/Sao_Paulo': 'BR',
            'America/Buenos_Aires': 'AR',
            'America/Bogota': 'CO',
            'America/Santiago': 'CL',
            'Australia/Sydney': 'AU',
            'Australia/Melbourne': 'AU',
            'Pacific/Auckland': 'NZ',
            'Africa/Johannesburg': 'ZA',
            'Africa/Lagos': 'NG',
            'Africa/Cairo': 'EG',
            'Africa/Nairobi': 'KE',
        };

        // Check timezone
        for (const [tz, country] of Object.entries(timezoneCountryMap)) {
            if (timezone.includes(tz.split('/')[1])) {
                return country;
            }
        }

        // Fallback: try browser language
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

// Get currency info for user's region
export const getUserCurrency = (): CurrencyInfo => {
    if (detectedCurrency) return detectedCurrency;

    const country = detectUserCountry();
    detectedCurrency = CURRENCY_BY_COUNTRY[country] || DEFAULT_CURRENCY;

    console.log(`🌍 Detected region: ${country}, Currency: ${detectedCurrency.code}`);
    return detectedCurrency;
};

// Format amount with user's currency
export const formatCurrency = (amount: number, options?: { showCode?: boolean }): string => {
    const currency = getUserCurrency();

    try {
        const formatted = new Intl.NumberFormat(currency.locale, {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);

        return formatted;
    } catch {
        // Fallback formatting
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
export const getCurrencySymbol = (): string => {
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
export const setCurrency = (countryCode: string): void => {
    if (CURRENCY_BY_COUNTRY[countryCode]) {
        detectedCurrency = CURRENCY_BY_COUNTRY[countryCode];
        localStorage.setItem('user_currency', countryCode);
    }
};

// Load saved currency preference
export const loadSavedCurrency = (): void => {
    const saved = localStorage.getItem('user_currency');
    if (saved && CURRENCY_BY_COUNTRY[saved]) {
        detectedCurrency = CURRENCY_BY_COUNTRY[saved];
    }
};

// Initialize on load
loadSavedCurrency();

export default {
    formatCurrency,
    formatCompact,
    getCurrencySymbol,
    getCurrencyCode,
    getCurrencyInfo,
    setCurrency,
    detectUserCountry,
};
