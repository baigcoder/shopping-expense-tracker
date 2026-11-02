import { describe, expect, it, vi } from 'vitest';

vi.mock('../../config/supabase.js', () => ({ supabase: {} }));
vi.mock('../emailService.js', () => ({ sendSimpleEmail: vi.fn() }));
vi.mock('../settingsService.js', () => ({ getUserSettings: vi.fn() }));

import { reminderText } from '../trialReminderService.js';

const sub = { name: 'Netflix', price: 9.99, cycle: 'monthly', trial_end_date: '2026-11-05' };

describe('reminderText', () => {
    it('says when the trial ends and what it will cost', () => {
        const { subject, body } = reminderText(sub, 2, 'USD');
        expect(subject).toBe('Your Netflix trial ends in 2 days');
        expect(body).toContain('billed $9.99/monthly');
        expect(reminderText(sub, 1, 'USD').subject).toContain('tomorrow');
        expect(reminderText(sub, 0, 'USD').subject).toContain('today');
    });

    it('does not invent a price when it is unknown', () => {
        expect(reminderText({ ...sub, price: 0 }, 2, 'USD').body).toContain('billed the full price');
    });
});
