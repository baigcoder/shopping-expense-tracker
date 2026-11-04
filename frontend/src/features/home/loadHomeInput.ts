// Everything Home needs, loaded once the same way for Home and Ask Cashly, so both work from the same numbers.
import type { HomeInput } from './homeModel';
import { accountsBalance, fromBill, fromSub } from '../commitments/fromServices';
import { supabaseTransactionService } from '@/services/supabaseTransactionService';
import { budgetService } from '@/services/budgetService';
import { subscriptionService } from '@/services/subscriptionService';
import { billService } from '@/services/billService';
import bankAccountService from '@/services/bankAccountService';
import { goalService } from '@/services/goalService';
import { transactionInboxApi, type TransactionCandidate } from '@/services/featureExpansionApi';

const settle = <T,>(p: Promise<T>, fallback: T, ms = 4000) =>
    Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]).catch(() => fallback);

/** Null when transactions could not load: an empty list would make a long-time user look brand new. */
export async function loadHomeInput(userId: string, force = true): Promise<Omit<HomeInput, 'now'> | null> {
    // Transactions are not raced against a timeout; the rest fall back to empty after 4 seconds.
    const [transactions, budgets, subscriptions, bills, goals, accounts, inbox] = await Promise.all([
        supabaseTransactionService.getAll(userId, { force }).catch(() => null),
        settle(budgetService.getAll(userId), []),
        settle(subscriptionService.getAll(userId), []),
        settle(billService.getAll(userId), []),
        settle(goalService.getAll(userId), []),
        settle(bankAccountService.getAll(userId), []),
        settle(transactionInboxApi.list({ status: 'pending', limit: 8 }), { data: [] as TransactionCandidate[] }),
    ]);
    if (transactions === null) return null;

    return {
        transactions,
        budgets,
        commitments: [...subscriptions.map(fromSub), ...bills.map(fromBill)],
        goals,
        accountsBalance: accountsBalance(accounts),
        pending: ((inbox?.data || []) as TransactionCandidate[]).map((c) => ({
            id: c.id,
            merchant: c.merchant_name || c.description,
            description: c.description,
            amount: Math.abs(c.amount),
            category: c.category || 'Other',
            date: c.date,
            source: c.source,
            type: c.type === 'income' ? 'income' as const : 'expense' as const,
        })),
    };
}
