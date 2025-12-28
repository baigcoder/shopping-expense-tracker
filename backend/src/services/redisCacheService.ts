// Redis Cloud Cache Service - Persistent caching for AI responses
// Uses ioredis for Redis Cloud connection

import Redis from 'ioredis';

// Initialize Redis client (Redis Cloud)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true
});

// Connection handling
redis.on('connect', () => {
    console.log('🔴 Redis Cloud connected');
});

redis.on('error', (err: Error) => {
    console.error('Redis connection error:', err.message);
});

// Default TTL values (in seconds)
const TTL = {
    INSIGHTS: 5 * 60,      // 5 minutes
    FORECAST: 10 * 60,     // 10 minutes
    RISK_ALERTS: 5 * 60,   // 5 minutes
    USER_DATA: 5 * 60,     // 5 minutes (increased from 2 min to reduce cache misses)
    CHAT_HISTORY: 30 * 60   // 30 minutes
};


// Cache key prefixes
const KEYS = {
    INSIGHTS: 'ai:insights:',
    FORECAST: 'ai:forecast:',
    RISKS: 'ai:risks:',
    USER_CONTEXT: 'user:context:',
    CHAT_HISTORY: 'ai:chat:history:'
};

/**
 * Get cached data
 */
export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const data = await redis.get(key);
        if (data) {
            console.log(`💾 Cache HIT: ${key}`);
            return JSON.parse(data);
        }
        console.log(`📭 Cache MISS: ${key}`);
        return null;
    } catch (error: any) {
        console.error('Redis get error:', error.message);
        return null;
    }
}

/**
 * Set cached data with TTL
 */
export async function setCache(key: string, data: any, ttlSeconds?: number): Promise<boolean> {
    try {
        const ttl = ttlSeconds || TTL.INSIGHTS;
        await redis.setex(key, ttl, JSON.stringify(data));
        console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
        return true;
    } catch (error: any) {
        console.error('Redis set error:', error.message);
        return false;
    }
}

/**
 * Delete cached data
 */
export async function deleteCache(key: string): Promise<boolean> {
    try {
        await redis.del(key);
        console.log(`🗑️ Cache DELETE: ${key}`);
        return true;
    } catch (error: any) {
        console.error('Redis delete error:', error.message);
        return false;
    }
}

/**
 * Invalidate all AI cache for a user
 */
export async function invalidateUserCache(userId: string): Promise<void> {
    try {
        const keys = [
            KEYS.INSIGHTS + userId,
            KEYS.FORECAST + userId,
            KEYS.RISKS + userId,
            KEYS.USER_CONTEXT + userId
        ];
        await Promise.all(keys.map(key => redis.del(key)));
        console.log(`🔄 Invalidated all AI cache for user: ${userId}`);
    } catch (error: any) {
        console.error('Redis invalidation error:', error.message);
    }
}

// ==================== INSIGHTS CACHE ====================

export async function getCachedInsights(userId: string) {
    return getCache(KEYS.INSIGHTS + userId);
}

export async function setCachedInsights(userId: string, insights: any) {
    return setCache(KEYS.INSIGHTS + userId, insights, TTL.INSIGHTS);
}

// ==================== FORECAST CACHE ====================

export async function getCachedForecast(userId: string) {
    return getCache(KEYS.FORECAST + userId);
}

export async function setCachedForecast(userId: string, forecast: any) {
    return setCache(KEYS.FORECAST + userId, forecast, TTL.FORECAST);
}

// ==================== RISK ALERTS CACHE ====================

export async function getCachedRisks(userId: string) {
    return getCache(KEYS.RISKS + userId);
}

export async function setCachedRisks(userId: string, risks: any) {
    return setCache(KEYS.RISKS + userId, risks, TTL.RISK_ALERTS);
}

// ==================== USER CONTEXT CACHE ====================

export async function getCachedUserContext(userId: string) {
    return getCache(KEYS.USER_CONTEXT + userId);
}

export async function setCachedUserContext(userId: string, context: any) {
    return setCache(KEYS.USER_CONTEXT + userId, context, TTL.USER_DATA);
}

// ==================== CHAT HISTORY CACHE ====================

export async function getChatHistory(userId: string): Promise<any[]> {
    const history = await getCache<any[]>(KEYS.CHAT_HISTORY + userId);
    return history || [];
}

export async function appendChatHistory(userId: string, message: { role: string; content: string }): Promise<void> {
    const history = await getChatHistory(userId);
    history.push(message);

    // Keep only last 10 messages for context efficiency
    const trimmedHistory = history.slice(-10);

    await setCache(KEYS.CHAT_HISTORY + userId, trimmedHistory, TTL.CHAT_HISTORY);
}

export async function clearChatHistory(userId: string): Promise<void> {
    await deleteCache(KEYS.CHAT_HISTORY + userId);
}

/**
 * Check Redis connection status
 */
export async function checkConnection(): Promise<boolean> {
    try {
        await redis.ping();
        return true;
    } catch {
        return false;
    }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ connected: boolean; memory?: string }> {
    try {
        const info = await redis.info('memory');
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        return {
            connected: true,
            memory: memoryMatch ? memoryMatch[1].trim() : 'unknown'
        };
    } catch {
        return { connected: false };
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
    getChatHistory,
    appendChatHistory,
    clearChatHistory,
    checkConnection,
    getCacheStats
};
