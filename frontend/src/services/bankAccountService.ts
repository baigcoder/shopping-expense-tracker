// Bank Account Service
// Track multiple bank accounts and calculate net worth

import { supabase } from '../config/supabase';

export interface BankAccount {
    id: string;
    user_id: string;
    name: string;
    bank_name: string;
    account_type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
    balance: number;
    currency: string;
    color: string;
    icon: string;
    is_active: boolean;
    last_updated: string;
    created_at: string;
}

export const bankAccountService = {
    // Get all accounts for user
    getAll: async (userId: string): Promise<BankAccount[]> => {
        const { data, error } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching bank accounts:', error);
            return [];
        }

        return data || [];
    },

    // Create account
    create: async (account: Omit<BankAccount, 'id' | 'created_at'>): Promise<BankAccount | null> => {
        const { data, error } = await supabase
            .from('bank_accounts')
            .insert(account)
            .select()
            .single();

        if (error) {
            console.error('Error creating bank account:', error);
            return null;
        }

        return data;
    },

    // Update account
    update: async (id: string, updates: Partial<BankAccount>): Promise<boolean> => {
        const { error } = await supabase
            .from('bank_accounts')
            .update({ ...updates, last_updated: new Date().toISOString() })
            .eq('id', id);

        return !error;
    },

    // Update balance
    updateBalance: async (id: string, balance: number): Promise<boolean> => {
        const { error } = await supabase
            .from('bank_accounts')
            .update({ balance, last_updated: new Date().toISOString() })
            .eq('id', id);

        return !error;
    },

    // Delete account
    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('bank_accounts')
            .delete()
            .eq('id', id);

        return !error;
    },

    // Calculate totals
    calculateNetWorth: (accounts: BankAccount[]): { assets: number; liabilities: number; netWorth: number } => {
        const assets = accounts
            .filter(a => a.is_active && a.account_type !== 'credit')
            .reduce((sum, a) => sum + a.balance, 0);

        const liabilities = accounts
            .filter(a => a.is_active && a.account_type === 'credit')
            .reduce((sum, a) => sum + Math.abs(a.balance), 0);

        return {
            assets,
            liabilities,
            netWorth: assets - liabilities
        };
    }
};

export default bankAccountService;
