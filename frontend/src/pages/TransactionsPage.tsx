// Activity: the approved ledger around the shared ActivityView (the demo renders the same view).
// Review of pending captures lives on the Review inbox screen.
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ActivityView } from '../features/activity/ActivityView';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import { supabaseTransactionService, type SupabaseTransaction } from '../services/supabaseTransactionService';
import { useTransactionRealtime } from '../hooks/useRealtimeSync';
import { TransactionSideSheet } from '../components/TransactionSideSheet';

const CSVImport = lazy(() => import('../components/CSVImport'));
const ExportModal = lazy(() => import('../components/ExportModal'));
const PDFAnalyzer = lazy(() => import('../components/PDFAnalyzer'));

export function TransactionsPage() {
    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState<SupabaseTransaction | null>(null);
    const [modal, setModal] = useState<null | 'csv' | 'pdf' | { export: SupabaseTransaction[] }>(null);

    const load = useCallback(async () => {
        if (!user?.id) return;
        try { setTransactions(await supabaseTransactionService.getAll(user.id, { force: true })); }
        catch { toast.error('Could not load your activity.'); }
        finally { setLoading(false); }
    }, [user?.id]);

    useEffect(() => { void load(); }, [load]);
    // Stable handlers: the hook resubscribes whenever they change.
    const refresh = useCallback(() => void load(), [load]);
    useTransactionRealtime(useMemo(() => ({ onInsert: refresh, onUpdate: refresh, onDelete: refresh }), [refresh]));

    return (
        <>
            <ActivityView
                transactions={transactions}
                money={(n) => formatCurrency(n)}
                loading={loading}
                onOpen={setOpen}
                onImportFile={() => setModal('csv')}
                onImportStatement={() => setModal('pdf')}
                onExport={(shown) => setModal({ export: shown })}
            />
            <TransactionSideSheet
                transaction={open}
                open={open !== null}
                onOpenChange={(o) => !o && setOpen(null)}
                onUpdate={async (u) => {
                    try {
                        await supabaseTransactionService.update(u.id, { description: u.description, category: u.category, amount: u.amount });
                        setTransactions((list) => list.map((t) => (t.id === u.id ? u : t)));
                        toast.success('Saved');
                    } catch { toast.error('Could not save that change.'); }
                }}
                onDelete={async (id) => {
                    try {
                        await supabaseTransactionService.delete(id);
                        setTransactions((list) => list.filter((t) => t.id !== id));
                        setOpen(null);
                        toast.success('Removed from your ledger');
                    } catch { toast.error('Could not remove it.'); }
                }}
            />
            <Suspense fallback={null}>
                {modal === 'csv' && <CSVImport onImport={() => { setModal(null); void load(); }} onClose={() => setModal(null)} />}
                {modal === 'pdf' && <PDFAnalyzer onComplete={() => { setModal(null); void load(); }} onClose={() => setModal(null)} />}
                {modal && typeof modal === 'object' && <ExportModal transactions={modal.export} onClose={() => setModal(null)} />}
            </Suspense>
        </>
    );
}

export default TransactionsPage;
