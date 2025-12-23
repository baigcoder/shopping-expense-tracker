// Real-time Sync Hook - Fast, accurate real-time updates using Supabase Realtime
import { useEffect, useCallback, useRef } from 'react';
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
    const connectionStatus = useRef<'connecting' | 'connected' | 'disconnected'>('connecting');

    const setupSubscription = useCallback(() => {
        if (!user?.id || isSubscribed.current) return;

        console.log('🔄 Setting up Supabase Realtime subscription for user:', user.id);

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
            console.log('⚡ INSTANT: Extension transaction broadcast received:', payload);

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
                console.log('💰 New transaction from Postgres:', payload.new);

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
                console.log('📝 Transaction updated:', payload.new);
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
                console.log('🗑️ Transaction deleted:', payload.old);
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
                console.log('📱 New subscription detected:', payload.new);

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
                console.log('🎯 Goal changed:', payload);
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
                console.log('💵 Budget changed:', payload);
                config.onBudgetUpdate?.(payload);
                config.onAnyChange?.();
            }
        );

        // Subscribe to channel with enhanced status handling
        channel.subscribe((status, err) => {
            console.log('🔄 Realtime subscription status:', status, err);

            if (status === 'SUBSCRIBED') {
                isSubscribed.current = true;
                connectionStatus.current = 'connected';
                console.log('✅ Real-time sync ACTIVE! (< 100ms latency)');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                connectionStatus.current = 'disconnected';
                console.error('❌ Real-time connection error, will retry...');
                // Auto-retry after 3 seconds
                setTimeout(() => {
                    if (!isSubscribed.current) {
                        console.log('🔄 Attempting to reconnect...');
                        cleanup();
                        setupSubscription();
                    }
                }, 3000);
            } else if (status === 'CLOSED') {
                connectionStatus.current = 'disconnected';
                isSubscribed.current = false;
            }
        });

        channelRef.current = channel;
    }, [user?.id, config]);

    // Cleanup function
    const cleanup = useCallback(() => {
        if (channelRef.current) {
            console.log('🔌 Disconnecting real-time channel');
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
            isSubscribed.current = false;
            connectionStatus.current = 'disconnected';
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
        connectionStatus: connectionStatus.current,
        reconnect: () => {
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
