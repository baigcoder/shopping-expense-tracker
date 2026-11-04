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

    it('covers last month in full, and the tax year from 1 July', () => {
        const last = buildReport(list, 'last-month', now);
        expect([last.from, last.to]).toEqual(['2026-10-01', '2026-10-31']);
        const tax = buildReport(list, 'tax-year', now);
        expect(tax.from).toBe('2026-07-01');
        expect(tax.rows.map((t) => t.id)).toEqual(['a', 'b', 'c', 'd']);
        expect(buildReport(list, 'tax-year', new Date(2027, 2, 1)).from).toBe('2026-07-01'); // March is still the 2026-27 tax year
    });

    it('leaves out entries dated in the future', () => {
        expect(buildReport([...list, tx('f', '2026-12-25', 999)], 'all', now).rows.map((t) => t.id)).not.toContain('f');
    });
});
