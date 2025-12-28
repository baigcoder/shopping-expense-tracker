// CSRF Protection Middleware
// Implements double-submit cookie pattern for stateless CSRF protection

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token
 */
function generateToken(): string {
    return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Middleware to set CSRF token cookie on GET requests
 * Client should include this token in X-CSRF-Token header for state-changing requests
 */
export function csrfTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Only set token on GET requests (safe methods)
    if (req.method === 'GET') {
        const existingToken = req.cookies?.[CSRF_COOKIE_NAME];

        if (!existingToken) {
            const token = generateToken();
            res.cookie(CSRF_COOKIE_NAME, token, {
                httpOnly: false, // JS needs to read it
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });
        }
    }
    next();
}

/**
 * Middleware to validate CSRF token on state-changing requests
 * Skips validation for:
 * - Safe methods (GET, HEAD, OPTIONS)
 * - Requests with valid Authorization header (API token auth)
 */
export function csrfValidationMiddleware(req: Request, res: Response, next: NextFunction): void {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

    // Skip for safe methods
    if (safeMethods.includes(req.method)) {
        next();
        return;
    }

    // Skip for requests with Authorization header (API clients)
    // These are already authenticated via JWT and less susceptible to CSRF
    if (req.headers.authorization) {
        next();
        return;
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] as string;

    // Validate tokens
    if (!cookieToken || !headerToken) {
        res.status(403).json({
            error: 'CSRF token missing',
            message: 'Please refresh the page and try again'
        });
        return;
    }

    // Constant-time comparison to prevent timing attacks
    const tokensMatch = crypto.timingSafeEqual(
        Buffer.from(cookieToken),
        Buffer.from(headerToken)
    );

    if (!tokensMatch) {
        res.status(403).json({
            error: 'CSRF token invalid',
            message: 'Security validation failed. Please refresh and try again.'
        });
        return;
    }

    next();
}

/**
 * Combined CSRF protection middleware
 * Use this for routes that need CSRF protection
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
    csrfTokenMiddleware(req, res, () => {
        csrfValidationMiddleware(req, res, next);
    });
}

export default {
    csrfTokenMiddleware,
    csrfValidationMiddleware,
    csrfProtection
};
