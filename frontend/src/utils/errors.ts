// Frontend Error Utilities
// Centralized error handling with user-friendly messages

// ================================
// Error Types
// ================================

export enum ErrorCode {
    // Network errors
    NETWORK_ERROR = 'NETWORK_ERROR',
    TIMEOUT = 'TIMEOUT',
    SERVER_ERROR = 'SERVER_ERROR',

    // Auth errors
    UNAUTHORIZED = 'UNAUTHORIZED',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

    // Validation errors
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INVALID_INPUT = 'INVALID_INPUT',

    // Resource errors
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',

    // Rate limiting
    RATE_LIMITED = 'RATE_LIMITED',

    // Generic
    UNKNOWN = 'UNKNOWN',
}

// ================================
// User-Friendly Error Messages
// ================================

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
    [ErrorCode.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection.',
    [ErrorCode.TIMEOUT]: 'The request took too long. Please try again.',
    [ErrorCode.SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
    [ErrorCode.UNAUTHORIZED]: 'You need to log in to continue.',
    [ErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
    [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
    [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
    [ErrorCode.INVALID_INPUT]: 'The provided data is invalid.',
    [ErrorCode.NOT_FOUND]: 'The requested item was not found.',
    [ErrorCode.CONFLICT]: 'This item already exists.',
    [ErrorCode.RATE_LIMITED]: 'Too many requests. Please wait a moment before trying again.',
    [ErrorCode.UNKNOWN]: 'An unexpected error occurred. Please try again.',
}

// ================================
// Custom Error Classes
// ================================

export class AppError extends Error {
    constructor(
        public code: ErrorCode,
        message?: string,
        public details?: Record<string, unknown>
    ) {
        super(message || ERROR_MESSAGES[code])
        this.name = 'AppError'
    }

    getUserMessage(): string {
        return this.message || ERROR_MESSAGES[this.code]
    }
}

export class ValidationError extends AppError {
    constructor(
        public fieldErrors: Record<string, string>,
        message?: string
    ) {
        super(ErrorCode.VALIDATION_ERROR, message)
        this.name = 'ValidationError'
    }

    getFirstError(): string {
        const errors = Object.values(this.fieldErrors)
        return errors[0] || ERROR_MESSAGES[ErrorCode.VALIDATION_ERROR]
    }
}

export class NetworkError extends AppError {
    constructor(message?: string) {
        super(ErrorCode.NETWORK_ERROR, message)
        this.name = 'NetworkError'
    }
}

// ================================
// Error Parsing Utilities
// ================================

/**
 * Parse an unknown error into an AppError with proper type
 */
export function parseError(error: unknown): AppError {
    // Already an AppError
    if (error instanceof AppError) {
        return error
    }

    // Axios-like error object
    if (isAxiosError(error)) {
        const status = error.response?.status
        const message = error.response?.data?.message || error.message

        switch (status) {
            case 400:
                return new AppError(ErrorCode.VALIDATION_ERROR, message)
            case 401:
                return new AppError(ErrorCode.UNAUTHORIZED, message)
            case 403:
                return new AppError(ErrorCode.UNAUTHORIZED, message)
            case 404:
                return new AppError(ErrorCode.NOT_FOUND, message)
            case 409:
                return new AppError(ErrorCode.CONFLICT, message)
            case 429:
                return new AppError(ErrorCode.RATE_LIMITED, message)
            case 500:
            case 502:
            case 503:
                return new AppError(ErrorCode.SERVER_ERROR, message)
            default:
                return new AppError(ErrorCode.UNKNOWN, message)
        }
    }

    // Network/fetch error
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return new NetworkError()
    }

    // Standard Error
    if (error instanceof Error) {
        if (error.message.includes('timeout')) {
            return new AppError(ErrorCode.TIMEOUT, error.message)
        }
        return new AppError(ErrorCode.UNKNOWN, error.message)
    }

    // String error
    if (typeof error === 'string') {
        return new AppError(ErrorCode.UNKNOWN, error)
    }

    // Unknown
    return new AppError(ErrorCode.UNKNOWN)
}

/**
 * Type guard for axios-like error objects
 */
function isAxiosError(error: unknown): error is {
    response?: { status?: number; data?: { message?: string } }
    message: string
} {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
    )
}

/**
 * Get a user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
    const appError = parseError(error)
    return appError.getUserMessage()
}

/**
 * Log error for debugging (in development) or monitoring (in production)
 */
export function logError(error: unknown, context?: string): void {
    const appError = parseError(error)

    if (process.env.NODE_ENV === 'development') {
        console.error(`[${context || 'Error'}]`, {
            code: appError.code,
            message: appError.message,
            details: appError.details,
            stack: appError.stack,
        })
    } else {
        // In production, you'd send to error tracking service (Sentry, etc.)
        console.error(`[${context || 'Error'}] ${appError.code}: ${appError.message}`)
    }
}
