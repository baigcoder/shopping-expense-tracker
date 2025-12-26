// Frontend Constants - Centralized configuration values
// Eliminates magic numbers and strings throughout the codebase

// ================================
// Pagination
// ================================
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    DEFAULT_PAGE: 1,
} as const

// ================================
// API Configuration
// ================================
export const API = {
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000,
} as const

// ================================
// Cache Settings
// ================================
export const CACHE = {
    AI_TIP_TTL_MS: 60000, // 1 minute
    USER_CONTEXT_TTL_MS: 60000, // 1 minute
    STALE_TIME_MS: 5 * 60 * 1000, // 5 minutes
    GC_TIME_MS: 10 * 60 * 1000, // 10 minutes
} as const

// ================================
// Animation Durations
// ================================
export const ANIMATION = {
    FAST_MS: 150,
    DEFAULT_MS: 300,
    SLOW_MS: 500,
    STAGGER_DELAY_MS: 100,
} as const

// ================================
// Notification Settings
// ================================
export const NOTIFICATION = {
    DURATION_MS: 5000,
    MAX_VISIBLE: 3,
} as const

// ================================
// Budget Periods
// ================================
export const BUDGET_PERIODS = ['weekly', 'monthly', 'yearly'] as const
export type BudgetPeriod = typeof BUDGET_PERIODS[number]

// ================================
// Chart Colors
// ================================
export const CHART_COLORS = {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    tertiary: '#EC4899',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    palette: [
        '#6366F1', '#8B5CF6', '#EC4899', '#F97316',
        '#10B981', '#06B6D4', '#3B82F6', '#14B8A6',
    ],
} as const

// ================================
// Date Formats
// ================================
export const DATE_FORMAT = {
    DISPLAY: 'MMM d, yyyy',
    DISPLAY_SHORT: 'MMM d',
    INPUT: 'yyyy-MM-dd',
    TIME: 'HH:mm',
    DATETIME: 'MMM d, yyyy HH:mm',
} as const

// ================================
// Currency Configuration
// ================================
export const CURRENCY = {
    DEFAULT: 'USD',
    SUPPORTED: ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'CAD', 'AUD'] as const,
} as const

// ================================
// Form Validation
// ================================
export const VALIDATION = {
    MIN_PASSWORD_LENGTH: 8,
    MAX_NAME_LENGTH: 50,
    MAX_NOTES_LENGTH: 500,
    MAX_DESCRIPTION_LENGTH: 300,
    MIN_AMOUNT: 0.01,
    MAX_AMOUNT: 999999999.99,
} as const

// ================================
// Storage Keys
// ================================
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER: 'user',
    THEME: 'theme',
    SOUND_ENABLED: 'sound_enabled',
    SOUND_VOLUME: 'sound_volume',
    NOTIFICATIONS_ENABLED: 'notifications_enabled',
    EXTENSION_SYNCED: 'cashly_extension_synced',
} as const

// ================================
// Routes
// ================================
export const ROUTES = {
    HOME: '/',
    DASHBOARD: '/dashboard',
    TRANSACTIONS: '/transactions',
    ANALYTICS: '/analytics',
    BUDGETS: '/budgets',
    GOALS: '/goals',
    SETTINGS: '/settings',
    PROFILE: '/profile',
    LOGIN: '/login',
    SIGNUP: '/signup',
} as const

// ================================
// Query Keys (for React Query)
// ================================
export const QUERY_KEYS = {
    TRANSACTIONS: 'transactions',
    RECENT_TRANSACTIONS: 'recent-transactions',
    CATEGORIES: 'categories',
    ANALYTICS: 'analytics',
    BUDGETS: 'budgets',
    GOALS: 'goals',
    USER: 'user',
    SUBSCRIPTIONS: 'subscriptions',
} as const
