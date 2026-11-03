// A month of money: what was spent on past days, what is scheduled on coming days.
export interface CalTx { id: string; date: string; description: string; amount: number; type: 'income' | 'expense' }
export interface CalCharge { id: string; name: string; amount: number; nextDate: string | null; cycle: string; active: boolean; isTrial?: boolean }

export interface CalEntry { id: string; label: string; amount: number; kind: 'spent' | 'income' | 'due' | 'trial' }
export interface CalDay { date: string; inMonth: boolean; isToday: boolean; isPast: boolean; entries: CalEntry[]; out: number; in: number }

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const STEP: Record<string, number> = { weekly: 7, monthly: 30, quarterly: 91, yearly: 365 };

/** Weeks start on Monday. `month` is any date inside the month to show. */
export function buildCalendar(transactions: CalTx[], charges: CalCharge[], month: Date, now = new Date()): { weeks: CalDay[][]; out: number; in: number; due: number } {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const start = new Date(first); start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const today = iso(now);

    const byDay = new Map<string, CalEntry[]>();
    const put = (day: string, e: CalEntry) => byDay.set(day, [...(byDay.get(day) || []), e]);
    for (const t of transactions) put(t.date.slice(0, 10), { id: t.id, label: t.description, amount: Math.abs(t.amount), kind: t.type === 'income' ? 'income' : 'spent' });

    // Scheduled charges from today on, repeated through the shown month by their cycle.
    for (const c of charges) {
        if (!c.active || !c.nextDate) continue;
        const step = STEP[c.cycle];
        for (let d = new Date(c.nextDate); d <= last; d = new Date(d.getTime() + (step || Infinity) * 86400000)) {
            const key = iso(d);
            if (key >= today && d >= start) put(key, { id: `${c.id}-${key}`, label: c.name, amount: c.amount, kind: c.isTrial ? 'trial' : 'due' });
            if (!step) break;
        }
    }

    const weeks: CalDay[][] = [];
    let out = 0, inn = 0, due = 0;
    for (let d = new Date(start); d <= last || weeks[weeks.length - 1]?.length !== 7; d.setDate(d.getDate() + 1)) {
        const key = iso(d);
        const entries = byDay.get(key) || [];
        const inMonth = d.getMonth() === month.getMonth();
        const dayOut = entries.filter((e) => e.kind === 'spent').reduce((s, e) => s + e.amount, 0);
        const dayIn = entries.filter((e) => e.kind === 'income').reduce((s, e) => s + e.amount, 0);
        if (inMonth) { out += dayOut; inn += dayIn; due += entries.filter((e) => e.kind === 'due' || e.kind === 'trial').reduce((s, e) => s + e.amount, 0); }
        if (!weeks.length || weeks[weeks.length - 1].length === 7) weeks.push([]);
        weeks[weeks.length - 1].push({ date: key, inMonth, isToday: key === today, isPast: key < today, entries, out: dayOut, in: dayIn });
        if (d > last && weeks[weeks.length - 1].length === 7) break;
    }
    return { weeks, out, in: inn, due };
}
