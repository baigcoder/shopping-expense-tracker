import { useCallback, useEffect, useRef, useState } from 'react';
import { invalidateTransactionCache } from '../services/supabaseTransactionService';
import { invalidateInboxCache } from '../services/featureExpansionApi';
import {
    buildPaymentCaptureTrail,
    persistPaymentCaptureTrail,
    readStoredPaymentCaptureTrail,
    type PaymentCaptureTrail,
} from '../utils/paymentCaptureTrail';

const CAPTURE_EVENTS = [
    'transaction-candidate-added',
    'cashly-data-updated',
    'transaction-added-realtime',
    'new-transaction',
    'payment-capture-trail',
    'site-visit-tracked',
] as const;

export const usePaymentCaptureSync = (onRefresh?: () => void) => {
    const [trail, setTrail] = useState<PaymentCaptureTrail | null>(() => readStoredPaymentCaptureTrail());
    const onRefreshRef = useRef(onRefresh);
    const refreshTimer = useRef<number | null>(null);

    useEffect(() => {
        onRefreshRef.current = onRefresh;
    }, [onRefresh]);

    const scheduleRefresh = useCallback((eventName: string, detail?: Record<string, unknown>) => {
        if (eventName === 'site-visit-tracked' || eventName === 'payment-capture-trail') return;
        const type = String(detail?.type || '');
        if (type === 'SITE_VISIT_TRACKED' || type === 'PAYMENT_CAPTURE_PROGRESS' || type === 'TRANSACTION_SYNC_STATUS') return;
        if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
        refreshTimer.current = window.setTimeout(() => {
            invalidateTransactionCache();
            invalidateInboxCache();
            onRefreshRef.current?.();
        }, 250);
    }, []);

    useEffect(() => {
        const handleCaptureEvent = (event: Event) => {
            const detail = (event as CustomEvent).detail;
            setTrail((previous) => {
                const next = buildPaymentCaptureTrail(detail, event.type, previous);
                if (next) persistPaymentCaptureTrail(next);
                return next;
            });
            scheduleRefresh(event.type, detail && typeof detail === 'object' ? detail as Record<string, unknown> : undefined);
        };

        CAPTURE_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, handleCaptureEvent as EventListener);
        });

        return () => {
            CAPTURE_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, handleCaptureEvent as EventListener);
            });
            if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
        };
    }, [scheduleRefresh]);

    return { trail };
};
