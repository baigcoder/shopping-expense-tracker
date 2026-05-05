import { supabase } from '../config/supabase.js';
import { getFinancialSnapshot } from './financialContextService.js';
import openRouterService from './openRouterService.js';
import { getUserSettings } from './settingsService.js';

type TransactionType = 'income' | 'expense';
type TrendDirection = 'increasing' | 'stable' | 'decreasing';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface MoneyTwinTransaction {
    id?: string;
    user_id: string;
    date: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    source?: string;
    confidence?: number;
    merchant_name?: string | null;
    store_name?: string | null;
    created_at?: string;
    pending?: boolean;
}

interface SpendingPattern {
    category: string;
    avgMonthlySpend: number;
    avgDailySpend: number;
    trend: TrendDirection;
    trendPercentage: number;
    volatility: number;
    seasonalPeaks: string[];
    dayOfMonthPattern: number[];
    predictedNextMonth: number;
    confidence: number;
}

interface FinancialForecast {
    month: string;
    predictedExpenses: number;
    predictedIncome: number;
    predictedSavings: number;
    riskLevel: RiskLevel;
    warnings: string[];
    breakdown: Record<string, number>;
}

interface RiskAlert {
    id: string;
    type: 'overdraft' | 'budget_breach' | 'goal_miss' | 'unusual_spending' | 'subscription_creep';
    severity: 'info' | 'warning' | 'danger' | 'critical';
    title: string;
    message: string;
    daysUntil: number | null;
    probability: number;
    preventionTip: string;
    createdAt: string;
}

