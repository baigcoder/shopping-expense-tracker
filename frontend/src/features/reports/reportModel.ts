// A statement for a period: money in, spent and kept, month by month.
export interface ReportTx { id: string; date: string; description: string; amount: number; type: 'income' | 'expense'; category: string }
export type ReportRange = 'month' | 'quarter' | 'year' | 'all';

export interface ReportModel {
    in: number; out: number; saved: number; rate: number | null;
    months: { key: string; label: string; in: number; out: number }[];
    rows: ReportTx[];
}

const monthKey = (d: string) => d.slice(0, 7);

export function buildReport(transactions: ReportTx[], range: ReportRange, now = new Date()): ReportModel {
    const from = range === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1)
        : range === 'quarter' ? new Date(now.getFullYear(), now.getMonth() - 2, 1)
            : range === 'year' ? new Date(now.getFullYear(), 0, 1) : null;
    const fromKey = from ? `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-01` : '';
    const rows = transactions.filter((t) => t.date.slice(0, 10) >= fromKey).sort((a, b) => b.date.localeCompare(a.date));

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
    return { in: totalIn, out: totalOut, saved: totalIn - totalOut, rate: totalIn > 0 ? (totalIn - totalOut) / totalIn : null, months, rows };
}
