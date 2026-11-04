import { describe, expect, it } from 'vitest';
import { isoDay, nextBillDue } from './billSchedule';

const today = new Date(2026, 10, 20); // 20 Nov 2026
const due = (b: Parameters<typeof nextBillDue>[0]) => isoDay(nextBillDue(b, today));

describe('nextBillDue', () => {
    it('is the coming due date when nothing is missed', () => {
        expect(due({ due_date: '25', frequency: 'monthly', created_at: '2026-11-01' })).toBe('2026-11-25');
    });

    it('moves on once paid, even when paid a few days early', () => {
        expect(due({ due_date: '25', frequency: 'monthly', created_at: '2026-09-01', last_paid_date: '2026-11-20' })).toBe('2026-12-25');
        expect(due({ due_date: '2026-01-25', frequency: 'monthly', last_paid_date: '2026-10-27' })).toBe('2026-11-25');
    });

    it('stays overdue when the due date passed unpaid, reporting only the latest missed one', () => {
        expect(due({ due_date: '10', frequency: 'monthly', created_at: '2026-11-01' })).toBe('2026-11-10');
        expect(due({ due_date: '10', frequency: 'monthly', created_at: '2026-06-01' })).toBe('2026-11-10');
        expect(due({ due_date: '10', frequency: 'monthly', created_at: '2026-06-01', last_paid_date: '2026-11-09' })).toBe('2026-12-10');
    });

    it('does not call a bill overdue for a due date before it was added', () => {
        expect(due({ due_date: '5', frequency: 'monthly', created_at: '2026-11-18' })).toBe('2026-12-05');
    });

    it('handles day 31, quarterly and yearly bills, and one-off dates', () => {
        expect(due({ due_date: '31', frequency: 'monthly', created_at: '2026-11-21', last_paid_date: '2026-10-31' })).toBe('2026-11-30');
        expect(due({ due_date: '2026-03-15', frequency: 'quarterly', last_paid_date: '2026-09-15' })).toBe('2026-12-15');
        expect(due({ due_date: '2025-12-01', frequency: 'yearly', last_paid_date: '2025-12-01' })).toBe('2026-12-01');
        expect(due({ due_date: '2026-11-02', frequency: 'one-time' })).toBe('2026-11-02');
    });
});
