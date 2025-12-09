// Goals Service - Supabase Integration
import { supabase } from '../config/supabase';

export interface Goal {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    icon: string;
    target: number;
    saved: number;
    deadline?: string;
    created_at?: string;
}

export const goalService = {
    // Get all goals for user
    getAll: async (userId: string): Promise<Goal[]> => {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching goals:', error);
            return [];
        }

        return data || [];
    },

    // Create a new goal
    create: async (goal: Omit<Goal, 'id' | 'created_at'>): Promise<Goal | null> => {
        const { data, error } = await supabase
            .from('goals')
            .insert(goal)
            .select()
            .single();

        if (error) {
            console.error('Error creating goal:', error);
            return null;
        }

        return data;
    },

    // Update a goal (e.g., add funds)
    update: async (id: string, updates: Partial<Goal>): Promise<Goal | null> => {
        const { data, error } = await supabase
            .from('goals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating goal:', error);
            return null;
        }

        return data;
    },

    // Add funds to a goal
    addFunds: async (id: string, amount: number): Promise<Goal | null> => {
        // First get current saved amount
        const { data: current, error: fetchError } = await supabase
            .from('goals')
            .select('saved')
            .eq('id', id)
            .single();

        if (fetchError || !current) {
            console.error('Error fetching goal:', fetchError);
            return null;
        }

        // Update with new amount
        const newSaved = (current.saved || 0) + amount;
        return goalService.update(id, { saved: newSaved });
    },

    // Delete a goal
    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting goal:', error);
            return false;
        }

        return true;
    }
};

export default goalService;
