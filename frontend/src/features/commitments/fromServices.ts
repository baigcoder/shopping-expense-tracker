// Map the subscription and bill services onto commitments (shared by Bills and subscriptions, and Money Twin).
import type { CommitmentInput } from './commitmentsModel';
import type { Subscription } from '@/services/subscriptionService';
import { billService, type Bill } from '@/services/billService';
import type { BankAccount } from '@/services/bankAccountService';
import { isoDay } from './billSchedule';

export const fromSub = (s: Subscription): CommitmentInput => ({
    id: s.id, kind: 'subscription', name: s.name, category: s.category, amount: s.price, cycle: s.cycle,
    nextDate: (s.is_trial && s.trial_end_date) || s.next_payment_date || s.renew_date || null,
    active: s.status !== 'cancelled' && s.is_active !== false, isTrial: s.is_trial && s.status !== 'cancelled',
});

export const fromBill = (b: Bill): CommitmentInput => ({
    id: b.id, kind: 'bill', name: b.name, category: b.category, amount: b.amount, cycle: b.frequency,
    // Local day, not toISOString(): in UTC+5 a midnight date would shift to the day before.
    nextDate: isoDay(billService.getNextDueDate(b)), active: true, paid: b.frequency === 'one-time' && b.is_paid,
});

/** What active accounts hold minus card debt, or null with no accounts so callers fall back to the ledger. Home and Money Twin share it. */
export const accountsBalance = (accounts: BankAccount[]): number | null => {
    const live = accounts.filter((a) => a.is_active);
    return live.length ? live.reduce((s, a) => s + (a.account_type === 'credit' ? -Math.abs(a.balance) : a.balance), 0) : null;
};
