// Bills and subscriptions: live data and actions around the shared CommitmentsView (the demo renders the same view).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CommitmentsView, type CommitmentTab, type NewCommitment } from '../features/commitments/CommitmentsView';
import { buildCommitments } from '../features/commitments/commitmentsModel';
import { fromBill, fromSub } from '../features/commitments/fromServices';
import { useAuthStore } from '../store/useStore';
import { subscriptionService, type Subscription } from '../services/subscriptionService';
import { billService, type Bill } from '../services/billService';
import { formatCurrency } from '../services/currencyService';

const TABS: CommitmentTab[] = ['all', 'subscriptions', 'bills', 'trials'];

const SubscriptionsPage = () => {
    const { user } = useAuthStore();
    const [params, setParams] = useSearchParams();
    const tab = TABS.includes(params.get('tab') as CommitmentTab) ? (params.get('tab') as CommitmentTab) : 'all';
    const [subs, setSubs] = useState<Subscription[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [s, b] = await Promise.all([subscriptionService.getAll(user.id), billService.getAll(user.id)]);
            setSubs(s);
            setBills(b);
        } catch {
            toast.error('Could not load bills and subscriptions.');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { void load(); }, [load]);

    const model = useMemo(() => buildCommitments([...subs.map(fromSub), ...bills.map(fromBill)]), [subs, bills]);

    const act = async (work: () => Promise<unknown>, ok: string) => {
        try { await work(); toast.success(ok); await load(); } catch { toast.error('That did not save. Try again.'); }
    };

    const add = async (c: NewCommitment) => {
        if (!user?.id) return;
        setSaving(true);
        await act(() => c.kind === 'bill'
            ? billService.create(user.id, {
                name: c.name, amount: c.amount, due_date: c.date, category: 'Utilities', is_recurring: c.cycle !== 'one-time',
                frequency: c.cycle as Bill['frequency'], reminder_days: 3, is_paid: false,
            })
            : subscriptionService.create({
                user_id: user.id, name: c.name, logo: '', category: c.category, price: c.amount, cycle: c.cycle as Subscription['cycle'],
                color: 'var(--color-brand)', is_active: true, status: c.isTrial ? 'trial' : 'active', is_trial: c.isTrial,
                trial_days: c.isTrial ? c.trialDays : undefined, start_date: c.date,
            }), `${c.name} added`);
        setSaving(false);
    };

    return (
        <CommitmentsView
            model={model}
            tab={tab}
            money={(n) => formatCurrency(n)}
            loading={loading}
            saving={saving}
            onTab={(t) => setParams(t === 'all' ? {} : { tab: t })}
            onToggle={(l) => void act(() => subscriptionService.update(l.id, { is_active: !l.active, status: l.active ? 'cancelled' : 'active' }), l.active ? `${l.name} cancelled` : `${l.name} resumed`)}
            onPaid={(l) => void act(() => billService.markAsPaid(l.id), `${l.name} marked paid`)}
            onRemove={(l) => void act(() => l.kind === 'bill' ? billService.delete(l.id) : subscriptionService.delete(l.id), `${l.name} removed`)}
            onAdd={(c) => void add(c)}
        />
    );
};

export default SubscriptionsPage;
