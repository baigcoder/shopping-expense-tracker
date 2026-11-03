// Sample month for the demo, anchored to the 20th of the current month so it always shows a full month.
import type { HomeBudget, HomeGoal, HomeSubscription, HomeTransaction } from '../home/homeModel';
import type { InboxItem, InboxRule } from '../inbox/InboxView';
import type { CommitmentInput } from '../commitments/commitmentsModel';

const today = new Date();
export const DEMO_NOW = new Date(today.getFullYear(), today.getMonth(), 20, 12);

const day = (offset: number) => {
    const d = new Date(DEMO_NOW);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
};

export const DEMO_USER = { name: 'Ayesha Khan', firstName: 'Ayesha', detail: 'Demo account · sample data' };

export const demoTransactions = (): HomeTransaction[] => [
    { id: 't1', date: day(-14), description: 'Salary', amount: 245000, type: 'income', category: 'Income' },
    { id: 't2', date: day(-13), description: 'Rent', amount: 65000, type: 'expense', category: 'Bills' },
    { id: 't3', date: day(-12), description: 'Imtiaz groceries', amount: 14250, type: 'expense', category: 'Food' },
    { id: 't4', date: day(-11), description: 'K-Electric', amount: 9800, type: 'expense', category: 'Bills' },
    { id: 't5', date: day(-10), description: 'Careem rides', amount: 3150, type: 'expense', category: 'Transport' },
    { id: 't6', date: day(-9), description: 'Khaadi', amount: 7490, type: 'expense', category: 'Shopping' },
    { id: 't7', date: day(-8), description: 'Foodpanda', amount: 2340, type: 'expense', category: 'Food' },
    { id: 't8', date: day(-7), description: 'Shell fuel', amount: 8000, type: 'expense', category: 'Transport' },
    { id: 't9', date: day(-6), description: 'Freelance design', amount: 38000, type: 'income', category: 'Income' },
    { id: 't10', date: day(-5), description: 'Dawaai pharmacy', amount: 1860, type: 'expense', category: 'Health' },
    { id: 't11', date: day(-4), description: 'Imtiaz groceries', amount: 11640, type: 'expense', category: 'Food' },
    { id: 't12', date: day(-3), description: 'Cinepax', amount: 2400, type: 'expense', category: 'Entertainment' },
    { id: 't13', date: day(-2), description: 'PTCL internet', amount: 4999, type: 'expense', category: 'Bills' },
    { id: 't14', date: day(-1), description: 'Gloria Jeans', amount: 1350, type: 'expense', category: 'Food' },
    { id: 't15', date: day(-33), description: 'Salary', amount: 245000, type: 'income', category: 'Income' },
    { id: 't16', date: day(-32), description: 'Rent', amount: 65000, type: 'expense', category: 'Bills' },
    { id: 't17', date: day(-28), description: 'Groceries', amount: 27400, type: 'expense', category: 'Food' },
    { id: 't18', date: day(-25), description: 'Daraz', amount: 18900, type: 'expense', category: 'Shopping' },
    { id: 't19', date: day(-20), description: 'Fuel and rides', amount: 12600, type: 'expense', category: 'Transport' },
];

export const demoInbox = (): InboxItem[] => [
    { id: 'p1', merchant: 'Daraz', description: 'Anker power bank 20,000 mAh', amount: 8499, category: 'Shopping', date: day(0), source: 'extension', confidence: 0.96 },
    { id: 'p2', merchant: 'Foodpanda', description: 'Dinner from Kolachi', amount: 3260, category: 'Food', date: day(0), source: 'extension', confidence: 0.93 },
    { id: 'p3', merchant: 'Spotify', description: 'Premium Duo, monthly', amount: 579, category: 'Subscriptions', date: day(0), source: 'extension', confidence: 0.91 },
    { id: 'p4', merchant: 'PayPro 4471', description: 'Card payment, merchant name unclear', amount: 2200, category: 'Other', date: day(-1), source: 'extension', confidence: 0.52 },
    { id: 'p5', merchant: 'Imtiaz', description: 'Groceries, same total as one you already approved', amount: 11640, category: 'Food', date: day(-1), source: 'csv', confidence: 0.88, duplicateOf: 't11' },
];

export const demoRules = (): InboxRule[] => [
    { id: 'r1', pattern: 'Careem', category: 'Transport', matchType: 'contains', enabled: true },
];

export const demoBudgets = (): (HomeBudget & { id: string })[] => [
    { id: 'b1', category: 'Food', amount: 40000 },
    { id: 'b2', category: 'Transport', amount: 15000 },
    { id: 'b3', category: 'Shopping', amount: 15000 },
    { id: 'b4', category: 'Entertainment', amount: 6000 },
    { id: 'b5', category: 'Health', amount: 5000 },
];

export const demoCommitments = (): CommitmentInput[] => [
    { id: 's1', kind: 'subscription', name: 'Netflix Standard', category: 'Entertainment', amount: 1100, cycle: 'monthly', nextDate: day(3), active: true },
    { id: 's2', kind: 'subscription', name: 'Adobe Express', category: 'Software', amount: 2950, cycle: 'monthly', nextDate: day(2), active: true, isTrial: true },
    { id: 's3', kind: 'subscription', name: 'Spotify Duo', category: 'Subscriptions', amount: 579, cycle: 'monthly', nextDate: day(9), active: true },
    { id: 's4', kind: 'subscription', name: 'iCloud 200 GB', category: 'Software', amount: 3900, cycle: 'yearly', nextDate: day(41), active: true },
    { id: 'bl1', kind: 'bill', name: 'Rent', category: 'Bills', amount: 65000, cycle: 'monthly', nextDate: day(16), active: true, paid: false },
    { id: 'bl2', kind: 'bill', name: 'PTCL internet', category: 'Bills', amount: 4999, cycle: 'monthly', nextDate: day(28), active: true, paid: false },
    { id: 'bl3', kind: 'bill', name: 'K-Electric', category: 'Bills', amount: 9800, cycle: 'monthly', nextDate: day(6), active: true, paid: false },
];

/** Home reads commitments in the shape the dashboard uses. */
export const toHomeSubscriptions = (list: CommitmentInput[]): HomeSubscription[] => list
    .filter((c) => c.active && !(c.kind === 'bill' && c.paid))
    .map((c) => ({ id: c.id, name: c.name, price: c.amount, is_active: true, is_trial: c.isTrial, next_payment_date: c.isTrial ? null : c.nextDate, trial_end_date: c.isTrial ? c.nextDate : null }));

export const demoGoals = (): (HomeGoal & { id: string; name: string; deadline?: string | null })[] => [
    { id: 'g1', name: 'New laptop', target: 300000, saved: 112000, deadline: day(160) },
    { id: 'g2', name: 'Umrah fund', target: 80000, saved: 64000, deadline: day(70) },
    { id: 'g3', name: 'Emergency savings', target: 150000, saved: 41000 },
];
