// Recurring Transaction Prediction Service
// Analyzes transaction history to identify recurring payments and predict upcoming bills

import { supabaseTransactionService } from './supabaseTransactionService';
import { subscriptionService } from './subscriptionService';

export interface RecurringPattern {
    id: string;
    merchant: string;
    amount: number;
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
    averageAmount: number;
    lastDate: string;
    nextPredictedDate: string;
    confidence: number;
    category: string;
    occurrences: number;
    isSubscription: boolean;
}

export interface UpcomingBill {
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    daysUntil: number;
    category: string;
    source: 'subscription' | 'prediction';
    confidence: number;
    isOverdue: boolean;
}

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
}

// Cache for predictions
let predictionsCache: { data: RecurringPattern[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Analyze transactions to find recurring patterns
export async function analyzeRecurringPatterns(userId?: string): Promise<RecurringPattern[]> {
    // Check cache
    if (predictionsCache && Date.now() - predictionsCache.timestamp < CACHE_DURATION) {
        return predictionsCache.data;
    }

    try {
        // Get all transactions
        const transactions = await supabaseTransactionService.getAll(userId || '');
        const expenses = transactions.filter(t => t.type === 'expense');

        // Group by normalized merchant name
        const merchantGroups: Record<string, Transaction[]> = {};

        for (const tx of expenses) {
            const normalizedName = normalizeMerchantName(tx.description);
            if (!merchantGroups[normalizedName]) {
                merchantGroups[normalizedName] = [];
            }
            merchantGroups[normalizedName].push(tx);
        }

        // Analyze each group for patterns
        const patterns: RecurringPattern[] = [];

        for (const [merchant, txList] of Object.entries(merchantGroups)) {
            // Need at least 2 transactions to detect a pattern
            if (txList.length < 2) continue;

            // Sort by date
            const sorted = txList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // Calculate intervals between transactions (in days)
            const intervals: number[] = [];
            for (let i = 1; i < sorted.length; i++) {
                const prevDate = new Date(sorted[i - 1].date);
                const currDate = new Date(sorted[i].date);
                const daysDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff > 0) {
                    intervals.push(daysDiff);
                }
            }

            if (intervals.length === 0) continue;

            // Detect frequency
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const frequency = detectFrequency(avgInterval);

            if (!frequency) continue;

            // Calculate consistency (how regular are the intervals)
            const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
            const stdDev = Math.sqrt(variance);
            const consistency = Math.max(0, 100 - (stdDev / avgInterval) * 100);

            // Only include if reasonably consistent (>50% confidence)
            if (consistency < 50) continue;

            // Calculate average amount
            const avgAmount = sorted.reduce((sum, tx) => sum + tx.amount, 0) / sorted.length;

            // Calculate next predicted date
            const lastTx = sorted[sorted.length - 1];
            const nextDate = predictNextDate(lastTx.date, frequency);

            patterns.push({
                id: `rec_${merchant.replace(/\s+/g, '_').toLowerCase()}`,
                merchant,
                amount: lastTx.amount,
                averageAmount: avgAmount,
                frequency,
                lastDate: lastTx.date,
                nextPredictedDate: nextDate,
                confidence: Math.round(consistency),
                category: lastTx.category || 'Other',
                occurrences: sorted.length,
                isSubscription: isLikelySubscription(merchant, frequency, consistency)
            });
        }

        // Sort by confidence and upcoming date
        patterns.sort((a, b) => {
            const dateA = new Date(a.nextPredictedDate);
            const dateB = new Date(b.nextPredictedDate);
            return dateA.getTime() - dateB.getTime();
        });

        // Cache results
        predictionsCache = { data: patterns, timestamp: Date.now() };

        return patterns;
    } catch (error) {
        console.error('Failed to analyze recurring patterns:', error);
        return [];
    }
}

// Get upcoming bills (combining subscriptions and predictions)
export async function getUpcomingBills(userId?: string, daysAhead: number = 30): Promise<UpcomingBill[]> {
    const bills: UpcomingBill[] = [];
    const today = new Date();
    const cutoffDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    try {
        // Get active subscriptions
        const subscriptions = await subscriptionService.getActive(userId || '');

        for (const sub of subscriptions) {
            const nextPayment = sub.next_payment_date ? new Date(sub.next_payment_date) : null;

            if (nextPayment && nextPayment <= cutoffDate) {
                const daysUntil = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                bills.push({
                    id: sub.id,
                    name: sub.name,
                    amount: sub.price,
                    dueDate: sub.next_payment_date || '',
                    daysUntil,
                    category: sub.category,
                    source: 'subscription',
                    confidence: 100,
                    isOverdue: daysUntil < 0
                });
            }
        }
    } catch (error) {
        console.error('Failed to get subscriptions:', error);
    }

    try {
        // Get predicted recurring transactions
        const patterns = await analyzeRecurringPatterns(userId);

        for (const pattern of patterns) {
            // Skip if already covered by a subscription
            if (bills.some(b => normalizeMerchantName(b.name) === normalizeMerchantName(pattern.merchant))) {
                continue;
            }

            const nextDate = new Date(pattern.nextPredictedDate);

            if (nextDate <= cutoffDate) {
                const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                bills.push({
                    id: pattern.id,
                    name: pattern.merchant,
                    amount: pattern.averageAmount,
                    dueDate: pattern.nextPredictedDate,
                    daysUntil,
                    category: pattern.category,
                    source: 'prediction',
                    confidence: pattern.confidence,
                    isOverdue: daysUntil < 0
                });
            }
        }
    } catch (error) {
        console.error('Failed to get predictions:', error);
    }

    // Sort by due date
    bills.sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return dateA.getTime() - dateB.getTime();
    });

    return bills;
}

