// Supabase Transaction Service
// Direct Supabase queries for transactions (for PDF imports, etc.)

import { supabase } from '../config/supabase';

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

export const supabaseTransactionService = {
    // Get all transactions for current user
    getAll: async (userId: string): Promise<SupabaseTransaction[]> => {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }

        return data || [];
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

        return true;
    },
};

export default supabaseTransactionService;
