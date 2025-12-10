// Enhanced Insights Service - Comprehensive spending analysis
// Real-time, accurate, and dynamic calculations for users

import { supabase } from '../config/supabase';

export interface Transaction {
    id: string;
    date: string;
    amount: number;
    category: string;
    description: string;
    type: 'income' | 'expense';
    merchant?: string;
}

export interface Budget {
    id: string;
    category: string;
    amount: number;
    period: string;
}

export interface Goal {
    id: string;
    name: string;
    target: number;
    saved: number;
    deadline?: string;
}

// =====================================================
// FINANCIAL HEALTH SCORE (0-100)
// =====================================================
export interface HealthScore {
    overall: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    factors: {
        name: string;
        score: number;
        maxScore: number;
        status: 'excellent' | 'good' | 'fair' | 'poor';
        tip: string;
    }[];
}

export const calculateHealthScore = (
    transactions: Transaction[],
    budgets: Budget[],
    goals: Goal[]
): HealthScore => {
    const factors: HealthScore['factors'] = [];
    let totalScore = 0;
    const maxTotal = 100;

    // Get current month data
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    const getMonthKey = (date: string) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const currentMonthTxs = transactions.filter(t => getMonthKey(t.date) === currentMonth);
    const lastMonthTxs = transactions.filter(t => getMonthKey(t.date) === lastMonthKey);

    const currentIncome = currentMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const currentExpenses = currentMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    const lastMonthExpenses = lastMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);

    // 1. Savings Rate (25 points)
    const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0;
    let savingsScore = 0;
    let savingsStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (savingsRate >= 20) { savingsScore = 25; savingsStatus = 'excellent'; }
    else if (savingsRate >= 10) { savingsScore = 20; savingsStatus = 'good'; }
    else if (savingsRate >= 5) { savingsScore = 12; savingsStatus = 'fair'; }
    else if (savingsRate > 0) { savingsScore = 5; savingsStatus = 'fair'; }
    else { savingsScore = 0; savingsStatus = 'poor'; }

    factors.push({
        name: 'Savings Rate',
        score: savingsScore,
        maxScore: 25,
        status: savingsStatus,
        tip: savingsRate < 10 ? 'Try to save at least 10-20% of income' : 'Great savings habit!'
    });
    totalScore += savingsScore;

    // 2. Budget Adherence (25 points)
    let budgetScore = 0;
    let budgetStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
    if (budgets.length > 0) {
        const categorySpending = new Map<string, number>();
        currentMonthTxs.filter(t => t.type === 'expense').forEach(t => {
            categorySpending.set(t.category, (categorySpending.get(t.category) || 0) + Math.abs(t.amount));
        });

        let underBudget = 0;
        let overBudget = 0;
        budgets.forEach(b => {
            const spent = categorySpending.get(b.category) || 0;
            if (spent <= b.amount) underBudget++;
            else overBudget++;
        });

        const adherenceRate = budgets.length > 0 ? (underBudget / budgets.length) * 100 : 50;
        if (adherenceRate >= 90) { budgetScore = 25; budgetStatus = 'excellent'; }
        else if (adherenceRate >= 70) { budgetScore = 20; budgetStatus = 'good'; }
        else if (adherenceRate >= 50) { budgetScore = 12; budgetStatus = 'fair'; }
        else { budgetScore = 5; budgetStatus = 'poor'; }
    } else {
        budgetScore = 10; // Neutral if no budgets set
        budgetStatus = 'fair';
    }

    factors.push({
        name: 'Budget Adherence',
        score: budgetScore,
        maxScore: 25,
        status: budgetStatus,
        tip: budgets.length === 0 ? 'Set budgets to track spending better' : budgetStatus === 'poor' ? 'Try to stay within budget limits' : 'Budget discipline is strong!'
    });
    totalScore += budgetScore;

    // 3. Spending Trend (20 points)
    let trendScore = 0;
    let trendStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
    if (lastMonthExpenses > 0) {
        const changePercent = ((currentExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
        if (changePercent <= -10) { trendScore = 20; trendStatus = 'excellent'; }
        else if (changePercent <= 0) { trendScore = 16; trendStatus = 'good'; }
        else if (changePercent <= 10) { trendScore = 10; trendStatus = 'fair'; }
        else { trendScore = 4; trendStatus = 'poor'; }
    } else {
        trendScore = 10;
    }

    factors.push({
        name: 'Spending Trend',
        score: trendScore,
        maxScore: 20,
        status: trendStatus,
        tip: trendStatus === 'poor' ? 'Spending increased significantly - review expenses' : 'Spending is under control'
    });
    totalScore += trendScore;

    // 4. Tracking Consistency (15 points)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const uniqueDays = new Set(currentMonthTxs.map(t => new Date(t.date).getDate())).size;
    const trackingRate = (uniqueDays / Math.min(now.getDate(), daysInMonth)) * 100;

    let trackingScore = 0;
    let trackingStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
    if (trackingRate >= 70) { trackingScore = 15; trackingStatus = 'excellent'; }
    else if (trackingRate >= 50) { trackingScore = 11; trackingStatus = 'good'; }
    else if (trackingRate >= 30) { trackingScore = 7; trackingStatus = 'fair'; }
    else { trackingScore = 3; trackingStatus = 'poor'; }

    factors.push({
        name: 'Tracking Consistency',
        score: trackingScore,
        maxScore: 15,
        status: trackingStatus,
        tip: trackingStatus === 'poor' ? 'Log transactions daily for better insights' : 'Consistent tracking habit!'
    });
    totalScore += trackingScore;

    // 5. Goal Progress (15 points)
    let goalScore = 0;
    let goalStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
    if (goals.length > 0) {
        const avgProgress = goals.reduce((sum, g) => sum + ((g.saved || 0) / (g.target || 1)) * 100, 0) / goals.length;
        if (avgProgress >= 75) { goalScore = 15; goalStatus = 'excellent'; }
        else if (avgProgress >= 50) { goalScore = 11; goalStatus = 'good'; }
        else if (avgProgress >= 25) { goalScore = 7; goalStatus = 'fair'; }
        else { goalScore = 3; goalStatus = 'poor'; }
    } else {
        goalScore = 8;
    }

    factors.push({
        name: 'Goal Progress',
        score: goalScore,
        maxScore: 15,
        status: goalStatus,
        tip: goals.length === 0 ? 'Set savings goals to stay motivated' : goalStatus === 'excellent' ? 'Amazing goal progress!' : 'Keep contributing to your goals'
    });
    totalScore += goalScore;

    // Calculate grade
    let grade: HealthScore['grade'];
    if (totalScore >= 90) grade = 'A+';
    else if (totalScore >= 80) grade = 'A';
    else if (totalScore >= 70) grade = 'B';
    else if (totalScore >= 60) grade = 'C';
    else if (totalScore >= 50) grade = 'D';
    else grade = 'F';

    return { overall: totalScore, grade, factors };
};

// =====================================================
// ANOMALY DETECTION
// =====================================================
export interface Anomaly {
    id: string;
    type: 'spike' | 'unusual_merchant' | 'unusual_time' | 'large_transaction';
    severity: 'high' | 'medium' | 'low';
    category: string;
    amount: number;
    expected: number;
    description: string;
    date: string;
    transaction?: Transaction;
}

export const detectAnomalies = (transactions: Transaction[]): Anomaly[] => {
    const anomalies: Anomaly[] = [];
    const expenses = transactions.filter(t => t.type === 'expense');

    if (expenses.length < 5) return []; // Need more data

    // Calculate category averages and std dev
    const categoryStats = new Map<string, { mean: number; stdDev: number; count: number }>();
    const categoryAmounts = new Map<string, number[]>();

    expenses.forEach(t => {
        const amounts = categoryAmounts.get(t.category) || [];
        amounts.push(Math.abs(t.amount));
        categoryAmounts.set(t.category, amounts);
    });

    categoryAmounts.forEach((amounts, category) => {
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        categoryStats.set(category, { mean, stdDev, count: amounts.length });
    });

    // Detect anomalies in recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTxs = expenses.filter(t => new Date(t.date) >= thirtyDaysAgo);

    recentTxs.forEach((t, i) => {
        const stats = categoryStats.get(t.category);
        if (!stats || stats.count < 3) return;

        const amount = Math.abs(t.amount);
        const zScore = (amount - stats.mean) / (stats.stdDev || 1);

        // Flag if more than 2 standard deviations from mean
        if (zScore > 2) {
            let severity: Anomaly['severity'] = 'low';
            if (zScore > 3) severity = 'high';
            else if (zScore > 2.5) severity = 'medium';

            anomalies.push({
                id: `anomaly-${i}`,
                type: 'spike',
                severity,
                category: t.category,
                amount,
                expected: stats.mean,
                description: `${t.category} spending was ${(zScore).toFixed(1)}x higher than usual`,
                date: t.date,
                transaction: t
            });
        }

        // Large transaction detection (over $500 or 3x category average)
        if (amount > 500 || amount > stats.mean * 3) {
            if (!anomalies.find(a => a.transaction?.id === t.id)) {
                anomalies.push({
                    id: `large-${i}`,
                    type: 'large_transaction',
                    severity: amount > 1000 ? 'high' : 'medium',
                    category: t.category,
                    amount,
                    expected: stats.mean,
                    description: `Large ${t.category} expense: ${t.description || 'Unknown'}`,
                    date: t.date,
                    transaction: t
                });
            }
        }
    });

    // Sort by severity
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]).slice(0, 10);
};

