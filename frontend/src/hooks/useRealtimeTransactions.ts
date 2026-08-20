// Real-time Transactions Hook - Listens for extension updates.
// Performance: toasts and confetti are coalesced via realtimeToasts so that
// bulk syncs (30+ events) don't freeze the main thread.
import { useState, useEffect, useCallback } from 'react';
import { queueRealtimeToast, queueBulkSyncedToast } from '../lib/realtimeToasts';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    type: 'income' | 'expense';
    source?: string;
}

export const useRealtimeTransactions = (initialTransactions: Transaction[] = []) => {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [monthlySpent, setMonthlySpent] = useState(0);
    const [todayCount, setTodayCount] = useState(0);

    // Handle new transaction from extension
    const handleNewTransaction = useCallback((event: Event) => {
        const detail = (event as CustomEvent).detail;
        const transaction = detail?.transaction ?? detail;
        if (!transaction || typeof transaction.amount !== 'number') return;

        console.log('🔥 Real-time transaction received:', transaction);

        setTransactions((prev) => [transaction, ...prev]);

        if (transaction.type === 'expense') {
            setMonthlySpent((prev) => prev + Math.abs(transaction.amount));
        }
        setTodayCount((prev) => prev + 1);

        // Coalesced toast + throttled confetti (see lib/realtimeToasts.ts)
        queueRealtimeToast({
            description: transaction.description || 'Transaction',
            amount: transaction.amount,
            type: transaction.type
        });
    }, []);

    // Handle bulk sync
    const handleTransactionsSynced = useCallback((event: Event) => {
        const { count } = (event as CustomEvent).detail || {};
        if (typeof count === 'number' && count > 0) {
            queueBulkSyncedToast(count);
        }
    }, []);

    // Listen for real-time events
    useEffect(() => {
        window.addEventListener('new-transaction', handleNewTransaction as EventListener, { passive: true });
        window.addEventListener('transaction-added-realtime', handleNewTransaction as EventListener, { passive: true });
        window.addEventListener('transactions-synced', handleTransactionsSynced as EventListener, { passive: true });

        return () => {
            window.removeEventListener('new-transaction', handleNewTransaction as EventListener);
            window.removeEventListener('transaction-added-realtime', handleNewTransaction as EventListener);
            window.removeEventListener('transactions-synced', handleTransactionsSynced as EventListener);
        };
    }, [handleNewTransaction, handleTransactionsSynced]);

    return {
        transactions,
        setTransactions,
        monthlySpent,
        todayCount
    };
};
