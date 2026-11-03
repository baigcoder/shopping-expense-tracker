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
            const d = new Date(g.deadline);
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