// =====================================================
// CATEGORY TRENDS
// =====================================================
export interface CategoryTrend {
    category: string;
    currentMonth: number;
    lastMonth: number;
    twoMonthsAgo: number;
    threeMonthsAgo: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
    color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
    'Food': '#EF4444',
    'Shopping': '#F59E0B',
    'Transport': '#3B82F6',
    'Entertainment': '#8B5CF6',
    'Utilities': '#10B981',
    'Healthcare': '#EC4899',
    'Education': '#06B6D4',
    'Other': '#6B7280'
};

export const calculateCategoryTrends = (transactions: Transaction[]): CategoryTrend[] => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const now = new Date();

    const getMonthKey = (monthsAgo: number) => {
        const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const months = [0, 1, 2, 3].map(getMonthKey);

    // Calculate spending per category per month
    const categoryMonthSpending = new Map<string, Map<string, number>>();

    expenses.forEach(t => {
        const d = new Date(t.date);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        if (!categoryMonthSpending.has(t.category)) {
            categoryMonthSpending.set(t.category, new Map());
        }
        const catMap = categoryMonthSpending.get(t.category)!;
        catMap.set(monthKey, (catMap.get(monthKey) || 0) + Math.abs(t.amount));
    });

    const trends: CategoryTrend[] = [];

    categoryMonthSpending.forEach((monthMap, category) => {
        const current = monthMap.get(months[0]) || 0;
        const last = monthMap.get(months[1]) || 0;
        const twoAgo = monthMap.get(months[2]) || 0;
        const threeAgo = monthMap.get(months[3]) || 0;

        const changePercent = last > 0 ? ((current - last) / last) * 100 : 0;

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (changePercent > 10) trend = 'up';
        else if (changePercent < -10) trend = 'down';

        trends.push({
            category,
            currentMonth: current,
            lastMonth: last,
            twoMonthsAgo: twoAgo,
            threeMonthsAgo: threeAgo,
            trend,
            changePercent,
            color: CATEGORY_COLORS[category] || '#6B7280'
        });
    });

    return trends.sort((a, b) => b.currentMonth - a.currentMonth);
};

