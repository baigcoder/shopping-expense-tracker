// Recurring Transactions Service
// Handles automatic recurring expenses like rent, bills, subscriptions

import { supabase } from '../config/supabase';

export interface RecurringTransaction {
    id: string;
    user_id: string;
    name: string;
    amount: number;
    category: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    next_due_date: string;
    last_processed_date?: string;
    is_active: boolean;
    auto_add: boolean; // If true, automatically adds transaction on due date
    reminder_days: number; // Days before due date to send reminder
    notes?: string;
    created_at: string;
}

export const recurringTransactionService = {
    // Get all recurring transactions for user
    getAll: async (userId: string): Promise<RecurringTransaction[]> => {
        const { data, error } = await supabase
            .from('recurring_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('next_due_date', { ascending: true });

        if (error) {
            console.error('Error fetching recurring transactions:', error);
            return [];
        }

        return data || [];
    },

    // Get upcoming recurring transactions (due within X days)
    getUpcoming: async (userId: string, days: number = 7): Promise<RecurringTransaction[]> => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const { data, error } = await supabase
            .from('recurring_transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .lte('next_due_date', futureDate.toISOString().split('T')[0])
            .order('next_due_date', { ascending: true });

        if (error) {
            console.error('Error fetching upcoming recurring:', error);
            return [];
        }

        return data || [];
    },

    // Create a new recurring transaction
    create: async (data: Omit<RecurringTransaction, 'id' | 'created_at'>): Promise<RecurringTransaction | null> => {
        const { data: created, error } = await supabase
            .from('recurring_transactions')
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error('Error creating recurring transaction:', error);
            return null;
        }

        return created;
    },

    // Update a recurring transaction
    update: async (id: string, updates: Partial<RecurringTransaction>): Promise<boolean> => {
        const { error } = await supabase
            .from('recurring_transactions')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating recurring transaction:', error);
            return false;
        }

        return true;
    },

    // Delete a recurring transaction
    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('recurring_transactions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting recurring transaction:', error);
            return false;
        }

        return true;
    },

    // Process due recurring transactions (creates actual transactions)
    processDue: async (userId: string): Promise<number> => {
        const today = new Date().toISOString().split('T')[0];

        // Get due transactions that should auto-add
        const { data: dueTransactions, error } = await supabase
            .from('recurring_transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .eq('auto_add', true)
            .lte('next_due_date', today);

        if (error || !dueTransactions) {
            console.error('Error fetching due transactions:', error);
            return 0;
        }

        let processedCount = 0;

        for (const recurring of dueTransactions) {
            // Create the actual transaction
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: userId,
                    description: recurring.name,
                    amount: recurring.amount,
                    type: 'expense',
                    category: recurring.category,
                    date: recurring.next_due_date,
                    source: 'recurring',
                    recurring_id: recurring.id
                });

            if (!txError) {
                // Calculate next due date
                const nextDate = calculateNextDueDate(recurring.next_due_date, recurring.frequency);

                // Update the recurring transaction
                await supabase
                    .from('recurring_transactions')
                    .update({
                        last_processed_date: recurring.next_due_date,
                        next_due_date: nextDate
                    })
                    .eq('id', recurring.id);

                processedCount++;
            }
        }

        return processedCount;
    },

    // Mark as paid manually (for non-auto transactions)
    markAsPaid: async (id: string): Promise<boolean> => {
        const { data: recurring, error: fetchError } = await supabase
            .from('recurring_transactions')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !recurring) return false;

        const nextDate = calculateNextDueDate(recurring.next_due_date, recurring.frequency);

        const { error } = await supabase
            .from('recurring_transactions')
            .update({
                last_processed_date: recurring.next_due_date,
                next_due_date: nextDate
            })
            .eq('id', id);

        return !error;
    }
};

// Helper function to calculate next due date
function calculateNextDueDate(currentDate: string, frequency: string): string {
    const date = new Date(currentDate);

    switch (frequency) {
        case 'daily':
            date.setDate(date.getDate() + 1);
            break;
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'yearly':
            date.setFullYear(date.getFullYear() + 1);
            break;
    }

    return date.toISOString().split('T')[0];
}

export default recurringTransactionService;
