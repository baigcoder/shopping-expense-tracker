// Real-time Transactions Hook - Listens for extension updates
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { formatCurrency } from '../services/currencyService';

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

    // Trigger confetti animation
    const triggerConfetti = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FBBF24', '#10B981', '#3B82F6', '#8B5CF6']
        });
    };

    // Handle new transaction from extension
    const handleNewTransaction = useCallback((event: CustomEvent) => {
        const { transaction } = event.detail;

        console.log('🔥 Real-time transaction received:', transaction);

        // Add to list
        setTransactions(prev => [transaction, ...prev]);

        // Update stats
        if (transaction.type === 'expense') {
            setMonthlySpent(prev => prev + Math.abs(transaction.amount));
        }
        setTodayCount(prev => prev + 1);

        // Show toast notification
        toast.success(
            `💸 ${transaction.description} - ${formatCurrency(transaction.amount)} tracked!`
        );

        // Trigger celebration
        triggerConfetti();
    }, []);

    // Handle bulk sync
    const handleTransactionsSynced = useCallback((event: CustomEvent) => {
        const { count } = event.detail;

        toast.info(`✅ ${count} transaction(s) synced from extension!`);
    }, []);

    // Listen for real-time events
    useEffect(() => {
        window.addEventListener('new-transaction', handleNewTransaction as EventListener);
        window.addEventListener('transaction-added-realtime', handleNewTransaction as EventListener);
        window.addEventListener('transactions-synced', handleTransactionsSynced as EventListener);

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
