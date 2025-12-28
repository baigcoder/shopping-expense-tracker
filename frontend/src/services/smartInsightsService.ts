// Smart Insights Service - Local Analytics Engine
// Generates accurate insights from actual user transaction data
// Provides fallback when AI API fails with rate limits

import { SupabaseTransaction, supabaseTransactionService } from './supabaseTransactionService';
import { budgetService, Budget } from './budgetService';
import { subscriptionService, Subscription } from './subscriptionService';
import { formatCurrency, getCurrencySymbol } from './currencyService';

export interface SmartInsight {
    id: string;
    type: 'savings' | 'warning' | 'trend' | 'goal' | 'tip' | 'achievement';
    severity: 'low' | 'medium' | 'high';
    title: string;
    message: string;
    value?: number;
    action?: string;
    actionPath?: string;
    icon: string;
    color: 'emerald' | 'amber' | 'violet' | 'pink' | 'red' | 'blue';
}

export interface InsightsStats {
    potentialSavings: number;
    activeTips: number;
    alerts: number;
    healthScore: number;
}

export interface CategorySpending {
    category: string;
    amount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    previousAmount?: number;
}

// Calculate category spending from transactions
function calculateCategorySpending(transactions: SupabaseTransaction[]): CategorySpending[] {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Current month expenses
    const currentMonthTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
    });

    // Last month expenses
    const lastMonthTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && t.type === 'expense';
    });

    // Group by category
    const categoryMap = new Map<string, number>();
    const lastMonthCategoryMap = new Map<string, number>();

    currentMonthTx.forEach(t => {
        const cat = typeof t.category === 'string' ? t.category : (t.category as any)?.name || 'Other';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.amount);
    });

    lastMonthTx.forEach(t => {
        const cat = typeof t.category === 'string' ? t.category : (t.category as any)?.name || 'Other';
        lastMonthCategoryMap.set(cat, (lastMonthCategoryMap.get(cat) || 0) + t.amount);
    });

    const totalSpent = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);

    return Array.from(categoryMap.entries()).map(([category, amount]) => {
        const previousAmount = lastMonthCategoryMap.get(category) || 0;
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (previousAmount > 0) {
            const change = ((amount - previousAmount) / previousAmount) * 100;
            if (change > 10) trend = 'up';
            else if (change < -10) trend = 'down';
        }

        return {
            category,
            amount,
            percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
            trend,
            previousAmount
        };
    }).sort((a, b) => b.amount - a.amount);
}

// Calculate spending patterns
function analyzeSpendingPatterns(transactions: SupabaseTransaction[]) {
    const now = new Date();
    const last30Days = transactions.filter(t => {
        const d = new Date(t.date);
        const daysDiff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 30 && t.type === 'expense';
    });

    // Analyze by day of week
    const daySpending: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    last30Days.forEach(t => {
        const day = new Date(t.date).getDay();
        daySpending[day].push(t.amount);
    });

    const avgByDay = Object.entries(daySpending).map(([day, amounts]) => ({
        day: parseInt(day),
        avg: amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0,
        total: amounts.reduce((a, b) => a + b, 0),
        count: amounts.length
    }));

    const weekendSpending = (avgByDay[0].total + avgByDay[6].total);
    const weekdaySpending = avgByDay.slice(1, 6).reduce((a, b) => a + b.total, 0);
    const weekendPct = (weekendSpending + weekdaySpending) > 0
        ? Math.round((weekendSpending / (weekendSpending + weekdaySpending)) * 100)
        : 0;

    // Calculate daily average
    const totalLast30 = last30Days.reduce((sum, t) => sum + t.amount, 0);
    const dailyAvg = totalLast30 / 30;

    return {
        weekendSpendingPct: weekendPct,
        dailyAverage: dailyAvg,
        totalLast30Days: totalLast30,
        transactionCount: last30Days.length,
        avgTransactionSize: last30Days.length > 0 ? totalLast30 / last30Days.length : 0
    };
}

