import { FinancialContext } from './openRouterService.js';
import cacheService from './redisCacheService.js';
import { supabase } from '../config/supabase.js';
import { listUserTransactions, MoneyTransaction } from './transactionDomainService.js';

export interface FinancialSnapshot {
    userId: string;
    generatedAt: string;
    dataVersion: string;
    transactions: MoneyTransaction[];
    subscriptions: any[];
    goals: any[];
    budgets: any[];
    upcomingBills: any[];
    pendingCandidates: any[];
    summary: FinancialContext;
    monthlySubCost: number;
    trialCount: number;
    categoryBreakdown: Record<string, number>;
}

const asRows = (value: unknown): any[] => Array.isArray(value) ? value : [];

const buildSnapshotVersion = (
    transactions: MoneyTransaction[],
    subscriptions: any[],
    goals: any[],
    budgets: any[],
    upcomingBills: any[]
) => [
    transactions[0]?.created_at || transactions[0]?.date || '',
    subscriptions[0]?.updated_at || subscriptions[0]?.created_at || '',
    goals[0]?.updated_at || goals[0]?.created_at || '',
    budgets[0]?.updated_at || budgets[0]?.created_at || '',
    upcomingBills[0]?.updated_at || upcomingBills[0]?.created_at || upcomingBills[0]?.due_date || '',
    transactions.length,
    subscriptions.length,
    goals.length,
    budgets.length,
    upcomingBills.length
].join('|');

function calculateHealthScore(monthlySpent: number, txCount: number): number {
    let score = 70;

    if (monthlySpent > 100000) score -= 20;
    else if (monthlySpent > 50000) score -= 10;

    if (txCount > 20) score += 10;
    else if (txCount > 10) score += 5;

    return Math.max(0, Math.min(100, score));
}

function getMonthlySubscriptionCost(subscriptions: any[]) {
    return subscriptions.reduce((sum, subscription) => {
        const price = Number(subscription.price || 0);
        if (subscription.cycle === 'yearly') return sum + price / 12;
        if (subscription.cycle === 'weekly') return sum + price * 4;
        return sum + price;
    }, 0);
}

function summarizeTransactions(userId: string, transactions: MoneyTransaction[]): FinancialContext & {
    categoryBreakdown: Record<string, number>;
} {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const expenses = transactions.filter(transaction => transaction.type === 'expense');
    const monthlyExpenses = expenses.filter(transaction => new Date(transaction.date) >= monthStart);
    const weeklyExpenses = expenses.filter(transaction => new Date(transaction.date) >= weekStart);

    const monthlySpent = monthlyExpenses.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0);
    const weeklySpent = weeklyExpenses.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0);

    const categoryBreakdown: Record<string, number> = {};
    monthlyExpenses.forEach(transaction => {
        const category = transaction.category || 'Other';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Math.abs(Number(transaction.amount) || 0);
    });

    const topCategory = Object.entries(categoryBreakdown)
        .sort((left, right) => right[1] - left[1])[0] || ['None', 0];

    return {
        userId,
        monthlySpent: Math.round(monthlySpent),
        weeklySpent: Math.round(weeklySpent),
        topCategory: topCategory[0],
        topCategoryAmount: Math.round(topCategory[1]),
        transactionCount: expenses.length,
        healthScore: calculateHealthScore(monthlySpent, expenses.length),
        categoryBreakdown
    };
}

export async function getFinancialSummary(userId: string, options: { force?: boolean; includePendingCandidates?: boolean } = {}): Promise<FinancialContext> {
    const cached = options.force ? null : await cacheService.getCachedUserContext(userId);
    if (cached) return cached as FinancialContext;

    const snapshot = await getFinancialSnapshot(userId, options);
    const summary = snapshot.summary;

    await cacheService.setCachedUserContext(userId, summary);
    return summary;
}

export async function getFinancialSnapshot(userId: string, options: { force?: boolean; includePendingCandidates?: boolean } = {}): Promise<FinancialSnapshot> {
    const cached = options.force ? null : await cacheService.getCachedUserSnapshot(userId);
    if (cached && !options.includePendingCandidates) return cached as FinancialSnapshot;

    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);

    const [
        transactions,
        subscriptionsResult,
        goalsResult,
        budgetsResult,
        billsResult,
        candidatesResult
    ] = await Promise.all([
        listUserTransactions(userId, { limit: 100 }),
        supabase.from('subscriptions').select('*').eq('user_id', userId),
        supabase.from('goals').select('*').eq('user_id', userId),
        supabase.from('budgets').select('*').eq('user_id', userId),
        supabase
            .from('bills')
            .select('*')
            .eq('user_id', userId)
            .gte('due_date', now.toISOString())
            .lte('due_date', next7Days.toISOString())
            .order('due_date', { ascending: true }),
        options.includePendingCandidates
            ? supabase
                .from('transaction_candidates')
                .select('description, amount, date, type, category, merchant_name, confidence')
                .eq('user_id', userId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(20)
            : Promise.resolve({ data: [], error: null })
    ]);

    const subscriptions = asRows(subscriptionsResult.data).filter(subscription => subscription.is_active !== false);
    const goals = asRows(goalsResult.data);
    const budgets = asRows(budgetsResult.data);
    const upcomingBills = asRows(billsResult.data);
    const pendingCandidates = asRows(candidatesResult.data);
    const { categoryBreakdown, ...summaryBase } = summarizeTransactions(userId, transactions);
    const monthlySubCost = getMonthlySubscriptionCost(subscriptions);
    const trialCount = subscriptions.filter(subscription => subscription.is_trial).length;

    const snapshot = {
        userId,
        generatedAt: new Date().toISOString(),
        dataVersion: buildSnapshotVersion(transactions, subscriptions, goals, budgets, upcomingBills),
        transactions,
        subscriptions,
        goals,
        budgets,
        upcomingBills,
        pendingCandidates,
        summary: {
            ...summaryBase,
            subscriptionCount: subscriptions.length,
            monthlySubCost: Math.round(monthlySubCost)
        },
        monthlySubCost,
        trialCount,
        categoryBreakdown
    };

    if (!options.includePendingCandidates) {
        await Promise.all([
            cacheService.setCachedUserSnapshot(userId, snapshot),
            cacheService.setCachedUserContext(userId, snapshot.summary)
        ]);
    }

    return snapshot;
}

