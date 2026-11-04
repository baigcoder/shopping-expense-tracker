import { describe, expect, it } from 'vitest';
import { buildSpending } from './spendingModel';

const now = new Date(2026, 10, 20, 12); // Fri 20 Nov 2026
const tx = (id: string, date: string, amount: number, category = 'Food', description = 'Imtiaz', type: 'income' | 'expense' = 'expense') => ({ id, date, amount, category, description, type });
const list = [
    tx('a', '2026-11-20', 1000), tx('b', '2026-11-14', 4000, 'Shopping', 'Daraz'), tx('c', '2026-11-02', 5000),
    tx('d', '2026-10-10', 3000), tx('e', '2026-10-25', 9000), tx('f', '2026-11-01', 200000, 'Income', 'Salary', 'income'),
    tx('g', '2025-03-01', 7000),
];

describe('buildSpending', () => {
    it('totals the month to date against the same days of last month', () => {
        const m = buildSpending(list, 'month', now);
        expect(m.total).toBe(10000);
        expect(m.previous).toBe(3000); // 25 Oct is after the 20th, so it is left out
        expect(m.bars).toHaveLength(30);
        expect(m.bars[13].value).toBe(4000);
        expect(m.bars[25].future).toBe(true);
    });

    it('ranks categories and shops, ignoring income', () => {
        const m = buildSpending(list, 'month', now);
        expect(m.categories.map((c) => c.name)).toEqual(['Food', 'Shopping']);
        expect(m.categories[0].share).toBeCloseTo(0.6);
        expect(m.merchants[0]).toEqual({ name: 'Imtiaz', amount: 6000, count: 2 });
    });

    it('covers the last seven days for a week and months for a year', () => {
        expect(buildSpending(list, 'week', now).total).toBe(5000);
        const y = buildSpending(list, 'year', now);
        expect(y.bars).toHaveLength(12);
        expect(y.bars[9].value).toBe(12000);
        expect(y.previous).toBe(7000);
    });

    it('compares 31 March with all of February, not with the first days of March', () => {
        const mar31 = new Date(2026, 2, 31, 12);
        const m = buildSpending([tx('a', '2026-02-27', 100), tx('b', '2026-03-02', 999), tx('c', '2026-03-31', 50)], 'month', mar31);
        expect(m.previous).toBe(100);
        expect(m.total).toBe(1049);
    });

    it('groups a shop however its name was typed', () => {
        const m = buildSpending([tx('a', '2026-11-03', 100, 'Shopping', 'Daraz'), tx('b', '2026-11-04', 200, 'Shopping', 'DARAZ ')], 'month', now);
        expect(m.merchants).toEqual([{ name: 'Daraz', amount: 300, count: 2 }]);
    });
});
