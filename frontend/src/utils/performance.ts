// Performance & Caching Utilities
// Optimized caching, memoization, and performance helpers

// =================================
// MEMORY CACHE (In-Memory with TTL)
// =================================

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

class MemoryCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private maxSize: number;

    constructor(maxSize: number = 100) {
        this.maxSize = maxSize;
    }

    set<T>(key: string, value: T, ttlSeconds: number = 300): void {
        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            data: value,
            expiry: Date.now() + ttlSeconds * 1000,
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    // Clear expired entries
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

export const appCache = new MemoryCache(200);

// =================================
// REQUEST DEDUPLICATION
// =================================

const pendingRequests: Map<string, Promise<any>> = new Map();

export async function dedupedFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    cacheTtl: number = 60
): Promise<T> {
    // Check cache first
    const cached = appCache.get<T>(key);
    if (cached) return cached;

    // Check if request is already pending
    if (pendingRequests.has(key)) {
        return pendingRequests.get(key) as Promise<T>;
    }

    // Make new request
    const promise = fetchFn()
        .then(data => {
            appCache.set(key, data, cacheTtl);
            pendingRequests.delete(key);
            return data;
        })
        .catch(error => {
            pendingRequests.delete(key);
            throw error;
        });

    pendingRequests.set(key, promise);
    return promise;
}

// =================================
// DEBOUNCE & THROTTLE
// =================================

export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return function (...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return function (...args: Parameters<T>) {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// =================================
// LAZY LOADING HELPERS
// =================================

export function lazyWithRetry<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    retries: number = 3,
    retryDelay: number = 1000
): React.LazyExoticComponent<T> {
    return React.lazy(async () => {
        for (let i = 0; i < retries; i++) {
            try {
                return await importFn();
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
        throw new Error('Failed to load component');
    });
}

// Preload component
export function preloadComponent(
    importFn: () => Promise<any>
): void {
    importFn().catch(() => { }); // Silently preload
}

// =================================
// IMAGE OPTIMIZATION
// =================================

export function getOptimizedImageUrl(
    url: string,
    width?: number,
    quality: number = 80
): string {
    // If it's a local image or data URL, return as-is
    if (url.startsWith('data:') || url.startsWith('/')) {
        return url;
    }

    // For external images, you could use an image proxy
    // For now, return as-is
    return url;
}

// Lazy load images
export function lazyLoadImage(
    imgElement: HTMLImageElement,
    src: string
): void {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    imgElement.src = src;
                    observer.unobserve(imgElement);
                }
            });
        });
        observer.observe(imgElement);
    } else {
        imgElement.src = src;
    }
}

// =================================
// BUNDLE ANALYSIS HELPERS
// =================================

export function measureRenderTime(componentName: string): () => void {
    const startTime = performance.now();

    return () => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        if (process.env.NODE_ENV === 'development') {
            console.log(`[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`);
        }
    };
}

// Web Vitals reporting
export function reportWebVitals(metric: any): void {
    if (process.env.NODE_ENV === 'development') {
        console.log('[Web Vitals]', metric);
    }
    // In production, send to analytics
}

// =================================
// REACT QUERY CONFIG
// =================================

export const queryClientConfig = {
    defaultOptions: {
        queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 30 minutes
            cacheTime: 30 * 60 * 1000,
            // Retry failed requests 2 times
            retry: 2,
            // Don't refetch on window focus by default
            refetchOnWindowFocus: false,
            // Refetch on reconnect
            refetchOnReconnect: true,
        },
        mutations: {
            retry: 1,
        },
    },
};

// =================================
// NETWORK STATUS
// =================================

export function getNetworkStatus(): 'online' | 'offline' | 'slow' {
    if (!navigator.onLine) return 'offline';

    // Check connection type if available
    const connection = (navigator as any).connection;
    if (connection) {
        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
            return 'slow';
        }
    }

    return 'online';
}

// Listen for network changes
export function onNetworkChange(callback: (status: 'online' | 'offline') => void): () => void {
    const handleOnline = () => callback('online');
    const handleOffline = () => callback('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}

import React from 'react';

export default {
    appCache,
    dedupedFetch,
    debounce,
    throttle,
    lazyWithRetry,
    preloadComponent,
    getOptimizedImageUrl,
    measureRenderTime,
    reportWebVitals,
    queryClientConfig,
    getNetworkStatus,
    onNetworkChange,
};
