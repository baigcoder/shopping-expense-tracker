import { describe, expect, it } from 'vitest';
import { buildHomeModel } from './homeModel';

const now = new Date('2026-11-15T12:00:00Z');

describe('buildHomeModel', () => {
    const model = buildHomeModel({
        now,
        transactions: [
            { id: 'i1', date: '2026-11-01', description: 'Salary', amount: 200000, type: 'income', category: 'Income' },
            { id: 'e1', date: '2026-11-10', description: 'Groceries', amount: 12000, type: 'expense', category: 'Food' },
            { id: 'e2', date: '2026-11-12', description: 'Fuel', amount: 6000, type: 'expense', category: 'Transport' },
            { id: 'e3', date: '2026-10-05', description: 'Old', amount: 9000, type: 'expense', category: 'Food' },
        ],
        budgets: [{ category: 'Food', amount: 30000 }, { category: 'Health', amount: 5000 }],
        subscriptions: [{ id: 's1', name: 'Netflix', price: 2000, is_active: true, next_payment_date: '2026-11-20' }],
        goals: [{ target: 50000, saved: 10000 }],
        pending: [
            { id: 'p1', merchant: 'Daraz', description: 'Headphones', amount: 8000, category: 'Shopping', date: '2026-11-15', source: 'extension' },
            { id: 'p2', merchant: 'Foodpanda', description: 'Dinner', amount: 1500, category: 'Food', date: '2026-11-15', source: 'extension' },
        ],
    });

    it('applies the safe-to-spend formula: balance - commitments - planned savings', () => {
        // balance 200000 - 27000 = 173000; minus 2000 commitments and min(40000, 5000) savings
        expect(model.balance).toBe(173000);
        expect(model.safeToSpend).toBe(173000 - 2000 - 5000);
    });

    it('splits this month from last month', () => {
        expect(model.monthIn).toBe(200000);
        expect(model.monthOut).toBe(18000);
        expect(model.lastMonthOut).toBe(9000);
    });

    it('shows what approving each pending item in order leaves safe to spend', () => {
        expect(model.pending.map((p) => p.safeAfter)).toEqual([166000 - 8000, 166000 - 9500]);
    });

    it('lists budgeted categories even with no spending, and upcoming payments within 30 days', () => {
        expect(model.categories.find((c) => c.category === 'Health')).toEqual({ category: 'Health', spent: 0, budget: 5000 });
        expect(model.upcoming).toEqual([expect.objectContaining({ name: 'Netflix', daysUntil: 5 })]);
    });
});
