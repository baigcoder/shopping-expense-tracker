export interface GoalInput { id: string; name: string; target: number; saved: number; deadline?: string | null }

export interface GoalLine extends GoalInput {
    pct: number;
    left: number;
    monthsLeft: number | null; // null when there is no deadline
    perMonth: number | null; // what to set aside each month to finish on time
    done: boolean;
    late: boolean; // deadline passed and not done
}

export function buildGoals(goals: GoalInput[], now = new Date()): { lines: GoalLine[]; saved: number; target: number; perMonth: number } {
    const lines = goals.map((g) => {
        const left = Math.max(0, g.target - g.saved);
        const done = left === 0 && g.target > 0;
        let monthsLeft: number | null = null;
        if (g.deadline) {
            const [y, mo, da] = g.deadline.slice(0, 10).split('-').map(Number);
            const d = new Date(y, mo - 1, da); // local day: "2026-12-31" must not become the 30th in UTC-5
            monthsLeft = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()) + (d.getDate() >= now.getDate() ? 0 : -1);
        }
        const late = !done && monthsLeft !== null && monthsLeft < 0;
        // Count the current month, so a deadline later this month still means one payment.
        const perMonth = done || monthsLeft === null || late ? null : Math.ceil(left / Math.max(1, monthsLeft + 1));
        return { ...g, pct: g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0, left, monthsLeft, perMonth, done, late };
    }).sort((a, b) => Number(a.done) - Number(b.done) || (a.monthsLeft ?? 999) - (b.monthsLeft ?? 999));

    return {
        lines,
        saved: goals.reduce((s, g) => s + g.saved, 0),
        target: goals.reduce((s, g) => s + g.target, 0),
        perMonth: lines.reduce((s, l) => s + (l.perMonth || 0), 0),
    };
}

export interface KeptTx { date: string; amount: number; type: 'income' | 'expense' }

/**
 * What the user usually keeps a month (money in minus money out), averaged over the last three
 * finished months that have any activity. Null until there is a finished month to go on.
 */
export function monthlyKept(transactions: KeptTx[], now = new Date()): number | null {
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const byMonth = new Map<string, number>();
    for (const t of transactions) {
        const key = t.date.slice(0, 7);
        if (key >= thisMonth) continue;
        byMonth.set(key, (byMonth.get(key) || 0) + (t.type === 'income' ? 1 : -1) * Math.abs(t.amount));
    }
    const recent = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 3);
    return recent.length ? Math.round(recent.reduce((s, [, v]) => s + v, 0) / recent.length) : null;
}
