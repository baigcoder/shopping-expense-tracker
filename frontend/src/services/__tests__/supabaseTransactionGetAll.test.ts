import { beforeEach, describe, expect, it, vi } from 'vitest';

// A fake transactions table of `rows` rows that answers .range(from, to) like Supabase.
const state = { rows: 0, fail: false, ranges: [] as [number, number][] };
vi.mock('../../config/supabase', () => {
    const query = {
        select: () => query, eq: () => query, order: () => query,
        range: (from: number, to: number) => {
            state.ranges.push([from, to]);
            if (state.fail) return Promise.resolve({ data: null, error: { message: 'offline' } });
            const n = Math.max(0, Math.min(to, state.rows - 1) - from + 1);
            return Promise.resolve({ data: Array.from({ length: n }, (_, i) => ({ id: String(from + i) })), error: null });
        },
    };
    return { supabase: { from: () => query } };
});

import { invalidateTransactionCache, supabaseTransactionService } from '../supabaseTransactionService';

describe('supabaseTransactionService.getAll', () => {
    beforeEach(() => { state.rows = 0; state.fail = false; state.ranges = []; invalidateTransactionCache(); });

    it('pages past 1,000 rows instead of stopping at the first 100', async () => {
        state.rows = 2350;
        const all = await supabaseTransactionService.getAll('u');
        expect(all).toHaveLength(2350);
        expect(state.ranges).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
    });

    it('asks for exactly the limit when one is given', async () => {
        state.rows = 5000;
        expect(await supabaseTransactionService.getAll('u', { limit: 1000 })).toHaveLength(1000);
        expect(state.ranges).toEqual([[0, 999]]);
    });

    it('throws on failure rather than pretending the user has no transactions', async () => {
        state.fail = true;
        await expect(supabaseTransactionService.getAll('u', { force: true })).rejects.toThrow('offline');
    });
});
