// Budgets for the current month, fed by live data (BudgetsPage) or sample data (demo).
import { categoryGroup } from '@/components/app/categoryTint';

export interface BudgetInput { id: string; category: string; amount: number }
export interface BudgetTx { date: string; amount: number; type: 'income' | 'expense'; category: string }

export type Pace = 'over' | 'fast' | 'ok';

export interface BudgetLine extends BudgetInput {
    spent: number;
    remaining: number;
    progress: number; // 0-100+, share of the budget used
    projected: number; // month-end spend at the current pace
    pace: Pace;
}

/** Spending with no budget, and a limit to suggest: last month's spend or this month's pace, rounded up. */
export interface Unbudgeted { category: string; spent: number; suggested: number }

export interface BudgetModel {
    day: number;
    daysInMonth: number;
    monthProgress: number; // 0-100, share of the month gone
    lines: BudgetLine[];
    total: number;
    spent: number;
    projected: number;
    unbudgeted: Unbudgeted[];
}

const localDay = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };

// Exact or one name inside the other ("Health" / "Healthcare"), or the same family ("Food" / "Groceries").
export const budgetMatches = (budgetCat: string, txCat: string) => {
    const b = budgetCat.toLowerCase(), t = (txCat || 'other').toLowerCase();
    if (b === t || b.includes(t) || t.includes(b)) return true;
    const g = categoryGroup(budgetCat);
    return g !== 'other' && g === categoryGroup(txCat);
};

// Before this day one early purchase would project a wild month-end figure, so pace alone does not warn yet.
const PACE_FROM_DAY = 5;
const roundUp = (n: number) => Math.ceil(n / 1000) * 1000;

export function buildBudgets(budgets: BudgetInput[], transactions: BudgetTx[], now = new Date()): BudgetModel {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const day = now.getDate();
    const monthProgress = (day / daysInMonth) * 100;
    const inMonth = (d: Date, offset: number) => {
        const ref = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
    };

    const spentBy: Record<string, number> = {};
    const loose = new Map<string, { now: number; last: number }>();
    for (const t of transactions) {
        if (t.type !== 'expense') continue;
        const d = localDay(t.date);
        const thisMonth = inMonth(d, 0);
        if (!thisMonth && !inMonth(d, -1)) continue;
        const b = budgets.find((x) => budgetMatches(x.category, t.category));
        if (b) {
            if (thisMonth) spentBy[b.category] = (spentBy[b.category] || 0) + Math.abs(t.amount);
            continue;
        }
        const key = t.category || 'Other';
        const v = loose.get(key) || { now: 0, last: 0 };
        v[thisMonth ? 'now' : 'last'] += Math.abs(t.amount);
        loose.set(key, v);
    }

    const lines = budgets.map((b) => {
        const spent = spentBy[b.category] || 0;
        const progress = b.amount > 0 ? (spent / b.amount) * 100 : 0;
        const projected = day > 0 ? (spent / day) * daysInMonth : spent;
        const pace: Pace = spent >= b.amount ? 'over' : (day >= PACE_FROM_DAY && projected > b.amount * 1.05) || progress >= 85 ? 'fast' : 'ok';
        return { ...b, spent, remaining: b.amount - spent, progress, projected, pace };
    }).sort((a, b) => b.progress - a.progress);

    const unbudgeted = [...loose.entries()]
        // Last month's real total beats a pace projection, which would treat a one-off like rent as daily spending.
        .map(([category, v]) => ({ category, spent: v.now, suggested: roundUp(v.last > 0 ? Math.max(v.last, v.now) : day >= PACE_FROM_DAY ? (v.now / day) * daysInMonth : v.now) }))
        .filter((u) => u.suggested > 0)
        .sort((a, b) => b.suggested - a.suggested)
        .slice(0, 4);

    const total = budgets.reduce((s, b) => s + b.amount, 0);
    const spent = lines.reduce((s, l) => s + l.spent, 0);
    return { day, daysInMonth, monthProgress, lines, total, spent, projected: day > 0 ? (spent / day) * daysInMonth : spent, unbudgeted };
}
