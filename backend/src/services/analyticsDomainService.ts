import { supabase } from '../config/supabase.js';
import { Money } from '../utils/money.js';

export interface SpendingSummary {
    totalSpent: number;
    transactionCount: number;
    averageTransaction: number;
    thisMonthSpent: number;
    thisMonthCount: number;
    lastMonthSpent: number;
    percentageChange: number;
}

export interface MonthlySpendingItem {
    month: string;
    total: number;
    transactionCount: number;
}

export interface CategorySpendingItem {
    categoryId: string | null;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    total: number;
    transactionCount: number;
    percentage: number;
}

export interface StoreSpendingItem {
    storeName: string;
    total: number;
    transactionCount: number;
}

const DEFAULT_CATEGORY_METADATA: Record<string, { icon: string; color: string }> = {
    shopping: { icon: '🛍️', color: '#ec4899' },
    groceries: { icon: '🛒', color: '#10b981' },
    food: { icon: '🍔', color: '#f59e0b' },
    dining: { icon: '🍽️', color: '#f59e0b' },
    entertainment: { icon: '🎬', color: '#8b5cf6' },
    transport: { icon: '🚗', color: '#3b82f6' },
    utilities: { icon: '⚡', color: '#06b6d4' },
    bills: { icon: '📄', color: '#ef4444' },
    subscriptions: { icon: '🔁', color: '#6366f1' },
    health: { icon: '💊', color: '#14b8a6' },
    travel: { icon: '✈️', color: '#0ea5e9' },
    electronics: { icon: '💻', color: '#6366f1' },
    other: { icon: '📦', color: '#6b7280' },
};

const getCategoryMeta = (categoryName: string) => {
    const key = categoryName.trim().toLowerCase();
    return DEFAULT_CATEGORY_METADATA[key] || { icon: '📦', color: '#6b7280' };
};

const extractStoreName = (tx: any): string => {
    const store = tx.store_name || tx.storeName || tx.merchant_name;
    if (store && String(store).trim()) return String(store).trim();
    const desc = String(tx.description || '').trim();
    if (!desc) return 'Unknown Store';
    return desc.split(/[-|]/)[0].trim() || 'Unknown Store';
};

const toMonthKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

import { createError } from '../middleware/errorHandler.js';

/**
 * Fetch all canonical transactions for a user
 */
async function fetchUserTransactions(userId: string) {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        throw createError(
            `Database query failed for analytics transactions: ${error.message}`,
            503,
            'DATABASE_ERROR'
        );
    }

    return Array.isArray(data) ? data : [];
}

/**
 * Authoritative spending summary calculation with zero floating-point drift
 */
