import { describe, expect, it } from 'vitest';
import { buildTwin, type TwinCharge } from './twinModel';

const now = new Date(2026, 10, 20, 12); // Fri 20 Nov 2026
const tx = [
    { date: '2026-11-01', amount: 100000, type: 'income' as const, category: 'Income' },
    { date: '2026-11-10', amount: 30000, type: 'expense' as const, category: 'Food' },
    { date: '2026-11-12', amount: 15000, type: 'expense' as const, category: 'Transport' },
];
const bill = (over: Partial<TwinCharge> = {}): TwinCharge => ({ id: 'r', kind: 'bill', name: 'Rent', category: 'Bills', amount: 45000, cycle: 'monthly', nextDate: '2026-11-25', active: true, ...over });
const none = { cutCategory: null, cutAmount: 0, cancelled: [], purchase: 0 };

describe('buildTwin', () => {
    it('starts from the ledger and spreads spending over the history it really has (20 days here)', () => {
        const m = buildTwin(tx, [], none, now);
        expect(m.days[0].balance).toBe(55000);
        expect(m.dailyBurn).toBe(2250); // 45,000 over 20 days
    });

    it('starts from the account total when there is one, like Home', () => {
        expect(buildTwin(tx, [], none, now, 80000).days[0].balance).toBe(80000);
    });

    it('takes bills on their calendar day and finds when money runs out', () => {
        const m = buildTwin(tx, [bill()], none, now);
        expect(m.days[5].balance).toBe(55000 - 5 * 2250 - 45000);
        expect(m.runwayDays).toBe(5);
        expect(m.lowest.day).toBe(41); // December costs 112,500 against 100,000 in, so the low is the day before 1 Jan
        expect(m.days[11].balance - m.days[10].balance).toBe(100000 - 2250);
    });

    it('counts an overdue unpaid bill as owed today', () => {
        const m = buildTwin(tx, [bill({ cycle: 'one-time', nextDate: '2026-11-02' })], none, now);
        expect(m.days[0].balance).toBe(55000 - 45000);
    });

    it('a cut and a cancellation push the runway out and report the monthly saving', () => {
        const m = buildTwin(tx, [bill()], { cutCategory: 'Food', cutAmount: 15000, cancelled: ['r'], purchase: 0 }, now);
        expect(m.runwayDays).toBeNull();
        expect(m.monthlySaved).toBe(60000);
    });

    it('keeps a salary paid 31 days ago, averaged per month it arrived', () => {
        const dec2 = new Date(2026, 11, 2, 12);
        const salaries = ['2026-08-01', '2026-09-01', '2026-10-01', '2026-11-01'].map((date) => ({ date, amount: 100000, type: 'income' as const, category: 'Income' }));
        const m = buildTwin(salaries, [], none, dec2);
        expect(m.monthlyIncome).toBe(100000);
        expect(m.payDay).toBe(1);
    });

    it('moves a pay day of the 31st to the last day of a shorter month', () => {
        const m = buildTwin([{ date: '2026-10-31', amount: 50000, type: 'income' as const, category: 'Income' }], [], none, new Date(2026, 10, 5, 12));
        expect(m.days[25].balance - m.days[24].balance).toBe(50000); // 30 Nov
    });
});
