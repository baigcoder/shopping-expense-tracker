// AI Tip Cache Service - Pre-fetches AI insights in background
// Enhanced with local fallback, graceful error handling, and reactive updates
// Uses user's detected currency (PKR, INR, USD, etc.)
// REALTIME: Cache is invalidated via useAIRealtime on any data change

import api from './api';
import { getCurrencySymbol, getCurrencyInfo, formatCurrency } from './currencyService';

// Safe AI call that never throws - uses backend AI
const safeCallAI = async (_type: string, systemPrompt: string, userPrompt: string, _userId?: string): Promise<{ response: string } | null> => {
    try {
        const response = await api.post('/ai/chat', {
            message: `${systemPrompt}\n\n${userPrompt}`,
            context: 'insights'
        });
        return { response: response.data.response };
    } catch (error) {
        console.error('Backend AI call failed:', error);
        return null;
    }
};



interface CachedAiTip {
    tip: string;
    timestamp: number;
    dataHash: string;
    isAI: boolean; // true if from AI, false if local fallback
}

// In-memory cache for AI tips
let cachedTip: CachedAiTip | null = null;
let isFetching = false;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (reduced for faster realtime updates)
const LOCAL_TTL = 3 * 60 * 1000; // 3 minutes for local fallback (shorter)


// Simple hash function for data comparison
const hashData = (data: { monthlyTotal: number; topCategory: string; categoryAmount: number }): string => {
    return `${Math.round(data.monthlyTotal)}-${data.topCategory}-${Math.round(data.categoryAmount)}`;
};

/**
 * Generate smart local tip based on spending data (NO API CALL)
 */
const generateLocalTip = (spendingData: {
    monthlyTotal: number;
    topCategory: string;
    categoryAmount: number;
}): string => {
    const { monthlyTotal, topCategory, categoryAmount } = spendingData;
    const percentage = monthlyTotal > 0 ? Math.round((categoryAmount / monthlyTotal) * 100) : 0;
    const currency = getCurrencyInfo();

    // Smart tips based on actual data patterns
    const tips: string[] = [];

    // High concentration in one category
    if (percentage > 50) {
        tips.push(`🎯 ${topCategory} takes ${percentage}% of your spending! Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.`);
    } else if (percentage > 35) {
        tips.push(`📊 ${topCategory} at ${percentage}% is your biggest expense. Small reductions here = big savings over time!`);
    }

    // Category-specific tips
    const lowerCat = topCategory.toLowerCase();
    if (lowerCat.includes('food') || lowerCat.includes('dining') || lowerCat.includes('restaurant')) {
        tips.push(`🍔 Food tip: Meal prepping 3x/week could save you ${formatCurrency(categoryAmount * 0.3)} monthly!`);
    } else if (lowerCat.includes('shopping') || lowerCat.includes('retail')) {
        tips.push(`🛍️ Shopping tip: Try the 48-hour rule - wait before buying. You'll skip most impulse purchases!`);
    } else if (lowerCat.includes('entertainment') || lowerCat.includes('streaming')) {
        tips.push(`🎬 Entertainment tip: Audit your subscriptions! Most people forget 2-3 unused ones.`);
    } else if (lowerCat.includes('transport') || lowerCat.includes('fuel') || lowerCat.includes('uber')) {
        tips.push(`🚗 Transport tip: Carpooling or combining trips could cut costs by 20-30%.`);
    }

    // Amount-based tips
    if (monthlyTotal > 100000) {
        tips.push(`💡 Pro tip: At your spending level, automating ${formatCurrency(monthlyTotal * 0.1)} to savings first can build wealth fast!`);
    } else if (monthlyTotal > 50000) {
        tips.push(`💰 Quick win: Saving just 10% = ${formatCurrency(monthlyTotal * 0.1)}/month = ${formatCurrency(monthlyTotal * 1.2)}/year!`);
    }

    // Generic helpful tips
    tips.push(`📈 Track daily! Users who log expenses daily save 23% more on average.`);
    tips.push(`🎯 Set a budget for ${topCategory}. Having limits makes decisions easier!`);

    // Return a random tip
    return tips[Math.floor(Math.random() * tips.length)];
};

/**
 * Get cached AI tip if available
 */
export const getCachedAiTip = (): string | null => {
    if (!cachedTip) return null;

    // Check if cache is still valid (shorter TTL for local tips)
    const ttl = cachedTip.isAI ? CACHE_TTL : LOCAL_TTL;
    if (Date.now() - cachedTip.timestamp > ttl) {
        return null;
    }

    return cachedTip.tip;
};

/**
 * Check if an AI tip fetch is currently in progress
 */
export const isAiTipFetching = (): boolean => isFetching;

/**
 * Fetch AI tip in background with graceful fallback
 * NEVER FAILS - always returns a tip (AI or local)
 */
