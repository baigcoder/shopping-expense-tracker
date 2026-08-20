// Extension Configuration
// Production defaults match the live Cashly site. Override locally via
// chrome.storage.sync CASHLY_CONFIG (API_BASE_URL, WEBSITE_URL, Supabase keys).

const DEFAULT_CONFIG = {
    SUPABASE_URL: 'https://gmttqefcyqaxhlghcfpo.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdHRxZWZjeXFheGhsZ2hjZnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTMwMDYsImV4cCI6MjA5NTM4OTAwNn0.fQXoRZNV8AuwaqWQ-1xgkWGlSzLNTSOZ9o-pCRkEiqI',
    API_BASE_URL: 'https://shopping-expense-tracker.vercel.app/api',

    WEBSITE_ORIGINS: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://localhost:3000',
        'https://finzen-expense.vercel.app',
        'https://spendsync-expense.vercel.app',
        'https://shopping-expense-tracker.vercel.app'
    ],

    WEBSITE_URL: 'https://shopping-expense-tracker.vercel.app',

    VERSION: '9.0.1',

    FEATURES: {
        BEHAVIOR_TRACKING: true,
        REALTIME_SYNC: true,
        NOTIFICATIONS: true
    },

    RATE_LIMIT: {
        MAX_REQUESTS_PER_MINUTE: 60,
        MAX_TRANSACTIONS_PER_MINUTE: 10,
        SYNC_COOLDOWN_MS: 5000
    }
};

const CONFIG = { ...DEFAULT_CONFIG };

Object.defineProperties(CONFIG, {
    API_URL: {
        get() {
            return `${this.SUPABASE_URL}/rest/v1`;
        }
    },
    REALTIME_URL: {
        get() {
            return `wss://${this.SUPABASE_URL.replace('https://', '')}/realtime/v1/websocket`;
        }
    }
});

async function loadConfigFromStorage() {
    try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            const stored = await chrome.storage.sync.get(['CASHLY_CONFIG']);
            if (stored.CASHLY_CONFIG) {
                if (stored.CASHLY_CONFIG.SUPABASE_URL) {
                    CONFIG.SUPABASE_URL = stored.CASHLY_CONFIG.SUPABASE_URL;
                }
                if (stored.CASHLY_CONFIG.SUPABASE_ANON_KEY) {
                    CONFIG.SUPABASE_ANON_KEY = stored.CASHLY_CONFIG.SUPABASE_ANON_KEY;
                }
                if (stored.CASHLY_CONFIG.WEBSITE_URL) {
                    CONFIG.WEBSITE_URL = stored.CASHLY_CONFIG.WEBSITE_URL;
                }
                if (stored.CASHLY_CONFIG.API_BASE_URL) {
                    CONFIG.API_BASE_URL = stored.CASHLY_CONFIG.API_BASE_URL;
                }
                console.log('📋 Config loaded from storage');
            }
        }
    } catch (error) {
        console.warn('Could not load config from storage, using defaults:', error);
    }
}

async function saveConfigToStorage(newConfig) {
    try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            await chrome.storage.sync.set({
                CASHLY_CONFIG: {
                    SUPABASE_URL: newConfig.SUPABASE_URL || CONFIG.SUPABASE_URL,
                    SUPABASE_ANON_KEY: newConfig.SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY,
                    WEBSITE_URL: newConfig.WEBSITE_URL || CONFIG.WEBSITE_URL,
                    API_BASE_URL: newConfig.API_BASE_URL || CONFIG.API_BASE_URL
                }
            });
            console.log('💾 Config saved to storage');
        }
    } catch (error) {
        console.warn('Could not save config to storage:', error);
    }
}

loadConfigFromStorage();

if (typeof self !== 'undefined') {
    self.CONFIG = CONFIG;
    self.loadConfigFromStorage = loadConfigFromStorage;
    self.saveConfigToStorage = saveConfigToStorage;
}

if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.loadConfigFromStorage = loadConfigFromStorage;
    window.saveConfigToStorage = saveConfigToStorage;
}
