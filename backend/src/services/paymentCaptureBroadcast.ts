const BROADCAST_TIMEOUT_MS = 2000;

export async function broadcastPaymentCapture(userId: string, payload: Record<string, unknown>) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key || !userId) return;

    try {
        await fetch(`${url.replace(/\/$/, '')}/realtime/v1/api/broadcast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
                messages: [{
                    topic: `realtime-${userId}`,
                    event: 'extension-transaction',
                    payload,
                }],
            }),
            signal: AbortSignal.timeout(BROADCAST_TIMEOUT_MS),
        });
    } catch (error) {
        console.warn('Payment capture broadcast failed:', error);
    }
}
