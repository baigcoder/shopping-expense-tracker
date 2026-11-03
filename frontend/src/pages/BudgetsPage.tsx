// Budgets: live data and actions around the shared BudgetsView (the demo renders the same view).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BudgetsView } from '../features/budgets/BudgetsView';
import { buildBudgets } from '../features/budgets/budgetModel';
import { budgetService, type Budget } from '../services/budgetService';
import { supabaseTransactionService, type SupabaseTransaction } from '../services/supabaseTransactionService';
import { formatCurrency } from '../services/currencyService';
import { useAuth } from '../hooks/useAuth';
import { useSound } from '@/hooks/useSound';

export const BudgetsPage = () => {
    const { user } = useAuth();
    const sound = useSound();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!user) return;
        try {
            const [b, t] = await Promise.all([budgetService.getAll(user.id), supabaseTransactionService.getAll(user.id)]);
            setBudgets(b);
            setTransactions(t);
        } catch {
            toast.error('Could not load your budgets. Try again in a moment.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { void load(); }, [load]);

    const model = useMemo(() => buildBudgets(budgets, transactions), [budgets, transactions]);

    return (
        <BudgetsView
            model={model}
            money={(n) => formatCurrency(n)}
            loading={loading}
            saving={saving}
            onAdd={async (category, amount) => {
                if (!user) return;
                setSaving(true);
                try {
                    const created = await budgetService.create({ user_id: user.id, category, amount, period: 'monthly' });
                    if (created) {
                        setBudgets((b) => [...b, created]);
                        toast.success(`${category} budget set to ${formatCurrency(amount)} a month`);
                        sound.playSuccess();
                    }
                } catch (e: any) {
                    toast.error(e?.message || 'Could not save the budget.');
                } finally {
                    setSaving(false);
                }
            }}
            onRemove={async (line) => {
                if (!confirm(`Remove the ${line.category} budget?`)) return;
                if (await budgetService.delete(line.id)) {
                    setBudgets((b) => b.filter((x) => x.id !== line.id));
                    toast.success(`${line.category} budget removed`);
                    sound.playClick();
                }
            }}
        />
    );
};

export default BudgetsPage;
