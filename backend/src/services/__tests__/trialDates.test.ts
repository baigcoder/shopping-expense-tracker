import { describe, expect, it, vi } from 'vitest';

vi.mock('../../config/supabase.js', () => ({ supabase: {} }));

import { trialDates } from '../transactionInboxService.js';

const server = '2026-11-19'; // the server's UTC day can lag the shopper's

describe('trialDates', () => {
    it('counts the length from the shopper’s own day', () => {
        expect(trialDates({ date: '2026-11-20', trialDays: 30 }, null, server)).toEqual({ trial_start_date: '2026-11-20', trial_end_date: '2026-12-20', trial_days: 30 });
    });

    it('uses the end date printed on the merchant’s page when it is believable', () => {
        expect(trialDates({ date: '2026-11-20', trialEndDate: '2026-12-04', trialDays: 7 }, null, server).trial_end_date).toBe('2026-12-04');
        expect(trialDates({ date: '2026-11-20', trialEndDate: '2029-01-01', trialDays: 7 }, null, server).trial_end_date).toBe('2026-11-27'); // years away: ignored
        expect(trialDates({ date: '2026-11-20', trialEndDate: '2026-10-01', trialDays: 7 }, null, server).trial_end_date).toBe('2026-11-27'); // in the past: ignored
    });

    it('keeps a running trial’s dates when the same trial is seen again', () => {
        const running = { is_trial: true, trial_start_date: '2026-11-10', trial_end_date: '2026-12-10' };
        expect(trialDates({ date: '2026-11-20', trialDays: 30 }, running, server)).toEqual({ trial_start_date: '2026-11-10', trial_end_date: '2026-12-10', trial_days: 30 });
    });

    it('starts a fresh trial when the old one has ended', () => {
        const ended = { is_trial: true, trial_start_date: '2026-09-01', trial_end_date: '2026-09-08' };
        expect(trialDates({ date: '2026-11-20', trialDays: 7 }, ended, server).trial_start_date).toBe('2026-11-20');
    });
});
