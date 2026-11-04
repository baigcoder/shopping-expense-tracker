import { describe, expect, it } from 'vitest';
import { buildCommitments } from './commitmentsModel';

describe('buildCommitments', () => {
    const now = new Date(2026, 10, 20, 9);
    const m = buildCommitments([
        { id: 'n', kind: 'subscription', name: 'Netflix', category: 'Streaming', amount: 1200, cycle: 'monthly', nextDate: '2026-11-23', active: true },
        { id: 'y', kind: 'subscription', name: 'Domain', category: 'Software', amount: 2400, cycle: 'yearly', nextDate: '2027-03-01', active: true },
        { id: 't', kind: 'subscription', name: 'Adobe', category: 'Software', amount: 2950, cycle: 'monthly', nextDate: '2026-11-22', active: true, isTrial: true },
        { id: 'c', kind: 'subscription', name: 'Old gym', category: 'Health', amount: 5000, cycle: 'monthly', nextDate: '2026-11-25', active: false },
        { id: 'r', kind: 'bill', name: 'Rent', category: 'Housing', amount: 65000, cycle: 'monthly', nextDate: '2026-12-05', active: true },
    ], now);

    it('normalises every cycle to a monthly cost; trials and cancelled ones cost nothing yet', () => {
        expect(m.monthly).toBe(1200 + 200 + 65000);
        expect(m.yearly).toBe(m.monthly * 12);
    });

    it('counts what is due in the next 7 days, including trials that will convert', () => {
        expect(m.next7).toEqual({ count: 2, amount: 1200 + 2950 });
        expect(m.trials.map((t) => t.name)).toEqual(['Adobe']);
    });

    it('places charges on the 30-day strip by day', () => {
        expect(m.month[3].items.map((i) => i.name)).toEqual(['Netflix']);
        expect(m.month[15].items.map((i) => i.name)).toEqual(['Rent']);
    });

    it('totals overdue unpaid bills and rolls a stale subscription renewal forward', () => {
        const x = buildCommitments([
            { id: 'k', kind: 'bill', name: 'K-Electric', category: 'Bills', amount: 9800, cycle: 'monthly', nextDate: '2026-11-10', active: true },
            { id: 'p', kind: 'bill', name: 'Old fine', category: 'Bills', amount: 500, cycle: 'one-time', nextDate: '2026-11-01', active: true, paid: true },
            { id: 'n', kind: 'subscription', name: 'Netflix', category: 'Entertainment', amount: 1100, cycle: 'monthly', nextDate: '2026-09-05', active: true },
        ], now);
        expect(x.overdue).toEqual({ count: 1, amount: 9800 });
        expect(x.lines.find((l) => l.id === 'n')?.daysUntil).toBe(15); // 5 Dec, not 76 days overdue
    });
});
