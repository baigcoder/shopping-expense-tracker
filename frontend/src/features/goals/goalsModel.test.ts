import { describe, expect, it } from 'vitest';
import { buildGoals, monthlyKept } from './goalsModel';

describe('buildGoals', () => {
    const now = new Date(2026, 10, 20);
    const m = buildGoals([
        { id: 'a', name: 'Laptop', target: 300000, saved: 120000, deadline: '2027-04-30' },
        { id: 'b', name: 'Umrah', target: 80000, saved: 80000, deadline: '2026-12-31' },
        { id: 'c', name: 'Emergency', target: 100000, saved: 10000 },
        { id: 'd', name: 'Bike', target: 50000, saved: 20000, deadline: '2026-10-01' },
    ], now);
    const by = Object.fromEntries(m.lines.map((l) => [l.id, l]));

    it('works out the monthly amount to finish on time, counting this month', () => {
        expect(by.a.monthsLeft).toBe(5);
        expect(by.a.perMonth).toBe(30000); // 180,000 over 6 payments
    });

    it('handles done, no deadline and overdue goals honestly', () => {
        expect(by.b.done).toBe(true);
        expect(by.c.perMonth).toBeNull();
        expect(by.d.late).toBe(true);
        expect(by.d.perMonth).toBeNull();
    });

    it('lists open goals first, soonest deadline first', () => {
        expect(m.lines.map((l) => l.id)).toEqual(['d', 'a', 'c', 'b']);
        expect(m.perMonth).toBe(30000);
    });
});

describe('monthlyKept', () => {
    const now = new Date(2026, 10, 20);
    const tx = (date: string, amount: number, type: 'income' | 'expense') => ({ date, amount, type });

    it('averages what was kept over the last three finished months, ignoring this month', () => {
        expect(monthlyKept([
            tx('2026-07-01', 100000, 'income'), tx('2026-07-10', 10000, 'expense'), // too old
            tx('2026-08-01', 100000, 'income'), tx('2026-08-10', 70000, 'expense'),
            tx('2026-09-01', 100000, 'income'), tx('2026-09-10', 80000, 'expense'),
            tx('2026-10-01', 100000, 'income'), tx('2026-10-10', 90000, 'expense'),
            tx('2026-11-01', 100000, 'income'),
        ], now)).toBe(20000);
    });

    it('has nothing to say before a month has finished', () => {
        expect(monthlyKept([tx('2026-11-01', 100000, 'income')], now)).toBeNull();
    });
});
