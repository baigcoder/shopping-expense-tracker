// Plaid Bank Connection Controller
import { Request, Response } from 'express';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { createClient } from '@supabase/supabase-js';

// Initialize Plaid client
const plaidConfig = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET,
        },
    },
});

const plaidClient = new PlaidApi(plaidConfig);

// Supabase client for database operations
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Create Link Token - Required to initialize Plaid Link
export async function createLinkToken(req: Request, res: Response) {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'User ID required' });
        }

        const response = await plaidClient.linkTokenCreate({
            user: { client_user_id: user_id },
            client_name: 'FinZen Expense Tracker',
            products: [Products.Transactions],
            country_codes: [CountryCode.Us],
            language: 'en',
        });

        res.json({
            success: true,
            link_token: response.data.link_token,
            expiration: response.data.expiration
        });
    } catch (error: any) {
        console.error('Create link token error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create link token',
            error: error.response?.data?.error_message || error.message
        });
    }
}

// Exchange Public Token for Access Token
export async function exchangePublicToken(req: Request, res: Response) {
    try {
        const { public_token, user_id, metadata } = req.body;

        if (!public_token || !user_id) {
            return res.status(400).json({ success: false, message: 'Public token and user ID required' });
        }

        // Exchange public token for access token
        const exchangeResponse = await plaidClient.itemPublicTokenExchange({
            public_token
        });

        const accessToken = exchangeResponse.data.access_token;
        const itemId = exchangeResponse.data.item_id;

        // Get account info
        const accountsResponse = await plaidClient.accountsGet({
            access_token: accessToken
        });

        const accounts = accountsResponse.data.accounts;
        const institution = metadata?.institution;

        // Store linked accounts in database
        for (const account of accounts) {
            await supabase.from('bank_accounts').upsert({
                user_id,
                institution_name: institution?.name || 'Unknown Bank',
                institution_id: institution?.institution_id || itemId,
                account_name: account.name,
                account_type: account.type,
                account_mask: account.mask,
                current_balance: account.balances.current,
                available_balance: account.balances.available,
                currency: account.balances.iso_currency_code || 'USD',
                access_token_encrypted: accessToken, // In production, encrypt this!
                item_id: itemId,
                last_synced: new Date().toISOString()
            }, {
                onConflict: 'item_id,account_mask'
            });
        }

        res.json({
            success: true,
            message: `Linked ${accounts.length} account(s) from ${institution?.name || 'bank'}`,
            accounts_count: accounts.length
        });
    } catch (error: any) {
        console.error('Exchange token error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to link account',
            error: error.response?.data?.error_message || error.message
        });
    }
}

// Get Linked Accounts for User
export async function getLinkedAccounts(req: Request, res: Response) {
    try {
        const user_id = req.query.user_id as string;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'User ID required' });
        }

        const { data, error } = await supabase
            .from('bank_accounts')
            .select('id, name, bank_name, account_type, balance, currency, is_active, last_updated, created_at')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map to expected frontend format
        const accounts = (data || []).map(acc => ({
            id: acc.id,
            institution_name: acc.bank_name,
            account_name: acc.name,
            account_type: acc.account_type,
            account_mask: '', // Not stored in this schema
            current_balance: acc.balance,
            available_balance: acc.balance,
            currency: acc.currency,
            last_synced: acc.last_updated
        }));

        res.json({ success: true, accounts });
    } catch (error: any) {
        console.error('Get accounts error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch accounts' });
    }
}

// Sync Transactions from Plaid
export async function syncTransactions(req: Request, res: Response) {
    try {
        const { accountId } = req.params;
        const { user_id } = req.body;

        // Get the access token for this account
        const { data: account, error: accountError } = await supabase
            .from('bank_accounts')
            .select('access_token_encrypted, item_id')
            .eq('id', accountId)
            .single();

        if (accountError || !account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        // Get transactions from last 30 days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const endDate = new Date();

        const transactionsResponse = await plaidClient.transactionsGet({
            access_token: account.access_token_encrypted,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
        });

        const transactions = transactionsResponse.data.transactions;
        let imported = 0;

        // Import transactions
        for (const tx of transactions) {
            // Check for duplicates
            const { data: existing } = await supabase
                .from('transactions')
                .select('id')
                .eq('plaid_transaction_id', tx.transaction_id)
                .single();

            if (existing) continue;

            // Insert new transaction
            const { error: insertError } = await supabase.from('transactions').insert({
                user_id,
                description: tx.merchant_name || tx.name,
                amount: Math.abs(tx.amount),
                type: tx.amount > 0 ? 'expense' : 'income',
                category: tx.category?.[0] || 'Other',
                date: tx.date,
                source: 'plaid',
                store: tx.merchant_name,
                plaid_transaction_id: tx.transaction_id
            });

            if (!insertError) imported++;
        }

        // Update last synced timestamp
        await supabase
            .from('bank_accounts')
            .update({ last_synced: new Date().toISOString() })
            .eq('id', accountId);

        res.json({
            success: true,
            message: `Synced ${imported} new transactions`,
            total_fetched: transactions.length,
            imported
        });
    } catch (error: any) {
        console.error('Sync transactions error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to sync transactions',
            error: error.response?.data?.error_message || error.message
        });
    }
}

// Disconnect Account
export async function disconnectAccount(req: Request, res: Response) {
    try {
        const { accountId } = req.params;

        // Get access token to remove from Plaid
        const { data: account } = await supabase
            .from('bank_accounts')
            .select('access_token_encrypted')
            .eq('id', accountId)
            .single();

        if (account?.access_token_encrypted) {
            // Remove item from Plaid
            await plaidClient.itemRemove({
                access_token: account.access_token_encrypted
            });
        }

        // Delete from database
        const { error } = await supabase
            .from('bank_accounts')
            .delete()
            .eq('id', accountId);

        if (error) throw error;

        res.json({ success: true, message: 'Account disconnected' });
    } catch (error: any) {
        console.error('Disconnect error:', error);
        res.status(500).json({ success: false, message: 'Failed to disconnect account' });
    }
}

// Refresh Account Balances
export async function refreshBalances(req: Request, res: Response) {
    try {
        const { accountId } = req.params;

        const { data: account } = await supabase
            .from('bank_accounts')
            .select('access_token_encrypted')
            .eq('id', accountId)
            .single();

        if (!account?.access_token_encrypted) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        const response = await plaidClient.accountsBalanceGet({
            access_token: account.access_token_encrypted
        });

        const balances = response.data.accounts[0]?.balances;

        if (balances) {
            await supabase
                .from('bank_accounts')
                .update({
                    current_balance: balances.current,
                    available_balance: balances.available,
                    last_synced: new Date().toISOString()
                })
                .eq('id', accountId);
        }

        res.json({
            success: true,
            current: balances?.current,
            available: balances?.available
        });
    } catch (error: any) {
        console.error('Refresh balance error:', error);
        res.status(500).json({ success: false, message: 'Failed to refresh balance' });
    }
}
