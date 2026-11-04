// Money Twin: live transactions, bills and subscriptions around the shared TwinView (the demo renders the same view).
// No placeholder figures: an empty account shows an empty forecast.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TwinView, type TwinAlert } from '../features/twin/TwinView';
import type { TwinCharge } from '../features/twin/twinModel';
import { accountsBalance, fromBill, fromSub } from '../features/commitments/fromServices';
import { useAuthStore } from '../store/useStore';
import { supabaseTransactionService, type SupabaseTransaction } from '../services/supabaseTransactionService';
import { subscriptionService } from '../services/subscriptionService';
import { billService } from '../services/billService';
import bankAccountService from '../services/bankAccountService';
import { moneyTwinService } from '../services/moneyTwinService';
import { formatCurrency } from '../services/currencyService';
import { useDataRealtime } from '../hooks/useDataRealtime';

export const MoneyTwinPage = () => {
    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [charges, setCharges] = useState<TwinCharge[]>([]);
    const [alerts, setAlerts] = useState<TwinAlert[]>([]);
    const [startBalance, setStartBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [txs, subs, bills, accounts] = await Promise.all([
                supabaseTransactionService.getAll(user.id),
                subscriptionService.getAll(user.id),
                billService.getAll(user.id),
                bankAccountService.getAll(user.id).catch(() => []),
            ]);
            setTransactions(txs);
            setCharges([...subs.map(fromSub), ...bills.map(fromBill)]);
            setStartBalance(accountsBalance(accounts));
        } catch {
            toast.error('Could not load your forecast.');
        } finally {
            setLoading(false);
        }
        // Risk alerts come from the backend model when it is available; the forecast does not depend on them.
        moneyTwinService.getMoneyTwin(user.id, false)
            .then((state) => setAlerts((state?.riskAlerts || []).map((a) => ({ id: a.id, title: a.title, message: a.preventionTip || a.message, urgent: a.severity === 'danger' || a.severity === 'critical' }))))
            .catch(() => undefined);
    }, [user?.id]);

    useEffect(() => { void load(); }, [load]);
    useDataRealtime({ onMoneyTwinRefresh: () => void load() });

    const tx = useMemo(() => transactions.map((t) => ({ date: t.date, amount: t.amount, type: t.type, category: t.category, description: t.description })), [transactions]);

    return <TwinView transactions={tx} charges={charges} alerts={alerts} money={(n) => formatCurrency(n)} loading={loading} startBalance={startBalance} />;
};

export default MoneyTwinPage;
