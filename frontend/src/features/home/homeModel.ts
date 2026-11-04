// One model for the Home screen, fed by live data (DashboardPage) or sample data (demo).
import type { CommitmentInput } from '../commitments/commitmentsModel';
import { buildGoals } from '../goals/goalsModel';

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

export interface HomeGoal {
    target: number;
    saved: number;
    deadline?: string | null;
}

export interface HomePending {
    id: string;
    merchant: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    source: string;
    type?: 'income' | 'expense'; // a refund or payment in raises safe to spend instead of lowering it
}

export interface HomeInput {
    transactions: HomeTransaction[];
    budgets: HomeBudget[];
    commitments: CommitmentInput[]; // bills and subscriptions, from the shared commitments model
    goals: HomeGoal[];
    pending: HomePending[];
    /** Sum of the user's accounts (what they have minus card debt); null falls back to the ledger. */
    accountsBalance?: number | null;
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
    kind: 'subscription' | 'bill';
}

export interface PendingLine extends HomePending {
    safeAfter: number;
}

export interface HomeModel {
    balance: number;
    balanceFrom: 'accounts' | 'ledger';
    isNew: boolean; // nothing recorded yet: show setup instead of empty numbers
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

// Local calendar days, so a purchase at 11 pm in Karachi stays on its own day.
const localDay = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const sameMonth = (iso: string, ref: Date) => { const d = localDay(iso); return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth(); };
const MONTHS: Record<string, number> = { monthly: 1, quarterly: 3, yearly: 12 };

/** Every charge of a commitment from today through `horizon` days. An unpaid bill already past due counts as due today. */
export function chargesWithin(c: CommitmentInput, today: Date, horizon: number): number[] {
    if (!c.active || c.paid || !c.nextDate) return [];
    const end = today.getTime() + horizon * DAY;
    let d = localDay(c.nextDate);
    const step = (x: Date) => (c.cycle === 'weekly' ? new Date(x.getFullYear(), x.getMonth(), x.getDate() + 7) : new Date(x.getFullYear(), x.getMonth() + (MONTHS[c.cycle] || 0), x.getDate()));
    if (d < today) {
        if (c.cycle === 'one-time') return c.kind === 'bill' ? [0] : [];
        while (d < today) d = step(d);
    }
    const out: number[] = [];
    for (; d.getTime() <= end; d = step(d)) {
        out.push(Math.round((d.getTime() - today.getTime()) / DAY));
        if (c.cycle === 'one-time') break;
    }
    return out;
}

export function buildHomeModel({ transactions, budgets, commitments, goals, pending, accountsBalance = null, now = new Date() }: HomeInput): HomeModel {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expenses = transactions.filter((t) => t.type === 'expense');
    const income = transactions.filter((t) => t.type === 'income');
    const sum = (list: HomeTransaction[]) => list.reduce((s, t) => s + Math.abs(t.amount), 0);

    const balanceFrom = accountsBalance !== null ? 'accounts' : 'ledger';
    const balance = accountsBalance ?? sum(income) - sum(expenses);
    const monthIn = sum(income.filter((t) => sameMonth(t.date, now)));
    const monthOut = sum(expenses.filter((t) => sameMonth(t.date, now)));
    const lastMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const lastMonthOut = sum(expenses.filter((t) => sameMonth(t.date, lastMonthRef)));

    // Safe to spend = balance - every bill and subscription charge due in the next 30 days - this month's goal amounts.
    const due = commitments.map((c) => ({ c, days: chargesWithin(c, today, 30) }));
    const committed30 = due.reduce((s, { c, days }) => s + c.amount * days.length, 0);
    const plannedSavings = buildGoals(goals.map((g, i) => ({ id: String(i), name: '', ...g })), now).perMonth;
    const safeToSpend = Math.max(0, balance - committed30 - plannedSavings);

    const since30 = today.getTime() - 29 * DAY;
    const spent30 = sum(expenses.filter((t) => localDay(t.date).getTime() >= since30));
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

    const upcoming = due
        .filter(({ days }) => days.length > 0)
        .map(({ c, days }) => ({
            id: c.id, name: c.name, amount: c.amount, kind: c.kind, isTrial: Boolean(c.isTrial),
            daysUntil: days[0], date: dayKey(new Date(today.getTime() + days[0] * DAY)),
        }))
        .sort((a, b) => a.daysUntil - b.daysUntil);

    const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

    const daily = Array.from({ length: 14 }, (_, i) => {
        const key = dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (13 - i)));
        return { date: key, spent: sum(expenses.filter((t) => t.date.slice(0, 10) === key)) };
    });

    // Approving items in order lowers what is safe to spend; show each item's effect before the user commits.
    let running = safeToSpend;
    const pendingLines = pending.map((p) => {
        running = Math.max(0, running + (p.type === 'income' ? 1 : -1) * Math.abs(p.amount));
        return { ...p, safeAfter: running };
    });

    return {
        balance, balanceFrom, isNew: transactions.length === 0 && pending.length === 0 && accountsBalance === null,
        monthIn, monthOut, lastMonthOut, committed30, plannedSavings, safeToSpend, runwayDays,
        budgetTotal, budgetUsed, categories, upcoming, recent, daily, pending: pendingLines,
    };
}
