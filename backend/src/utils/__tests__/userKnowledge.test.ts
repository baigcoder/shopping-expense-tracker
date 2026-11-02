import { describe, expect, it } from 'vitest';
import { buildCommitments, deriveSubscriptionFacts, monthlyPaidCost, trialAlerts, trialInsights } from '../userKnowledge.js';

const now = new Date('2026-11-03T10:00:00Z');
const sub = (over: Record<string, unknown>) => ({ name: 'Netflix', price: 9.99, cycle: 'monthly', is_active: true, ...over });

describe('deriveSubscriptionFacts', () => {
    it('classifies trials by days left', () => {
        const [far, soon, today] = deriveSubscriptionFacts([
            sub({ is_trial: true, trial_end_date: '2026-11-20' }),
            sub({ is_trial: true, trial_end_date: '2026-11-05' }),
            sub({ is_trial: true, trial_end_date: '2026-11-03' }),
        ], [], now);
        expect(far).toMatchObject({ state: 'trial_active', daysLeft: 17 });
        expect(soon).toMatchObject({ state: 'trial_ending_soon', daysLeft: 2 });
        expect(today).toMatchObject({ state: 'trial_ending_soon', daysLeft: 0 });
    });

    it('tells a converted trial from an unpaid ended one', () => {
        const ended = { is_trial: true, trial_end_date: '2026-10-30' };
        const charge = { store_name: 'Netflix', amount: 9.99, type: 'expense', date: '2026-10-30' };
        expect(deriveSubscriptionFacts([sub(ended)], [charge], now)[0].state).toBe('trial_converted');
        expect(deriveSubscriptionFacts([sub(ended)], [], now)[0].state).toBe('trial_ended_unpaid');
        expect(deriveSubscriptionFacts([sub(ended)], [{ ...charge, date: '2026-10-01' }], now)[0].state).toBe('trial_ended_unpaid');
    });

    it('keeps cancelled and plain paid subscriptions apart', () => {
        const [cancelled, inactive, paid] = deriveSubscriptionFacts([
            sub({ status: 'cancelled', is_trial: true, trial_end_date: '2026-11-20' }),
            sub({ is_active: false }),
            sub({ next_payment_date: '2026-11-10' }),
        ], [], now);
        expect(cancelled.state).toBe('cancelled');
        expect(inactive.state).toBe('cancelled');
        expect(paid).toMatchObject({ state: 'paid', nextChargeDate: '2026-11-10' });
    });
});

describe('trialAlerts', () => {
    it('warns about trials that bill soon or ended with no charge, and nothing else', () => {
        const facts = deriveSubscriptionFacts([
            sub({ name: 'Netflix', is_trial: true, trial_end_date: '2026-11-04' }),
            sub({ name: 'Hulu', is_trial: true, trial_end_date: '2026-10-30' }),
            sub({ name: 'Far', is_trial: true, trial_end_date: '2026-12-30' }),
            sub({ name: 'Paid' }),
        ], [], now);
        const alerts = trialAlerts(facts, (value) => `$${value}`);
        expect(alerts.map((alert) => alert.title)).toEqual(['Netflix trial ends tomorrow', 'Hulu trial has ended']);
        expect(alerts[0].message).toContain('Cancel before 2026-11-04');
        expect(trialInsights(alerts, 'risk')[0]).toMatchObject({ type: 'risk', confidence: 1 });
    });
});

describe('commitments and cost', () => {
    it('lists trial conversions, renewals and unpaid bills in date order', () => {
        const facts = deriveSubscriptionFacts([
            sub({ name: 'Hulu', is_trial: true, trial_end_date: '2026-11-08' }),
            sub({ name: 'Spotify', price: 5, next_payment_date: '2026-11-05' }),
            sub({ name: 'Late', next_payment_date: '2027-03-01' }),
        ], [], now);
        const items = buildCommitments(facts, [
            { title: 'Rent', amount: 500, due_date: '2026-11-04', is_paid: false },
            { title: 'Paid bill', amount: 1, due_date: '2026-11-04', is_paid: true },
        ], now);
        expect(items.map((item) => item.title)).toEqual(['Rent', 'Spotify renewal', 'Hulu trial ends and starts billing']);
    });

    it('does not count unbilled trials in the monthly cost', () => {
        const facts = deriveSubscriptionFacts([
            sub({ price: 10 }),
            sub({ price: 120, cycle: 'yearly' }),
            sub({ price: 50, is_trial: true, trial_end_date: '2026-11-20' }),
        ], [], now);
        expect(monthlyPaidCost(facts)).toBe(20);
    });
});
