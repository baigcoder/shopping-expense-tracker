// Sample month for the demo, anchored to the 20th of the current month so it always shows a full month.
import type { HomeBudget, HomeGoal, HomePending, HomeSubscription, HomeTransaction } from '../home/homeModel';

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

export const demoPending = (): HomePending[] => [
    { id: 'p1', merchant: 'Daraz', description: 'Anker power bank 20,000 mAh', amount: 8499, category: 'Shopping', date: day(0), source: 'extension' },
    { id: 'p2', merchant: 'Foodpanda', description: 'Dinner from Kolachi', amount: 3260, category: 'Food', date: day(0), source: 'extension' },
    { id: 'p3', merchant: 'Spotify', description: 'Premium Duo, monthly', amount: 579, category: 'Subscriptions', date: day(0), source: 'extension' },
];

export const demoBudgets: HomeBudget[] = [
    { category: 'Food', amount: 40000 },
    { category: 'Transport', amount: 15000 },
    { category: 'Shopping', amount: 15000 },
    { category: 'Entertainment', amount: 6000 },
    { category: 'Health', amount: 5000 },
];

export const demoSubscriptions: HomeSubscription[] = [
    { id: 's1', name: 'Netflix Standard', price: 1100, is_active: true, next_payment_date: day(3) },
    { id: 's2', name: 'Adobe Express', price: 2950, is_active: true, is_trial: true, trial_end_date: day(2) },
    { id: 's3', name: 'Rent', price: 65000, is_active: true, next_payment_date: day(16) },
    { id: 's4', name: 'PTCL internet', price: 4999, is_active: true, next_payment_date: day(28) },
];

export const demoGoals: HomeGoal[] = [
    { target: 300000, saved: 112000 },
    { target: 80000, saved: 64000 },
];
