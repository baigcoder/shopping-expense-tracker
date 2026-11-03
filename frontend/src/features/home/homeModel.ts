// One model for the Home screen, fed by live data (DashboardPage) or sample data (demo).

export interface HomeTransaction {
    id: string;
    date: string; // YYYY-MM-DD or ISO
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
}

export interface HomeBudget {
    category: string;
    amount: number;
}

export interface HomeSubscription {
    id: string;
    name: string;
    price: number;
    is_active: boolean;
    is_trial?: boolean;
    next_payment_date?: string | null;
    trial_end_date?: string | null;
}

export interface HomeGoal {
    target: number;
    saved: number;
}

export interface HomePending {
    id: string;
    merchant: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    source: string;
}

export interface HomeInput {
    transactions: HomeTransaction[];
    budgets: HomeBudget[];
    subscriptions: HomeSubscription[];
    goals: HomeGoal[];
    pending: HomePending[];
    now?: Date;
}

export interface CategoryLine {
    category: string;
    spent: number;
    budget: number | null;
}

export interface UpcomingLine {
    id: string;
    name: string;
    amount: number;
    date: string;
    daysUntil: number;
    isTrial: boolean;
}

export interface PendingLine extends HomePending {
    safeAfter: number;
}

export interface HomeModel {
    balance: number;
    monthIn: number;
    monthOut: number;
    lastMonthOut: number;
    committed30: number;
    plannedSavings: number;
    safeToSpend: number;
    runwayDays: number | null;
    budgetTotal: number;
    budgetUsed: number;
    categories: CategoryLine[];
    upcoming: UpcomingLine[];
    recent: HomeTransaction[];
    daily: { date: string; spent: number }[];
    pending: PendingLine[];
}

const DAY = 24 * 60 * 60 * 1000;

const sameMonth = (iso: string, ref: Date) => {
    const d = new Date(iso);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
};

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function buildHomeModel({ transactions, budgets, subscriptions, goals, pending, now = new Date() }: HomeInput): HomeModel {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const income = transactions.filter((t) => t.type === 'income');
    const sum = (list: HomeTransaction[]) => list.reduce((s, t) => s + Math.abs(t.amount), 0);

    const balance = sum(income) - sum(expenses);
    const monthIn = sum(income.filter((t) => sameMonth(t.date, now)));
    const monthOut = sum(expenses.filter((t) => sameMonth(t.date, now)));
    const lastMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const lastMonthOut = sum(expenses.filter((t) => sameMonth(t.date, lastMonthRef)));

    // Same formula the dashboard has always used: balance - next 30 days of commitments - planned savings.
    const committed30 = subscriptions.filter((s) => s.is_active).reduce((s, sub) => s + (sub.price || 0), 0);
    const plannedSavings = goals
        .filter((g) => g.target > g.saved)
        .reduce((s, g) => s + Math.min(g.target - g.saved, Math.round(g.target / 10) || 500), 0);
    const safeToSpend = Math.max(0, balance - committed30 - plannedSavings);

    const since30 = now.getTime() - 30 * DAY;
    const spent30 = sum(expenses.filter((t) => new Date(t.date).getTime() >= since30));
    const dailyBurn = spent30 / 30;
    const runwayDays = dailyBurn > 0 ? Math.floor(safeToSpend / dailyBurn) : null;

    const budgetTotal = budgets.reduce((s, b) => s + b.amount, 0);
    const monthExpenses = expenses.filter((t) => sameMonth(t.date, now));
    const byCategory = new Map<string, number>();
    for (const t of monthExpenses) byCategory.set(t.category || 'Other', (byCategory.get(t.category || 'Other') || 0) + Math.abs(t.amount));
    for (const b of budgets) if (!byCategory.has(b.category)) byCategory.set(b.category, 0);
    const categories = [...byCategory.entries()]
        .map(([category, spent]) => ({ category, spent, budget: budgets.find((b) => b.category === category)?.amount ?? null }))
        .sort((a, b) => b.spent - a.spent);
    const budgetUsed = categories.filter((c) => c.budget !== null).reduce((s, c) => s + c.spent, 0);

    const upcoming = subscriptions
        .filter((s) => s.is_active && (s.next_payment_date || s.trial_end_date))
        .map((s) => {
            const date = (s.is_trial && s.trial_end_date) || s.next_payment_date || '';
            return {
                id: s.id,
                name: s.name,
                amount: s.price,
                date,
                daysUntil: Math.ceil((new Date(date).getTime() - now.getTime()) / DAY),
                isTrial: Boolean(s.is_trial),
            };
        })
        .filter((u) => u.daysUntil >= 0 && u.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil);

    const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

    const daily = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(now.getTime() - (13 - i) * DAY);
        const key = dayKey(d);
        return { date: key, spent: sum(expenses.filter((t) => t.date.slice(0, 10) === key)) };
    });

    // Approving items in order lowers what is safe to spend; show each item's effect before the user commits.
    let running = safeToSpend;
    const pendingLines = pending.map((p) => {
        running = Math.max(0, running - Math.abs(p.amount));
        return { ...p, safeAfter: running };
    });

    return {
        balance, monthIn, monthOut, lastMonthOut, committed30, plannedSavings, safeToSpend, runwayDays,
        budgetTotal, budgetUsed, categories, upcoming, recent, daily, pending: pendingLines,
    };
}
