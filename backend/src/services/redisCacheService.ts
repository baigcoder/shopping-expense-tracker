// Redis Cloud Cache Service - Persistent caching for AI responses
// With in-memory fallback for local development or when Redis is down

import Redis from 'ioredis';

// In-memory fallback storage
const localCache: Record<string, { data: string; expires: number }> = {};
const localHistory: Record<string, any[]> = {};

// Initialize Redis client (Redis Cloud)
let isRedisConnected = false;
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    connectTimeout: 5000,
    retryStrategy: (times) => {
        if (times > 3) return null; // stop retrying after 3 times
        return Math.min(times * 100, 2000);
    }
});

// Connection handling
redis.on('connect', () => {
    console.log('🔴 Redis Cloud connected');
    isRedisConnected = true;
});

redis.on('error', (err: Error) => {
    // Only log once to avoid flooding logs
    if (isRedisConnected) {
        console.error('Redis connection lost:', err.message);
        isRedisConnected = false;
    }
});

// Default TTL values (in seconds)
const TTL = {
    INSIGHTS: 5 * 60,      // 5 minutes
    FORECAST: 10 * 60,     // 10 minutes
    RISK_ALERTS: 5 * 60,   // 5 minutes
    USER_DATA: 60,         // 1 minute
    USER_SNAPSHOT: 60,     // 1 minute
    CHAT_HISTORY: 30 * 60   // 30 minutes
};

// Cache key prefixes
const KEYS = {
    INSIGHTS: 'ai:insights:',
    FORECAST: 'ai:forecast:',
    RISKS: 'ai:risks:',
    USER_CONTEXT: 'user:context:',
    USER_SNAPSHOT: 'user:snapshot:',
    CHAT_HISTORY: 'ai:chat:history:'
};

/**
 * Get cached data with fallback
 */
export async function getCache<T>(key: string): Promise<T | null> {
    try {
        if (isRedisConnected) {
            const data = await redis.get(key);
            if (data) return JSON.parse(data);
        } else {
            const entry = localCache[key];
            if (entry && entry.expires > Date.now()) {
                return JSON.parse(entry.data);
            } else if (entry) {
                delete localCache[key];
            }
        }
        return null;
    } catch (error: any) {
        return null;
    }
}

/**
 * Set cached data with TTL and fallback
 */
export async function setCache(key: string, data: any, ttlSeconds?: number): Promise<boolean> {
    try {
        const ttl = ttlSeconds || TTL.INSIGHTS;
        const serialized = JSON.stringify(data);

        if (isRedisConnected) {
            await redis.setex(key, ttl, serialized);
        }

        // Always update local cache as immediate fallback
        localCache[key] = {
            data: serialized,
            expires: Date.now() + (ttl * 1000)
        };

        return true;
    } catch (error: any) {
        return false;
    }
}

/**
 * Delete cached data
 */
export async function deleteCache(key: string): Promise<boolean> {
    try {
        if (isRedisConnected) {
            await redis.del(key);
        }
        delete localCache[key];
        return true;
    } catch (error: any) {
        return false;
    }
}

/**
 * Invalidate all AI cache for a user
 */
export async function invalidateUserCache(userId: string): Promise<void> {
    try {
        const prefixes = [KEYS.INSIGHTS, KEYS.FORECAST, KEYS.RISKS, KEYS.USER_CONTEXT, KEYS.USER_SNAPSHOT];
        for (const prefix of prefixes) {
            const key = prefix + userId;
            if (isRedisConnected) await redis.del(key);
            delete localCache[key];
        }
    } catch (error: any) {}
}

// ==================== INSIGHTS CACHE ====================
export async function getCachedInsights(userId: string) { return getCache(KEYS.INSIGHTS + userId); }
export async function setCachedInsights(userId: string, insights: any) { return setCache(KEYS.INSIGHTS + userId, insights, TTL.INSIGHTS); }

// ==================== FORECAST CACHE ====================
export async function getCachedForecast(userId: string) { return getCache(KEYS.FORECAST + userId); }
export async function setCachedForecast(userId: string, forecast: any) { return setCache(KEYS.FORECAST + userId, forecast, TTL.FORECAST); }

// ==================== RISK ALERTS CACHE ====================
export async function getCachedRisks(userId: string) { return getCache(KEYS.RISKS + userId); }
export async function setCachedRisks(userId: string, risks: any) { return setCache(KEYS.RISKS + userId, risks, TTL.RISK_ALERTS); }

// ==================== USER CONTEXT CACHE ====================
export async function getCachedUserContext(userId: string) { return getCache(KEYS.USER_CONTEXT + userId); }
export async function setCachedUserContext(userId: string, context: any) { return setCache(KEYS.USER_CONTEXT + userId, context, TTL.USER_DATA); }
export async function getCachedUserSnapshot(userId: string) { return getCache(KEYS.USER_SNAPSHOT + userId); }
export async function setCachedUserSnapshot(userId: string, snapshot: any) { return setCache(KEYS.USER_SNAPSHOT + userId, snapshot, TTL.USER_SNAPSHOT); }

// ==================== CHAT HISTORY CACHE ====================
export async function getChatHistory(userId: string): Promise<any[]> {
    const key = KEYS.CHAT_HISTORY + userId;
    if (isRedisConnected) {
        const history = await getCache<any[]>(key);
        return history || [];
    }
    return localHistory[userId] || [];
}

export async function appendChatHistory(userId: string, message: { role: string; content: string }): Promise<void> {
    const key = KEYS.CHAT_HISTORY + userId;
    const history = await getChatHistory(userId);
    history.push(message);

    // Keep only last 10 messages
    const trimmedHistory = history.slice(-10);

    if (isRedisConnected) {
        await setCache(key, trimmedHistory, TTL.CHAT_HISTORY);
    }
    localHistory[userId] = trimmedHistory;
}

export async function clearChatHistory(userId: string): Promise<void> {
    const key = KEYS.CHAT_HISTORY + userId;
    if (isRedisConnected) await deleteCache(key);
    delete localHistory[userId];
}

/**
 * Check Redis connection status
 */
export async function checkConnection(): Promise<boolean> {
    if (!isRedisConnected) return false;
    try {
        await redis.ping();
        return true;
    } catch {
        isRedisConnected = false;
        return false;
    }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ connected: boolean; memory?: string }> {
    if (!isRedisConnected) return { connected: false, memory: 'using in-memory fallback' };
    try {
        const info = await redis.info('memory');
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        return {
            connected: true,
            memory: memoryMatch ? memoryMatch[1].trim() : 'unknown'
        };
    } catch {
        return { connected: false, memory: 'using in-memory fallback' };
    }
}

export default {
    getCache,
    setCache,
    deleteCache,
    invalidateUserCache,
    getCachedInsights,
    setCachedInsights,
    getCachedForecast,
    setCachedForecast,
    getCachedRisks,
    setCachedRisks,
    getCachedUserContext,
    setCachedUserContext,
    getCachedUserSnapshot,
    setCachedUserSnapshot,
    getChatHistory,
    appendChatHistory,
    clearChatHistory,
    checkConnection,
    getCacheStats
};
