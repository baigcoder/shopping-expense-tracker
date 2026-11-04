// Home: live data in, shared HomeView out. The demo renders the same HomeView with sample data.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { HomeView } from '../features/home/HomeView';
import { buildHomeModel, type HomeInput, type PendingLine } from '../features/home/homeModel';
import { useAuthStore, useModalStore } from '../store/useStore';
import { transactionInboxApi } from '../services/featureExpansionApi';
import { loadHomeInput } from '../features/home/loadHomeInput';
import { usePaymentCaptureSync } from '../hooks/usePaymentCaptureSync';
import { formatCurrency } from '../services/currencyService';
import { supabase } from '../config/supabase';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

const EMPTY: Omit<HomeInput, 'now'> = { transactions: [], budgets: [], commitments: [], goals: [], pending: [] };

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

        const next = await loadHomeInput(userId);
        if (next === null) toast.error('Could not load your money. Check your connection and try again.');
        else setInput(next);
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
