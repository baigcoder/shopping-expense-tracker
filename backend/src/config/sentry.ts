// Sentry Configuration for Backend
// Initialize this file at the top of server.ts
import * as Sentry from '@sentry/node';
import { Express, Request, Response, NextFunction } from 'express';

const SENTRY_DSN = process.env.SENTRY_DSN;

export const initSentry = (app: Express) => {
    // Only initialize if DSN is provided
    if (!SENTRY_DSN) {
        console.log('Sentry DSN not configured, skipping initialization');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',

        // Performance Monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Only enable in production
        enabled: process.env.NODE_ENV === 'production',

        // Filter out health check endpoints
        beforeSend(event) {
            // Don't send health check errors
            if (event.request?.url?.includes('/health')) {
                return null;
            }
            return event;
        },
    });

    // Setup Express error handler
    Sentry.setupExpressErrorHandler(app);

    console.log('🔍 Sentry initialized for backend error monitoring');
};

// Noop middleware for when Sentry is not configured
const noopMiddleware = (_req: Request, _res: Response, next: NextFunction) => next();

// Setup Sentry request handler (call early in middleware chain)
export const sentryRequestHandler = () => {
    if (!SENTRY_DSN) return noopMiddleware;
    // In Sentry v8, use express integration instead
    return noopMiddleware;
};

// Setup Sentry tracing handler
export const sentryTracingHandler = () => {
    if (!SENTRY_DSN) return noopMiddleware;
    return noopMiddleware;
};

// Setup Sentry error handler (call after all routes)
export const sentryErrorHandler = () => {
    if (!SENTRY_DSN) {
        return (err: Error, _req: Request, res: Response, next: NextFunction) => {
            console.error('Error:', err.message);
            next(err);
        };
    }
    return (err: Error, _req: Request, res: Response, next: NextFunction) => {
        Sentry.captureException(err);
        next(err);
    };
};

// Export Sentry for manual error reporting
export { Sentry };

// Helper to capture errors with extra context
export const captureError = (error: Error, context?: Record<string, unknown>) => {
    if (SENTRY_DSN) {
        Sentry.captureException(error, {
            extra: context,
        });
    } else {
        console.error('Error:', error.message, context);
    }
};

// Helper to set user context
export const setUserContext = (userId: string, email?: string) => {
    Sentry.setUser({
        id: userId,
        email,
    });
};

// Helper to clear user context
export const clearUserContext = () => {
    Sentry.setUser(null);
};
