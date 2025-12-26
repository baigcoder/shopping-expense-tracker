// useDataRealtime.ts - Unified Realtime Hook for MoneyTwin, Analytics, Insights
// Auto-refreshes data and clears caches when underlying data changes
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/useStore';
import { moneyTwinService } from '../services/moneyTwinService';
import { refreshBackendAI } from '../services/aiService';
import genZToast from '../services/genZToast';
import { RealtimeChannel } from '@supabase/supabase-js';

interface DataRealtimeConfig {
    // Callback when money twin data needs refresh
    onMoneyTwinRefresh?: () => void;
    // Callback when analytics data needs refresh  
    onAnalyticsRefresh?: () => void;
    // Callback when insights data needs refresh
    onInsightsRefresh?: () => void;
    // Callback when health score changes
    onHealthScoreChange?: (newScore: number, oldScore: number) => void;
    // Callback when new risk is detected
    onRiskDetected?: (risk: { title: string; severity: string; message: string }) => void;
}

// Track last health score for animation
let lastHealthScore: number | null = null;

export const useDataRealtime = (config: DataRealtimeConfig = {}) => {
    const { user } = useAuthStore();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const refreshDebounce = useRef<NodeJS.Timeout | null>(null);
    const DEBOUNCE_MS = 300; // Reduced for faster updates

    // Unified refresh function with debounce
    const triggerRefresh = useCallback((source: string) => {
        // Clear existing debounce
        if (refreshDebounce.current) {
            clearTimeout(refreshDebounce.current);
        }

        refreshDebounce.current = setTimeout(async () => {
            console.log(`🔄 Realtime refresh triggered by: ${source}`);

            // 1. Clear MoneyTwin cache
            moneyTwinService.clearCache();

            // 2. Refresh backend AI cache (in background, don't await)
            if (user?.id) {
                refreshBackendAI(user.id).then(() => {
                    console.log('🤖 Backend AI cache refreshed');
                }).catch(() => {
                    console.log('Backend AI refresh skipped');
                });
            }

            // 3. Dispatch insights-data-changed for InsightsPage
            window.dispatchEvent(new CustomEvent('insights-data-changed'));

            // 4. Dispatch analytics-data-changed for AnalyticsPage
            window.dispatchEvent(new CustomEvent('analytics-data-changed'));

            // 5. Dispatch money-twin-refresh for MoneyTwinPage
            window.dispatchEvent(new CustomEvent('money-twin-refresh'));

            // Notify callbacks
            config.onMoneyTwinRefresh?.();
            config.onAnalyticsRefresh?.();
            config.onInsightsRefresh?.();

        }, DEBOUNCE_MS);
    }, [config, user?.id]);

    // Check health score changes and detect risks
    const checkHealthAndRisks = useCallback(async () => {
        if (!user?.id) return;

        try {
            const twinState = await moneyTwinService.getMoneyTwin(user.id);

            // Check health score change
            if (lastHealthScore !== null && twinState.healthScore !== lastHealthScore) {
                config.onHealthScoreChange?.(twinState.healthScore, lastHealthScore);

                // Animate if significant change (±10 points)
                const diff = twinState.healthScore - lastHealthScore;
                if (Math.abs(diff) >= 10) {
                    if (diff > 0) {
                        genZToast.success(`📈 Health score up! ${lastHealthScore} → ${twinState.healthScore}`);
                    } else {
                        genZToast.warning(`📉 Health score dropped: ${lastHealthScore} → ${twinState.healthScore}`);
                    }
                }
            }
            lastHealthScore = twinState.healthScore;

            // Check for critical/danger risks
            const criticalRisks = twinState.riskAlerts.filter(
                r => r.severity === 'critical' || r.severity === 'danger'
            );

            for (const risk of criticalRisks) {
                // Only alert new risks (created in last 5 minutes)
                const riskAge = Date.now() - new Date(risk.createdAt).getTime();
                if (riskAge < 5 * 60 * 1000) {
                    config.onRiskDetected?.(risk);
                    genZToast.warning(`⚠️ ${risk.title}: ${risk.message}`);
                }
            }
        } catch (e) {

        }
    }, [user?.id, config]);

    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase.channel(`data-realtime-${user.id}`);
        channelRef.current = channel;

        // ================================
        // TRANSACTIONS - Primary trigger
        // ================================
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
            () => {

                triggerRefresh('transaction');

                // Check health after a delay (let data settle)
                setTimeout(checkHealthAndRisks, 2000);
            }
        );

        // ================================
        // SUBSCRIPTIONS
        // ================================
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
            () => {

                triggerRefresh('subscription');
            }
        );

        // ================================
        // BUDGETS
        // ================================
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${user.id}` },
            () => {

                triggerRefresh('budget');
                setTimeout(checkHealthAndRisks, 2000);
            }
        );

        // ================================
        // GOALS
        // ================================
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${user.id}` },
            () => {

                triggerRefresh('goal');
                setTimeout(checkHealthAndRisks, 2000);
            }
        );

        // Subscribe to channel
        channel.subscribe((status) => {

        });

        return () => {
            if (refreshDebounce.current) {
                clearTimeout(refreshDebounce.current);
            }
            channel.unsubscribe();
        };
    }, [user?.id, triggerRefresh, checkHealthAndRisks]);

    return {
        triggerRefresh,
        checkHealthAndRisks
    };
};

export default useDataRealtime;
