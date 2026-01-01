// Cache Control Middleware - Sets appropriate HTTP caching headers
import { Request, Response, NextFunction } from 'express';

/**
 * Cache control middleware for API responses
 * Different caching strategies based on route type
 */
export const cacheControl = (type: 'static' | 'dynamic' | 'private' | 'none' = 'private') => {
    return (_req: Request, res: Response, next: NextFunction): void => {
        switch (type) {
            case 'static':
                // Long cache for static/rarely changing data (categories, user preferences)
                res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
                break;
            case 'dynamic':
                // Short cache for frequently updating data (dashboard stats)
                res.setHeader('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
                break;
            case 'private':
                // User-specific data that can be cached in browser only
                res.setHeader('Cache-Control', 'private, max-age=300, must-revalidate');
                break;
            case 'none':
                // No caching (mutations, sensitive data)
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                break;
        }
        next();
    };
};

/**
 * ETag support for conditional requests
 * Reduces bandwidth by returning 304 Not Modified when possible
 */
export const etagSupport = (req: Request, res: Response, next: NextFunction): void => {
    // Enable weak ETags for dynamic content
    res.setHeader('ETag', `W/"${Date.now().toString(36)}"`);

    const clientEtag = req.headers['if-none-match'];
    const serverEtag = res.getHeader('ETag');

    if (clientEtag && serverEtag && clientEtag === serverEtag) {
        res.status(304).end();
        return;
    }

    next();
};

export default { cacheControl, etagSupport };