// =====================================================
// SPENDING VELOCITY
// =====================================================
export interface SpendingVelocity {
    dailyRate: number;
    weeklyRate: number;
    projectedMonthEnd: number;
    daysUntilBudgetDepleted: number | null;
    burnRate: 'fast' | 'moderate' | 'slow';
    suggestion: string;
}

export const calculateSpendingVelocity = (
    transactions: Transaction[],
    monthlyBudget?: number
): SpendingVelocity => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    const currentMonthExpenses = transactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const dailyRate = dayOfMonth > 0 ? currentMonthExpenses / dayOfMonth : 0;
    const weeklyRate = dailyRate * 7;
    const projectedMonthEnd = currentMonthExpenses + (dailyRate * daysRemaining);

    let daysUntilBudgetDepleted: number | null = null;
    if (monthlyBudget && dailyRate > 0) {
        const remainingBudget = monthlyBudget - currentMonthExpenses;
        daysUntilBudgetDepleted = remainingBudget > 0 ? Math.floor(remainingBudget / dailyRate) : 0;
    }

    let burnRate: SpendingVelocity['burnRate'] = 'moderate';
    const expectedDailyRate = monthlyBudget ? monthlyBudget / daysInMonth : dailyRate;
    const velocityRatio = dailyRate / expectedDailyRate;

    if (velocityRatio > 1.3) burnRate = 'fast';
    else if (velocityRatio < 0.8) burnRate = 'slow';

    let suggestion = '';
    if (burnRate === 'fast') {
        suggestion = `Slow down! At this rate, you'll exceed budget by ${Math.round((projectedMonthEnd - (monthlyBudget || projectedMonthEnd)) / 100) * 100}`;
    } else if (burnRate === 'slow') {
        suggestion = 'Great pace! You might have extra savings this month';
    } else {
        suggestion = 'On track with your spending';
    }

    return {
        dailyRate,
        weeklyRate,
        projectedMonthEnd,
        daysUntilBudgetDepleted,
        burnRate,
        suggestion
    };
};

