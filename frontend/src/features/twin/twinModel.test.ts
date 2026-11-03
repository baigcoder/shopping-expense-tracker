import { describe, expect, it } from 'vitest';
import { buildTwin } from './twinModel';

const now = new Date(2026, 10, 20, 12);
const tx = [
    { date: '2026-11-01', amount: 100000, type: 'income' as const, category: 'Income' },
    { date: '2026-11-10', amount: 30000, type: 'expense' as const, category: 'Food' },
    { date: '2026-11-12', amount: 15000, type: 'expense' as const, category: 'Transport' },
];
const charges = [{ id: 'r', name: 'Rent', amount: 40000, daysUntil: 5, cycle: 'monthly', kind: 'bill' as const, active: true }];
const none = { cutCategory: null, cutAmount: 0, cancelled: [], purchase: 0 };

describe('buildTwin', () => {
    it('starts from the approved balance and spends at the 30-day pace', () => {
        const m = buildTwin(tx, charges, none, now);
        expect(m.days[0].balance).toBe(55000);
        expect(m.dailyBurn).toBe(1500);
    });

    it('takes scheduled charges on their day and finds when money runs out', () => {
        const rent = [{ ...charges[0], amount: 45000 }];
        const m = buildTwin(tx, rent, none, now);
        expect(m.days[5].balance).toBe(55000 - 5 * 1500 - 45000);
        expect(m.runwayDays).toBe(7); // 2,500 left after rent, gone two days later
        expect(m.lowest.day).toBe(10); // the 1st (day 11) brings income back
    });

    it('a cut and a cancellation push the runway out and report the monthly saving', () => {
        const m = buildTwin(tx, charges, { cutCategory: 'Food', cutAmount: 15000, cancelled: ['r'], purchase: 0 }, now);
        expect(m.runwayDays).toBeNull();
        expect(m.monthlySaved).toBe(55000);
    });

    it('expects a month of income again on the day the biggest payment came, not the latest small one', () => {
        const two = [...tx, { date: '2026-11-14', amount: 20000, type: 'income' as const, category: 'Income' }];
        const m = buildTwin(two, [], none, now);
        // pay day is the 1st (day 11) and brings back the full 120,000 received in 30 days
        expect(m.days[11].balance - m.days[10].balance).toBe(120000 - 1500);
    });
});
