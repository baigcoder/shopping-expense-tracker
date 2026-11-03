import { describe, expect, it } from 'vitest';
import { demoAnswer } from './demoAnswers';
import { buildHomeModel } from '../home/homeModel';
import { buildBudgets } from '../budgets/budgetModel';
import { buildCommitments } from '../commitments/commitmentsModel';
import { DEMO_NOW, demoBudgets, demoCommitments, demoGoals, demoInbox, demoTransactions, toHomeSubscriptions } from './demoData';

const money = (n: number) => `Rs ${Math.round(n).toLocaleString('en-US')}`;

describe('demoAnswer', () => {
    const home = buildHomeModel({ transactions: demoTransactions(), budgets: demoBudgets(), subscriptions: toHomeSubscriptions(demoCommitments()), goals: demoGoals(), pending: demoInbox(), now: DEMO_NOW });
    const budgets = buildBudgets(demoBudgets(), demoTransactions(), DEMO_NOW);
    const bills = buildCommitments(demoCommitments(), DEMO_NOW);

    it('answers an affordability question from safe-to-spend, and mentions pending items', () => {
        const a = demoAnswer('Can I afford a Rs 30,000 phone?', home, budgets, bills, money);
        expect(a).toContain(money(home.safeToSpend - 30000));
        expect(a).toContain('still waiting');
    });

    it('says no when the price is more than is safe to spend', () => {
        expect(demoAnswer('can I buy a 9,999,999 car', home, budgets, bills, money)).toMatch(/^Not this month/);
    });

    it('points at the trial about to charge when asked about subscriptions', () => {
        expect(demoAnswer('Which subscriptions should I cancel?', home, budgets, bills, money)).toContain('Adobe Express');
    });
});
