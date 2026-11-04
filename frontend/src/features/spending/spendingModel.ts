// Where the money went in a period, against the same stretch of the period before.
export interface SpendTx { id: string; date: string; description: string; amount: number; type: 'income' | 'expense'; category: string }
export type SpendPeriod = 'week' | 'month' | 'year';

export interface SpendingModel {
    total: number; previous: number; count: number;
    bars: { key: string; label: string; value: number; future: boolean }[];
    categories: { name: string; amount: number; share: number }[];
    merchants: { name: string; amount: number; count: number }[];
}

const DAY = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Ranges are [from, to) in local days; "previous" covers the same number of days one period earlier. */
function ranges(period: SpendPeriod, now: Date) {
    const today = startOfDay(now);
    const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
    const end = new Date(y, m, d + 1);
    if (period === 'week') return { from: new Date(y, m, d - 6), to: end, prevFrom: new Date(y, m, d - 13), prevTo: new Date(y, m, d - 6) };
    // Same days of the earlier period, clamped: 31 March compares with all of February, never with 3 March.
    const upTo = (yy: number, mm: number) => new Date(yy, mm, Math.min(d, new Date(yy, mm + 1, 0).getDate()) + 1);
    if (period === 'month') return { from: new Date(y, m, 1), to: end, prevFrom: new Date(y, m - 1, 1), prevTo: upTo(y, m - 1) };
    return { from: new Date(y, 0, 1), to: end, prevFrom: new Date(y - 1, 0, 1), prevTo: upTo(y - 1, m) };
}

export function buildSpending(transactions: SpendTx[], period: SpendPeriod, now = new Date()): SpendingModel {
    const r = ranges(period, now);
    const day = (t: SpendTx) => new Date(`${t.date.slice(0, 10)}T00:00`);
    const spent = transactions.filter((t) => t.type === 'expense');
    const inRange = spent.filter((t) => day(t) >= r.from && day(t) < r.to);
    const previous = spent.filter((t) => day(t) >= r.prevFrom && day(t) < r.prevTo).reduce((s, t) => s + Math.abs(t.amount), 0);
    const total = inRange.reduce((s, t) => s + Math.abs(t.amount), 0);

    // Bars: days for a week or month (the whole month, coming days empty), months for a year.
    const bars: SpendingModel['bars'] = [];
    const today = iso(now);
    if (period === 'year') {
        for (let m = 0; m < 12; m++) bars.push({ key: String(m), label: new Date(now.getFullYear(), m, 1).toLocaleDateString(undefined, { month: 'short' }), value: 0, future: m > now.getMonth() });
        for (const t of inRange) bars[day(t).getMonth()].value += Math.abs(t.amount);
    } else {
        const last = period === 'week' ? new Date(r.to.getTime() - DAY) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
        for (let d = new Date(r.from); d <= last; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
            bars.push({ key: iso(d), label: period === 'week' ? d.toLocaleDateString(undefined, { weekday: 'short' }) : String(d.getDate()), value: 0, future: iso(d) > today });
        }
        const at = new Map(bars.map((b, i) => [b.key, i]));
        for (const t of inRange) { const i = at.get(t.date.slice(0, 10)); if (i !== undefined) bars[i].value += Math.abs(t.amount); }
    }

    // Grouped case- and space-insensitively ("Daraz" and "DARAZ "), shown under the first spelling seen.
    const sum = (key: (t: SpendTx) => string) => {
        const m = new Map<string, { name: string; amount: number; count: number }>();
        for (const t of inRange) {
            const name = key(t).trim().replace(/\s+/g, ' ') || 'Other';
            const k = name.toLowerCase();
            const v = m.get(k) || { name, amount: 0, count: 0 };
            m.set(k, { name: v.name, amount: v.amount + Math.abs(t.amount), count: v.count + 1 });
        }
        return [...m.values()].sort((a, b) => b.amount - a.amount);
    };
    return {
        total, previous, count: inRange.length, bars,
        categories: sum((t) => t.category || '').map((v) => ({ name: v.name, amount: v.amount, share: total ? v.amount / total : 0 })),
        merchants: sum((t) => t.description || '').slice(0, 6),
    };
}
