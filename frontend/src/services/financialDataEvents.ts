export const FINANCIAL_DATA_EVENTS = [
    'transaction-added',
    'transaction-updated',
    'transaction-deleted',
    'transaction-candidate-added',
    'cashly-data-updated',
    'new-transaction',
    'transactions-synced',
    'budget-changed',
    'subscription-changed',
    'subscription-added',
    'goal-added',
    'goal-updated',
    'goal-deleted',
    'reminder-changed',
    'bill-reminder-changed',
] as const;

export type FinancialDataEventName = typeof FINANCIAL_DATA_EVENTS[number];

const CHANNEL_NAME = 'cashly-financial-data';
let broadcastChannel: BroadcastChannel | null | undefined;
let inboundListenerReady = false;

function getBroadcastChannel(): BroadcastChannel | null {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
    if (broadcastChannel === undefined) {
        broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    }
    return broadcastChannel;
}

function setupInboundBroadcastListener() {
    if (inboundListenerReady) return;
    const channel = getBroadcastChannel();
    if (!channel) return;

    channel.addEventListener('message', (event) => {
        const payload = event.data as { eventName?: FinancialDataEventName; detail?: unknown };
        if (!payload?.eventName || !FINANCIAL_DATA_EVENTS.includes(payload.eventName)) return;
        window.dispatchEvent(new CustomEvent(payload.eventName, {
            detail: {
                ...(payload.detail && typeof payload.detail === 'object' ? payload.detail : { value: payload.detail }),
                remote: true,
            },
        }));
    });

    inboundListenerReady = true;
}

export function getFinancialDataEventSource(eventName: string): string {
    if (eventName.startsWith('transaction') || eventName === 'new-transaction' || eventName === 'transactions-synced') {
        return 'transaction';
    }
    if (eventName.startsWith('goal')) return 'goal';
    if (eventName.startsWith('budget')) return 'budget';
    if (eventName.startsWith('subscription')) return 'subscription';
    if (eventName.includes('reminder')) return 'reminder';
    return 'financial-data';
}

export function emitFinancialDataEvent(eventName: FinancialDataEventName, detail?: unknown) {
    if (typeof window === 'undefined') return;

    setupInboundBroadcastListener();
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
    getBroadcastChannel()?.postMessage({ eventName, detail, timestamp: Date.now() });
}

if (typeof window !== 'undefined') {
    setupInboundBroadcastListener();
}
