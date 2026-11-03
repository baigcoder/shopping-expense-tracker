import { describe, expect, it } from 'vitest';
import { buildCalendar } from './calendarModel';

describe('buildCalendar', () => {
    const now = new Date(2026, 10, 20, 12); // Fri 20 Nov 2026
    const cal = buildCalendar(
        [
            { id: 'a', date: '2026-11-03', description: 'Groceries', amount: 5000, type: 'expense' },
            { id: 'b', date: '2026-11-01', description: 'Salary', amount: 200000, type: 'income' },
        ],
        [
            { id: 'n', name: 'Netflix', amount: 1100, nextDate: '2026-11-23', cycle: 'monthly', active: true },
            { id: 'w', name: 'Gym', amount: 500, nextDate: '2026-11-21', cycle: 'weekly', active: true },
            { id: 'x', name: 'Cancelled', amount: 999, nextDate: '2026-11-22', cycle: 'monthly', active: false },
        ],
        new Date(2026, 10, 1),
        now,
    );
    const day = (d: string) => cal.weeks.flat().find((x) => x.date === d)!;

    it('lays the month out in Monday-first weeks', () => {
        expect(cal.weeks[0][0].date).toBe('2026-10-26');
        expect(cal.weeks.every((w) => w.length === 7)).toBe(true);
        expect(day('2026-11-20').isToday).toBe(true);
    });

    it('puts spending and income on their days and repeats charges by cycle', () => {
        expect(day('2026-11-03').out).toBe(5000);
        expect(day('2026-11-01').in).toBe(200000);
        expect(day('2026-11-28').entries.map((e) => e.label)).toEqual(['Gym']);
        expect(day('2026-11-22').entries).toEqual([]);
        expect(cal.due).toBe(1100 + 500 * 2);
    });
});
