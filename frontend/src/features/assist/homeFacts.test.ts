import { describe, expect, it } from 'vitest';
import { homeFacts } from './homeFacts';
import { buildHomeModel } from '../home/homeModel';

const money = (n: number) => `Rs ${n.toLocaleString('en-US')}`;

describe('homeFacts', () => {
    it('states safe to spend and how it is made, with bills, waiting purchases and budgets', () => {
        const m = buildHomeModel({
            now: new Date(2026, 10, 15, 12),
            transactions: [{ id: 't', date: '2026-11-03', description: 'Groceries', amount: 5000, type: 'expense', category: 'Food' }],
            budgets: [{ category: 'Food', amount: 20000 }],
            commitments: [{ id: 'r', kind: 'bill', name: 'Rent', category: 'Bills', amount: 60000, cycle: 'monthly', nextDate: '2026-11-25', active: true }],
            goals: [],
            pending: [{ id: 'p', merchant: 'Daraz', description: 'Phone', amount: 30000, category: 'Shopping', date: '2026-11-15', source: 'extension' }],
            accountsBalance: 200000,
        });
        const text = homeFacts(m, money);
        expect(text).toContain('Safe to spend: Rs 140,000 = account balances Rs 200,000 - Rs 60,000 bills');
        expect(text).toContain('Rent Rs 60,000 in 10 days');
        expect(text).toContain('Waiting for approval, not yet counted: Daraz Rs 30,000');
        expect(text).toContain('Food Rs 5,000 of Rs 20,000');
    });
});
