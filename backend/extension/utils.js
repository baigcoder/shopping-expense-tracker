// Extension Utilities - Reusable helper functions
// Common functionality used across content.js, popup.js, background.js

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHTML(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Escape HTML entities for safe display
 * @param {string} unsafe - Unsafe string with potential HTML
 * @returns {string} Escaped string
 */
function escapeHTML(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between executions in ms
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 1000) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format currency amount for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (USD, PKR, etc.)
 * @returns {string} Formatted amount string
 */
function formatCurrency(amount, currency = 'USD') {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';

    const symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'PKR': 'Rs',
        'INR': '₹'
    };

    const symbol = symbols[currency] || '$';
    return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Extract domain from URL
 * @param {string} url - Full URL
 * @returns {string} Domain name
 */
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return '';
    }
}

/**
 * Get favicon URL for a domain
 * @param {string} domain - Domain name
 * @returns {string} Favicon URL
 */
function getFaviconUrl(domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

/**
 * Safe Chrome storage get with fallback
 * @param {string|string[]} keys - Keys to retrieve
 * @param {object} defaults - Default values
 * @returns {Promise<object>} Storage values
 */
async function safeStorageGet(keys, defaults = {}) {
    try {
        const result = await chrome.storage.local.get(keys);
        return { ...defaults, ...result };
    } catch (error) {
        console.warn('Storage get error:', error);
        return defaults;
    }
}

/**
 * Safe Chrome storage set
 * @param {object} data - Data to store
 * @returns {Promise<boolean>} Success status
 */
async function safeStorageSet(data) {
    try {
        await chrome.storage.local.set(data);
        return true;
    } catch (error) {
        console.warn('Storage set error:', error);
        return false;
    }
}

/**
 * Parse price from text
 * @param {string} text - Text containing price
 * @returns {number|null} Parsed price or null
 */
function parsePrice(text) {
    if (!text) return null;

    const patterns = [
        /\$\s*([\d,]+\.?\d*)/,
        /€\s*([\d,]+\.?\d*)/,
        /£\s*([\d,]+\.?\d*)/,
        /Rs\.?\s*([\d,]+\.?\d*)/i,
        /₹\s*([\d,]+\.?\d*)/
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const price = parseFloat(match[1].replace(/,/g, ''));
            if (price > 0 && price < 100000) return price;
        }
    }

    return null;
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if element is visible in viewport
 * @param {Element} element - DOM element
 * @returns {boolean} Visibility status
 */
function isElementVisible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

/**
 * Wait for element to appear in DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Element|null>} Element or null
 */
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);
    });
}

/**
 * Log with extension prefix 
 * @param {string} message - Log message
 * @param {object} data - Optional data to log
 */
function log(message, data = null) {
    const prefix = '💸 Cashly:';
    if (data) {
        console.log(prefix, message, data);
    } else {
        console.log(prefix, message);
    }
}

// Export for use in different contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeHTML,
        escapeHTML,
        debounce,
        throttle,
        formatCurrency,
        extractDomain,
        getFaviconUrl,
        safeStorageGet,
        safeStorageSet,
        parsePrice,
        generateId,
        isElementVisible,
        waitForElement,
        log
    };
}
