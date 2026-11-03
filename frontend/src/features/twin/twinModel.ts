// Money Twin: the next 60 days of balance, from the same inputs Home uses, with three what-ifs.

export interface TwinTx { date: string; amount: number; type: 'income' | 'expense'; category: string; description?: string }
export interface TwinCharge { id: string; name: string; amount: number; daysUntil: number | null; cycle: string; kind: 'subscription' | 'bill'; active: boolean; isTrial?: boolean }

export interface WhatIf { cutCategory: string | null; cutAmount: number; cancelled: string[]; purchase: number }

export interface TwinModel {
    days: { day: number; balance: number }[];
    runwayDays: number | null; // first day the balance goes below zero, or null if it never does in 60 days
    dailyBurn: number;
    lowest: { day: number; balance: number };
    monthlySaved: number; // how much the what-ifs save per month
    categories: { category: string; monthly: number }[];
}

const DAY = 86400000;
const HORIZON = 60;

export function buildTwin(transactions: TwinTx[], charges: TwinCharge[], whatIf: WhatIf, now = new Date()): TwinModel {
    const income = transactions.filter((t) => t.type === 'income');
    const expenses = transactions.filter((t) => t.type === 'expense');
    const balance = income.reduce((s, t) => s + t.amount, 0) - expenses.reduce((s, t) => s + Math.abs(t.amount), 0);

    // Day-to-day spending pace over the last 30 days, leaving out scheduled charges (they are placed on their own days).
    const since = now.getTime() - 30 * DAY;
    const scheduled = new Set(charges.map((c) => c.name.toLowerCase()));
    const recent = expenses.filter((t) => new Date(t.date).getTime() >= since && !scheduled.has((t.description || '').toLowerCase()));
    const byCat = new Map<string, number>();
    for (const t of recent) byCat.set(t.category, (byCat.get(t.category) || 0) + Math.abs(t.amount));
    const categories = [...byCat.entries()].map(([category, monthly]) => ({ category, monthly })).sort((a, b) => b.monthly - a.monthly);

    const cut = whatIf.cutCategory ? Math.min(whatIf.cutAmount, byCat.get(whatIf.cutCategory) || 0) : 0;
    const dailyBurn = Math.max(0, ([...byCat.values()].reduce((s, v) => s + v, 0) - cut) / 30);

    // A month's income (everything received in the last 30 days) arrives again on the day the largest payment came.
    const recentIncome = income.filter((t) => new Date(t.date).getTime() >= since);
    const biggest = [...recentIncome].sort((a, b) => b.amount - a.amount)[0];
    const payDay = biggest ? new Date(biggest.date).getDate() : null;
    const monthlyIncome = recentIncome.reduce((s, t) => s + t.amount, 0);

    const live = charges.filter((c) => c.active && !whatIf.cancelled.includes(c.id) && c.daysUntil !== null);
    const cancelledMonthly = charges.filter((c) => whatIf.cancelled.includes(c.id)).reduce((s, c) => s + (c.cycle === 'yearly' ? c.amount / 12 : c.cycle === 'weekly' ? c.amount * 4 : c.amount), 0);

    let bal = balance - whatIf.purchase;
    const days: { day: number; balance: number }[] = [{ day: 0, balance: bal }];
    for (let d = 1; d <= HORIZON; d++) {
        const date = new Date(now.getTime() + d * DAY);
        bal -= dailyBurn;
        if (payDay !== null && date.getDate() === payDay) bal += monthlyIncome;
        for (const c of live) {
            const first = c.daysUntil!;
            const step = c.cycle === 'weekly' ? 7 : c.cycle === 'yearly' ? 365 : c.cycle === 'one-time' ? Infinity : 30;
            if (d >= first && (d - first) % step === 0) bal -= c.amount;
        }
        days.push({ day: d, balance: Math.round(bal) });
    }

    const below = days.find((p) => p.balance < 0);
    const lowest = days.reduce((m, p) => (p.balance < m.balance ? p : m), days[0]);
    return { days, runwayDays: below ? below.day : null, dailyBurn, lowest, monthlySaved: Math.round(cut + cancelledMonthly), categories };
}
