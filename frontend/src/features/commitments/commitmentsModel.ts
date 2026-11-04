// Bills, subscriptions and trials as one list of commitments, for the live page and the demo.

export type CommitmentKind = 'subscription' | 'bill';
export type Cycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time';

export interface CommitmentInput {
    id: string;
    kind: CommitmentKind;
    name: string;
    category: string;
    amount: number;
    cycle: Cycle;
    nextDate: string | null; // next charge, renewal or due date (trial end for trials)
    active: boolean; // subscription not cancelled, bill not paid-off one-time
    isTrial?: boolean;
    paid?: boolean; // bills only
}

export interface CommitmentLine extends CommitmentInput { monthly: number; daysUntil: number | null }

export interface CommitmentsModel {
    lines: CommitmentLine[];
    monthly: number;
    yearly: number;
    next7: { count: number; amount: number };
    overdue: { count: number; amount: number }; // unpaid bills past their due date
    trials: CommitmentLine[];
    month: { day: number; items: CommitmentLine[] }[]; // next 30 days, for the strip
}

const DAY = 86400000;
const localDay = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
const step = (d: Date, cycle: Cycle) => (cycle === 'weekly' ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
    : new Date(d.getFullYear(), d.getMonth() + (cycle === 'quarterly' ? 3 : cycle === 'yearly' ? 12 : 1), d.getDate()));
const perMonth: Record<Cycle, number> = { weekly: 4, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12, 'one-time': 0 };

export function buildCommitments(items: CommitmentInput[], now = new Date()): CommitmentsModel {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lines = items.map((c) => {
        let due = c.nextDate ? localDay(c.nextDate) : null;
        // Subscriptions renew on their own: a stale renewal date rolls forward instead of reading "overdue".
        if (due && c.kind === 'subscription' && c.cycle !== 'one-time') while (due.getTime() < today) due = step(due, c.cycle);
        const daysUntil = due ? Math.round((due.getTime() - today) / DAY) : null;
        // A trial costs nothing until it converts; an unpaid one-time bill counts once.
        const monthly = !c.active || c.isTrial ? 0 : c.cycle === 'one-time' ? (c.paid ? 0 : c.amount) : c.amount * perMonth[c.cycle];
        return { ...c, monthly, daysUntil };
    }).sort((a, b) => (a.daysUntil ?? 9999) - (b.daysUntil ?? 9999));

    const live = lines.filter((l) => l.active && !(l.kind === 'bill' && l.paid && l.cycle === 'one-time'));
    const soon = live.filter((l) => l.daysUntil !== null && l.daysUntil >= 0 && l.daysUntil <= 7);
    const late = live.filter((l) => l.kind === 'bill' && !l.paid && l.daysUntil !== null && l.daysUntil < 0);
    const monthly = lines.reduce((s, l) => s + l.monthly, 0);

    return {
        lines,
        monthly,
        yearly: monthly * 12,
        next7: { count: soon.length, amount: soon.reduce((s, l) => s + l.amount, 0) },
        overdue: { count: late.length, amount: late.reduce((s, l) => s + l.amount, 0) },
        trials: live.filter((l) => l.isTrial),
        month: Array.from({ length: 30 }, (_, day) => ({ day, items: live.filter((l) => l.daysUntil === day) })),
    };
}
