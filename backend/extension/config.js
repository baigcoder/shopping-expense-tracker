// Extension Configuration
// Centralized config for Supabase and other settings
// Uses chrome.storage.sync for secure credential storage when available

// Default config (fallback values - can be overridden via storage)
const DEFAULT_CONFIG = {
    SUPABASE_URL: 'https://ebfolvhqjvavrwrfcbhn.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZm9sdmhxanZhdnJ3cmZjYmhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NjI0NDgsImV4cCI6MjA0OTIzODQ0OH0.RC7d0vMx1F4Z2J2Ovl9m2hZV8HCmZ2f6pBWSN-GJ3O0',

    // Website URLs
    WEBSITE_ORIGINS: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://finzen-expense.vercel.app',
        'https://spendsync-expense.vercel.app'
    ],

    WEBSITE_URL: 'http://localhost:5173',

    // Extension settings
    VERSION: '5.0.0',

    // Feature flags
    FEATURES: {
        BEHAVIOR_TRACKING: true,
        REALTIME_SYNC: true,
        NOTIFICATIONS: true
    },

    // Rate limiting settings
    RATE_LIMIT: {
        MAX_REQUESTS_PER_MINUTE: 60,
        MAX_TRANSACTIONS_PER_MINUTE: 10,
        SYNC_COOLDOWN_MS: 5000
    }
};

// Create a reactive config object
const CONFIG = { ...DEFAULT_CONFIG };

// Computed properties
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

// Load config from storage (async - will update CONFIG when ready)
async function loadConfigFromStorage() {
    try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            const stored = await chrome.storage.sync.get(['CASHLY_CONFIG']);
            if (stored.CASHLY_CONFIG) {
                // Only override specific keys for security
                if (stored.CASHLY_CONFIG.SUPABASE_URL) {
                    CONFIG.SUPABASE_URL = stored.CASHLY_CONFIG.SUPABASE_URL;
                }
                if (stored.CASHLY_CONFIG.SUPABASE_ANON_KEY) {
                    CONFIG.SUPABASE_ANON_KEY = stored.CASHLY_CONFIG.SUPABASE_ANON_KEY;
                }
                if (stored.CASHLY_CONFIG.WEBSITE_URL) {
                    CONFIG.WEBSITE_URL = stored.CASHLY_CONFIG.WEBSITE_URL;
                }
                console.log('📋 Config loaded from storage');
            }
        }
    } catch (error) {
        console.warn('Could not load config from storage, using defaults:', error);
    }
}

// Save config to storage
async function saveConfigToStorage(newConfig) {
    try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            await chrome.storage.sync.set({
                CASHLY_CONFIG: {
                    SUPABASE_URL: newConfig.SUPABASE_URL || CONFIG.SUPABASE_URL,
                    SUPABASE_ANON_KEY: newConfig.SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY,
                    WEBSITE_URL: newConfig.WEBSITE_URL || CONFIG.WEBSITE_URL
                }
            });
            console.log('💾 Config saved to storage');
        }
    } catch (error) {
        console.warn('Could not save config to storage:', error);
    }
}

// Initialize config on load
loadConfigFromStorage();

// For service worker (background.js) - self is the global
if (typeof self !== 'undefined') {
    self.CONFIG = CONFIG;
    self.loadConfigFromStorage = loadConfigFromStorage;
    self.saveConfigToStorage = saveConfigToStorage;
}

// For content scripts and popup
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.loadConfigFromStorage = loadConfigFromStorage;
    window.saveConfigToStorage = saveConfigToStorage;
}
