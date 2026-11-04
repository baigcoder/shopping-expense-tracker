// Reports: approved transactions around the shared ReportsView (the demo renders the same view).
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ReportsView } from '../features/reports/ReportsView';
import { supabaseTransactionService, type SupabaseTransaction } from '@/services/supabaseTransactionService';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';

export const ReportsPage = () => {
    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!user?.id) return;
        try { setTransactions(await supabaseTransactionService.getAll(user.id)); }
        catch { toast.error('Could not load your reports.'); }
        finally { setLoading(false); }
    }, [user?.id]);

    useEffect(() => { void load(); }, [load]);

    return <ReportsView transactions={transactions} money={(n) => formatCurrency(n)} loading={loading} />;
};

export default ReportsPage;