// Get bills due in the next N days (for notifications)
export async function getBillsDueSoon(userId?: string, days: number = 7): Promise<UpcomingBill[]> {
    const allBills = await getUpcomingBills(userId, days);
    return allBills.filter(b => b.daysUntil >= 0 && b.daysUntil <= days);
}

// Get high-value upcoming expenses
export async function getHighValueUpcoming(userId?: string, threshold: number = 100): Promise<UpcomingBill[]> {
    const bills = await getUpcomingBills(userId, 30);
    return bills.filter(b => b.amount >= threshold);
}

// Calculate total upcoming expenses
export async function getTotalUpcomingExpenses(userId?: string, days: number = 30): Promise<number> {
    const bills = await getUpcomingBills(userId, days);
    return bills.reduce((sum, b) => sum + b.amount, 0);
}

// Helper: Normalize merchant name for comparison
function normalizeMerchantName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .slice(0, 3) // Take first 3 words
        .join(' ');
}

// Helper: Detect frequency from average interval
function detectFrequency(avgDays: number): RecurringPattern['frequency'] | null {
    if (avgDays >= 5 && avgDays <= 9) return 'weekly';
    if (avgDays >= 12 && avgDays <= 17) return 'biweekly';
    if (avgDays >= 25 && avgDays <= 35) return 'monthly';
    if (avgDays >= 85 && avgDays <= 100) return 'quarterly';
    if (avgDays >= 350 && avgDays <= 380) return 'yearly';
    return null;
}

// Helper: Predict next date based on frequency
function predictNextDate(lastDate: string, frequency: RecurringPattern['frequency']): string {
    const date = new Date(lastDate);

    switch (frequency) {
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'biweekly':
            date.setDate(date.getDate() + 14);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'quarterly':
            date.setMonth(date.getMonth() + 3);
            break;
        case 'yearly':
            date.setFullYear(date.getFullYear() + 1);
            break;
    }

    return date.toISOString().split('T')[0];
}

// Helper: Determine if pattern is likely a subscription
function isLikelySubscription(merchant: string, frequency: RecurringPattern['frequency'], confidence: number): boolean {
    const subscriptionKeywords = [
        'netflix', 'spotify', 'amazon', 'prime', 'hulu', 'disney',
        'apple', 'google', 'microsoft', 'adobe', 'dropbox', 'slack',
        'gym', 'fitness', 'membership', 'subscription', 'premium',
        'youtube', 'twitch', 'patreon', 'medium', 'linkedin'
    ];

    const lowerMerchant = merchant.toLowerCase();
    const hasKeyword = subscriptionKeywords.some(kw => lowerMerchant.includes(kw));

    // High confidence monthly transactions are likely subscriptions
    return hasKeyword || (frequency === 'monthly' && confidence > 80);
}

// Clear cache (call after adding transactions)
export function clearPredictionCache(): void {
    predictionsCache = null;
}

export const recurringPredictionService = {
    analyzeRecurringPatterns,
    getUpcomingBills,
    getBillsDueSoon,
    getHighValueUpcoming,
    getTotalUpcomingExpenses,
    clearPredictionCache
};

export default recurringPredictionService;
