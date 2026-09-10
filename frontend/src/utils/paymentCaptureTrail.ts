export type BehaviorFlowStep = {
    from?: string;
    to?: string;
    at?: number;
};

export type PaymentCaptureTrail = {
    merchant: string;
    amount: number;
    state: string;
    hostname?: string;
    pendingReview: boolean;
    timestamp: number;
    behaviorFlow: BehaviorFlowStep[];
    source?: string;
};

const TRAIL_TTL_MS = 15 * 60 * 1000;
export const PAYMENT_CAPTURE_STORAGE_KEY = 'cashly_payment_capture_trail';

const PAYMENT_STATES = new Set([
    'checkout_entered',
    'payment_form_active',
    'payment_submitted',
    'transaction_confirmed',
    'queued',
    'approved',
]);

const asRecord = (value: unknown): Record<string, unknown> => (
    value && typeof value === 'object' ? value as Record<string, unknown> : {}
);

const asNumber = (value: unknown): number => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
};

const asFlow = (value: unknown): BehaviorFlowStep[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((step) => asRecord(step))
        .filter((step) => typeof step.to === 'string' || typeof step.from === 'string')
        .map((step) => ({
            from: typeof step.from === 'string' ? step.from : undefined,
            to: typeof step.to === 'string' ? step.to : undefined,
            at: asNumber(step.at) || undefined,
        }));
};

export const formatCaptureState = (state?: string) => {
    if (!state) return 'Detected';
    return state.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatBehaviorFlow = (flow: BehaviorFlowStep[]) => {
    if (!flow.length) return '';
    const steps = flow
        .map((step) => step.to || step.from)
        .filter(Boolean)
        .map((step) => String(step).replace(/_/g, ' '));
    return [...new Set(steps)].join(' → ');
};

export const isLivePaymentState = (state?: string) => !!state && PAYMENT_STATES.has(state);

export const readStoredPaymentCaptureTrail = (): PaymentCaptureTrail | null => {
    if (typeof sessionStorage === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(PAYMENT_CAPTURE_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as PaymentCaptureTrail;
        if (!parsed?.timestamp || Date.now() - parsed.timestamp > TRAIL_TTL_MS) {
            sessionStorage.removeItem(PAYMENT_CAPTURE_STORAGE_KEY);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
};

export const persistPaymentCaptureTrail = (trail: PaymentCaptureTrail) => {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(PAYMENT_CAPTURE_STORAGE_KEY, JSON.stringify(trail));
};

export const buildPaymentCaptureTrail = (
    detail: unknown,
    eventName: string,
    previous?: PaymentCaptureTrail | null,
): PaymentCaptureTrail | null => {
    const root = asRecord(detail);
    const nested = asRecord(root.candidate || root.transaction || root.payload);
    const merged = { ...nested, ...root };
    const sourceType = String(merged.type || '');
    const normalizedEvent = eventName === 'cashly-data-updated' && sourceType === 'SITE_VISIT_TRACKED'
        ? 'site-visit-tracked'
        : eventName === 'cashly-data-updated' && sourceType === 'PAYMENT_CAPTURE_PROGRESS'
            ? 'payment-capture-trail'
            : eventName;
    const state = String(
        merged.state
        || (normalizedEvent === 'transaction-candidate-added' ? 'queued' : '')
        || (normalizedEvent === 'transaction-added-realtime' || normalizedEvent === 'new-transaction' ? 'approved' : '')
        || previous?.state
        || '',
    );
    const merchant = String(
        merged.merchant_name
        || merged.merchantName
        || merged.siteName
        || merged.name
        || merged.description
        || previous?.merchant
        || '',
    );
    const amount = asNumber(merged.amount ?? merged.price ?? previous?.amount);
    const hostname = String(merged.hostname || previous?.hostname || '');
    const behaviorFlow = asFlow(merged.behaviorFlow || merged.behavior_flow || previous?.behaviorFlow);
    const pendingReview = merged.pendingReview === true
        || normalizedEvent === 'transaction-candidate-added'
        || (normalizedEvent === 'site-visit-tracked' && state !== 'approved');

    if (normalizedEvent === 'site-visit-tracked' && !isLivePaymentState(state)) {
        return previous || null;
    }

    if (!merchant && !amount && !state && !behaviorFlow.length) {
        return previous || null;
    }

    return {
        merchant: merchant || previous?.merchant || 'Checkout',
        amount,
        state: state || previous?.state || 'queued',
        hostname: hostname || undefined,
        pendingReview: normalizedEvent === 'transaction-added-realtime' || normalizedEvent === 'new-transaction'
            ? false
            : pendingReview,
        timestamp: Date.now(),
        behaviorFlow: behaviorFlow.length ? behaviorFlow : (previous?.behaviorFlow || []),
        source: String(merged.source || normalizedEvent),
    };
};
