// Real-time Sync Hook - Fast, accurate real-time updates using Supabase Realtime
import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import genZToast from '../services/genZToast';
import confetti from 'canvas-confetti';
import { RealtimeChannel } from '@supabase/supabase-js';

type EventHandler = (payload: any) => void;

interface RealtimeConfig {
    onTransactionInsert?: EventHandler;
    onTransactionUpdate?: EventHandler;
    onTransactionDelete?: EventHandler;
    onSubscriptionInsert?: EventHandler;
    onGoalUpdate?: EventHandler;
    onBudgetUpdate?: EventHandler;
    onAIInsight?: EventHandler;
    onPaymentReminder?: EventHandler;
    onAnyChange?: () => void;
}

// Celebration confetti
const triggerCelebration = () => {
    confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#FBBF24', '#10B981', '#8B5CF6', '#EC4899']
    });
};

// Main real-time sync hook with enhanced performance
export const useRealtimeSync = (config: RealtimeConfig = {}) => {
    const { user } = useAuthStore();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const isSubscribed = useRef(false);
    // Use state for connectionStatus so components re-render on status change
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

    const setupSubscription = useCallback(() => {
        if (!user?.id || isSubscribed.current) return;



        // Create a unique channel for this user with optimized settings
        const channel = supabase.channel(`realtime-${user.id}`, {
            config: {
                broadcast: { self: true, ack: true },
                presence: { key: user.id }
            }
        });

        // ================================
        // BROADCAST CHANNEL - For instant extension updates
        // ================================
        channel.on('broadcast', { event: 'extension-transaction' }, (payload) => {


            const tx = payload.payload;
            const amount = tx.amount || 0;
            const description = tx.name || tx.description || 'Transaction';

            // Show toast immediately
            genZToast.cash(`⚡ ${description} • ${formatCurrency(Math.abs(amount))} tracked!`);

            // Celebration for purchases
            if (Math.abs(amount) >= 10) {
                triggerCelebration();
            }

            // Dispatch custom event for components
            window.dispatchEvent(new CustomEvent('transaction-added-realtime', {
                detail: { transaction: tx, source: 'broadcast' }
            }));

            // Call handlers
            config.onTransactionInsert?.({ new: tx });
            config.onAnyChange?.();
        });

        // ================================
        // EXTENSION SYNC BROADCAST - For instant cross-tab sync
        // ================================
        channel.on('broadcast', { event: 'extension-synced' }, (payload) => {


            // Dispatch event for ExtensionGate and other components
            window.dispatchEvent(new CustomEvent('extension-synced', {
                detail: payload.payload
            }));

            // Show success toast (handles deduplication internally)
            genZToast.extensionSynced();
        });

        channel.on('broadcast', { event: 'extension-removed' }, (payload) => {


            // VERIFY: Only show toast if extension is actually removed (check localStorage)
            const syncedData = localStorage.getItem('cashly_extension_synced');
            if (syncedData) {
                try {
                    const parsed = JSON.parse(syncedData);
                    // If still synced in localStorage, this is a false alarm
                    if (parsed.synced) {

                        return;
                    }
                } catch (e) {
                    // Continue with removal if parse fails
                }
            }

            // Dispatch event for ExtensionGate
            window.dispatchEvent(new CustomEvent('extension-removed', {
                detail: payload.payload
            }));

            // Show error toast (only once per session)
            if (!sessionStorage.getItem('extension-removal-toast-shown')) {
                sessionStorage.setItem('extension-removal-toast-shown', 'true');
                genZToast.error('Extension disconnected! Please reinstall.');
            }
        });

        // ================================
        // POSTGRES CHANGES - For database sync
        // ================================
        channel.on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'transactions',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => {


                const tx = payload.new as any;
                const amount = tx.amount || 0;
                const description = tx.description || tx.category || 'Transaction';

                // Show toast notification
                genZToast.cash(`${description} • ${formatCurrency(Math.abs(amount))} tracked! 💸`);

                // Celebration for purchases
                if (Math.abs(amount) >= 10) {
                    triggerCelebration();
                }

                // Dispatch custom event for components
                window.dispatchEvent(new CustomEvent('transaction-added-realtime', {
                    detail: { transaction: tx, source: 'postgres' }
                }));

                // Call handler
                config.onTransactionInsert?.(payload);
                config.onAnyChange?.();
            }
        );

        channel.on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'transactions',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => {

                config.onTransactionUpdate?.(payload);
                config.onAnyChange?.();
            }
        );

        channel.on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'transactions',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => {

                config.onTransactionDelete?.(payload);
                config.onAnyChange?.();
            }
        );

        // Subscribe to SUBSCRIPTIONS table
        channel.on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'subscriptions',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => {


                const sub = payload.new as any;
                genZToast.success(`New subscription: ${sub.name || 'Service'} added! 💳`);

                config.onSubscriptionInsert?.(payload);
                config.onAnyChange?.();
            }
        );

        // Subscribe to GOALS table
        channel.on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'goals',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => {

                config.onGoalUpdate?.(payload);
                config.onAnyChange?.();
            }
        );

        // Subscribe to BUDGETS table
        channel.on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'budgets',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => {


                // Check if budget limit is approaching (80%+)
                const budget = payload.new as any;
                if (budget && budget.spent && budget.limit) {
                    const percentage = (budget.spent / budget.limit) * 100;
                    if (percentage >= 80 && percentage < 100) {
                        genZToast.warning(`⚠️ Budget "${budget.category}" at ${percentage.toFixed(0)}%! Slow down spending.`);
                    } else if (percentage >= 100) {
                        genZToast.error(`🚨 Budget "${budget.category}" exceeded! ${percentage.toFixed(0)}% spent.`);
                    }
                }

                config.onBudgetUpdate?.(payload);
                config.onAnyChange?.();
            }
        );

        // ================================
        // AI INSIGHTS - Instant notifications
        // ================================
        channel.on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'ai_insights',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => {


                const insight = payload.new as any;
                genZToast.success(`🤖 AI Insight: ${insight.title || 'New analysis ready!'}`);

                // Dispatch event for components
                window.dispatchEvent(new CustomEvent('ai-insight-ready', {
                    detail: { insight, source: 'postgres' }
                }));

                config.onAnyChange?.();
            }
        );

        // ================================
        // PAYMENT REMINDERS - Due date alerts
        // ================================
        channel.on('broadcast', { event: 'payment-reminder' }, (payload) => {


            const reminder = payload.payload;
            const daysLeft = reminder.daysUntilDue || 0;
            const subName = reminder.subscriptionName || 'Subscription';

            if (daysLeft === 0) {
                genZToast.error(`💳 ${subName} payment due TODAY!`);
            } else if (daysLeft === 1) {
                genZToast.warning(`💳 ${subName} payment due tomorrow!`);
            } else if (daysLeft <= 3) {
                genZToast.info(`💳 ${subName} payment due in ${daysLeft} days`);
            }

            // Dispatch event for NotificationsPanel
            window.dispatchEvent(new CustomEvent('payment-reminder', {
                detail: reminder
            }));
        });

        // ================================
        // MULTI-DEVICE SYNC - Cross-device updates
        // ================================
        channel.on('broadcast', { event: 'data-sync' }, (payload) => {


            // Refresh all data when another device makes changes
            config.onAnyChange?.();

            genZToast.info('📱 Synced from another device!');
        });

        // Subscribe to channel with enhanced status handling
        channel.subscribe((status, err) => {


            if (status === 'SUBSCRIBED') {
                isSubscribed.current = true;
                setConnectionStatus('connected');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                setConnectionStatus('disconnected');
                console.error('❌ Real-time connection error, will retry...');
                // Auto-retry after 3 seconds
                setTimeout(() => {
                    if (!isSubscribed.current) {

                        cleanup();
                        setupSubscription();
                    }
                }, 3000);
            } else if (status === 'CLOSED') {
                setConnectionStatus('disconnected');
                isSubscribed.current = false;
            }
        });

        channelRef.current = channel;
    }, [user?.id, config]);

    // Cleanup function
    const cleanup = useCallback(() => {
        if (channelRef.current) {

            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
            isSubscribed.current = false;
            setConnectionStatus('disconnected');
        }
    }, []);

    // Setup on mount, cleanup on unmount
    useEffect(() => {
        setupSubscription();
        return cleanup;
    }, [setupSubscription, cleanup]);

    // Return status and controls
    return {
        isConnected: isSubscribed.current,
        connectionStatus,  // Now using state directly
        reconnect: () => {
            setConnectionStatus('connecting');
            cleanup();
            setTimeout(setupSubscription, 100);
        }
    };
};

// Simpler hook just for dashboard refreshes
export const useDashboardRealtime = (refreshCallback: () => void) => {
    return useRealtimeSync({
        onAnyChange: refreshCallback
    });
};

// Hook for transaction-specific listening
export const useTransactionRealtime = (handlers: {
    onInsert?: (tx: any) => void;
    onUpdate?: (tx: any) => void;
    onDelete?: (id: string) => void;
}) => {
    return useRealtimeSync({
        onTransactionInsert: (payload) => handlers.onInsert?.(payload.new),
        onTransactionUpdate: (payload) => handlers.onUpdate?.(payload.new),
        onTransactionDelete: (payload) => handlers.onDelete?.(payload.old?.id)
    });
};
