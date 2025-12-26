// useAIRealtime.ts - AI Context Realtime Sync Hook
// Automatically invalidates AI context and refreshes tips when data changes
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/useStore';
import { clearAIContext } from '../services/aiService';
import aiTipCacheService from '../services/aiTipCacheService';
import genZToast from '../services/genZToast';
import { RealtimeChannel } from '@supabase/supabase-js';

interface AIRealtimeConfig {
    onContextInvalidated?: () => void;
    onAnomalyDetected?: (anomaly: AnomalyData) => void;
    onInsightReady?: (insight: any) => void;
}

interface AnomalyData {
    type: 'unusual_spending' | 'budget_exceeded' | 'subscription_change' | 'goal_milestone';
    message: string;
    severity: 'info' | 'warning' | 'error';
    data?: any;
}

// Spending history for anomaly detection
let recentSpending: number[] = [];
const SPENDING_WINDOW = 7; // Track last 7 transactions

export const useAIRealtime = (config: AIRealtimeConfig = {}) => {
    const { user } = useAuthStore();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const lastContextUpdate = useRef<number>(0);
    const DEBOUNCE_MS = 500; // Debounce rapid updates

    // Invalidate AI context with debounce
    const invalidateContext = useCallback(() => {
        const now = Date.now();
        if (now - lastContextUpdate.current < DEBOUNCE_MS) return;
        lastContextUpdate.current = now;

        console.log('🧠 AI Context invalidated - data changed');
        clearAIContext();
        aiTipCacheService.notifyDataChanged();
        config.onContextInvalidated?.();
    }, [config]);

    // Detect spending anomalies
    const detectAnomaly = useCallback((transaction: any) => {
        const amount = Math.abs(transaction.amount || 0);

        // Calculate average of recent spending
        if (recentSpending.length >= 3) {
            const avgSpending = recentSpending.reduce((a, b) => a + b, 0) / recentSpending.length;

            // Unusual spending: 3x higher than average
            if (amount > avgSpending * 3 && avgSpending > 0) {
                const anomaly: AnomalyData = {
                    type: 'unusual_spending',
                    message: `🚨 Unusual spending detected: ${transaction.description} is 3x higher than your average!`,
                    severity: 'warning',
                    data: { amount, average: avgSpending }
                };
                config.onAnomalyDetected?.(anomaly);
                genZToast.warning(anomaly.message);
            }
        }

        // Add to history
        recentSpending.push(amount);
        if (recentSpending.length > SPENDING_WINDOW) {
            recentSpending.shift();
        }
    }, [config]);

    // Check budget thresholds for proactive insights
    const checkBudgetThreshold = useCallback((budget: any) => {
        if (!budget?.spent || !budget?.limit) return;

        const percentage = (budget.spent / budget.limit) * 100;

        if (percentage >= 90 && percentage < 100) {
            const anomaly: AnomalyData = {
                type: 'budget_exceeded',
                message: `⚠️ ${budget.category} budget at ${percentage.toFixed(0)}%! Consider slowing down.`,
                severity: 'warning',
                data: budget
            };
            config.onAnomalyDetected?.(anomaly);
        }
    }, [config]);

    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase.channel(`ai-realtime-${user.id}`);
        channelRef.current = channel;

        // ================================
        // TRANSACTION CHANGES - Invalidate context + detect anomalies
        // ================================
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
            (payload) => {
                console.log('🔄 Transaction change detected for AI');
                invalidateContext();

                if (payload.eventType === 'INSERT' && payload.new) {
                    detectAnomaly(payload.new);
                }
            }
        );

        // ================================
        // SUBSCRIPTION CHANGES - Invalidate context
        // ================================
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
            () => {
                console.log('📱 Subscription change detected for AI');
                invalidateContext();
            }
        );

        // ================================
        // BUDGET CHANGES - Invalidate context + check thresholds
        // ================================
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${user.id}` },
            (payload) => {
                console.log('💵 Budget change detected for AI');
                invalidateContext();

                if (payload.new) {
                    checkBudgetThreshold(payload.new);
                }
            }
        );

        // ================================
        // GOAL CHANGES - Invalidate context + check milestones
        // ================================
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${user.id}` },
            (payload) => {
                console.log('🎯 Goal change detected for AI');
                invalidateContext();

                const goal = payload.new as any;
                if (goal?.current_amount && goal?.target_amount) {
                    const progress = (goal.current_amount / goal.target_amount) * 100;

                    // Milestone detection: 25%, 50%, 75%, 100%
                    const milestones = [25, 50, 75, 100];
                    for (const m of milestones) {
                        if (progress >= m && progress < m + 5) {
                            genZToast.success(`🎉 Goal "${goal.name}" hit ${m}%!`);
                            break;
                        }
                    }
                }
            }
        );

        // ================================
        // AI INSIGHTS TABLE - Notify on new insights
        // ================================
        channel.on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'ai_insights', filter: `user_id=eq.${user.id}` },
            (payload) => {
                console.log('🤖 New AI insight ready');
                const insight = payload.new;
                config.onInsightReady?.(insight);

                genZToast.success(`🤖 AI Insight: ${(insight as any)?.title || 'New analysis ready!'}`);

                window.dispatchEvent(new CustomEvent('ai-insight-ready', { detail: insight }));
            }
        );

        // Subscribe to channel
        channel.subscribe((status) => {
            console.log('🧠 AI Realtime subscription:', status);
        });

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id, invalidateContext, detectAnomaly, checkBudgetThreshold, config]);

    return {
        invalidateContext,
        resetSpendingHistory: () => { recentSpending = []; }
    };
};

export default useAIRealtime;
