// Plaid Bank Connection Service
// Now integrated with backend API endpoints

import { supabase } from '@/config/supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Plaid environment types
type PlaidEnvironment = 'sandbox' | 'development' | 'production';

export interface PlaidConfig {
    clientId: string;
    secret: string;
    environment: PlaidEnvironment;
}

export interface LinkedAccount {
    id: string;
    user_id: string;
    institution_name: string;
    institution_id: string;
    account_name: string;
    account_type: string;
    account_mask: string;
    current_balance: number;
    available_balance: number;
    currency: string;
    last_synced: string;
    access_token_encrypted?: string;
    item_id?: string;
    created_at: string;
}

export interface PlaidTransaction {
    transaction_id: string;
    account_id: string;
    amount: number;
    date: string;
    name: string;
    merchant_name?: string;
    category?: string[];
    pending: boolean;
}

// Check if Plaid is configured (backend handles actual credentials)
export function isPlaidConfigured(): boolean {
    return true; // Backend now handles credential checks
}

// Create link token (call this to start Plaid Link flow)
export async function createLinkToken(userId: string): Promise<string | null> {
    try {
        const response = await fetch(`${API_BASE}/plaid/create-link-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });

        const data = await response.json();
        if (data.success && data.link_token) {
            return data.link_token;
        }
        return null;
    } catch (error) {
        console.error('Failed to create Plaid link token:', error);
        return null;
    }
}


// Exchange public token for access token (after successful Link)
export async function exchangePublicToken(publicToken: string): Promise<boolean> {
    try {
        const response = await fetch('/api/plaid/exchange-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_token: publicToken })
        });

        if (!response.ok) throw new Error('Failed to exchange token');

        return true;
    } catch (error) {
        console.error('Failed to exchange public token:', error);
        return false;
    }
}

// Get linked accounts from database
export async function getLinkedAccounts(): Promise<LinkedAccount[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('linked_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch linked accounts:', error);
        return [];
    }

    return data || [];
}

// Sync transactions from a linked account
export async function syncTransactions(accountId: string): Promise<PlaidTransaction[]> {
    try {
        const response = await fetch(`/api/plaid/sync-transactions/${accountId}`, {
            method: 'POST'
        });

        if (!response.ok) throw new Error('Failed to sync transactions');

        const data = await response.json();
        return data.transactions || [];
    } catch (error) {
        console.error('Failed to sync transactions:', error);
        return [];
    }
}

// Import Plaid transactions into our system
export async function importPlaidTransactions(transactions: PlaidTransaction[]): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    let imported = 0;

    for (const tx of transactions) {
        try {
            // Check if transaction already exists
            const { data: existing } = await supabase
                .from('transactions')
                .select('id')
                .eq('plaid_transaction_id', tx.transaction_id)
                .single();

            if (existing) continue; // Skip duplicates

            // Insert new transaction
            await supabase.from('transactions').insert({
                user_id: user.id,
                description: tx.merchant_name || tx.name,
                amount: Math.abs(tx.amount),
                type: tx.amount < 0 ? 'expense' : 'income',
                category: tx.category?.[0] || 'Other',
                date: tx.date,
                source: 'plaid',
                plaid_transaction_id: tx.transaction_id
            });

            imported++;
        } catch (error) {
            console.error('Failed to import transaction:', tx.name);
        }
    }

    return imported;
}

// Disconnect a linked account
export async function disconnectAccount(accountId: string): Promise<boolean> {
    try {
        // First, remove access token from Plaid
        await fetch(`/api/plaid/disconnect/${accountId}`, {
            method: 'DELETE'
        });

        // Then remove from database
        const { error } = await supabase
            .from('linked_accounts')
            .delete()
            .eq('id', accountId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Failed to disconnect account:', error);
        return false;
    }
}

// Get account balances
export async function refreshBalances(): Promise<void> {
    const accounts = await getLinkedAccounts();

    for (const account of accounts) {
        try {
            const response = await fetch(`/api/plaid/balance/${account.id}`);
            if (response.ok) {
                const data = await response.json();

                // Update balance in database
                await supabase
                    .from('linked_accounts')
                    .update({
                        current_balance: data.current,
                        available_balance: data.available,
                        last_synced: new Date().toISOString()
                    })
                    .eq('id', account.id);
            }
        } catch (error) {
            console.error('Failed to refresh balance for:', account.institution_name);
        }
    }
}

// Calculate total balance across all linked accounts
export async function getTotalBalance(): Promise<number> {
    const accounts = await getLinkedAccounts();
    return accounts.reduce((sum, account) => sum + (account.current_balance || 0), 0);
}

export const plaidService = {
    isPlaidConfigured,
    createLinkToken,
    exchangePublicToken,
    getLinkedAccounts,
    syncTransactions,
    importPlaidTransactions,
    disconnectAccount,
    refreshBalances,
    getTotalBalance
};

export default plaidService;
