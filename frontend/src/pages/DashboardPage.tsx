// Home: live data in, shared HomeView out. The demo renders the same HomeView with sample data.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { HomeView } from '../features/home/HomeView';
import { buildHomeModel, type HomeInput, type PendingLine } from '../features/home/homeModel';
import { useAuthStore, useModalStore } from '../store/useStore';
import { supabaseTransactionService } from '../services/supabaseTransactionService';
import { budgetService } from '../services/budgetService';
import { subscriptionService } from '../services/subscriptionService';
import { billService } from '../services/billService';
import bankAccountService from '../services/bankAccountService';
import { accountsBalance, fromBill, fromSub } from '../features/commitments/fromServices';
import { goalService } from '../services/goalService';
import { transactionInboxApi, type TransactionCandidate } from '../services/featureExpansionApi';
import { usePaymentCaptureSync } from '../hooks/usePaymentCaptureSync';
import { formatCurrency } from '../services/currencyService';
import { supabase } from '../config/supabase';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

const EMPTY: Omit<HomeInput, 'now'> = { transactions: [], budgets: [], commitments: [], goals: [], pending: [] };

const settle = <T,>(p: Promise<T>, fallback: T, ms = 4000) =>
    Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]).catch(() => fallback);

export function DashboardPage() {
    const { user } = useAuthStore();
    const { openAddTransaction } = useModalStore();
    const [input, setInput] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        let userId = user?.id;
        if (!userId) userId = (await supabase.auth.getSession()).data.session?.user?.id;
        if (!userId) { setLoading(false); return; }

        // Transactions are not raced against a timeout: an empty list would show a long-time user the new-user setup.
        const [transactions, budgets, subscriptions, bills, goals, accounts, inbox] = await Promise.all([
            supabaseTransactionService.getAll(userId, { force: true }).catch(() => null),
            settle(budgetService.getAll(userId), []),
            settle(subscriptionService.getAll(userId), []),
            settle(billService.getAll(userId), []),
            settle(goalService.getAll(userId), []),
            settle(bankAccountService.getAll(userId), []),
            settle(transactionInboxApi.list({ status: 'pending', limit: 8 }), { data: [] as TransactionCandidate[] }),
        ]);

        if (transactions === null) {
            toast.error('Could not load your money. Check your connection and try again.');
            setLoading(false);
            return;
        }

        setInput({
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
        });
        setLoading(false);
    }, [user?.id]);

    usePaymentCaptureSync(() => void load());
    useEffect(() => { void load(); }, [load]);

    const model = useMemo(() => buildHomeModel(input), [input]);

    const act = async (item: PendingLine, kind: 'approve' | 'reject') => {
        setBusyId(item.id);
        try {
            if (kind === 'approve') await transactionInboxApi.approve(item.id);
            else await transactionInboxApi.reject(item.id);
            toast.success(kind === 'approve' ? `${item.merchant} added to your spending` : `${item.merchant} dismissed`);
            await load();
        } catch {
            toast.error('That did not save. Try again in a moment.');
        } finally {
            setBusyId(null);
        }
    };

    if (loading) return <DashboardSkeleton />;

    return (
        <HomeView
            model={model}
            firstName={user?.name?.split(' ')[0] || 'there'}
            money={(n) => formatCurrency(n)}
            busyId={busyId}
            onApprove={(i) => void act(i, 'approve')}
            onDismiss={(i) => void act(i, 'reject')}
            onAdd={openAddTransaction}
        />
    );
}

export default DashboardPage;