// Generate smart insights from data
export async function generateSmartInsights(userId: string): Promise<{
    insights: SmartInsight[];
    stats: InsightsStats;
    categorySpending: CategorySpending[];
}> {
    const insights: SmartInsight[] = [];
    let healthScore = 70; // Base score

    try {
        // Fetch all user data
        const [transactions, budgets, subscriptions] = await Promise.all([
            supabaseTransactionService.getAll(userId),
            budgetService.getAll(userId),
            subscriptionService.getAll(userId)
        ]);

        const categorySpending = calculateCategorySpending(transactions);
        const patterns = analyzeSpendingPatterns(transactions);

        // Total monthly subscriptions cost
        const monthlySubs = subscriptions.reduce((sum, s) => {
            if (s.cycle === 'monthly') return sum + s.price;
            if (s.cycle === 'yearly') return sum + (s.price / 12);
            if (s.cycle === 'weekly') return sum + (s.price * 4);
            return sum;
        }, 0);

        // Total monthly expenses
        const now = new Date();
        const currentMonthExpenses = transactions
            .filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear() &&
                    t.type === 'expense';
            })
            .reduce((sum, t) => sum + t.amount, 0);

        // Total monthly income
        const currentMonthIncome = transactions
            .filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear() &&
                    t.type === 'income';
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const savingsRate = currentMonthIncome > 0
            ? Math.round(((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100)
            : 0;

        // ===== INSIGHT 1: Top Category Spending =====
        if (categorySpending.length > 0) {
            const topCat = categorySpending[0];
            if (topCat.percentage > 40) {
                insights.push({
                    id: 'top-category-high',
                    type: 'warning',
                    severity: 'high',
                    title: `Too Much on ${topCat.category}`,
                    message: `${topCat.percentage}% of your spending goes to ${topCat.category}. Try cutting back a bit!`,
                    value: topCat.amount,
                    action: 'Set Budget Limit',
                    actionPath: '/budgets',
                    icon: 'AlertTriangle',
                    color: 'amber'
                });
                healthScore -= 10;
            } else if (topCat.trend === 'up' && topCat.previousAmount) {
                const increase = Math.round(((topCat.amount - topCat.previousAmount) / topCat.previousAmount) * 100);
                if (increase > 25) {
                    insights.push({
                        id: 'category-spike',
                        type: 'trend',
                        severity: 'medium',
                        title: `${topCat.category} Went Up ${increase}%`,
                        message: `You spent more on ${topCat.category} than last month.`,
                        value: topCat.amount - topCat.previousAmount,
                        action: 'Review Transactions',
                        actionPath: '/transactions',
                        icon: 'TrendingUp',
                        color: 'violet'
                    });
                }
            }
        }

        // ===== INSIGHT 2: Weekend Spending Pattern =====
        if (patterns.weekendSpendingPct > 45) {
            const potentialSave = Math.round(patterns.totalLast30Days * 0.1);
            insights.push({
                id: 'weekend-spending',
                type: 'trend',
                severity: 'medium',
                title: 'High Weekend Spending',
                message: `${patterns.weekendSpendingPct}% of your money is spent on weekends. A weekend budget could save you ${formatCurrency(potentialSave)}/month.`,
                value: potentialSave,
                action: 'Set Weekend Budget',
                actionPath: '/budgets',
                icon: 'Calendar',
                color: 'violet'
            });
        }

        // ===== INSIGHT 3: Budget Status =====
        const overBudgetCategories: string[] = [];
        const nearBudgetCategories: string[] = [];

        budgets.forEach(budget => {
            const spent = categorySpending.find(c =>
                c.category.toLowerCase() === budget.category.toLowerCase()
            )?.amount || 0;
            const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

            if (pct >= 100) {
                overBudgetCategories.push(budget.category);
                healthScore -= 5;
            } else if (pct >= 80) {
                nearBudgetCategories.push(budget.category);
            }
        });

        if (overBudgetCategories.length > 0) {
            insights.push({
                id: 'over-budget',
                type: 'warning',
                severity: 'high',
                title: `Over Budget!`,
                message: `You've spent too much on: ${overBudgetCategories.join(', ')}. Try to spend less.`,
                action: 'View Budgets',
                actionPath: '/budgets',
                icon: 'AlertTriangle',
                color: 'red'
            });
        }

        if (nearBudgetCategories.length > 0) {
            insights.push({
                id: 'near-budget',
                type: 'warning',
                severity: 'medium',
                title: 'Almost at Budget Limit',
                message: `Getting close to your limit for: ${nearBudgetCategories.join(', ')}.`,
                action: 'Adjust Spending',
                actionPath: '/budgets',
                icon: 'Target',
                color: 'amber'
            });
        }

        // ===== INSIGHT 4: Subscription Optimization =====
        if (subscriptions.length > 0) {
            const unusedSubs = subscriptions.filter(s => {
                // Check if subscription category appears in recent transactions
                const hasTx = transactions.some(t => {
                    const txCat = typeof t.category === 'string' ? t.category : '';
                    return txCat.toLowerCase().includes(s.name.toLowerCase()) ||
                        (t as any).merchant?.toLowerCase().includes(s.name.toLowerCase());
                });
                return !hasTx && s.price > 0;
            });

            if (unusedSubs.length > 0) {
                const potentialSave = unusedSubs.reduce((sum, s) => sum + s.price, 0);
                insights.push({
                    id: 'unused-subs',
                    type: 'savings',
                    severity: 'medium',
                    title: 'Unused Subscriptions',
                    message: `You have ${unusedSubs.length} subscription(s) you might not be using: ${unusedSubs.slice(0, 2).map(s => s.name).join(', ')}. Cancel to save ${formatCurrency(potentialSave)}/month.`,
                    value: potentialSave,
                    action: 'Review Subscriptions',
                    actionPath: '/subscriptions',
                    icon: 'Scissors',
                    color: 'emerald'
                });
            }

            if (monthlySubs > patterns.dailyAverage * 10) {
                insights.push({
                    id: 'high-subs',
                    type: 'tip',
                    severity: 'low',
                    title: 'Your Subscriptions',
                    message: `You pay ${formatCurrency(monthlySubs)}/month for ${subscriptions.length} subscriptions (${formatCurrency(monthlySubs * 12)}/year). Yearly plans can save money.`,
                    value: monthlySubs,
                    action: 'Manage Subscriptions',
                    actionPath: '/subscriptions',
                    icon: 'CreditCard',
                    color: 'blue'
                });
            }
        }

        // ===== INSIGHT 5: Savings Rate =====
        if (savingsRate < 10 && currentMonthIncome > 0) {
            insights.push({
                id: 'low-savings',
                type: 'warning',
                severity: 'high',
                title: 'Save More!',
                message: `You're only saving ${savingsRate}% of your money. Try to save at least 20%.`,
                action: 'Create Savings Goal',
                actionPath: '/goals',
                icon: 'PiggyBank',
                color: 'red'
            });
            healthScore -= 15;
        } else if (savingsRate >= 20) {
            insights.push({
                id: 'great-savings',
                type: 'achievement',
                severity: 'low',
                title: 'Great Job Saving! 🎉',
                message: `You're saving ${savingsRate}% of your money - that's awesome! Keep going!`,
                action: 'Explore Goals',
                actionPath: '/goals',
                icon: 'Trophy',
                color: 'emerald'
            });
            healthScore += 10;
        }

        // ===== INSIGHT 6: Small Transactions Add Up =====
        const smallTx = transactions.filter(t =>
            t.type === 'expense' && t.amount < 500 // Small transactions under Rs 500
        );
        const smallTxTotal = smallTx.reduce((sum, t) => sum + t.amount, 0);

        if (smallTx.length > 20 && smallTxTotal > patterns.totalLast30Days * 0.15) {
            insights.push({
                id: 'small-tx',
                type: 'tip',
                severity: 'low',
                title: 'Small Purchases Add Up',
                message: `${smallTx.length} small purchases added up to ${formatCurrency(smallTxTotal)}. Watch those little expenses!`,
                value: smallTxTotal,
                action: 'View Small Transactions',
                actionPath: '/transactions',
                icon: 'Coffee',
                color: 'amber'
            });
        }

        // ===== INSIGHT 7: Dining Out Analysis =====
        const diningCategories = ['food', 'dining', 'restaurant', 'cafe', 'takeout'];
        const diningSpend = categorySpending
            .filter(c => diningCategories.some(d => c.category.toLowerCase().includes(d)))
            .reduce((sum, c) => sum + c.amount, 0);

        if (diningSpend > currentMonthExpenses * 0.25) {
            const potentialSave = Math.round(diningSpend * 0.3);
            insights.push({
                id: 'dining-high',
                type: 'savings',
                severity: 'medium',
                title: 'Eating Out a Lot',
                message: `Food & dining is ${Math.round((diningSpend / currentMonthExpenses) * 100)}% of your spending. Cooking at home could save ${formatCurrency(potentialSave)}/month.`,
                value: potentialSave,
                action: 'Set Food Budget',
                actionPath: '/budgets',
                icon: 'UtensilsCrossed',
                color: 'emerald'
            });
        }

        // Calculate final stats
        const potentialSavings = insights
            .filter(i => i.type === 'savings' || (i.type === 'tip' && i.value))
            .reduce((sum, i) => sum + (i.value || 0), 0);

        const alerts = insights.filter(i => i.type === 'warning').length;
        const activeTips = insights.filter(i => i.type === 'tip' || i.type === 'savings').length;

        // Clamp health score
        healthScore = Math.max(20, Math.min(100, healthScore));

        return {
            insights,
            stats: {
                potentialSavings,
                activeTips,
                alerts,
                healthScore
            },
            categorySpending
        };

    } catch (error) {
        console.error('Failed to generate smart insights:', error);

        // Return fallback insights
        return {
            insights: [{
                id: 'fallback',
                type: 'tip',
                severity: 'low',
                title: 'Start Tracking',
                message: 'Add your spending to get tips on how to save money.',
                action: 'Add Transaction',
                actionPath: '/transactions',
                icon: 'Plus',
                color: 'emerald'
            }],
            stats: {
                potentialSavings: 0,
                activeTips: 1,
                alerts: 0,
                healthScore: 50
            },
            categorySpending: []
        };
    }
}

// Get cached AI tip with fallback
export function getLocalFallbackTip(stats: InsightsStats): string {
    if (stats.alerts > 0) {
        return `⚠️ You have ${stats.alerts} thing(s) to check. Look at your tips for details.`;
    }
    if (stats.potentialSavings > 0) {
        return `💡 You could save up to ${formatCurrency(stats.potentialSavings)} by following our tips.`;
    }
    if (stats.healthScore >= 80) {
        return `🌟 Great job! Your money health score is ${stats.healthScore}/100. Keep it up!`;
    }
    return `📊 Add more spending to see tips on how to save money.`;
}
