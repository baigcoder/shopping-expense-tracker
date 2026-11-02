import { describe, expect, it, vi } from 'vitest';

vi.mock('../../config/supabase.js', () => ({ supabase: {} }));
vi.mock('../redisCacheService.js', () => ({ default: {} }));
vi.mock('../settingsService.js', () => ({ getUserSettings: vi.fn() }));
vi.mock('../transactionDomainService.js', () => ({ listUserTransactions: vi.fn() }));

import { buildCashlySystemPrompt, FinancialSnapshot } from '../financialContextService.js';
import { buildCommitments, deriveSubscriptionFacts } from '../../utils/userKnowledge.js';

const now = new Date('2026-11-03T10:00:00Z');

function snapshotWith(subs: Array<Record<string, unknown>>): FinancialSnapshot {
    const facts = deriveSubscriptionFacts(subs, [], now);
    return {
        userId: 'u1',
        generatedAt: now.toISOString(),
        asOf: '2026-11-03',
        dataVersion: 'v',
        transactions: [],
        subscriptions: subs,
        goals: [],
        budgets: [],
        upcomingBills: [],
        pendingCandidates: [],
        summary: { userId: 'u1', monthlySpent: 0, weeklySpent: 0, topCategory: 'None', topCategoryAmount: 0, transactionCount: 0, healthScore: 70, currency: 'USD' },
        monthlySubCost: 0,
        trialCount: facts.filter((fact) => fact.state.startsWith('trial_a') || fact.state === 'trial_ending_soon').length,
        categoryBreakdown: {},
        subscriptionFacts: facts,
        commitments: buildCommitments(facts, [], now),
        transactionsTruncated: false,
    };
}

describe('buildCashlySystemPrompt', () => {
    it('states today and each trial lifecycle fact for the model', () => {
        const prompt = buildCashlySystemPrompt(snapshotWith([
            { name: 'Netflix', price: 9.99, cycle: 'monthly', is_trial: true, trial_end_date: '2026-11-05', is_active: true },
            { name: 'Hulu', price: 7, cycle: 'monthly', is_trial: true, trial_end_date: '2026-10-30', is_active: true },
            { name: 'Gym', price: 20, cycle: 'monthly', status: 'cancelled', is_active: false },
        ]));
        expect(prompt).toContain('TODAY is 2026-11-03');
        expect(prompt).toContain('Netflix: TRIAL ENDING SOON, ends 2026-11-05 (in 2 days)');
        expect(prompt).toContain('Hulu: TRIAL ENDED 2026-10-30, no charge found');
        expect(prompt).toContain('Gym: CANCELLED');
        expect(prompt).toContain('2026-11-05: Netflix trial ends and starts billing');
    });

    it('flags a cut-off subscription list instead of hiding it', () => {
        const many = Array.from({ length: 17 }, (_, i) => ({ name: `Service ${i}`, price: 1, cycle: 'monthly', is_active: true }));
        expect(buildCashlySystemPrompt(snapshotWith(many))).toContain('showing 15 of 17');
    });
});
