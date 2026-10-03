import { describe, it, expect, vi, beforeEach } from 'vitest';
import { idempotencyCoordinator } from '../idempotencyGuard.js';

describe('Concurrency & Idempotency Multi-Worker Stress Test', () => {
    beforeEach(() => {
        idempotencyCoordinator.clear();
        vi.clearAllMocks();
    });

    it('handles 10 parallel concurrent requests with exact same idempotency key without double-execution', async () => {
        const workerKey = 'idem:approve:user_789:candidate_999';
        let executionCount = 0;

        const executeMutation = async () => {
            return idempotencyCoordinator.execute(workerKey, async () => {
                // Simulate async database I/O latency
                await new Promise((resolve) => setTimeout(resolve, 50));
                executionCount++;
                return {
                    status: 'approved',
                    transactionId: 'tx_canonical_123',
                    amount: 99.95,
                };
            });
        };

        // Fire 10 concurrent requests at the exact same moment
        const results = await Promise.all([
            executeMutation(),
            executeMutation(),
            executeMutation(),
            executeMutation(),
            executeMutation(),
            executeMutation(),
            executeMutation(),
            executeMutation(),
            executeMutation(),
            executeMutation(),
        ]);

        // Invariant: The underlying mutation MUST only execute once!
        expect(executionCount).toBe(1);

        // All 10 callers receive the identical canonical payload
        for (const res of results) {
            expect(res.result).toEqual({
                status: 'approved',
                transactionId: 'tx_canonical_123',
                amount: 99.95,
            });
        }

        // Exactly 1 request executes live (fromCache: false), the other 9 receive cached/resolved output (fromCache: true)
        const fromCacheCount = results.filter((r) => r.fromCache).length;
        expect(fromCacheCount).toBe(9);
    });

    it('releases lock when the mutation throws an error so retry can succeed', async () => {
        const workerKey = 'idem:retry:user_123:req_456';
        let attempts = 0;

        const failingOperation = async () => {
            return idempotencyCoordinator.execute(workerKey, async () => {
                attempts++;
                if (attempts === 1) {
                    throw new Error('Database connection timed out');
                }
                return { status: 'success_on_retry' };
            });
        };

        // First attempt fails
        await expect(failingOperation()).rejects.toThrow('Database connection timed out');
        expect(attempts).toBe(1);

        // Immediate retry should NOT be locked out and should execute successfully
        const retryResult = await failingOperation();
        expect(retryResult.result).toEqual({ status: 'success_on_retry' });
        expect(retryResult.fromCache).toBe(false);
        expect(attempts).toBe(2);
    });
});
