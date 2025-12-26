// Cloudflare Worker - API Proxy for Cashly Backend
// Deploy at: https://dash.cloudflare.com -> Workers & Pages -> Create

const BACKEND_URL = 'https://shopping-expense-tracker-production.up.railway.app';

// Cache durations (in seconds)
const CACHE_CONFIG = {
    '/api/ai/insights': 300,    // 5 minutes
    '/api/ai/forecast': 600,    // 10 minutes
    '/api/ai/tips': 300,        // 5 minutes
    '/api/health': 60,          // 1 minute
};

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        let path = url.pathname;

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders(request),
            });
        }

        // Add /api prefix if not already present (frontend calls /ai/chat, backend expects /api/ai/chat)
        if (!path.startsWith('/api')) {
            path = '/api' + path;
        }

        // Build backend URL with /api prefix
        const backendUrl = BACKEND_URL + path + url.search;

        // Check cache for GET requests
        if (request.method === 'GET') {
            const cacheKey = new Request(backendUrl, request);
            const cache = caches.default;

            // Check if we have a cached response
            let response = await cache.match(cacheKey);
            if (response) {
                // Add cache hit header
                const headers = new Headers(response.headers);
                headers.set('X-Cache', 'HIT');
                headers.set('X-Powered-By', 'Cloudflare Workers');
                return new Response(response.body, {
                    status: response.status,
                    headers: addCorsHeaders(headers, request),
                });
            }
        }

        // Forward request to Railway backend
        try {
            const response = await fetch(backendUrl, {
                method: request.method,
                headers: {
                    ...Object.fromEntries(request.headers),
                    'Host': new URL(BACKEND_URL).host,
                    'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
                    'X-Real-IP': request.headers.get('CF-Connecting-IP') || '',
                },
                body: request.method !== 'GET' && request.method !== 'HEAD'
                    ? await request.text()
                    : undefined,
            });

            // Clone response for caching
            const responseClone = response.clone();

            // Cache successful GET responses
            if (request.method === 'GET' && response.ok) {
                const cacheDuration = getCacheDuration(path);
                if (cacheDuration > 0) {
                    const cacheKey = new Request(backendUrl, request);
                    const headers = new Headers(response.headers);
                    headers.set('Cache-Control', `public, max-age=${cacheDuration}`);

                    const cachedResponse = new Response(responseClone.body, {
                        status: response.status,
                        headers,
                    });

                    ctx.waitUntil(caches.default.put(cacheKey, cachedResponse));
                }
            }

            // Add CORS and proxy headers
            const headers = new Headers(response.headers);
            headers.set('X-Cache', 'MISS');
            headers.set('X-Powered-By', 'Cloudflare Workers');

            return new Response(response.body, {
                status: response.status,
                headers: addCorsHeaders(headers, request),
            });

        } catch (error) {
            return new Response(JSON.stringify({
                error: 'Backend unavailable',
                message: error.message
            }), {
                status: 502,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders(request),
                },
            });
        }
    },
};

// Get cache duration for path
function getCacheDuration(path) {
    for (const [pattern, duration] of Object.entries(CACHE_CONFIG)) {
        if (path.startsWith(pattern)) {
            return duration;
        }
    }
    return 0; // No caching by default
}

// CORS headers
function corsHeaders(request) {
    const origin = request.headers.get('Origin') || '*';
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    };
}

// Add CORS headers to existing headers
function addCorsHeaders(headers, request) {
    const cors = corsHeaders(request);
    for (const [key, value] of Object.entries(cors)) {
        headers.set(key, value);
    }
    return headers;
}
