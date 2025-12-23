
import { supabase } from '../config/supabase';

export interface Budget {
    id: string;
    user_id: string;
    category: string;
    amount: number;
    period: string;
    created_at?: string;
}

export const budgetService = {
    // Get all budgets for the current user
    getAll: async (userId: string): Promise<Budget[]> => {
        const { data, error } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching budgets:', error);
            return [];
        }

        return data || [];
    },

    // Create a new budget limit
    create: async (budget: Omit<Budget, 'id'>): Promise<Budget | null> => {
        const { data, error } = await supabase
            .from('budgets')
            .insert(budget)
            .select()
            .single();

        if (error) {
            console.error('Error creating budget:', error);
            return null;
        }

        // Notify listeners that data changed
        window.dispatchEvent(new CustomEvent('budget-changed', { detail: { action: 'create', data } }));
        return data;
    },

    // Update a budget
    update: async (id: string, updates: Partial<Budget>): Promise<Budget | null> => {
        const { data, error } = await supabase
            .from('budgets')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating budget:', error);
            return null;
        }

        // Notify listeners that data changed
        window.dispatchEvent(new CustomEvent('budget-changed', { detail: { action: 'update', data } }));
        return data;
    },

    // Delete a budget
    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting budget:', error);
            return false;
        }

        // Notify listeners that data changed
        window.dispatchEvent(new CustomEvent('budget-changed', { detail: { action: 'delete', id } }));
        return true;
    }
};
