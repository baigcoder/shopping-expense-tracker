// Reports Service - Supabase Integration
import { supabase } from '../config/supabase';

export interface Report {
    id: string;
    user_id: string;
    name: string;
    type: string;
    start_date?: string;
    end_date?: string;
    data?: any;
    created_at?: string;
}

export const reportService = {
    // Get all reports for user
    getAll: async (userId: string): Promise<Report[]> => {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reports:', error);
            return [];
        }

        return data || [];
    },

    // Create a new report
    create: async (report: Omit<Report, 'id' | 'created_at'>): Promise<Report | null> => {
        const { data, error } = await supabase
            .from('reports')
            .insert(report)
            .select()
            .single();

        if (error) {
            console.error('Error creating report:', error);
            return null;
        }

        return data;
    },

    // Delete a report
    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting report:', error);
            return false;
        }

        return true;
    }
};

export default reportService;
