// Extension Configuration
// Centralized config for Supabase and other settings
// NOTE: For production, consider using Chrome storage sync or a secure config service

const CONFIG = {
    SUPABASE_URL: 'https://ebfolvhqjvavrwrfcbhn.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZm9sdmhxanZhdnJ3cmZjYmhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NjI0NDgsImV4cCI6MjA0OTIzODQ0OH0.RC7d0vMx1F4Z2J2Ovl9m2hZV8HCmZ2f6pBWSN-GJ3O0',

    // Website URLs
    WEBSITE_ORIGINS: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://finzen-expense.vercel.app'
    ],

    WEBSITE_URL: 'http://localhost:5173',

    // API Endpoints
    get API_URL() {
        return `${this.SUPABASE_URL}/rest/v1`;
    },

    get REALTIME_URL() {
        return `wss://${this.SUPABASE_URL.replace('https://', '')}/realtime/v1/websocket`;
    },

    // Extension settings
    VERSION: '4.0.0',

    // Feature flags
    FEATURES: {
        BEHAVIOR_TRACKING: true,
        REALTIME_SYNC: true,
        NOTIFICATIONS: true
    }
};

// For service worker (background.js) - self is the global
if (typeof self !== 'undefined') {
    self.CONFIG = CONFIG;
}

// For content scripts and popup
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