// =====================================================
// DAY-OF-WEEK ANALYSIS
// =====================================================
export interface DayOfWeekAnalysis {
    dayName: string;
    dayIndex: number;
    totalSpent: number;
    avgSpent: number;
    transactionCount: number;
    percentage: number;
    isHighest: boolean;
    isLowest: boolean;
}

export const analyzeDayOfWeek = (transactions: Transaction[]): DayOfWeekAnalysis[] => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const dayStats = Array(7).fill(null).map(() => ({ total: 0, count: 0, days: new Set<string>() }));

    expenses.forEach(t => {
        const d = new Date(t.date);
        const dayIndex = d.getDay();
        dayStats[dayIndex].total += Math.abs(t.amount);
        dayStats[dayIndex].count++;
        dayStats[dayIndex].days.add(t.date);
    });

    const totalSpent = dayStats.reduce((sum, d) => sum + d.total, 0);

    const results: DayOfWeekAnalysis[] = dayStats.map((stat, i) => ({
        dayName: dayNames[i],
        dayIndex: i,
        totalSpent: stat.total,
        avgSpent: stat.days.size > 0 ? stat.total / stat.days.size : 0,
        transactionCount: stat.count,
        percentage: totalSpent > 0 ? (stat.total / totalSpent) * 100 : 0,
        isHighest: false,
        isLowest: false
    }));

    // Mark highest and lowest
    const sortedByTotal = [...results].sort((a, b) => b.totalSpent - a.totalSpent);
    if (sortedByTotal[0]) sortedByTotal[0].isHighest = true;
    if (sortedByTotal[sortedByTotal.length - 1]) sortedByTotal[sortedByTotal.length - 1].isLowest = true;

    return results;
};

// =====================================================
// MERCHANT ANALYSIS
// =====================================================
export interface MerchantAnalysis {
    merchant: string;
    totalSpent: number;
    transactionCount: number;
    avgTransaction: number;
    lastTransaction: string;
    category: string;
    isRecurring: boolean;
}

export const analyzeMerchants = (transactions: Transaction[]): MerchantAnalysis[] => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const merchantMap = new Map<string, {
        total: number;
        count: number;
        dates: string[];
        category: string;
    }>();

    expenses.forEach(t => {
        const merchant = t.merchant || t.description || 'Unknown';
        const existing = merchantMap.get(merchant) || { total: 0, count: 0, dates: [], category: t.category };
        existing.total += Math.abs(t.amount);
        existing.count++;
        existing.dates.push(t.date);
        merchantMap.set(merchant, existing);
    });

    const results: MerchantAnalysis[] = [];

    merchantMap.forEach((data, merchant) => {
        // Check if recurring (multiple transactions, similar intervals)
        const sortedDates = data.dates.sort();
        let isRecurring = false;
        if (sortedDates.length >= 2) {
            const intervals: number[] = [];
            for (let i = 1; i < sortedDates.length; i++) {
                const diff = (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime()) / (1000 * 60 * 60 * 24);
                intervals.push(diff);
            }
            // Check if intervals are similar (within 5 days of each other)
            if (intervals.length >= 1) {
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
                isRecurring = variance < 25 && avgInterval <= 35; // Low variance and monthly-ish
            }
        }

        results.push({
            merchant,
            totalSpent: data.total,
            transactionCount: data.count,
            avgTransaction: data.total / data.count,
            lastTransaction: sortedDates[sortedDates.length - 1],
            category: data.category,
            isRecurring
        });
    });

    return results.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 15);
};

