import { describe, expect, it } from 'vitest';
import { buildCalendar, type CalCharge } from './calendarModel';

const charge = (over: Partial<CalCharge>): CalCharge => ({ id: 'x', kind: 'subscription', name: 'X', category: 'Other', amount: 100, cycle: 'monthly', nextDate: null, active: true, ...over });

describe('buildCalendar', () => {
    const now = new Date(2026, 10, 20, 12); // Fri 20 Nov 2026
    const cal = buildCalendar(
        [
            { id: 'a', date: '2026-11-03', description: 'Groceries', amount: 5000, type: 'expense' },
            { id: 'b', date: '2026-11-01', description: 'Salary', amount: 200000, type: 'income' },
        ],
        [
            charge({ id: 'n', name: 'Netflix', amount: 1100, nextDate: '2026-11-23' }),
            charge({ id: 'w', name: 'Gym', amount: 500, nextDate: '2026-11-21', cycle: 'weekly' }),
            charge({ id: 'x', name: 'Cancelled', amount: 999, nextDate: '2026-11-22', active: false }),
        ],
        new Date(2026, 10, 1),
        now,
    );
    const day = (d: string, c = cal) => c.weeks.flat().find((x) => x.date === d)!;

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

    it('keeps a monthly bill on its day in later months instead of drifting every 30 days', () => {
        const jan = buildCalendar([], [charge({ id: 'r', kind: 'bill', name: 'Rent', amount: 65000, nextDate: '2026-11-25' })], new Date(2027, 0, 1), now);
        expect(day('2027-01-25', jan).entries.map((e) => e.label)).toEqual(['Rent']);
        expect(jan.due).toBe(65000);
    });

    it('shows an unpaid bill whose date passed as overdue today', () => {
        const c = buildCalendar([], [charge({ id: 'k', kind: 'bill', name: 'K-Electric', amount: 9800, nextDate: '2026-11-10' })], new Date(2026, 10, 1), now);
        expect(day('2026-11-20', c).entries).toEqual([expect.objectContaining({ label: 'K-Electric', kind: 'overdue' })]);
        expect(day('2026-12-10', buildCalendar([], [charge({ id: 'k', kind: 'bill', name: 'K-Electric', amount: 9800, nextDate: '2026-11-10' })], new Date(2026, 11, 1), now)).entries.map((e) => e.kind)).toEqual(['due']);
    });
});
