// Extension Constants - Centralized configuration values
// Reduces magic strings/numbers throughout the codebase

// ================================
// EXCLUDED DOMAINS
// ================================
const EXCLUDED_DOMAINS = [
    'localhost', '127.0.0.1', 'vibe-tracker', 'vibetracker',
    'shopping-expense-tracker', 'vercel.app', 'netlify.app', 'cashly',
    'spendsync', 'finzen'
];

// ================================
// STATE MACHINE STATES
// ================================
const STATES = {
    IDLE: 'idle',
    MONITORING: 'monitoring',
    CHECKOUT_ENTERED: 'checkout_entered',
    PAYMENT_FORM_ACTIVE: 'payment_form_active',
    PAYMENT_SUBMITTED: 'payment_submitted',
    TRANSACTION_CONFIRMED: 'transaction_confirmed'
};

// ================================
// URL PATTERNS
// ================================
const CHECKOUT_URL_PATTERNS = [
    /\/checkout/i, /\/payment/i, /\/billing/i, /\/subscribe/i,
    /\/pay\//i, /\/cart/i, /\/order/i, /\/purchase/i,
    /step=payment/i, /step=checkout/i
];

const SUCCESS_URL_PATTERNS = [
    /\/thank/i, /\/success/i, /\/confirm/i, /\/complete/i,
    /\/receipt/i, /\?success/i, /\?confirmed/i
];

const PRODUCT_URL_PATTERNS = [
    /\/products?\//i, /\/item\//i, /\/p\//i, /\/pd\//i,
    /\/detail\//i, /product_id=/i, /item_id=/i,
    /\/collections\/[^/]+\/products\//i
];

// ================================
// DOM SELECTORS
// ================================
const PAYMENT_FORM_SELECTORS = [
    'input[autocomplete="cc-number"]', 'input[autocomplete="cc-csc"]',
    'input[name*="card"]', 'input[data-stripe]',
    '[class*="card-number"]', 'iframe[src*="stripe"]',
    'iframe[src*="braintree"]', 'iframe[src*="paypal"]',
    '.StripeElement'
];

const SUCCESS_ELEMENT_SELECTORS = [
    '[class*="success"]', '[class*="confirm"]', '[class*="thank"]',
    '[class*="complete"]', '.order-confirmation', '.payment-success'
];

const CREDIT_CARD_SELECTORS = [
    'input[autocomplete="cc-number"]',
    'input[autocomplete="cc-csc"]',
    'input[autocomplete="cc-exp"]',
    'input[autocomplete="cc-name"]',
    'input[name*="card"][name*="number"]',
    'input[name*="credit"]',
    'input[data-stripe]',
    'input[data-braintree]',
    '[class*="card-number"]',
    '[class*="cc-number"]',
    '[class*="credit-card"]',
    'input[placeholder*="card number"]',
    'input[placeholder*="1234"]'
];

// ================================
// PAYMENT BUTTON PATTERNS
// ================================
const PAYMENT_BUTTON_PATTERNS = [
    /^pay$/i, /^pay\s*now$/i, /^submit\s*(payment|order)?$/i,
    /^complete\s*(order|purchase)?$/i, /^place\s*order$/i,
    /^confirm\s*(order|payment)?$/i, /^subscribe$/i,
    /^start\s*(free\s*)?trial$/i, /^buy\s*now$/i
];

// ================================
// SITE ANALYSIS SCORES
// ================================
const ANALYSIS_SCORES = {
    CREDIT_CARD_FORM: 40,
    PAYMENT_IFRAME: 35,
    STRIPE_ELEMENTS: 35,
    PAYMENT_URL: 30,
    PRODUCT_PAGE: 25,
    ECOMMERCE_ELEMENTS: 20,
    PAYMENT_BUTTON: 15,
    SUBSCRIPTION_KEYWORDS: 15,
    ECOMMERCE_SINGLE: 10,
    PRODUCT_PAGE_WEAK: 10,
    OG_PRODUCT: 10,
    SCHEMA_PRODUCT: 10,
    THRESHOLD: 15
};

// ================================
// RATE LIMITING
// ================================
const RATE_LIMITS = {
    MAX_REQUESTS_PER_MINUTE: 60,
    MAX_TRANSACTIONS_PER_MINUTE: 10,
    SYNC_COOLDOWN_MS: 5000,
    CONFIRMATION_WATCHER_TIMEOUT_MS: 30000
};

// ================================
// NOTIFICATION SETTINGS
// ================================
const NOTIFICATION_SETTINGS = {
    DURATION_MS: 8000,
    POPUP_DURATION_MS: 5000
};

// ================================
// CATEGORY MAPPINGS
// ================================
const CATEGORY_PATTERNS = {
    'Entertainment': /netflix|hulu|disney|hbo|spotify|youtube|twitch|prime video/i,
    'Creative': /adobe|figma|canva|sketch/i,
    'Productivity': /notion|slack|trello|asana|monday/i,
    'Development': /github|vercel|aws|azure|digitalocean|heroku/i,
    'Storage': /dropbox|google.*drive|icloud|box/i,
    'Shopping': /amazon|ebay|walmart|target|aliexpress|daraz|shopify/i,
    'Food Delivery': /uber.*eat|doordash|grubhub|foodpanda|deliveroo/i,
    'AI Services': /chatgpt|openai|claude|gemini|midjourney/i,
    'Health & Fitness': /gym|fitness|peloton|headspace|calm/i,
    'Education': /coursera|udemy|skillshare|masterclass/i
};

// ================================
// CURRENCY PATTERNS
// ================================
const CURRENCY_PATTERNS = [
    { pattern: /\$\s*([\d,]+\.?\d*)/g, currency: 'USD' },
    { pattern: /USD\s*([\d,]+\.?\d*)/gi, currency: 'USD' },
    { pattern: /€\s*([\d,]+\.?\d*)/g, currency: 'EUR' },
    { pattern: /£\s*([\d,]+\.?\d*)/g, currency: 'GBP' },
    { pattern: /Rs\.?\s*([\d,]+\.?\d*)/gi, currency: 'PKR' },
    { pattern: /PKR\s*([\d,]+\.?\d*)/gi, currency: 'PKR' },
    { pattern: /INR\s*([\d,]+\.?\d*)/gi, currency: 'INR' },
    { pattern: /₹\s*([\d,]+\.?\d*)/g, currency: 'INR' }
];

// ================================
// TRIAL DETECTION PATTERNS
// ================================
const TRIAL_PATTERNS = [
    /(\d+)\s*[-–]?\s*day\s*(free\s*)?trial/i,
    /free\s*for\s*(\d+)\s*days?/i,
    /(\d+)\s*days?\s*free/i,
    /try\s*free\s*for\s*(\d+)/i
];

// Export for use in different contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EXCLUDED_DOMAINS,
        STATES,
        CHECKOUT_URL_PATTERNS,
        SUCCESS_URL_PATTERNS,
        PRODUCT_URL_PATTERNS,
        PAYMENT_FORM_SELECTORS,
        SUCCESS_ELEMENT_SELECTORS,
        CREDIT_CARD_SELECTORS,
        PAYMENT_BUTTON_PATTERNS,
        ANALYSIS_SCORES,
        RATE_LIMITS,
        NOTIFICATION_SETTINGS,
        CATEGORY_PATTERNS,
        CURRENCY_PATTERNS,
        TRIAL_PATTERNS
    };
}
