import { describe, expect, it } from 'vitest';
import { budgetMatches, buildBudgets } from './budgetModel';

describe('buildBudgets', () => {
    const now = new Date(2026, 10, 15, 12); // 15 of 30 days gone
    const m = buildBudgets(
        [{ id: 'f', category: 'Food', amount: 10000 }, { id: 's', category: 'Shopping', amount: 10000 }, { id: 't', category: 'Transport', amount: 10000 }],
        [
            { date: '2026-11-10', amount: 4000, type: 'expense', category: 'food' },
            { date: '2026-11-11', amount: 12000, type: 'expense', category: 'Shopping' },
            { date: '2026-11-12', amount: 7000, type: 'expense', category: 'Transport' },
            { date: '2026-10-30', amount: 9999, type: 'expense', category: 'Food' },
            { date: '2026-11-12', amount: 50000, type: 'income', category: 'Food' },
            { date: '2026-11-13', amount: 500, type: 'expense', category: 'Groceries' },
            { date: '2026-10-08', amount: 4200, type: 'expense', category: 'Education' },
            { date: '2026-11-05', amount: 1000, type: 'expense', category: 'Education' },
        ],
        now,
    );

    it('counts this month of expenses, including categories of the same family', () => {
        expect(m.lines.find((l) => l.category === 'Food')?.spent).toBe(4500); // food + groceries
        expect(m.spent).toBe(23500);
    });

    it('marks pace: over the cap, heading over at this pace, or fine', () => {
        const pace = Object.fromEntries(m.lines.map((l) => [l.category, l.pace]));
        expect(pace).toEqual({ Shopping: 'over', Transport: 'fast', Food: 'ok' });
    });

    it('projects month-end spend at the current daily pace', () => {
        expect(m.monthProgress).toBe(50);
        expect(m.lines.find((l) => l.category === 'Transport')?.projected).toBe(14000);
    });

    it('does not warn on pace from one purchase early in the month', () => {
        const early = buildBudgets([{ id: 'f', category: 'Food', amount: 40000 }], [{ date: '2026-11-02', amount: 5000, type: 'expense', category: 'Food' }], new Date(2026, 10, 2, 12));
        expect(early.lines[0].pace).toBe('ok'); // would project 75,000
    });

    it('suggests a limit for spending with no budget from last month, or the pace when there is no last month', () => {
        expect(m.unbudgeted).toEqual([{ category: 'Education', spent: 1000, suggested: 5000 }]); // last month 4,200
        const rentOnly = buildBudgets([], [
            { date: '2026-10-01', amount: 65000, type: 'expense', category: 'Rent' },
            { date: '2026-11-01', amount: 65000, type: 'expense', category: 'Rent' },
        ], now);
        expect(rentOnly.unbudgeted[0].suggested).toBe(65000); // not 130,000 from pace
        const newUser = buildBudgets([], [{ date: '2026-11-10', amount: 3000, type: 'expense', category: 'Fuel' }], now);
        expect(newUser.unbudgeted[0].suggested).toBe(6000);
    });

    it('matches loosely but never lumps two unrelated categories together', () => {
        expect(budgetMatches('Health', 'Healthcare')).toBe(true);
        expect(budgetMatches('Food & Dining', 'Restaurant')).toBe(true);
        expect(budgetMatches('Education', 'Travel')).toBe(false);
    });
});
