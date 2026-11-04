// Supabase Transaction Service
// Direct Supabase queries for transactions (for PDF imports, etc.)

import { supabase } from '../config/supabase';
import { emitFinancialDataEvent } from './financialDataEvents';

export interface SupabaseTransaction {
    id: string;
    user_id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    source?: string;
    confidence?: number;
    statement_id?: string;
    created_at: string;
}

const TRANSACTION_CACHE_TTL = 30 * 1000;
const PAGE_ROWS = 1000;
const MAX_ROWS = 20000;
const transactionCache = new Map<string, { data: SupabaseTransaction[]; timestamp: number }>();

export const invalidateTransactionCache = (userId?: string) => {
    if (userId) {
        transactionCache.delete(userId);
        return;
    }

    transactionCache.clear();
};

export const supabaseTransactionService = {
    // Every transaction for the user, newest first. Supabase returns at most 1,000 rows per request,
    // so this pages through them; the old single 100-row query left balances and year totals short.
    // A failed load throws instead of returning [], which would make an existing user look brand new.
    getAll: async (userId: string, options: { force?: boolean; limit?: number } = {}): Promise<SupabaseTransaction[]> => {
        const cached = transactionCache.get(userId);
        if (!options.force && !options.limit && cached && Date.now() - cached.timestamp < TRANSACTION_CACHE_TTL) {
            return cached.data;
        }

        // shortcut: stops at MAX_ROWS; move totals to a server-side query if users ever pass that.
        const want = options.limit || MAX_ROWS;
        const transactions: SupabaseTransaction[] = [];
        for (let from = 0; from < want; from += PAGE_ROWS) {
            const to = Math.min(from + PAGE_ROWS, want) - 1;
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .order('id', { ascending: false }) // stable order, so pages never skip or repeat a row
                .range(from, to);
            if (error) throw new Error(`Could not load transactions: ${error.message}`);
            transactions.push(...(data || []));
            if (!data || data.length < to - from + 1) break;
        }

        if (!options.limit) transactionCache.set(userId, { data: transactions, timestamp: Date.now() });
        return transactions;
    },

    // Get transactions by source (e.g., 'pdf_import', 'csv_import')
    getBySource: async (userId: string, source: string): Promise<SupabaseTransaction[]> => {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('source', source)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching transactions by source:', error);
            return [];
        }

        return data || [];
    },

    // Create a single transaction
    create: async (transaction: Omit<SupabaseTransaction, 'id' | 'created_at'>): Promise<SupabaseTransaction | null> => {
        const { data, error } = await supabase
            .from('transactions')
            .insert(transaction)
            .select()
            .single();

        if (error) {
            console.error('Error creating transaction:', error);
            return null;
        }

        invalidateTransactionCache(transaction.user_id);
        emitFinancialDataEvent('transaction-added', data);
        return data;
    },

    // Create multiple transactions (bulk insert)
    createMany: async (transactions: Omit<SupabaseTransaction, 'id' | 'created_at'>[]): Promise<SupabaseTransaction[]> => {
        const { data, error } = await supabase
            .from('transactions')
            .insert(transactions)
            .select();

        if (error) {
            console.error('Error creating transactions:', error);
            return [];
        }

        invalidateTransactionCache(transactions[0]?.user_id);
        emitFinancialDataEvent('transaction-added', { count: data?.length || 0, transactions: data || [] });
        return data || [];
    },

    // Update a transaction
    update: async (id: string, updates: Partial<SupabaseTransaction>): Promise<SupabaseTransaction | null> => {
        const { data, error } = await supabase
            .from('transactions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating transaction:', error);
            return null;
        }

        invalidateTransactionCache(data.user_id);
        emitFinancialDataEvent('transaction-updated', data);
        return data;
    },

    // Delete a transaction
    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting transaction:', error);
            return false;
        }

        invalidateTransactionCache();
        emitFinancialDataEvent('transaction-deleted', { id });
        return true;
    },
};

export default supabaseTransactionService;
