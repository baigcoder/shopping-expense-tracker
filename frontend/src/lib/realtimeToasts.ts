/**
 * Realtime toast + confetti coalescer.
 * Bulk extension syncs (e.g. 30+ transactions) used to freeze the main thread
 * with 30 confetti bursts + 30 toasts. This helper batches events within a
 * short window and emits a single toast + (at most) one confetti per cycle.
 */
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const COALESCE_MS = 2000;
const CONFETTI_COOLDOWN_MS = 30_000;

let pending: Array<{ description: string; amount: number; type: 'income' | 'expense' }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let lastConfettiAt = 0;

const flush = () => {
    const batch = pending;
    pending = [];
    flushTimer = null;
    if (batch.length === 0) return;

    const totalExpense = batch
        .filter((b) => b.type === 'expense')
        .reduce((s, b) => s + Math.abs(b.amount), 0);

    if (batch.length === 1) {
        const t = batch[0];
        toast.success(`💸 ${t.description} - $${Math.abs(t.amount).toFixed(2)} tracked!`);
    } else {
        toast.success(
            `💸 ${batch.length} transactions tracked ($${totalExpense.toFixed(2)} spent)`
        );
    }

    // One confetti burst per 30s, regardless of batch size
    const now = Date.now();
    if (now - lastConfettiAt > CONFETTI_COOLDOWN_MS) {
        lastConfettiAt = now;
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FBBF24', '#10B981', '#3B82F6', '#8B5CF6']
        });
    }
};

export const queueRealtimeToast = (tx: { description: string; amount: number; type: 'income' | 'expense' }) => {
    pending.push(tx);
    if (flushTimer) return;
    flushTimer = setTimeout(flush, COALESCE_MS);
};

export const queueBulkSyncedToast = (count: number) => {
    toast.info(`✅ ${count} transaction(s) synced from extension!`);
};