export const fetchAiTipInBackground = async (
    userId: string,
    spendingData: {
        monthlyTotal: number;
        topCategory: string;
        categoryAmount: number;
    }
): Promise<void> => {
    // Don't duplicate requests
    if (isFetching) {
        console.log('🔄 AI tip fetch already in progress');
        return;
    }

    // Check if data has changed
    const newHash = hashData(spendingData);
    if (cachedTip && cachedTip.dataHash === newHash && Date.now() - cachedTip.timestamp < (cachedTip.isAI ? CACHE_TTL : LOCAL_TTL)) {
        console.log('✅ AI tip cache still valid');
        return;
    }

    console.log('🧠 Fetching AI tip in background...');
    isFetching = true;

    try {
        const currency = getCurrencyInfo();
        const systemPrompt = `You are Cashly, a Gen-Z financial advisor. Give ONE specific, actionable tip based on the user's spending. Be casual but helpful. Keep it to 2 sentences max. Use ${currency.symbol} for currency amounts. Add a relevant emoji at the start.`;
        const userPrompt = `My monthly spending: ${currency.symbol}${spendingData.monthlyTotal.toLocaleString()}. Top category: ${spendingData.topCategory} (${currency.symbol}${spendingData.categoryAmount.toLocaleString()}). Give me one personalized tip.`;

        // Use safe call that never throws - pass userId for auth
        const result = await safeCallAI('insights', systemPrompt, userPrompt, userId);

        if (result) {
            cachedTip = {
                tip: result.response,
                timestamp: Date.now(),
                dataHash: newHash,
                isAI: true
            };
            console.log('✅ AI tip cached successfully');
        } else {
            // AI failed, use local fallback
            const localTip = generateLocalTip(spendingData);
            cachedTip = {
                tip: localTip,
                timestamp: Date.now(),
                dataHash: newHash,
                isAI: false
            };
            console.log('✅ Local fallback tip generated');
        }

        // Dispatch event so UI can update
        window.dispatchEvent(new CustomEvent('ai-tip-ready', { detail: { tip: cachedTip.tip, isAI: cachedTip.isAI } }));

    } catch (error) {
        // This should never happen with safeCallAI, but just in case
        console.error('❌ Unexpected error in AI tip fetch:', error);

        // Still provide local fallback
        const localTip = generateLocalTip(spendingData);
        cachedTip = {
            tip: localTip,
            timestamp: Date.now(),
            dataHash: newHash,
            isAI: false
        };
        window.dispatchEvent(new CustomEvent('ai-tip-ready', { detail: { tip: localTip, isAI: false } }));
    } finally {
        isFetching = false;
    }
};

/**
 * Force refresh the AI tip (ignores cache) - with fallback
 */
export const forceRefreshAiTip = async (
    userId: string,
    spendingData: {
        monthlyTotal: number;
        topCategory: string;
        categoryAmount: number;
    }
): Promise<string> => {
    console.log('🔄 Force refreshing AI tip...');
    isFetching = true;

    try {
        const currency = getCurrencyInfo();
        const systemPrompt = `You are Cashly, a Gen-Z financial advisor. Give ONE specific, actionable tip based on the user's spending. Be casual but helpful. Keep it to 2 sentences max. Use ${currency.symbol} for currency amounts. Add a relevant emoji at the start.`;
        const userPrompt = `My monthly spending: ${currency.symbol}${spendingData.monthlyTotal.toLocaleString()}. Top category: ${spendingData.topCategory} (${currency.symbol}${spendingData.categoryAmount.toLocaleString()}). Give me a fresh personalized tip.`;

        const result = await safeCallAI('insights', systemPrompt, userPrompt);
        const newHash = hashData(spendingData);

        if (result) {
            cachedTip = {
                tip: result.response,
                timestamp: Date.now(),
                dataHash: newHash,
                isAI: true
            };
            console.log('✅ AI tip force-refreshed');
            return result.response;
        } else {
            // Fallback to local
            const localTip = generateLocalTip(spendingData);
            cachedTip = {
                tip: localTip,
                timestamp: Date.now(),
                dataHash: newHash,
                isAI: false
            };
            console.log('✅ Local tip generated as fallback');
            return localTip;
        }
    } finally {
        isFetching = false;
    }
};

/**
 * Get immediate tip without async - for initial render
 */
export const getImmediateTip = (spendingData: {
    monthlyTotal: number;
    topCategory: string;
    categoryAmount: number;
}): string => {
    // Return cached if available
    const cached = getCachedAiTip();
    if (cached) return cached;

    // Otherwise generate local tip instantly
    return generateLocalTip(spendingData);
};

/**
 * Clear the AI tip cache
 */
export const clearAiTipCache = (): void => {
    cachedTip = null;
    console.log('🗑️ AI tip cache cleared');
};

/**
 * Notify that data has changed - triggers re-fetch
 */
export const notifyDataChanged = (): void => {
    // Clear cache to force refresh on next request
    if (cachedTip) {
        cachedTip.timestamp = 0; // Mark as expired
    }
    window.dispatchEvent(new CustomEvent('insights-data-changed'));
    console.log('📢 Data change notification dispatched');
};

export default {
    getCachedAiTip,
    isAiTipFetching,
    fetchAiTipInBackground,
    forceRefreshAiTip,
    getImmediateTip,
    clearAiTipCache,
    notifyDataChanged
};