export function buildCashlySystemPrompt(snapshot: FinancialSnapshot): string {
    const now = new Date();
    const sortedCategories = Object.entries(snapshot.categoryBreakdown).sort((left, right) => right[1] - left[1]);

    const subscriptionsList = snapshot.subscriptions.slice(0, 8).map(subscription =>
        `- ${subscription.name}: Rs ${(subscription.price || 0).toLocaleString()}/${subscription.cycle || 'monthly'}${subscription.is_trial ? ' (TRIAL)' : ''}`
    ).join('\n');

    const goalsList = snapshot.goals.map(goal => {
        const progress = goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0;
        const remaining = Math.max(0, goal.target - goal.saved);
        return `- ${goal.name}: ${progress}% done (Rs ${goal.saved?.toLocaleString()} / Rs ${goal.target?.toLocaleString()}, need Rs ${remaining.toLocaleString()} more)`;
    }).join('\n');

    const budgetsList = snapshot.budgets.map(budget => {
        const spent = snapshot.categoryBreakdown[budget.category] || 0;
        const percent = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
        const status = percent >= 100 ? 'OVER' : percent >= 80 ? 'CLOSE' : 'OK';
        return `- ${budget.category}: Rs ${spent.toLocaleString()} / Rs ${budget.amount?.toLocaleString()} (${percent}%) ${status}`;
    }).join('\n');

    const upcomingBills = snapshot.upcomingBills.slice(0, 5).map(bill => {
        const dueDate = new Date(bill.due_date);
        const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return `- ${bill.title}: Rs ${(bill.amount || 0).toLocaleString()} due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} (${dueDate.toLocaleDateString()})`;
    }).join('\n');

    const recentTransactions = snapshot.transactions.slice(0, 10).map(transaction =>
        `- ${transaction.description || transaction.category}: Rs ${Math.abs(Number(transaction.amount) || 0).toLocaleString()} (${transaction.category}, ${new Date(transaction.date).toLocaleDateString()})`
    ).join('\n');

    const pendingCandidates = snapshot.pendingCandidates.slice(0, 10).map(candidate =>
        `- ${candidate.description || candidate.merchant_name || 'Pending transaction'}: Rs ${Math.abs(Number(candidate.amount) || 0).toLocaleString()} (${candidate.category || 'Uncategorized'}, pending inbox review)`
    ).join('\n');

    const categoryList = sortedCategories.slice(0, 5)
        .map(([category, amount]) => `- ${category}: Rs ${amount.toLocaleString()}`)
        .join('\n');

    return `You are "Cashly AI", a friendly Gen-Z financial assistant. You speak casually and give genuinely helpful financial advice based on the user's real data.

KEY RULES:
- Keep responses concise (3-5 sentences max unless asked for details)
- Reference the user's actual data below to personalize advice
- Be encouraging but honest about spending habits
- Do not use markdown headings
- Use emojis sparingly

USER FINANCIAL DATA
Spending:
- This month: Rs ${snapshot.summary.monthlySpent.toLocaleString()}
- This week: Rs ${snapshot.summary.weeklySpent.toLocaleString()}
- Top category: ${snapshot.summary.topCategory} (Rs ${snapshot.summary.topCategoryAmount.toLocaleString()})
- Total transactions: ${snapshot.transactions.length}

Subscriptions (${snapshot.subscriptions.length} active, ~Rs ${Math.round(snapshot.monthlySubCost).toLocaleString()}/month):
${subscriptionsList || '- No subscriptions tracked yet'}
${snapshot.trialCount > 0 ? `- ${snapshot.trialCount} active trial(s)` : ''}

Goals (${snapshot.goals.length}):
${goalsList || '- No goals set yet'}

Budgets:
${budgetsList || '- No budgets set yet'}

Upcoming bills:
${upcomingBills || '- No bills due soon'}

Recent transactions:
${recentTransactions || '- No recent transactions'}

Pending inbox candidates:
${pendingCandidates || '- No pending candidates'}

Category spending this month:
${categoryList || '- No spending data'}`;
}

export default {
    getFinancialSummary,
    getFinancialSnapshot,
    buildCashlySystemPrompt
};