export async function getSpendingSummary(userId: string): Promise<SpendingSummary> {
    const transactions = await fetchUserTransactions(userId);
    const expenseRows = transactions.filter((tx) => tx.type !== 'income');

    const now = new Date();
    const currentMonthKey = toMonthKey(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = toMonthKey(lastMonthDate);

    let allTimeExpenseMoney = Money.zero();
    let thisMonthExpenseMoney = Money.zero();
    let lastMonthExpenseMoney = Money.zero();
    let thisMonthCount = 0;

    for (const tx of expenseRows) {
        const rawAmount = Number(tx.amount || 0);
        if (!Number.isFinite(rawAmount) || rawAmount <= 0) continue;

        const txMoney = Money.fromDecimal(rawAmount);
        allTimeExpenseMoney = allTimeExpenseMoney.add(txMoney);

        const txDate = new Date(tx.date || tx.created_at || now);
        const txMonthKey = toMonthKey(txDate);

        if (txMonthKey === currentMonthKey) {
            thisMonthExpenseMoney = thisMonthExpenseMoney.add(txMoney);
            thisMonthCount++;
        } else if (txMonthKey === lastMonthKey) {
            lastMonthExpenseMoney = lastMonthExpenseMoney.add(txMoney);
        }
    }

    const totalSpent = allTimeExpenseMoney.toDecimal();
    const transactionCount = expenseRows.length;
    const averageTransaction = transactionCount > 0
        ? Money.fromCents(Math.round(allTimeExpenseMoney.cents / transactionCount)).toDecimal()
        : 0;

    const thisMonthSpent = thisMonthExpenseMoney.toDecimal();
    const lastMonthSpent = lastMonthExpenseMoney.toDecimal();

    let percentageChange = 0;
    if (lastMonthSpent > 0) {
        percentageChange = Math.round(((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 10000) / 100;
    }

    return {
        totalSpent,
        transactionCount,
        averageTransaction,
        thisMonthSpent,
        thisMonthCount,
        lastMonthSpent,
        percentageChange,
    };
}

/**
 * Monthly spending aggregation for the last N months
 */
export async function getMonthlySpendingHistory(
    userId: string,
    monthsCount: number = 12
): Promise<MonthlySpendingItem[]> {
    const months = Math.min(36, Math.max(1, monthsCount));
    const transactions = await fetchUserTransactions(userId);
    const expenseRows = transactions.filter((tx) => tx.type !== 'income');

    const now = new Date();
    const monthlyMap = new Map<string, { money: Money; count: number }>();

    // Pre-initialize in chronological order
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = toMonthKey(d);
        monthlyMap.set(key, { money: Money.zero(), count: 0 });
    }

    for (const tx of expenseRows) {
        const rawAmount = Number(tx.amount || 0);
        if (!Number.isFinite(rawAmount) || rawAmount <= 0) continue;

        const txDate = new Date(tx.date || tx.created_at || now);
        const key = toMonthKey(txDate);

        const current = monthlyMap.get(key);
        if (current) {
            current.money = current.money.add(Money.fromDecimal(rawAmount));
            current.count++;
        }
    }

    return Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
            month,
            total: data.money.toDecimal(),
            transactionCount: data.count,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Category spending breakdown with percentage and metadata
 */
export async function getCategorySpendingBreakdown(
    userId: string,
    startDate?: Date,
    endDate?: Date
): Promise<CategorySpendingItem[]> {
    const transactions = await fetchUserTransactions(userId);
    let expenseRows = transactions.filter((tx) => tx.type !== 'income');

    if (startDate) {
        expenseRows = expenseRows.filter((tx) => new Date(tx.date || tx.created_at) >= startDate);
    }
    if (endDate) {
        expenseRows = expenseRows.filter((tx) => new Date(tx.date || tx.created_at) <= endDate);
    }

    const categoryMap = new Map<string, { money: Money; count: number }>();
    let totalAllMoney = Money.zero();

    for (const tx of expenseRows) {
        const rawAmount = Number(tx.amount || 0);
        if (!Number.isFinite(rawAmount) || rawAmount <= 0) continue;

        const category = String(tx.category || 'Other').trim() || 'Other';
        const txMoney = Money.fromDecimal(rawAmount);
        totalAllMoney = totalAllMoney.add(txMoney);

        const current = categoryMap.get(category) || { money: Money.zero(), count: 0 };
        current.money = current.money.add(txMoney);
        current.count++;
        categoryMap.set(category, current);
    }

    const totalCents = totalAllMoney.cents;

    return Array.from(categoryMap.entries())
        .map(([categoryName, data]) => {
            const meta = getCategoryMeta(categoryName);
            const total = data.money.toDecimal();
            const percentage = totalCents > 0
                ? Math.round((data.money.cents / totalCents) * 10000) / 100
                : 0;

            return {
                categoryId: null,
                categoryName,
                categoryIcon: meta.icon,
                categoryColor: meta.color,
                total,
                transactionCount: data.count,
                percentage,
            };
        })
        .sort((a, b) => b.total - a.total);
}

/**
 * Store spending breakdown
 */
export async function getStoreSpendingBreakdown(
    userId: string,
    limit: number = 10
): Promise<StoreSpendingItem[]> {
    const transactions = await fetchUserTransactions(userId);
    const expenseRows = transactions.filter((tx) => tx.type !== 'income');

    const storeMap = new Map<string, { money: Money; count: number }>();

    for (const tx of expenseRows) {
        const rawAmount = Number(tx.amount || 0);
        if (!Number.isFinite(rawAmount) || rawAmount <= 0) continue;

        const store = extractStoreName(tx);
        const txMoney = Money.fromDecimal(rawAmount);

        const current = storeMap.get(store) || { money: Money.zero(), count: 0 };
        current.money = current.money.add(txMoney);
        current.count++;
        storeMap.set(store, current);
    }

    return Array.from(storeMap.entries())
        .map(([storeName, data]) => ({
            storeName,
            total: data.money.toDecimal(),
            transactionCount: data.count,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, Math.max(1, limit));
}
