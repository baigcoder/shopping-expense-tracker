import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTransactionCandidate } from '../services/transactionInboxService.js';
import { supabase } from '../config/supabase.js';

vi.mock('../config/supabase.js', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

describe('Multi-Instance & Cross-Process Concurrency (Layer 2 Database Idempotency)', () => {
    const userId = 'usr_distributed_cluster_1';
    const sharedPayload = {
        amount: 249.99,
        date: '2026-10-04T12:00:00.000Z',
        description: 'Sony WH-1000XM5 Headphones - Amazon',
        merchantName: 'Amazon',
        source: 'extension' as const,
        type: 'expense' as const,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('simulates 3 independent server processes (Process A, B, C) submitting identical capture simultaneously without shared memory', async () => {
        // Shared database state simulating PostgreSQL
        const postgresTable: any[] = [];
        let insertAttempts = 0;

        (supabase.from as any).mockImplementation((tableName: string) => {
            if (tableName === 'transaction_candidates') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                    limit: vi.fn().mockImplementation(() => {
                        return Promise.resolve({
                            data: postgresTable.filter((r) => r.user_id === userId),
                            error: null,
                        });
                    }),
                    insert: vi.fn().mockImplementation((record: any) => {
                        insertAttempts++;
                        // Simulate PostgreSQL Unique Constraint on (user_id, transaction_hash)
                        const existing = postgresTable.find(
                            (r) => r.user_id === record.user_id && r.transaction_hash === record.transaction_hash
                        );

                        if (existing) {
                            // PostgreSQL error 23505: unique_violation
                            return {
                                select: () => ({
                                    single: () =>
                                        Promise.resolve({
                                            data: null,
                                            error: { code: '23505', message: 'duplicate key value violates unique constraint' },
                                        }),
                                }),
                            };
                        }

                        const inserted = {
                            id: `cand_canonical_${Date.now()}`,
                            ...record,
                            status: 'pending',
                            created_at: new Date().toISOString(),
                        };
                        postgresTable.push(inserted);

                        return {
                            select: () => ({
                                single: () => Promise.resolve({ data: inserted, error: null }),
                            }),
                        };
                    }),
                };
            }

            if (tableName === 'transactions') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    ilike: vi.fn().mockReturnThis(),
                    gte: vi.fn().mockReturnThis(),
                    lte: vi.fn().mockReturnThis(),
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
            }

            if (tableName === 'merchant_rules') {
                const rulesBuilder: any = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                    then: (resolve: any) => resolve({ data: [], error: null }),
                };
                return rulesBuilder;
            }

            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                upsert: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { user_id: userId, ai_insights_enabled: false }, error: null }),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
        });

        // Fire Process A, Process B, Process C concurrently without any shared in-memory mutex
        const [resultA, resultB, resultC] = await Promise.all([
            createTransactionCandidate(userId, sharedPayload, { broadcast: false }),
            createTransactionCandidate(userId, sharedPayload, { broadcast: false }),
            createTransactionCandidate(userId, sharedPayload, { broadcast: false }),
        ]);

        // INVARIANT 1: Database table must contain EXACTLY ONE record
        expect(postgresTable).toHaveLength(1);
        const canonicalId = postgresTable[0].id;

        // INVARIANT 2: All 3 processes must resolve to the identical canonical transaction candidate ID
        expect(resultA.candidate.id).toBe(canonicalId);
        expect(resultB.candidate.id).toBe(canonicalId);
        expect(resultC.candidate.id).toBe(canonicalId);

        // INVARIANT 3: Exactly 1 process creates the record; the other 2 recognize it as existing/reused
        const createdCount = [resultA, resultB, resultC].filter((r) => !r.reused).length;
        const reusedCount = [resultA, resultB, resultC].filter((r) => r.reused).length;

        expect(createdCount).toBe(1);
        expect(reusedCount).toBe(2);
    });
});
