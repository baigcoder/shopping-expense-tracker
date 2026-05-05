import { supabase } from '../config/supabase.js';
import {
    getCashflowCalendar,
    getCurrentCoachPlan,
    getExtensionHealth,
    getReportExports,
    getSubscriptionCommandCenter,
} from './featureExpansionService.js';

const asRows = (value: unknown): any[] => Array.isArray(value) ? value : [];

const safeRows = async (table: string, userId: string, orderColumn = 'created_at', limit = 200) => {
    const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .order(orderColumn, { ascending: false })
        .limit(limit);

    if (error) {
        console.warn(`Dashboard optional table ${table} unavailable: ${error.message}`);
        return [];
    }

    return asRows(data);
};

const safeValue = async <T = any>(fallback: T, getter: () => Promise<any>): Promise<T> => {
    try {
        return await getter();
    } catch (error) {
        console.warn('Dashboard optional section unavailable:', error instanceof Error ? error.message : error);
        return fallback;
    }
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);
const monthKey = (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const normalizeAmount = (value: unknown) => {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? Math.abs(amount) : 0;
};

const merchantName = (tx: any) =>
    tx.merchant_name || tx.store_name || tx.storeName || String(tx.description || 'Unknown merchant').split(/[-|]/)[0].trim() || 'Unknown merchant';

export async function getDashboardSummary(userId: string) {
    const now = new Date();
    const currentMonth = monthKey(now);
    const lastMonthDate = new Date(now);
    lastMonthDate.setMonth(now.getMonth() - 1);
    const lastMonth = monthKey(lastMonthDate);
    const today = toDateKey(now);

    const [
        transactions,
        budgets,
        cards,
        candidatesResult,
        cashflow,
        subscriptions,
        extensionHealth,
        coach,
        reportExports,
    ] = await Promise.all([
        safeRows('transactions', userId, 'date', 500),
        safeRows('budgets', userId, 'created_at', 100),
        safeRows('cards', userId, 'created_at', 50),
        safeValue({ data: [], pagination: { total: 0 } }, async () => {
            const { listTransactionCandidates } = await import('./transactionInboxService.js');
            return listTransactionCandidates(userId, { status: 'pending', limit: 5 });
        }),
        safeValue([], () => getCashflowCalendar(userId)),
        safeValue({
            active: [],
            trialsEndingSoon: [],
            priceIncreases: [],
            unusedAlerts: [],
            totals: { activeCount: 0, monthlyCost: 0, yearlyCost: 0 },
        }, () => getSubscriptionCommandCenter(userId)),
        safeValue({
            sites: [],
            recentEvents: [],
            queuedSyncs: 0,
            failedDetections: 0,
            lastSuccessfulSync: null,
            permissionStatus: 'unknown',
        }, () => getExtensionHealth(userId)),
        safeValue(null, () => getCurrentCoachPlan(userId)),
        safeValue([], () => getReportExports(userId)),
    ]);

    const incomeRows = transactions.filter((tx) => tx.type === 'income');
    const expenseRows = transactions.filter((tx) => tx.type !== 'income');
    const currentMonthRows = transactions.filter((tx) => monthKey(tx.date || tx.created_at || now) === currentMonth);
    const lastMonthExpense = transactions
        .filter((tx) => tx.type !== 'income' && monthKey(tx.date || tx.created_at || now) === lastMonth)
        .reduce((sum, tx) => sum + normalizeAmount(tx.amount), 0);

    const monthlyIncome = currentMonthRows
        .filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + normalizeAmount(tx.amount), 0);
    const monthlyExpense = currentMonthRows
        .filter((tx) => tx.type !== 'income')
        .reduce((sum, tx) => sum + normalizeAmount(tx.amount), 0);
    const totalIncome = incomeRows.reduce((sum, tx) => sum + normalizeAmount(tx.amount), 0);
    const totalExpense = expenseRows.reduce((sum, tx) => sum + normalizeAmount(tx.amount), 0);
    const totalBudget = budgets.reduce((sum, budget) => sum + normalizeAmount(budget.amount), 0);
    const budgetPercentage = totalBudget > 0 ? Math.min(100, Math.round((monthlyExpense / totalBudget) * 100)) : 0;

    const groupAmounts = (rows: any[], keyFn: (tx: any) => string) => {
        const map = new Map<string, { name: string; amount: number; count: number }>();
        rows.forEach((tx) => {
            const key = keyFn(tx) || 'Other';
            const current = map.get(key) || { name: key, amount: 0, count: 0 };
            map.set(key, {
                name: key,
                amount: current.amount + normalizeAmount(tx.amount),
                count: current.count + 1,
            });
        });
        return [...map.values()].sort((a, b) => b.amount - a.amount);
    };

    const chart = Array.from({ length: 14 }, (_, index) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (13 - index));
        const key = toDateKey(date);
        const rows = transactions.filter((tx) => String(tx.date || tx.created_at || '').startsWith(key));
        return {
            date: key,
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            income: rows.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + normalizeAmount(tx.amount), 0),
            expense: rows.filter((tx) => tx.type !== 'income').reduce((sum, tx) => sum + normalizeAmount(tx.amount), 0),
        };
    });

    const categoryBreakdown = groupAmounts(expenseRows, (tx) => tx.category || 'Other').slice(0, 6);
    const merchantBreakdown = groupAmounts(expenseRows, merchantName).slice(0, 5);
    const activityScore = Math.min(100, transactions.length * 4);
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.min(100, ((totalIncome - totalExpense) / totalIncome) * 100)) : 50;
    const budgetScore = totalBudget > 0 ? Math.max(0, 100 - budgetPercentage) : 50;
    const healthScore = transactions.length ? Math.round(activityScore * 0.25 + savingsRate * 0.45 + budgetScore * 0.30) : 50;
    const upcomingCashflow = cashflow
        .filter((event: any) => event.date && new Date(event.date) >= new Date(today))
        .slice(0, 6);

    return {
        generatedAt: new Date().toISOString(),
        stats: {
            totalBalance: totalIncome - totalExpense,
            totalIncome,
            totalExpense,
            monthlyIncome,
            monthlyExpense,
            transactionsToday: transactions.filter((tx) => String(tx.date || tx.created_at || '').startsWith(today)).length,
            transactionCount: transactions.length,
            cardCount: cards.length,
            healthScore,
            budgetUsed: monthlyExpense,
            budgetTotal: totalBudget,
            budgetPercentage,
            expenseTrend: lastMonthExpense > 0 ? Math.round(((monthlyExpense - lastMonthExpense) / lastMonthExpense) * 1000) / 10 : 0,
        },
        chart,
        recentTransactions: transactions.slice(0, 6),
        categoryBreakdown,
        merchantBreakdown,
        inbox: {
            pendingCount: candidatesResult.pagination?.total || 0,
            candidates: candidatesResult.data || [],
            duplicateWarnings: asRows(candidatesResult.data).filter((candidate) => candidate.duplicate_transaction_id).length,
        },
        cashflow: {
            upcoming: upcomingCashflow,
            totalEvents: cashflow.length,
        },
        subscriptions: {
            activeCount: subscriptions.totals?.activeCount || 0,
            monthlyCost: subscriptions.totals?.monthlyCost || 0,
            trialsEndingSoon: subscriptions.trialsEndingSoon || [],
            priceIncreases: subscriptions.priceIncreases || [],
            unusedAlerts: subscriptions.unusedAlerts || [],
        },
        extensionHealth,
        coach,
        reports: {
            recentExports: asRows(reportExports).slice(0, 5),
            exportCount: asRows(reportExports).length,
        },
        emptyState: {
            hasTransactions: transactions.length > 0,
            nextActions: [
                { id: 'import', label: 'Import a statement', path: '/transactions' },
                { id: 'inbox', label: 'Review pending detections', path: '/transaction-inbox' },
                { id: 'budget', label: 'Create a budget', path: '/budgets' },
                { id: 'extension', label: 'Connect the browser extension', path: '/extension-health' },
            ],
        },
    };
}
