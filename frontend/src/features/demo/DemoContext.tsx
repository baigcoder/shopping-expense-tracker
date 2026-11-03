import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { HomeInput, HomePending, HomeTransaction } from '../home/homeModel';
import { demoBudgets, demoGoals, demoPending, demoSubscriptions, demoTransactions } from './demoData';

interface DemoState {
    input: Omit<HomeInput, 'now'>;
    approve: (item: HomePending) => void;
    dismiss: (item: HomePending) => void;
    reset: () => void;
    lastAction: string | null;
}

const DemoCtx = createContext<DemoState | null>(null);

// In-memory only: nothing the visitor does in the demo is saved or sent anywhere.
export function DemoProvider({ children }: { children: ReactNode }) {
    const [transactions, setTransactions] = useState<HomeTransaction[]>(demoTransactions);
    const [pending, setPending] = useState<HomePending[]>(demoPending);
    const [lastAction, setLastAction] = useState<string | null>(null);

    const approve = useCallback((item: HomePending) => {
        setPending((p) => p.filter((x) => x.id !== item.id));
        setTransactions((t) => [{ id: `a-${item.id}`, date: item.date, description: item.merchant, amount: item.amount, type: 'expense', category: item.category }, ...t]);
        setLastAction(`${item.merchant} approved. It now counts toward your ${item.category} budget and safe-to-spend.`);
    }, []);

    const dismiss = useCallback((item: HomePending) => {
        setPending((p) => p.filter((x) => x.id !== item.id));
        setLastAction(`${item.merchant} dismissed. It never touches your numbers.`);
    }, []);

    const reset = useCallback(() => {
        setTransactions(demoTransactions());
        setPending(demoPending());
        setLastAction(null);
    }, []);

    const value = useMemo(() => ({
        input: { transactions, pending, budgets: demoBudgets, subscriptions: demoSubscriptions, goals: demoGoals },
        approve, dismiss, reset, lastAction,
    }), [transactions, pending, approve, dismiss, reset, lastAction]);

    return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export function useDemo() {
    const ctx = useContext(DemoCtx);
    if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
    return ctx;
}