// =====================================================
// RECURRING TRANSACTION DETECTION
// =====================================================
export interface RecurringTransaction {
    merchant: string;
    amount: number;
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    nextExpected: string;
    category: string;
    confidence: number;
}

export const detectRecurringTransactions = (transactions: Transaction[]): RecurringTransaction[] => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const merchantGroups = new Map<string, Transaction[]>();

    expenses.forEach(t => {
        const key = `${t.merchant || t.description}-${Math.round(Math.abs(t.amount) / 5) * 5}`; // Group by merchant and similar amount
        const group = merchantGroups.get(key) || [];
        group.push(t);
        merchantGroups.set(key, group);
    });

    const recurring: RecurringTransaction[] = [];

    merchantGroups.forEach((txs, key) => {
        if (txs.length < 2) return;

        const sortedDates = txs.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
        const intervals: number[] = [];

        for (let i = 1; i < sortedDates.length; i++) {
            const diff = (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
            intervals.push(diff);
        }

        if (intervals.length === 0) return;

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);

        // Only flag as recurring if intervals are consistent
        if (stdDev > avgInterval * 0.3) return; // Too much variance

        let frequency: RecurringTransaction['frequency'];
        if (avgInterval <= 10) frequency = 'weekly';
        else if (avgInterval <= 35) frequency = 'monthly';
        else if (avgInterval <= 100) frequency = 'quarterly';
        else frequency = 'yearly';

        const lastDate = sortedDates[sortedDates.length - 1];
        const nextExpected = new Date(lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);

        const avgAmount = txs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / txs.length;
        const confidence = Math.min(0.95, 0.5 + (txs.length * 0.1) + (1 - stdDev / avgInterval) * 0.3);

        recurring.push({
            merchant: txs[0].merchant || txs[0].description || 'Unknown',
            amount: avgAmount,
            frequency,
            nextExpected: nextExpected.toISOString().split('T')[0],
            category: txs[0].category,
            confidence
        });
    });

    return recurring.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
};

// =====================================================
// BUDGET VS ACTUAL
// =====================================================
export interface BudgetComparison {
    category: string;
    budgeted: number;
    actual: number;
    remaining: number;
    percentUsed: number;
    status: 'under' | 'on_track' | 'over' | 'critical';
    daysRemaining: number;
    projectedTotal: number;
}

export const compareBudgetVsActual = (
    transactions: Transaction[],
    budgets: Budget[]
): BudgetComparison[] => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    const currentMonthExpenses = transactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth);

    const categorySpending = new Map<string, number>();
    currentMonthExpenses.forEach(t => {
        categorySpending.set(t.category, (categorySpending.get(t.category) || 0) + Math.abs(t.amount));
    });

    return budgets.map(budget => {
        const actual = categorySpending.get(budget.category) || 0;
        const remaining = budget.amount - actual;
        const percentUsed = budget.amount > 0 ? (actual / budget.amount) * 100 : 0;

        // Project total based on current rate
        const dailyRate = dayOfMonth > 0 ? actual / dayOfMonth : 0;
        const projectedTotal = actual + (dailyRate * daysRemaining);

        let status: BudgetComparison['status'];
        if (percentUsed > 100) status = 'critical';
        else if (percentUsed > 85) status = 'over';
        else if (percentUsed > 60) status = 'on_track';
        else status = 'under';

        return {
            category: budget.category,
            budgeted: budget.amount,
            actual,
            remaining,
            percentUsed,
            status,
            daysRemaining,
            projectedTotal
        };
    }).sort((a, b) => b.percentUsed - a.percentUsed);
};

export default {
    calculateHealthScore,
    detectAnomalies,
    calculateCategoryTrends,
    calculateSpendingVelocity,
    analyzeDayOfWeek,
    analyzeMerchants,
    detectRecurringTransactions,
    compareBudgetVsActual
};
