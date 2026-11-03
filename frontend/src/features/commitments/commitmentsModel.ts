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
    trials: CommitmentLine[];
    month: { day: number; items: CommitmentLine[] }[]; // next 30 days, for the strip
}

const DAY = 86400000;
const perMonth: Record<Cycle, number> = { weekly: 4, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12, 'one-time': 0 };

export function buildCommitments(items: CommitmentInput[], now = new Date()): CommitmentsModel {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lines = items.map((c) => {
        const daysUntil = c.nextDate ? Math.round((new Date(c.nextDate).setHours(0, 0, 0, 0) - today) / DAY) : null;
        // A trial costs nothing until it converts; an unpaid one-time bill counts once.
        const monthly = !c.active || c.isTrial ? 0 : c.cycle === 'one-time' ? (c.paid ? 0 : c.amount) : c.amount * perMonth[c.cycle];
        return { ...c, monthly, daysUntil };
    }).sort((a, b) => (a.daysUntil ?? 9999) - (b.daysUntil ?? 9999));

    const live = lines.filter((l) => l.active && !(l.kind === 'bill' && l.paid && l.cycle === 'one-time'));
    const soon = live.filter((l) => l.daysUntil !== null && l.daysUntil >= 0 && l.daysUntil <= 7);
    const monthly = lines.reduce((s, l) => s + l.monthly, 0);

    return {
        lines,
        monthly,
        yearly: monthly * 12,
        next7: { count: soon.length, amount: soon.reduce((s, l) => s + l.amount, 0) },
        trials: live.filter((l) => l.isTrial),
        month: Array.from({ length: 30 }, (_, day) => ({ day, items: live.filter((l) => l.daysUntil === day) })),
    };
}
