import { describe, expect, it } from 'vitest';
import { buildReport } from './reportModel';

const now = new Date(2026, 10, 20, 12);
const tx = (id: string, date: string, amount: number, type: 'income' | 'expense' = 'expense') => ({ id, date, amount, type, description: id, category: 'Food' });
const list = [tx('a', '2026-11-03', 5000), tx('b', '2026-11-01', 100000, 'income'), tx('c', '2026-09-15', 8000), tx('d', '2026-08-30', 2000), tx('e', '2025-12-01', 1000)];

describe('buildReport', () => {
    it('sums the current month', () => {
        const r = buildReport(list, 'month', now);
        expect([r.in, r.out, r.saved]).toEqual([100000, 5000, 95000]);
        expect(r.rate).toBeCloseTo(0.95);
    });

    it('covers three calendar months for a quarter, newest month first', () => {
        const r = buildReport(list, 'quarter', now);
        expect(r.months.map((m) => m.key)).toEqual(['2026-11', '2026-09']);
        expect(r.rows.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    });

    it('has no savings rate without income', () => {
        expect(buildReport([tx('x', '2026-11-02', 10)], 'all', now).rate).toBeNull();
        expect(buildReport(list, 'all', now).rows).toHaveLength(5);
    });
});
