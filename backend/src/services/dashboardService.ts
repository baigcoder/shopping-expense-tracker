import { supabase } from '../config/supabase.js';
import { Money } from '../utils/money.js';
import { createError } from '../middleware/errorHandler.js';
import {
    getCashflowCalendar,
    getCurrentCoachPlan,
    getExtensionHealth,
    getReportExports,
    getSubscriptionCommandCenter,
} from './featureExpansionService.js';

const asRows = (value: unknown): any[] => (Array.isArray(value) ? value : []);

/**
 * Authoritative financial query: Fails fast on database errors.
 * Never converts a database failure into a fake healthy zero state!
 */
const requireRows = async (table: string, userId: string, orderColumn = 'created_at', limit = 500, columns = '*') => {
    const { data, error } = await supabase
        .from(table)
        .select(columns)
        .eq('user_id', userId)
        .order(orderColumn, { ascending: false })
        .limit(limit);

    if (error) {
        throw createError(
            `Authoritative financial query failed on ${table}: ${error.message}`,
            503,
            'DATABASE_ERROR'
        );
    }

    return asRows(data);
};

/**
 * Non-critical optional query: Falls back to empty list on error.
 */
const safeRows = async (table: string, userId: string, orderColumn = 'created_at', limit = 500, columns = '*') => {
    const { data, error } = await supabase
        .from(table)
        .select(columns)
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

const normalizeAmount = (value: unknown): number => {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? Math.abs(amount) : 0;
};

const merchantName = (tx: any): string =>
    tx.merchant_name ||
    tx.store_name ||
    tx.storeName ||
    String(tx.description || 'Unknown merchant').split(/[-|]/)[0].trim() ||
    'Unknown merchant';

/**
 * Authoritative calculation of core financial metrics according to V11 Domain Invariants (INV-07)
 * Safe-to-Spend = max(0, LiquidBalance - CommittedBills - PlannedSavingsAlloc)
 */
export function computeFinancialHealthMetrics(params: {
    totalBalanceMoney: Money;
    monthlyExpenseMoney: Money;
    monthlyIncomeMoney: Money;
    committedMonthlySpendMoney: Money;
    plannedSavingsAllocMoney?: Money;
    dayOfMonth: number;
    transactionCount: number;
    budgetTotalMoney: Money;
}) {
    const {
        totalBalanceMoney,
        monthlyExpenseMoney,
        committedMonthlySpendMoney,
        plannedSavingsAllocMoney = Money.zero(totalBalanceMoney.currency),
        dayOfMonth,
        transactionCount,
        budgetTotalMoney,
    } = params;

    // 1. Safe-to-Spend = max(0, LiquidBalance - CommittedSpend - PlannedSavingsAlloc)
    const safeToSpendCents = Math.max(
        0,
        totalBalanceMoney.cents - committedMonthlySpendMoney.cents - plannedSavingsAllocMoney.cents
    );
    const safeToSpend = Money.fromCents(safeToSpendCents, totalBalanceMoney.currency).toDecimal();

    // 2. Daily Burn Velocity = MonthlyExpense / max(1, DayOfMonth)
    const safeDay = Math.max(1, dayOfMonth);
    const burnVelocity = Math.round((monthlyExpenseMoney.toDecimal() / safeDay) * 100) / 100;

    // 3. Cashflow Runway in Days = LiquidBalance / BurnVelocity
    let runwayDays = 999;
    if (burnVelocity > 0) {
        const balanceDecimal = totalBalanceMoney.toDecimal();
        runwayDays = balanceDecimal > 0 ? Math.max(0, Math.floor(balanceDecimal / burnVelocity)) : 0;
    }

    // 4. Budget Score & Health Score
    const totalBudget = budgetTotalMoney.toDecimal();
    const monthlyExpense = monthlyExpenseMoney.toDecimal();
    const budgetPercentage = totalBudget > 0 ? Math.min(100, Math.round((monthlyExpense / totalBudget) * 100)) : 0;

    const activityScore = Math.min(100, transactionCount * 4);
    const savingsRate = params.monthlyIncomeMoney.cents > 0
        ? Math.max(0, Math.min(100, Math.round(((params.monthlyIncomeMoney.cents - monthlyExpenseMoney.cents) / params.monthlyIncomeMoney.cents) * 100)))
        : 50;
    const budgetScore = totalBudget > 0 ? Math.max(0, 100 - budgetPercentage) : 50;
    const healthScore = transactionCount ? Math.round(activityScore * 0.25 + savingsRate * 0.45 + budgetScore * 0.30) : 50;

    return {
        safeToSpend,
        plannedSavingsReserve: plannedSavingsAllocMoney.toDecimal(),
        burnVelocity,
        runwayDays,
        budgetPercentage,
        healthScore,
    };
}

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
        goals,
        candidatesResult,
        cashflow,
        subscriptions,
        extensionHealth,
        coach,
        reportExports,
    ] = await Promise.all([
        requireRows('transactions', userId, 'date', 500, 'id, user_id, amount, date, created_at, type, description, store_name, category'),
        safeRows('budgets', userId, 'created_at', 100),
        safeRows('cards', userId, 'created_at', 50),
        safeRows('goals', userId, 'created_at', 100),
        safeValue({ data: [], pagination: { total: 0 } }, async () => {
            const { listTransactionCandidates } = await import('./transactionInboxService.js');
            return listTransactionCandidates(userId, { status: 'pending', limit: 5 });
        }),
        safeValue([], () => getCashflowCalendar(userId)),
        safeValue(
            {
                active: [],
                trialsEndingSoon: [],
                priceIncreases: [],
                unusedAlerts: [],
                totals: { activeCount: 0, monthlyCost: 0, yearlyCost: 0 },
            },
            () => getSubscriptionCommandCenter(userId)
        ),
        safeValue(
            {
                sites: [],
                recentEvents: [],
                queuedSyncs: 0,
                failedDetections: 0,
                lastSuccessfulSync: null,
                permissionStatus: 'unknown',
            },
            () => getExtensionHealth(userId)
        ),
        safeValue(null, () => getCurrentCoachPlan(userId)),
        safeValue([], () => getReportExports(userId)),
    ]);

    // Financial summing with Money (integer cents) precision
    let totalIncomeMoney = Money.zero();
    let totalExpenseMoney = Money.zero();
    let monthlyIncomeMoney = Money.zero();
    let monthlyExpenseMoney = Money.zero();
    let lastMonthExpenseMoney = Money.zero();

    const incomeRows: any[] = [];
    const expenseRows: any[] = [];

    for (const tx of transactions) {
        const rawAmount = normalizeAmount(tx.amount);
        const txMoney = Money.fromDecimal(rawAmount);
        const txMonth = monthKey(tx.date || tx.created_at || now);

        if (tx.type === 'income') {
            incomeRows.push(tx);
            totalIncomeMoney = totalIncomeMoney.add(txMoney);
            if (txMonth === currentMonth) {
                monthlyIncomeMoney = monthlyIncomeMoney.add(txMoney);
            }
        } else {
            expenseRows.push(tx);
            totalExpenseMoney = totalExpenseMoney.add(txMoney);
            if (txMonth === currentMonth) {
                monthlyExpenseMoney = monthlyExpenseMoney.add(txMoney);
            } else if (txMonth === lastMonth) {
                lastMonthExpenseMoney = lastMonthExpenseMoney.add(txMoney);
            }
        }
    }

    let totalBudgetMoney = Money.zero();
    for (const b of budgets) {
        totalBudgetMoney = totalBudgetMoney.add(Money.fromDecimal(normalizeAmount(b.amount)));
    }

    const totalBalanceMoney = totalIncomeMoney.subtract(totalExpenseMoney);
    const committedSpendMoney = Money.fromDecimal(subscriptions?.totals?.monthlyCost || 0);

    // Authoritative Planned Savings Allocation (INV-07 & Product Spec)
    let plannedSavingsCents = 0;
    for (const g of goals) {
        // Exclude completed, cancelled, or archived goals
        if (g.is_completed || g.status === 'completed' || g.status === 'cancelled' || g.status === 'archived') {
            continue;
        }
        const target = Number(g.target_amount || g.target || 0);
        const current = Number(g.current_amount || g.saved || 0);
        if (target <= current || target <= 0) {
            continue;
        }
        const remaining = target - current;
        const monthlyTarget = Number(g.monthly_contribution || 0);
        const alloc = monthlyTarget > 0
            ? Math.min(remaining, monthlyTarget)
            : Math.min(remaining, Math.round(target / 10) || 500);

        plannedSavingsCents += Math.round(alloc * 100);
    }
    const plannedSavingsAllocMoney = Money.fromCents(plannedSavingsCents);

    const {
        safeToSpend,
        plannedSavingsReserve,
        burnVelocity,
        runwayDays,
        budgetPercentage,
        healthScore,
    } = computeFinancialHealthMetrics({
        totalBalanceMoney,
        monthlyExpenseMoney,
        monthlyIncomeMoney,
        committedMonthlySpendMoney: committedSpendMoney,
        plannedSavingsAllocMoney,
        dayOfMonth: now.getDate(),
        transactionCount: transactions.length,
        budgetTotalMoney: totalBudgetMoney,
    });

    const groupAmounts = (rows: any[], keyFn: (tx: any) => string) => {
        const map = new Map<string, { name: string; money: Money; count: number }>();
        rows.forEach((tx) => {
            const key = keyFn(tx) || 'Other';
            const current = map.get(key) || { name: key, money: Money.zero(), count: 0 };
            current.money = current.money.add(Money.fromDecimal(normalizeAmount(tx.amount)));
            current.count += 1;
            map.set(key, current);
        });
        return [...map.values()]
            .map((item) => ({
                name: item.name,
                amount: item.money.toDecimal(),
                count: item.count,
            }))
            .sort((a, b) => b.amount - a.amount);
    };

    const chart = Array.from({ length: 14 }, (_, index) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (13 - index));
        const key = toDateKey(date);
        const rows = transactions.filter((tx) => String(tx.date || tx.created_at || '').startsWith(key));

        let dayIncome = Money.zero();
        let dayExpense = Money.zero();
        for (const tx of rows) {
            const txMoney = Money.fromDecimal(normalizeAmount(tx.amount));
            if (tx.type === 'income') {
                dayIncome = dayIncome.add(txMoney);
            } else {
                dayExpense = dayExpense.add(txMoney);
            }
        }

        return {
            date: key,
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            income: dayIncome.toDecimal(),
            expense: dayExpense.toDecimal(),
        };
    });

    const categoryBreakdown = groupAmounts(expenseRows, (tx) => tx.category || 'Other').slice(0, 6);
    const merchantBreakdown = groupAmounts(expenseRows, merchantName).slice(0, 5);

    const upcomingCashflow = cashflow
        .filter((event: any) => event.date && new Date(event.date) >= new Date(today))
        .slice(0, 6);

    const lastMonthExpense = lastMonthExpenseMoney.toDecimal();
    const monthlyExpense = monthlyExpenseMoney.toDecimal();
    const expenseTrend = lastMonthExpense > 0
        ? Math.round(((monthlyExpense - lastMonthExpense) / lastMonthExpense) * 1000) / 10
        : 0;

    return {
        generatedAt: new Date().toISOString(),
        stats: {
            totalBalance: totalBalanceMoney.toDecimal(),
            totalIncome: totalIncomeMoney.toDecimal(),
            totalExpense: totalExpenseMoney.toDecimal(),
            monthlyIncome: monthlyIncomeMoney.toDecimal(),
            monthlyExpense,
            safeToSpend,
            plannedSavingsReserve,
            burnVelocity,
            runwayDays,
            committedSpend: committedSpendMoney.toDecimal(),
            discretionaryHeadroom: safeToSpend,
            transactionsToday: transactions.filter((tx) => String(tx.date || tx.created_at || '').startsWith(today)).length,
            transactionCount: transactions.length,
            cardCount: cards.length,
            healthScore,
            budgetUsed: monthlyExpense,
            budgetTotal: totalBudgetMoney.toDecimal(),
            budgetPercentage,
            expenseTrend,
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
