// A statement for a period: money in, spent and kept, month by month.
export interface ReportTx { id: string; date: string; description: string; amount: number; type: 'income' | 'expense'; category: string }
export type ReportRange = 'month' | 'last-month' | 'quarter' | 'tax-year' | 'year' | 'all';

export interface ReportModel {
    in: number; out: number; saved: number; rate: number | null;
    months: { key: string; label: string; in: number; out: number }[];
    rows: ReportTx[];
    from: string | null; // first day covered, YYYY-MM-DD
    to: string; // last day covered
}

const monthKey = (d: string) => d.slice(0, 7);

export function buildReport(transactions: ReportTx[], range: ReportRange, now = new Date()): ReportModel {
    const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const y = now.getFullYear(), m = now.getMonth();
    // Pakistan's tax year runs 1 July to 30 June; before July we are still in the one that began last year.
    const taxStart = new Date(m >= 6 ? y : y - 1, 6, 1);
    const [from, to] = range === 'month' ? [new Date(y, m, 1), now]
        : range === 'last-month' ? [new Date(y, m - 1, 1), new Date(y, m, 0)]
            : range === 'quarter' ? [new Date(y, m - 2, 1), now]
                : range === 'tax-year' ? [taxStart, now]
                    : range === 'year' ? [new Date(y, 0, 1), now] : [null, now];
    const fromKey = from ? key(from) : '';
    const toKey = key(to);
    // Entries dated in the future are left out until their day comes.
    const rows = transactions.filter((t) => t.date.slice(0, 10) >= fromKey && t.date.slice(0, 10) <= toKey).sort((a, b) => b.date.localeCompare(a.date));

    const byMonth = new Map<string, { in: number; out: number }>();
    for (const t of rows) {
        const m = byMonth.get(monthKey(t.date)) || { in: 0, out: 0 };
        m[t.type === 'income' ? 'in' : 'out'] += Math.abs(t.amount);
        byMonth.set(monthKey(t.date), m);
    }
    const months = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([key, v]) => ({
        key, label: new Date(`${key}-01T00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), ...v,
    }));
    const totalIn = months.reduce((s, m) => s + m.in, 0);
    const totalOut = months.reduce((s, m) => s + m.out, 0);
    return { in: totalIn, out: totalOut, saved: totalIn - totalOut, rate: totalIn > 0 ? (totalIn - totalOut) / totalIn : null, months, rows, from: from ? fromKey : null, to: toKey };
}
