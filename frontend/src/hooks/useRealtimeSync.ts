// Real-time Sync Hook - Fast, accurate real-time updates using Supabase Realtime
import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import genZToast from '../services/genZToast';
import confetti from 'canvas-confetti';
import { RealtimeChannel } from '@supabase/supabase-js';
import { claimCaptureToast } from '../lib/captureToastGuard';

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

export const useRealtimeSync = (config: RealtimeConfig = {}) => {
    const { user } = useAuthStore();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const isSubscribed = useRef(false);
    const retryCountRef = useRef(0); // Track reconnection attempts for exponential backoff
    const configRef = useRef(config);
    configRef.current = config;
    // Use state for connectionStatus so components re-render on status change
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

    const setupSubscription = useCallback(async () => {
        if (!user?.id || isSubscribed.current) return;

        // Verify we have a valid session before subscribing
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!session || error) {
            console.warn('No valid session, skipping realtime subscription');
            setConnectionStatus('disconnected');
            return;
        }

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
            const tx = payload.payload || {};
            const amount = tx.amount || 0;
            const description = tx.name || tx.description || 'Transaction';
            const toastKey = String(tx.id || tx.transaction_hash || `${description}-${amount}`);

            if (tx.pendingReview) {
                window.dispatchEvent(new CustomEvent('transaction-candidate-added', {
                    detail: { candidate: tx, source: 'broadcast' }
                }));
                window.dispatchEvent(new CustomEvent('payment-capture-trail', { detail: tx }));
                if (claimCaptureToast(`inbox-${toastKey}`)) {
                    genZToast.info(`${description} is waiting in your inbox`);
                }
                configRef.current.onAnyChange?.();
                return;
            }

            if (claimCaptureToast(`ledger-${toastKey}`)) {
                genZToast.cash(`⚡ ${description} • ${formatCurrency(Math.abs(amount))} tracked!`);
                if (Math.abs(amount) >= 10) {
                    triggerCelebration();
                }
            }

            window.dispatchEvent(new CustomEvent('transaction-added-realtime', {
                detail: { transaction: tx, source: 'broadcast' }
            }));

            configRef.current.onTransactionInsert?.({ new: tx });
            configRef.current.onAnyChange?.();
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
                const toastKey = String(tx.id || `${description}-${amount}`);

                if (claimCaptureToast(`ledger-${toastKey}`)) {
                    genZToast.cash(`${description} • ${formatCurrency(Math.abs(amount))} tracked! 💸`);
                    if (Math.abs(amount) >= 10) {
                        triggerCelebration();
                    }
                }

                window.dispatchEvent(new CustomEvent('transaction-added-realtime', {
                    detail: { transaction: tx, source: 'postgres' }
                }));

                configRef.current.onTransactionInsert?.(payload);
                configRef.current.onAnyChange?.();
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
                window.dispatchEvent(new CustomEvent('transaction-updated-realtime', {
                    detail: payload.new
                }));
                configRef.current.onTransactionUpdate?.(payload);
                configRef.current.onAnyChange?.();
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
                window.dispatchEvent(new CustomEvent('transaction-deleted-realtime', {
                    detail: payload.old
                }));
                configRef.current.onTransactionDelete?.(payload);
                configRef.current.onAnyChange?.();
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

                configRef.current.onSubscriptionInsert?.(payload);
                configRef.current.onAnyChange?.();
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

                configRef.current.onGoalUpdate?.(payload);
                configRef.current.onAnyChange?.();
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

                configRef.current.onBudgetUpdate?.(payload);
                configRef.current.onAnyChange?.();
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

                configRef.current.onAnyChange?.();
            }
        );

        channel.on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'transaction_candidates',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => {
                const candidate = payload.new as any;
                const toastKey = String(candidate.id || candidate.transaction_hash || candidate.description);
                window.dispatchEvent(new CustomEvent('transaction-candidate-added', {
                    detail: { candidate, source: 'postgres' }
                }));
                window.dispatchEvent(new CustomEvent('payment-capture-trail', {
                    detail: { ...candidate, pendingReview: true, state: 'queued' }
                }));
                if (claimCaptureToast(`inbox-${toastKey}`)) {
                    genZToast.info(`${candidate.description || 'Payment'} is waiting in your inbox`);
                }
                configRef.current.onAnyChange?.();
            }
        );

        channel.on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'transaction_candidates',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => {
                window.dispatchEvent(new CustomEvent('cashly-data-updated', {
                    detail: { type: 'TRANSACTION_CANDIDATE_UPDATED', candidate: payload.new }
                }));
                configRef.current.onAnyChange?.();
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


            configRef.current.onAnyChange?.();

            genZToast.info('📱 Synced from another device!');
        });

        // Subscribe to channel with enhanced status handling
        channel.subscribe((status, err) => {


            if (status === 'SUBSCRIBED') {
                isSubscribed.current = true;
                retryCountRef.current = 0; // Reset retry count on success
                setConnectionStatus('connected');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                setConnectionStatus('disconnected');
                console.error('❌ Real-time connection error, will retry with backoff...');

                // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 30s)
                const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                retryCountRef.current++;

                if (retryCountRef.current <= 5) {
                    console.log(`🔄 Retrying realtime connection in ${retryDelay / 1000}s (attempt ${retryCountRef.current}/5)`);
                    setTimeout(() => {
                        if (!isSubscribed.current) {
                            cleanup();
                            setupSubscription();
                        }
                    }, retryDelay);
                } else {
                    console.error('❌ Max retries reached for realtime connection');
                }
            } else if (status === 'CLOSED') {
                setConnectionStatus('disconnected');
                isSubscribed.current = false;
            }
        });

        channelRef.current = channel;
    }, [user?.id]);

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
    const { onInsert, onUpdate, onDelete } = handlers;

    useEffect(() => {
        const seen = new Set<string>();
        const handleExtensionTransaction = (event: Event) => {
            const detail = (event as CustomEvent).detail;
            const tx = detail?.transaction || detail;
            if (!tx || tx.pendingReview) return;
            const key = tx.id || `${tx.description || tx.name}-${tx.amount}-${tx.date || tx.created_at}`;
            if (key && seen.has(key)) return;
            if (key) {
                seen.add(key);
                setTimeout(() => seen.delete(key), 5000);
            }
            onInsert?.(tx);
        };

        const handleUpdate = (event: Event) => {
            const tx = (event as CustomEvent).detail;
            if (tx) onUpdate?.(tx);
        };
        const handleDelete = (event: Event) => {
            const tx = (event as CustomEvent).detail;
            onDelete?.(tx?.id || tx);
        };

        window.addEventListener('new-transaction', handleExtensionTransaction);
        window.addEventListener('transaction-added-realtime', handleExtensionTransaction);
        window.addEventListener('transaction-updated-realtime', handleUpdate);
        window.addEventListener('transaction-deleted-realtime', handleDelete);
        return () => {
            window.removeEventListener('new-transaction', handleExtensionTransaction);
            window.removeEventListener('transaction-added-realtime', handleExtensionTransaction);
            window.removeEventListener('transaction-updated-realtime', handleUpdate);
            window.removeEventListener('transaction-deleted-realtime', handleDelete);
        };
    }, [onInsert, onUpdate, onDelete]);
};
