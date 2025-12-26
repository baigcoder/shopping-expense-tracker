// Backend Constants - Centralized configuration values
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
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,
} as const

// ================================
// Authentication
// ================================
export const AUTH = {
    OTP_EXPIRY_MINUTES: 10,
    OTP_LENGTH: 6,
    MAX_OTP_ATTEMPTS: 5,
    SESSION_EXPIRY_HOURS: 24 * 7, // 1 week
} as const

// ================================
// Database
// ================================
export const DB = {
    MAX_CONNECTIONS: 10,
    CONNECTION_TIMEOUT_MS: 5000,
} as const

// ================================
// Transaction Settings
// ================================
export const TRANSACTION = {
    MAX_AMOUNT: 999999999.99,
    MIN_AMOUNT: 0.01,
    MAX_STORE_NAME_LENGTH: 100,
    MAX_PRODUCT_NAME_LENGTH: 200,
    MAX_NOTES_LENGTH: 500,
} as const

// ================================
// Budget Periods
// ================================
export const BUDGET_PERIODS = ['weekly', 'monthly', 'yearly'] as const
export type BudgetPeriod = typeof BUDGET_PERIODS[number]

// ================================
// Currency Configuration
// ================================
export const CURRENCY = {
    DEFAULT: 'USD',
    SUPPORTED: ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'CAD', 'AUD'] as const,
} as const

// ================================
// Sync Settings (Extension)
// ================================
export const SYNC = {
    INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
    BATCH_SIZE: 50,
    MAX_RETRIES: 3,
} as const

// ================================
// Email Settings
// ================================
export const EMAIL = {
    FROM_NAME: 'SpendSync',
    FROM_EMAIL: 'noreply@spendsync.app',
    MAX_RETRIES: 3,
} as const

// ================================
// HTTP Status Codes
// ================================
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
} as const

// ================================
// Error Messages
// ================================
export const ERROR_MESSAGES = {
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    VALIDATION_ERROR: 'Validation failed',
    INTERNAL_ERROR: 'An internal error occurred',
    RATE_LIMITED: 'Too many requests, please try again later',
    TRANSACTION_NOT_FOUND: 'Transaction not found',
    USER_NOT_FOUND: 'User not found',
    CATEGORY_NOT_FOUND: 'Category not found',
    INVALID_OTP: 'Invalid or expired OTP',
    OTP_EXPIRED: 'OTP has expired',
    MAX_ATTEMPTS_EXCEEDED: 'Maximum attempts exceeded',
} as const
