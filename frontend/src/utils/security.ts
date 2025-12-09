// Security & Validation Utilities
// Centralized input validation, sanitization, and security helpers

// =================================
// INPUT VALIDATION
// =================================

export const validators = {
    // Email validation
    isValidEmail: (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Password strength check
    isStrongPassword: (password: string): { valid: boolean; message: string } => {
        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters' };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: 'Password must contain an uppercase letter' };
        }
        if (!/[a-z]/.test(password)) {
            return { valid: false, message: 'Password must contain a lowercase letter' };
        }
        if (!/[0-9]/.test(password)) {
            return { valid: false, message: 'Password must contain a number' };
        }
        return { valid: true, message: 'Password is strong' };
    },

    // Amount validation (positive numbers only)
    isValidAmount: (amount: number | string): boolean => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return !isNaN(num) && num > 0 && num < 100000000; // Max 100 million
    },

    // Date validation
    isValidDate: (dateString: string): boolean => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    },

    // Category validation
    isValidCategory: (category: string, allowedCategories: string[]): boolean => {
        return allowedCategories.some(c => c.toLowerCase() === category.toLowerCase());
    },

    // UUID validation
    isValidUUID: (uuid: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    },
};

// =================================
// INPUT SANITIZATION
// =================================

export const sanitize = {
    // Remove HTML tags to prevent XSS
    stripHtml: (input: string): string => {
        return input.replace(/<[^>]*>/g, '');
    },

    // Escape special characters
    escapeHtml: (input: string): string => {
        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        return input.replace(/[&<>"']/g, m => map[m]);
    },

    // Trim and limit string length
    trimAndLimit: (input: string, maxLength: number = 500): string => {
        return input.trim().slice(0, maxLength);
    },

    // Clean description/text input
    cleanText: (input: string): string => {
        return sanitize.trimAndLimit(sanitize.stripHtml(input), 500);
    },

    // Sanitize number input
    cleanNumber: (input: string | number): number => {
        const num = typeof input === 'string' ? parseFloat(input.replace(/[^0-9.-]/g, '')) : input;
        return isNaN(num) ? 0 : Math.abs(num);
    },

    // Clean file name
    cleanFileName: (fileName: string): string => {
        return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    },
};

// =================================
// RATE LIMITING (Client-side)
// =================================

const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

export const rateLimit = {
    check: (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
        const now = Date.now();
        const entry = rateLimitStore.get(key);

        if (!entry || now > entry.resetTime) {
            rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
            return true;
        }

        if (entry.count >= maxRequests) {
            return false; // Rate limit exceeded
        }

        entry.count++;
        return true;
    },

    clear: (key: string): void => {
        rateLimitStore.delete(key);
    },
};

// =================================
// SECURE STORAGE
// =================================

export const secureStorage = {
    // Set item with optional expiry
    set: (key: string, value: any, expiryMinutes?: number): void => {
        const item = {
            value,
            expiry: expiryMinutes ? Date.now() + expiryMinutes * 60 * 1000 : null,
        };
        try {
            localStorage.setItem(key, JSON.stringify(item));
        } catch (e) {
            console.error('Storage error:', e);
        }
    },

    // Get item (returns null if expired)
    get: <T>(key: string): T | null => {
        try {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) return null;

            const item = JSON.parse(itemStr);
            if (item.expiry && Date.now() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            return item.value as T;
        } catch (e) {
            return null;
        }
    },

    // Remove item
    remove: (key: string): void => {
        localStorage.removeItem(key);
    },

    // Clear all app storage
    clearAll: (): void => {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.startsWith('vibe-'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    },
};

// =================================
// ERROR HANDLING
// =================================

export class AppError extends Error {
    constructor(
        message: string,
        public code: string = 'UNKNOWN_ERROR',
        public statusCode: number = 500,
        public isOperational: boolean = true
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export const errorHandler = {
    // Format error for display
    formatError: (error: unknown): string => {
        if (error instanceof AppError) {
            return error.message;
        }
        if (error instanceof Error) {
            // Don't expose internal errors to users
            if (process.env.NODE_ENV === 'production') {
                return 'Something went wrong. Please try again.';
            }
            return error.message;
        }
        return 'An unexpected error occurred';
    },

    // Log error (can be extended to send to logging service)
    logError: (error: unknown, context?: Record<string, any>): void => {
        console.error('[App Error]', {
            error,
            context,
            timestamp: new Date().toISOString(),
        });
    },
};

// =================================
// CSRF TOKEN HELPER
// =================================

export const csrf = {
    generate: (): string => {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    store: (token: string): void => {
        sessionStorage.setItem('csrf_token', token);
    },

    get: (): string | null => {
        return sessionStorage.getItem('csrf_token');
    },

    verify: (token: string): boolean => {
        const stored = sessionStorage.getItem('csrf_token');
        return stored === token;
    },
};

export default {
    validators,
    sanitize,
    rateLimit,
    secureStorage,
    errorHandler,
    csrf,
    AppError,
};
