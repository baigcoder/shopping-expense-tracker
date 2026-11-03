// Goals: live data and actions around the shared GoalsView (the demo renders the same view).
// Uses goalService, whose columns (target, saved) match the goals table.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { GoalsView } from '../features/goals/GoalsView';
import { buildGoals } from '../features/goals/goalsModel';
import { goalService, type Goal } from '../services/goalService';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';

const GoalsPage = () => {
    const { user } = useAuthStore();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!user?.id) return;
        try { setGoals(await goalService.getAll(user.id)); }
        catch { toast.error('Could not load your goals.'); }
        finally { setLoading(false); }
    }, [user?.id]);

    useEffect(() => { void load(); }, [load]);

    const model = useMemo(() => buildGoals(goals), [goals]);

    return (
        <GoalsView
            model={model}
            money={(n) => formatCurrency(n)}
            loading={loading}
            saving={saving}
            onAdd={async (g) => {
                if (!user?.id) return;
                setSaving(true);
                const created = await goalService.create({ user_id: user.id, name: g.name, target: g.target, saved: 0, deadline: g.deadline || undefined, icon: '' });
                setSaving(false);
                if (!created) return void toast.error('Could not save the goal.');
                toast.success(`${g.name} added`);
                void load();
            }}
            onDeposit={async (g, amount) => {
                const updated = await goalService.addFunds(g.id, amount);
                if (!updated) return void toast.error('Could not add that amount.');
                toast.success(`${formatCurrency(amount)} added to ${g.name}`);
                void load();
            }}
            onRemove={async (g) => {
                if (!confirm(`Remove ${g.name}?`)) return;
                if (await goalService.delete(g.id)) { toast.success(`${g.name} removed`); void load(); }
            }}
        />
    );
};

export default GoalsPage;
