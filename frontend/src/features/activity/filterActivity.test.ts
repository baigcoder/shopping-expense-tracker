import { describe, expect, it } from 'vitest';
import { filterActivity } from './ActivityView';

const now = new Date(2026, 10, 20, 12);
const list = [
    { id: '1', date: '2026-11-20', description: 'Foodpanda', amount: 1200, type: 'expense' as const, category: 'Food' },
    { id: '2', date: '2026-11-16', description: 'Salary', amount: 200000, type: 'income' as const, category: 'Income' },
    { id: '3', date: '2026-11-02', description: 'Daraz', amount: 8000, type: 'expense' as const, category: 'Shopping' },
    { id: '4', date: '2026-10-28', description: 'Imtiaz', amount: 9000, type: 'expense' as const, category: 'Food' },
];
const ids = (r: { id: string }[]) => r.map((x) => x.id);

describe('filterActivity', () => {
    it('sorts newest first and filters by period', () => {
        expect(ids(filterActivity(list, '', 'all', 'all', 'all', now))).toEqual(['1', '2', '3', '4']);
        expect(ids(filterActivity(list, '', 'all', 'all', 'today', now))).toEqual(['1']);
        expect(ids(filterActivity(list, '', 'all', 'all', 'week', now))).toEqual(['1', '2']);
        expect(ids(filterActivity(list, '', 'all', 'all', 'month', now))).toEqual(['1', '2', '3']);
    });

    it('filters by type, category and search text', () => {
        expect(ids(filterActivity(list, '', 'income', 'all', 'all', now))).toEqual(['2']);
        expect(ids(filterActivity(list, '', 'all', 'Food', 'all', now))).toEqual(['1', '4']);
        expect(ids(filterActivity(list, 'dar', 'all', 'all', 'all', now))).toEqual(['3']);
    });

    it('finds an entry by its amount, written either way', () => {
        expect(ids(filterActivity(list, '8000', 'all', 'all', 'all', now))).toEqual(['3']);
        expect(ids(filterActivity(list, 'Rs 8,000', 'all', 'all', 'all', now))).toEqual(['3']);
        expect(ids(filterActivity(list, 'food', 'all', 'all', 'all', now))).toEqual(['1', '4']);
    });
});
