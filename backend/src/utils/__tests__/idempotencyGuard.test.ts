import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    ConcurrentExecutionError,
    idempotencyCoordinator,
} from '../idempotencyGuard.js';

describe('Idempotency & Concurrency Coordinator (INV-04 & INV-12)', () => {
    beforeEach(() => {
        idempotencyCoordinator.clear();
    });

    it('executes a new operation and stores the result', async () => {
        const op = vi.fn().mockResolvedValue({ id: 'tx-1', amount: 1420.50 });
        const { result, fromCache } = await idempotencyCoordinator.execute('test-key-1', op);

        expect(fromCache).toBe(false);
        expect(result).toEqual({ id: 'tx-1', amount: 1420.50 });
        expect(op).toHaveBeenCalledTimes(1);
    });

    it('returns cached result for subsequent calls with same key without re-executing', async () => {
        const op = vi.fn().mockResolvedValue({ id: 'tx-1' });

        const first = await idempotencyCoordinator.execute('test-key-2', op);
        const second = await idempotencyCoordinator.execute('test-key-2', op);

        expect(first.fromCache).toBe(false);
        expect(second.fromCache).toBe(true);
        expect(second.result).toEqual({ id: 'tx-1' });
        expect(op).toHaveBeenCalledTimes(1); // Crucial: executed only once
    });

    it('handles 10 simultaneous parallel requests without race condition or double execution', async () => {
        let executionCount = 0;
        const slowOperation = async () => {
            executionCount++;
            await new Promise((resolve) => setTimeout(resolve, 50));
            return { ledgerId: 'ledger-item-99', count: executionCount };
        };

        // Fire 10 concurrent requests simultaneously
        const promises = Array.from({ length: 10 }).map(() =>
            idempotencyCoordinator.execute('concurrent-checkout-key', slowOperation, {
                waitIfInFlightMs: 1000,
            })
        );

        const results = await Promise.all(promises);

        // Exactly one executed, all 9 others received the resolved result
        expect(executionCount).toBe(1);

        const nonCached = results.filter((r) => !r.fromCache);
        const fromCache = results.filter((r) => r.fromCache);

        expect(nonCached).toHaveLength(1);
        expect(fromCache).toHaveLength(9);
        expect(results.every((r) => r.result.ledgerId === 'ledger-item-99')).toBe(true);
    });

    it('releases lock upon operation failure to allow safe retry', async () => {
        const failingOp = vi.fn().mockRejectedValue(new Error('Database timeout'));
        const succeedingOp = vi.fn().mockResolvedValue({ status: 'ok' });

        await expect(idempotencyCoordinator.execute('retry-key', failingOp)).rejects.toThrow('Database timeout');

        // Subsequent retry should now succeed because lock was cleared on error
        const retry = await idempotencyCoordinator.execute('retry-key', succeedingOp);
        expect(retry.fromCache).toBe(false);
        expect(retry.result).toEqual({ status: 'ok' });
    });
});
