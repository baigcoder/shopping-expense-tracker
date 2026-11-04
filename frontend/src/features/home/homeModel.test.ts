import { describe, expect, it } from 'vitest';
import { buildHomeModel, chargesWithin } from './homeModel';
import type { CommitmentInput } from '../commitments/commitmentsModel';

const now = new Date(2026, 10, 15, 12); // 15 Nov 2026, local time
const today = new Date(2026, 10, 15);
const sub = (over: Partial<CommitmentInput>): CommitmentInput => ({ id: 'x', kind: 'subscription', name: 'X', category: 'Subscriptions', amount: 1000, cycle: 'monthly', nextDate: '2026-11-20', active: true, ...over });

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
        commitments: [
            sub({ id: 's1', name: 'Netflix', amount: 2000, nextDate: '2026-11-20' }),
            sub({ id: 'b1', kind: 'bill', name: 'Rent', amount: 60000, nextDate: '2026-12-01' }),
            sub({ id: 's2', name: 'iCloud', amount: 3900, cycle: 'yearly', nextDate: '2027-03-01' }),
        ],
        goals: [{ target: 50000, saved: 10000, deadline: '2027-02-15' }],
        pending: [
            { id: 'p1', merchant: 'Daraz', description: 'Headphones', amount: 8000, category: 'Shopping', date: '2026-11-15', source: 'extension' },
            { id: 'p2', merchant: 'Foodpanda', description: 'Dinner', amount: 1500, category: 'Food', date: '2026-11-15', source: 'extension' },
        ],
    });

    it('takes bills and only the charges due in 30 days off safe to spend, plus the goal amount for this month', () => {
        expect(model.balance).toBe(173000);
        expect(model.balanceFrom).toBe('ledger');
        expect(model.committed30).toBe(2000 + 60000); // iCloud renews in March, so it is not counted
        expect(model.plannedSavings).toBe(10000); // 40000 left over Nov, Dec, Jan, Feb
        expect(model.safeToSpend).toBe(173000 - 62000 - 10000);
    });

    it('splits this month from last month', () => {
        expect([model.monthIn, model.monthOut, model.lastMonthOut]).toEqual([200000, 18000, 9000]);
    });

    it('shows what approving each pending item in order leaves safe to spend', () => {
        expect(model.pending.map((p) => p.safeAfter)).toEqual([101000 - 8000, 101000 - 9500]);
    });

    it('raises safe to spend for a refund waiting in the inbox', () => {
        const m = buildHomeModel({ now, transactions: [], budgets: [], commitments: [], goals: [], pending: [
            { id: 'r', merchant: 'Daraz', description: 'Refund', amount: 2000, category: 'Shopping', date: '2026-11-15', source: 'extension', type: 'income' },
        ], accountsBalance: 10000 });
        expect(m.pending[0].safeAfter).toBe(12000);
    });

    it('lists bills and subscriptions coming up, soonest first', () => {
        expect(model.upcoming.map((u) => [u.name, u.daysUntil, u.kind])).toEqual([['Netflix', 5, 'subscription'], ['Rent', 16, 'bill']]);
        expect(model.categories.find((c) => c.category === 'Health')).toEqual({ category: 'Health', spent: 0, budget: 5000 });
    });

    it('uses account balances when the user has accounts, and flags a brand-new user', () => {
        const withAccounts = buildHomeModel({ now, transactions: [], budgets: [], commitments: [], goals: [], pending: [], accountsBalance: 50000 });
        expect([withAccounts.balance, withAccounts.balanceFrom, withAccounts.isNew]).toEqual([50000, 'accounts', false]);
        expect(buildHomeModel({ now, transactions: [], budgets: [], commitments: [], goals: [], pending: [] }).isNew).toBe(true);
    });
});

describe('chargesWithin', () => {
    it('repeats weekly charges and rolls a stale renewal date forward', () => {
        expect(chargesWithin(sub({ cycle: 'weekly', nextDate: '2026-11-16' }), today, 30)).toEqual([1, 8, 15, 22, 29]);
        expect(chargesWithin(sub({ nextDate: '2026-09-20' }), today, 30)).toEqual([5]);
    });

    it('counts an unpaid overdue bill today and skips paid or cancelled ones', () => {
        expect(chargesWithin(sub({ kind: 'bill', cycle: 'one-time', nextDate: '2026-11-01' }), today, 30)).toEqual([0]);
        expect(chargesWithin(sub({ kind: 'bill', paid: true }), today, 30)).toEqual([]);
        expect(chargesWithin(sub({ active: false }), today, 30)).toEqual([]);
    });
});
