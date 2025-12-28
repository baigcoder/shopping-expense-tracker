// Security Utilities - Input Sanitization and Validation
// Protects against prompt injection and XSS attacks

/**
 * Sanitize user input to prevent prompt injection attacks
 * Removes or escapes potentially dangerous patterns
 */
export function sanitizeAIInput(input: string, maxLength: number = 2000): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    let sanitized = input
        // Limit length to prevent DoS
        .slice(0, maxLength)
        // Remove control characters (except newlines and tabs)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Remove potential prompt injection patterns
        .replace(/```[\s\S]*?```/g, '[code block removed]') // Remove code blocks that might contain instructions
        .replace(/\{[\s\S]*?\}/g, '[object removed]')       // Remove JSON-like objects
        .replace(/<script[\s\S]*?<\/script>/gi, '')         // Remove script tags
        .replace(/<style[\s\S]*?<\/style>/gi, '')           // Remove style tags
        .replace(/<[^>]*>/g, '')                            // Remove all HTML tags
        // Remove common prompt injection phrases (case-insensitive)
        .replace(/ignore\s+(all\s+)?previous\s+instructions?/gi, '[filtered]')
        .replace(/forget\s+(all\s+)?previous\s+instructions?/gi, '[filtered]')
        .replace(/disregard\s+(all\s+)?previous/gi, '[filtered]')
        .replace(/you\s+are\s+now\s+a/gi, '[filtered]')
        .replace(/pretend\s+you\s+are/gi, '[filtered]')
        .replace(/act\s+as\s+if/gi, '[filtered]')
        .replace(/new\s+instructions?:/gi, '[filtered]')
        .replace(/system\s*:/gi, '[filtered]')
        .replace(/assistant\s*:/gi, '[filtered]')
        .replace(/user\s*:/gi, '[filtered]')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();

    return sanitized;
}

/**
 * Sanitize object values recursively (for context objects)
 */
export function sanitizeContext<T extends Record<string, any>>(obj: T): T {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeAIInput(value, 500);
        } else if (typeof value === 'number') {
            // Ensure numbers are within reasonable bounds
            sanitized[key] = Math.max(-1e12, Math.min(1e12, value));
        } else if (typeof value === 'boolean') {
            sanitized[key] = value;
        } else if (Array.isArray(value)) {
            sanitized[key] = value.slice(0, 100).map(item =>
                typeof item === 'string' ? sanitizeAIInput(item, 500) : item
            );
        } else if (value && typeof value === 'object') {
            sanitized[key] = sanitizeContext(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized as T;
}

/**
 * Validate and sanitize chat message
 */
export function sanitizeChatMessage(message: string): { valid: boolean; sanitized: string; error?: string } {
    if (!message || typeof message !== 'string') {
        return { valid: false, sanitized: '', error: 'Message is required' };
    }

    const trimmed = message.trim();

    if (trimmed.length === 0) {
        return { valid: false, sanitized: '', error: 'Message cannot be empty' };
    }

    if (trimmed.length > 4000) {
        return { valid: false, sanitized: '', error: 'Message too long (max 4000 characters)' };
    }

    const sanitized = sanitizeAIInput(trimmed, 4000);

    // Check if message was significantly altered (potential attack)
    const alteredRatio = 1 - (sanitized.length / trimmed.length);
    if (alteredRatio > 0.5) {
        return { valid: false, sanitized: '', error: 'Message contains invalid content' };
    }

    return { valid: true, sanitized };
}

/**
 * Rate limit key generator for AI endpoints
 */
export function getAIRateLimitKey(userId: string, endpoint: string): string {
    return `ai:ratelimit:${endpoint}:${userId}`;
}

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };

    return text.replace(/[&<>"'`=/]/g, char => htmlEntities[char]);
}

export default {
    sanitizeAIInput,
    sanitizeContext,
    sanitizeChatMessage,
    getAIRateLimitKey,
    escapeHtml
};
