// Map the subscription and bill services onto commitments (shared by Bills and subscriptions, and Money Twin).
import type { CommitmentInput } from './commitmentsModel';
import type { Subscription } from '@/services/subscriptionService';
import { billService, type Bill } from '@/services/billService';

export const fromSub = (s: Subscription): CommitmentInput => ({
    id: s.id, kind: 'subscription', name: s.name, category: s.category, amount: s.price, cycle: s.cycle,
    nextDate: (s.is_trial && s.trial_end_date) || s.next_payment_date || s.renew_date || null,
    active: s.status !== 'cancelled' && s.is_active !== false, isTrial: s.is_trial && s.status !== 'cancelled',
});

export const fromBill = (b: Bill): CommitmentInput => ({
    id: b.id, kind: 'bill', name: b.name, category: b.category, amount: b.amount, cycle: b.frequency,
    nextDate: billService.getNextDueDate(b).toISOString(), active: true, paid: b.is_paid,
});