const asRows = (value: unknown): any[] => Array.isArray(value) ? value : [];
const amount = (value: unknown) => {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
};
const monthKey = (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const avg = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

async function safeRows(table: string, userId: string, orderColumn = 'created_at', limit = 1000) {
    const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .order(orderColumn, { ascending: false })
        .limit(limit);

    if (error) {
        console.warn(`Money Twin optional table ${table} unavailable: ${error.message}`);
        return [];
    }

    return asRows(data);
}

function groupByMonth(transactions: MoneyTwinTransaction[]) {
    const grouped: Record<string, number> = {};
    transactions.forEach((transaction) => {
        const key = monthKey(transaction.date || transaction.created_at || new Date());
        grouped[key] = (grouped[key] || 0) + amount(transaction.amount);
    });
    return grouped;
}

function detectTrend(values: number[]): { direction: TrendDirection; percentage: number } {
    if (values.length < 2) return { direction: 'stable', percentage: 0 };
    const recent = values.slice(-3);
    const older = values.slice(0, -3);
    const recentAvg = avg(recent);
    const olderAvg = older.length ? avg(older) : values[values.length - 2];
    const change = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    return {
        direction: change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable',
        percentage: Math.round(change * 10) / 10,
    };
}

function volatility(values: number[]) {
    if (values.length < 2) return 0;
    const mean = avg(values);
    if (!mean) return 0;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return clamp(Math.sqrt(variance) / mean, 0, 1);
}

function analyzePatterns(transactions: MoneyTwinTransaction[]): SpendingPattern[] {
    const expenses = transactions.filter((transaction) => transaction.type !== 'income');
    const byCategory = new Map<string, MoneyTwinTransaction[]>();
    expenses.forEach((transaction) => {
        const category = transaction.category || 'Other';
        byCategory.set(category, [...(byCategory.get(category) || []), transaction]);
    });

    return [...byCategory.entries()].map(([category, rows]) => {
        const monthly = groupByMonth(rows);
        const values = Object.values(monthly);
        const trend = detectTrend(values);
        const recentBase = avg(values.slice(-3));
        const predictedNextMonth = Math.max(0, recentBase * (1 + trend.percentage / 100));
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const overall = avg(values);
        const seasonalPeaks = Object.entries(monthly)
            .filter(([, total]) => overall > 0 && total > overall * 1.2)
            .map(([key]) => monthNames[Number(key.split('-')[1]) - 1])
            .filter(Boolean);
        const dayCounts = new Map<number, number>();
        rows.forEach((transaction) => {
            const day = new Date(transaction.date).getDate();
            dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
        });
        const dayAvg = rows.length / 31;

        return {
            category,
            avgMonthlySpend: Math.round(avg(values)),
            avgDailySpend: Math.round(avg(values) / 30),
            trend: trend.direction,
            trendPercentage: trend.percentage,
            volatility: volatility(values),
            seasonalPeaks: [...new Set(seasonalPeaks)],
            dayOfMonthPattern: [...dayCounts.entries()]
                .filter(([, count]) => count > dayAvg * 1.5)
                .map(([day]) => day)
                .sort((left, right) => left - right),
            predictedNextMonth: Math.round(predictedNextMonth),
            confidence: Math.round(clamp((1 - volatility(values)) * 75 + Math.min(values.length / 6, 1) * 25, 0, 100)),
        };
    }).sort((left, right) => right.avgMonthlySpend - left.avgMonthlySpend);
}

function calculateVelocity(transactions: MoneyTwinTransaction[]) {
    const expenses = transactions.filter((transaction) => transaction.type !== 'income');
    const income = transactions.filter((transaction) => transaction.type === 'income');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const recentTotal = expenses
        .filter((transaction) => new Date(transaction.date) >= thirtyDaysAgo)
        .reduce((sum, transaction) => sum + amount(transaction.amount), 0);
    const olderTotal = expenses
        .filter((transaction) => new Date(transaction.date) >= sixtyDaysAgo && new Date(transaction.date) < thirtyDaysAgo)
        .reduce((sum, transaction) => sum + amount(transaction.amount), 0);
    const incomeTotal = income
        .filter((transaction) => new Date(transaction.date) >= thirtyDaysAgo)
        .reduce((sum, transaction) => sum + amount(transaction.amount), 0);
    const dailyRate = recentTotal / 30;
    const remainingIncome = incomeTotal - recentTotal;

    return {
        dailyRate: Math.round(dailyRate),
        weeklyRate: Math.round(dailyRate * 7),
        monthlyRate: Math.round(recentTotal),
        acceleration: Math.round(olderTotal > 0 ? ((recentTotal - olderTotal) / olderTotal) * 100 : 0),
        daysUntilBroke: dailyRate > 0 && remainingIncome > 0 ? Math.round(remainingIncome / dailyRate) : remainingIncome <= 0 && incomeTotal > 0 ? 0 : null,
        burnRate: Math.round(incomeTotal > 0 ? (recentTotal / incomeTotal) * 100 : recentTotal > 0 ? 100 : 0),
    };
}

function monthlySubscriptionCost(subscriptions: any[]) {
    return subscriptions
        .filter((subscription) => subscription.is_active !== false)
        .reduce((sum, subscription) => {
            const price = amount(subscription.price);
            if (subscription.cycle === 'yearly') return sum + price / 12;
            if (subscription.cycle === 'weekly') return sum + price * 4;
            return sum + price;
        }, 0);
}

function generateForecasts(transactions: MoneyTwinTransaction[], patterns: SpendingPattern[], subscriptions: any[], aiForecast: any[] = []): FinancialForecast[] {
    const now = new Date();
    const expenses = transactions.filter((transaction) => transaction.type !== 'income' && !transaction.pending);
    const income = transactions.filter((transaction) => transaction.type === 'income');
    const expenseByMonth = groupByMonth(expenses);
    const incomeByMonth = groupByMonth(income);
    const expenseKeys = Object.keys(expenseByMonth).sort().slice(-6);
    const incomeKeys = Object.keys(incomeByMonth).sort().slice(-6);
    const baseExpense = avg(expenseKeys.map((key) => expenseByMonth[key]));
    const baseIncome = avg(incomeKeys.map((key) => incomeByMonth[key]));
    const trend = detectTrend(expenseKeys.map((key) => expenseByMonth[key]));
    const subCost = monthlySubscriptionCost(subscriptions);
    const currentSubscriptionSpend = expenses
        .filter((transaction) => /subscription|netflix|spotify|adobe|youtube|openai|github|canva|figma/i.test(`${transaction.category} ${transaction.description}`))
        .reduce((sum, transaction) => sum + amount(transaction.amount), 0) / Math.max(1, expenseKeys.length);
    const incrementalSubCost = Math.max(0, subCost - currentSubscriptionSpend);

    return [1, 2].map((monthOffset) => {
        const forecastDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
        const month = forecastDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        const ai = aiForecast.find((item) => String(item?.month || '').toLowerCase().includes(month.split(' ')[0].toLowerCase()));
        const multiplier = Math.pow(1 + (trend.percentage / 100) * 0.5, monthOffset);
        const breakdown: Record<string, number> = {};
        patterns.slice(0, 8).forEach((pattern) => {
            breakdown[pattern.category] = Math.round(pattern.predictedNextMonth * multiplier);
        });
        if (incrementalSubCost > 0) breakdown.Subscriptions = Math.round((breakdown.Subscriptions || 0) + incrementalSubCost);
        const predictedExpenses = Math.round(Number(ai?.predictedExpenses) || ((baseExpense || patterns.reduce((sum, p) => sum + p.avgMonthlySpend, 0)) * multiplier + incrementalSubCost));
        const predictedIncome = Math.round(Number(ai?.predictedIncome) || baseIncome);
        const predictedSavings = predictedIncome - predictedExpenses;
        const savingsRate = predictedIncome > 0 ? (predictedSavings / predictedIncome) * 100 : 0;
        const warnings = [
            ...(Array.isArray(ai?.insights) ? ai.insights.slice(0, 2) : []),
            ...(predictedSavings < 0 ? [`Projected deficit: Rs ${Math.abs(predictedSavings).toLocaleString()}`] : []),
            ...(trend.direction === 'increasing' && trend.percentage > 10 ? [`Spending trend is up ${Math.round(trend.percentage)}%`] : []),
        ];
        const riskLevel: RiskLevel = predictedSavings < 0 ? 'critical' : savingsRate < 10 ? 'high' : savingsRate < 20 ? 'medium' : 'low';

        return {
            month,
            predictedExpenses,
            predictedIncome,
            predictedSavings,
            riskLevel,
            warnings: warnings.length ? warnings : ['Forecast based on approved transactions and recurring costs.'],
            breakdown,
        };
    });
}

function calculateHealthScore(velocity: ReturnType<typeof calculateVelocity>, patterns: SpendingPattern[], budgets: any[], goals: any[]) {
    let score = 100;
    if (velocity.burnRate > 100) score -= 30;
    else if (velocity.burnRate > 90) score -= 20;
    else if (velocity.burnRate > 80) score -= 10;
    score -= patterns.filter((pattern) => pattern.trend === 'increasing').length * 3;
    score -= patterns.filter((pattern) => pattern.volatility > 0.5).length * 2;
    if (velocity.acceleration > 20) score -= 15;
    else if (velocity.acceleration > 10) score -= 10;
    score += Math.min(goals.length * 3, 10);
    score += Math.min(budgets.length * 2, 10);
    return Math.round(clamp(score, 0, 100));
}

function detectRisks(transactions: MoneyTwinTransaction[], velocity: ReturnType<typeof calculateVelocity>, budgets: any[], forecasts: FinancialForecast[], aiRisks: any[] = []): RiskAlert[] {
    const now = new Date();
    const alerts: RiskAlert[] = aiRisks.slice(0, 3).map((risk, index) => ({
        id: `ai-risk-${index}`,
        type: 'unusual_spending',
        severity: (risk.confidence || 0) > 0.8 ? 'danger' : 'warning',
        title: risk.title || 'AI Risk Alert',
        message: risk.message || 'Potential financial risk detected.',
        daysUntil: null,
        probability: Math.round((risk.confidence || 0.7) * 100),
        preventionTip: risk.message || 'Review your recent spending.',
        createdAt: risk.generatedAt || now.toISOString(),
    }));

    if (velocity.daysUntilBroke !== null && velocity.daysUntilBroke <= 15) {
        alerts.push({
            id: `overdraft-${now.getTime()}`,
            type: 'overdraft',
            severity: velocity.daysUntilBroke <= 5 ? 'critical' : velocity.daysUntilBroke <= 10 ? 'danger' : 'warning',
            title: 'Runway Risk',
            message: `At the current burn rate, available monthly income may run out in ${velocity.daysUntilBroke} days.`,
            daysUntil: velocity.daysUntilBroke,
            probability: clamp(100 - velocity.daysUntilBroke * 5, 30, 100),
            preventionTip: `Reduce daily flexible spending by about Rs ${Math.round(velocity.dailyRate * 0.3).toLocaleString()}.`,
            createdAt: now.toISOString(),
        });
    }

    const expenses = transactions.filter((transaction) => transaction.type !== 'income' && !transaction.pending);
    budgets.forEach((budget) => {
        const spent = expenses
            .filter((transaction) => (transaction.category || '').toLowerCase() === String(budget.category || '').toLowerCase() && new Date(transaction.date).getMonth() === now.getMonth())
            .reduce((sum, transaction) => sum + amount(transaction.amount), 0);
        const percentUsed = amount(budget.amount) > 0 ? (spent / amount(budget.amount)) * 100 : 0;
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysLeft = Math.max(1, daysInMonth - now.getDate());
        const expectedPercent = (now.getDate() / daysInMonth) * 100;

        if (percentUsed > expectedPercent * 1.3 && percentUsed < 100) {
            const dailyBudget = Math.max(0, (amount(budget.amount) - spent) / daysLeft);
            alerts.push({
                id: `budget-${budget.category}-${now.getTime()}`,
                type: 'budget_breach',
                severity: percentUsed > 90 ? 'danger' : 'warning',
                title: `${budget.category} budget at risk`,
                message: `You have used ${Math.round(percentUsed)}% of this budget with ${daysLeft} day(s) left.`,
                daysUntil: velocity.dailyRate > 0 ? Math.round(Math.max(0, amount(budget.amount) - spent) / velocity.dailyRate) : null,
                probability: Math.round(clamp(percentUsed + 10, 0, 100)),
                preventionTip: `Keep ${budget.category} spending near Rs ${Math.round(dailyBudget).toLocaleString()}/day for the rest of this month.`,
                createdAt: now.toISOString(),
            });
        }
    });

    const weeklyTotal = expenses
        .filter((transaction) => now.getTime() - new Date(transaction.date).getTime() <= 7 * 24 * 60 * 60 * 1000)
        .reduce((sum, transaction) => sum + amount(transaction.amount), 0);
    if (velocity.weeklyRate > 0 && weeklyTotal > velocity.weeklyRate * 1.5) {
        alerts.push({
            id: `unusual-${now.getTime()}`,
            type: 'unusual_spending',
            severity: 'warning',
            title: 'Unusual spending spike',
            message: `This week is ${Math.round((weeklyTotal / velocity.weeklyRate - 1) * 100)}% above your normal weekly pace.`,
            daysUntil: null,
            probability: 80,
            preventionTip: 'Review recent transactions and pause flexible spending for a few days.',
            createdAt: now.toISOString(),
        });
    }

    const critical = forecasts.find((forecast) => forecast.riskLevel === 'critical');
    if (critical) {
        alerts.push({
            id: `forecast-critical-${now.getTime()}`,
            type: 'budget_breach',
            severity: 'danger',
            title: 'Future deficit predicted',
            message: `${critical.month} may be short by Rs ${Math.abs(critical.predictedSavings).toLocaleString()}.`,
            daysUntil: 30,
            probability: 70,
            preventionTip: 'Adjust spending this week before the deficit becomes likely.',
            createdAt: now.toISOString(),
        });
    }

    if (!alerts.length) {
        alerts.push({
            id: `tip-${now.getTime()}`,
            type: 'goal_miss',
            severity: 'info',
            title: 'Financial health is stable',
            message: 'No major risks detected from the current approved transaction set.',
            daysUntil: null,
            probability: 100,
            preventionTip: 'Keep budgets and goals updated so the model stays accurate.',
            createdAt: now.toISOString(),
        });
    }

    const order = { critical: 0, danger: 1, warning: 2, info: 3 };
    return alerts.sort((left, right) => order[left.severity] - order[right.severity]).slice(0, 10);
}

function buildPendingCandidateImpact(candidates: any[]) {
    const byCategory: Record<string, number> = {};
    candidates.forEach((candidate) => {
        const category = candidate.category || 'Other';
        byCategory[category] = (byCategory[category] || 0) + amount(candidate.amount);
    });
    return {
        count: candidates.length,
        totalAmount: Math.round(candidates.reduce((sum, candidate) => sum + amount(candidate.amount), 0)),
        duplicateWarnings: candidates.filter((candidate) => candidate.duplicate_transaction_id).length,
        byCategory,
        candidates: candidates.slice(0, 10),
    };
}

function buildWhatIfInputs(patterns: SpendingPattern[], subscriptions: any[]) {
    return {
        topCategories: patterns.slice(0, 8).map((pattern) => ({
            category: pattern.category,
            avgMonthlySpend: pattern.avgMonthlySpend,
            suggestedReductionPercent: pattern.avgMonthlySpend > 0 ? 20 : 0,
        })),
        subscriptions: subscriptions
            .filter((subscription) => subscription.is_active !== false)
            .slice(0, 20)
            .map((subscription) => ({
                id: subscription.id,
                name: subscription.name,
                price: amount(subscription.price),
                cycle: subscription.cycle || 'monthly',
                is_trial: !!subscription.is_trial,
            })),
    };
}

export async function getMoneyTwin(userId: string, options: { force?: boolean; includePending?: boolean } = {}) {
    const includePending = options.includePending !== false;
    const snapshot = await getFinancialSnapshot(userId, {
        force: options.force,
        includePendingCandidates: includePending,
    });
    const settings = await getUserSettings(userId);

    const [transactions, subscriptions, budgets, goals] = await Promise.all([
        safeRows('transactions', userId, 'date', 1000),
        safeRows('subscriptions', userId, 'created_at', 500),
        safeRows('budgets', userId, 'created_at', 200),
        safeRows('goals', userId, 'created_at', 200),
    ]);

    const pendingCandidates = includePending ? snapshot.pendingCandidates : [];
    const pendingAsTransactions: MoneyTwinTransaction[] = pendingCandidates.map((candidate) => ({
        id: candidate.id,
        user_id: userId,
        date: candidate.date || new Date().toISOString(),
        description: candidate.description || candidate.merchant_name || 'Pending transaction',
        amount: amount(candidate.amount),
        type: candidate.type === 'income' ? 'income' : 'expense',
        category: candidate.category || 'Other',
        confidence: Number(candidate.confidence || 0.5),
        merchant_name: candidate.merchant_name,
        pending: true,
    }));
    const modelTransactions = [...transactions as MoneyTwinTransaction[], ...pendingAsTransactions];

    let aiForecast: any[] = [];
    let aiRisks: any[] = [];
    if (settings.aiLiveEnabled) {
        const [forecastResult, riskResult] = await Promise.all([
            openRouterService.generateForecast(snapshot.summary).catch(() => []),
            openRouterService.generateRiskAlerts(snapshot.summary).catch(() => []),
        ]);
        aiForecast = forecastResult;
        aiRisks = riskResult;
    }

    const patterns = analyzePatterns(modelTransactions);
    const velocity = calculateVelocity(modelTransactions);
    const forecasts = generateForecasts(modelTransactions, patterns, subscriptions, aiForecast);
    const healthScore = calculateHealthScore(velocity, patterns, budgets, goals);
    const riskAlerts = detectRisks(modelTransactions, velocity, budgets, forecasts, aiRisks);

    return {
        userId,
        lastUpdated: new Date().toISOString(),
        dataVersion: snapshot.dataVersion,
        source: 'backend',
        model: {
            backendOwned: true,
            includesPendingCandidates: includePending,
            aiLiveEnabled: settings.aiLiveEnabled,
            transactionCount: transactions.length,
            pendingCandidateCount: pendingCandidates.length,
        },
        patterns,
        velocity,
        forecasts,
        healthScore,
        riskAlerts,
        pendingCandidateImpact: buildPendingCandidateImpact(pendingCandidates),
        whatIfInputs: buildWhatIfInputs(patterns, subscriptions),
    };
}

export default { getMoneyTwin };
