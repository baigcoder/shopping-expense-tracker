// Budgets for the current month, fed by live data (BudgetsPage) or sample data (demo).

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

export interface BudgetModel {
    day: number;
    daysInMonth: number;
    monthProgress: number; // 0-100, share of the month gone
    lines: BudgetLine[];
    total: number;
    spent: number;
    projected: number;
}

// Same matching the page always used: exact, or one category name containing the other.
const matches = (budgetCat: string, txCat: string) => {
    const b = budgetCat.toLowerCase(), t = (txCat || 'other').toLowerCase();
    return b === t || b.includes(t) || t.includes(b);
};

export function buildBudgets(budgets: BudgetInput[], transactions: BudgetTx[], now = new Date()): BudgetModel {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const day = now.getDate();
    const monthProgress = (day / daysInMonth) * 100;

    const spentBy: Record<string, number> = {};
    for (const t of transactions) {
        const d = new Date(t.date);
        if (t.type !== 'expense' || d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) continue;
        const b = budgets.find((x) => matches(x.category, t.category));
        if (b) spentBy[b.category] = (spentBy[b.category] || 0) + Math.abs(t.amount);
    }

    const lines = budgets.map((b) => {
        const spent = spentBy[b.category] || 0;
        const progress = b.amount > 0 ? (spent / b.amount) * 100 : 0;
        const projected = day > 0 ? (spent / day) * daysInMonth : spent;
        // "fast" when the share used runs 12 points ahead of the share of month gone, or past 85%.
        const pace: Pace = spent >= b.amount ? 'over' : progress > monthProgress + 12 || progress >= 85 ? 'fast' : 'ok';
        return { ...b, spent, remaining: b.amount - spent, progress, projected, pace };
    }).sort((a, b) => b.progress - a.progress);

    const total = budgets.reduce((s, b) => s + b.amount, 0);
    const spent = lines.reduce((s, l) => s + l.spent, 0);
    return { day, daysInMonth, monthProgress, lines, total, spent, projected: day > 0 ? (spent / day) * daysInMonth : spent };
}
