/**
 * CASHLY V11 — IDEMPOTENCY & CONCURRENCY COORDINATOR
 * Authority: INV-04 & INV-12
 * Prevents TOCTOU race conditions and double-spending across parallel requests.
 */

export interface IdempotencyRecord<T = unknown> {
    key: string;
    status: 'IN_FLIGHT' | 'COMPLETED' | 'FAILED';
    result?: T;
    error?: string;
    createdAt: number;
    expiresAt: number;
}

export class ConcurrentExecutionError extends Error {
    constructor(key: string) {
        super(`A concurrent operation is already in flight for idempotency key: ${key}`);
        this.name = 'ConcurrentExecutionError';
    }
}

export class IdempotencyCoordinator {
    private static instance: IdempotencyCoordinator;
    private readonly records = new Map<string, IdempotencyRecord>();
    private readonly lockTtlMs = 15_000; // 15 seconds max lock for in-flight requests
    private readonly completedTtlMs = 5 * 60 * 1000; // 5 minutes cache for completed idempotent results

    private constructor() {
        // Periodic cleanup of expired records
        if (typeof setInterval !== 'undefined') {
            const cleanupTimer = setInterval(() => this.cleanup(), 60_000);
            cleanupTimer.unref?.();
        }
    }

    static getInstance(): IdempotencyCoordinator {
        if (!IdempotencyCoordinator.instance) {
            IdempotencyCoordinator.instance = new IdempotencyCoordinator();
        }
        return IdempotencyCoordinator.instance;
    }

    /**
     * Executes an operation with idempotency protection.
     * If an identical operation is in flight, it blocks/waits or rejects.
     * If already completed, it returns the cached result without re-executing.
     */
    async execute<T>(
        key: string,
        operation: () => Promise<T>,
        options: { waitIfInFlightMs?: number } = {}
    ): Promise<{ result: T; fromCache: boolean }> {
        const now = Date.now();
        const existing = this.records.get(key);

        if (existing && existing.expiresAt > now) {
            if (existing.status === 'COMPLETED') {
                return { result: existing.result as T, fromCache: true };
            }

            if (existing.status === 'IN_FLIGHT') {
                const waitMs = options.waitIfInFlightMs ?? 2000;
                if (waitMs > 0) {
                    // Wait for in-flight operation to finish
                    const waited = await this.waitForCompletion<T>(key, waitMs);
                    if (waited) {
                        return { result: waited, fromCache: true };
                    }
                }
                throw new ConcurrentExecutionError(key);
            }
        }

        // Acquire lock
        this.records.set(key, {
            key,
            status: 'IN_FLIGHT',
            createdAt: now,
            expiresAt: now + this.lockTtlMs,
        });

        try {
            const result = await operation();
            this.records.set(key, {
                key,
                status: 'COMPLETED',
                result,
                createdAt: now,
                expiresAt: Date.now() + this.completedTtlMs,
            });
            return { result, fromCache: false };
        } catch (error) {
            // Delete lock on failure so caller can retry safely
            this.records.delete(key);
            throw error;
        }
    }

    private async waitForCompletion<T>(key: string, maxWaitMs: number): Promise<T | null> {
        const start = Date.now();
        const pollInterval = 50;

        while (Date.now() - start < maxWaitMs) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            const current = this.records.get(key);
            if (current?.status === 'COMPLETED') {
                return current.result as T;
            }
            if (!current || current.status === 'FAILED') {
                return null;
            }
        }
        return null;
    }

    private cleanup() {
        const now = Date.now();
        for (const [key, record] of this.records.entries()) {
            if (record.expiresAt <= now) {
                this.records.delete(key);
            }
        }
    }

    /** For test reset */
    clear() {
        this.records.clear();
    }
}

export const idempotencyCoordinator = IdempotencyCoordinator.getInstance();
