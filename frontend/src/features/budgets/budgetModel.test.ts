import { describe, expect, it } from 'vitest';
import { buildBudgets } from './budgetModel';

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
        ],
        now,
    );

    it('counts only this month’s expenses, matching categories loosely', () => {
        expect(m.lines.find((l) => l.category === 'Food')?.spent).toBe(4000);
        expect(m.spent).toBe(23000);
    });

    it('marks pace: over the cap, ahead of the month, or fine', () => {
        const pace = Object.fromEntries(m.lines.map((l) => [l.category, l.pace]));
        expect(pace).toEqual({ Shopping: 'over', Transport: 'fast', Food: 'ok' });
    });

    it('projects month-end spend at the current daily pace', () => {
        expect(m.monthProgress).toBe(50);
        expect(m.lines.find((l) => l.category === 'Transport')?.projected).toBe(14000);
    });
});
