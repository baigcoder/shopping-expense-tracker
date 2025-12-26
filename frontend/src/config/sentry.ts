// Sentry Configuration for Frontend
// Initialize this file in main.tsx before any other imports
import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const initSentry = () => {
    // Only initialize in production or if DSN is provided
    if (!SENTRY_DSN) {
        console.log('Sentry DSN not configured, skipping initialization');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.MODE,

        // Integrations
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
            }),
        ],

        // Performance Monitoring
        tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

        // Session Replay
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

        // Only send errors in production
        enabled: import.meta.env.MODE === 'production',

        // Filter out common non-actionable errors
        beforeSend(event) {
            // Don't send ResizeObserver errors (common browser noise)
            if (event.message?.includes('ResizeObserver')) {
                return null;
            }

            // Don't send chunk load errors (usually network issues)
            if (event.message?.includes('Loading chunk')) {
                return null;
            }

            return event;
        },

        // Don't report errors from extensions or third-party scripts
        denyUrls: [
            /extensions\//i,
            /^chrome:\/\//i,
            /^chrome-extension:\/\//i,
        ],
    });

    console.log('🔍 Sentry initialized for error monitoring');
};

// Export Sentry for use in error boundaries and manual error reporting
export { Sentry };

// Helper to capture errors with extra context
export const captureError = (error: Error, context?: Record<string, unknown>) => {
    Sentry.captureException(error, {
        extra: context,
    });
};

// Helper to set user context
export const setUserContext = (userId: string, email?: string) => {
    Sentry.setUser({
        id: userId,
        email,
    });
};

// Helper to clear user context on logout
export const clearUserContext = () => {
    Sentry.setUser(null);
};

// Export ErrorBoundary component from Sentry
export const SentryErrorBoundary = Sentry.ErrorBoundary;
