// Calendar: approved transactions plus scheduled bills and subscriptions, around the shared CalendarView (the demo renders the same view).
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarView } from '../features/calendar/CalendarView';
import type { CalCharge } from '../features/calendar/calendarModel';
import { fromBill, fromSub } from '../features/commitments/fromServices';
import { useAuthStore } from '../store/useStore';
import { supabaseTransactionService, type SupabaseTransaction } from '../services/supabaseTransactionService';
import { subscriptionService } from '../services/subscriptionService';
import { billService } from '../services/billService';
import { formatCurrency } from '../services/currencyService';

const CashflowCalendarPage = () => {
    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [charges, setCharges] = useState<CalCharge[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [t, s, b] = await Promise.all([supabaseTransactionService.getAll(user.id), subscriptionService.getAll(user.id), billService.getAll(user.id)]);
            setTransactions(t);
            setCharges([...s.map(fromSub), ...b.map(fromBill)]);
        } catch {
            toast.error('Could not load your calendar.');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { void load(); }, [load]);

    return <CalendarView transactions={transactions} charges={charges} money={(n) => formatCurrency(n)} loading={loading} />;
};

export default CashflowCalendarPage;
