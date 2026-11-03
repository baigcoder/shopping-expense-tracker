// Spending: approved transactions around the shared SpendingView (the demo renders the same view).
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SpendingView } from '../features/spending/SpendingView';
import { supabaseTransactionService, type SupabaseTransaction } from '../services/supabaseTransactionService';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import { FINANCIAL_DATA_EVENTS } from '../services/financialDataEvents';

export const AnalyticsPage = () => {
    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!user?.id) return;
        try { setTransactions(await supabaseTransactionService.getAll(user.id)); }
        catch { toast.error('Could not load your spending.'); }
        finally { setLoading(false); }
    }, [user?.id]);

    useEffect(() => { void load(); }, [load]);
    useEffect(() => {
        const refresh = () => void load();
        const events = ['analytics-data-changed', ...FINANCIAL_DATA_EVENTS];
        events.forEach((e) => window.addEventListener(e, refresh));
        return () => events.forEach((e) => window.removeEventListener(e, refresh));
    }, [load]);

    return <SpendingView transactions={transactions} money={(n) => formatCurrency(n)} loading={loading} />;
};

export default AnalyticsPage;
