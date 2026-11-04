// A month of money: what was spent on past days, what is scheduled on coming days.
import type { CommitmentInput } from '../commitments/commitmentsModel';
import { chargesWithin } from '../home/homeModel';

export interface CalTx { id: string; date: string; description: string; amount: number; type: 'income' | 'expense' }
export type CalCharge = CommitmentInput;

export interface CalEntry { id: string; label: string; amount: number; kind: 'spent' | 'income' | 'due' | 'trial' | 'overdue' }
export interface CalDay { date: string; inMonth: boolean; isToday: boolean; isPast: boolean; entries: CalEntry[]; out: number; in: number }

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const DAY = 86400000;

/** Weeks start on Monday. `month` is any date inside the month to show. */
export function buildCalendar(transactions: CalTx[], charges: CalCharge[], month: Date, now = new Date()): { weeks: CalDay[][]; out: number; in: number; due: number } {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const start = new Date(first); start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const today = iso(now);

    const byDay = new Map<string, CalEntry[]>();
    const put = (day: string, e: CalEntry) => byDay.set(day, [...(byDay.get(day) || []), e]);
    for (const t of transactions) put(t.date.slice(0, 10), { id: t.id, label: t.description, amount: Math.abs(t.amount), kind: t.type === 'income' ? 'income' : 'spent' });

    // Scheduled charges from today to the end of the grid, on the same calendar-month schedule Home uses.
    const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const gridEnd = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 6);
    const horizon = Math.round((gridEnd.getTime() - day0.getTime()) / DAY);
    for (const c of charges) {
        // An unpaid bill whose date has passed sits on today as overdue, so it is not lost.
        const overdue = c.kind === 'bill' && c.active && !c.paid && !!c.nextDate && c.nextDate.slice(0, 10) < today;
        if (overdue) put(today, { id: `${c.id}-overdue`, label: c.name, amount: c.amount, kind: 'overdue' });
        if (horizon < 0) continue;
        for (const offset of chargesWithin(c, day0, horizon)) {
            if (overdue && offset === 0 && c.cycle === 'one-time') continue;
            const key = iso(new Date(day0.getFullYear(), day0.getMonth(), day0.getDate() + offset));
            put(key, { id: `${c.id}-${key}`, label: c.name, amount: c.amount, kind: c.isTrial ? 'trial' : 'due' });
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
        if (inMonth) { out += dayOut; inn += dayIn; due += entries.filter((e) => e.kind === 'due' || e.kind === 'trial' || e.kind === 'overdue').reduce((s, e) => s + e.amount, 0); }
        if (!weeks.length || weeks[weeks.length - 1].length === 7) weeks.push([]);
        weeks[weeks.length - 1].push({ date: key, inMonth, isToday: key === today, isPast: key < today, entries, out: dayOut, in: dayIn });
        if (d > last && weeks[weeks.length - 1].length === 7) break;
    }
    return { weeks, out, in: inn, due };
}
