// Plaid Bank Connection Controller - Hardened & Authorized
import { Request, Response } from 'express';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { createClient } from '@supabase/supabase-js';
import { getCanonicalUserId } from '../utils/userAuth.js';
import { encryptToken, decryptToken } from '../services/encryptionService.js';

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

// Supabase client for database operations (isolated server-side access)
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Create Link Token - Required to initialize Plaid Link
export async function createLinkToken(req: Request, res: Response) {
    try {
        const userId = getCanonicalUserId(req);

        const response = await plaidClient.linkTokenCreate({
            user: { client_user_id: userId },
            client_name: 'Cashly Expense Tracker',
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
        const userId = getCanonicalUserId(req);
        const { public_token, metadata } = req.body;

        if (!public_token) {
            return res.status(400).json({ success: false, message: 'Public token required' });
        }

        // Exchange public token for access token
        const exchangeResponse = await plaidClient.itemPublicTokenExchange({
            public_token
        });

        const accessToken = exchangeResponse.data.access_token;
        const itemId = exchangeResponse.data.item_id;

        // Encrypt Plaid access token before storing
        const encryptedAccessToken = encryptToken(accessToken);

        // Get account info
        const accountsResponse = await plaidClient.accountsGet({
            access_token: accessToken
        });

        const accounts = accountsResponse.data.accounts;
        const institution = metadata?.institution;

        // Store linked accounts in database scoped to authenticated user
        for (const account of accounts) {
            await supabase.from('bank_accounts').upsert({
                user_id: userId,
                institution_name: institution?.name || 'Unknown Bank',
                institution_id: institution?.institution_id || itemId,
                account_name: account.name,
                account_type: account.type,
                account_mask: account.mask,
                current_balance: account.balances.current,
                available_balance: account.balances.available,
                currency: account.balances.iso_currency_code || 'USD',
                access_token_encrypted: encryptedAccessToken,
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

// Get Linked Accounts for Authenticated User
export async function getLinkedAccounts(req: Request, res: Response) {
    try {
        const userId = getCanonicalUserId(req);

        const { data, error } = await supabase
            .from('bank_accounts')
            .select('id, name, bank_name, account_type, balance, currency, is_active, last_updated, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map to expected frontend format
        const accounts = (data || []).map(acc => ({
            id: acc.id,
            institution_name: acc.bank_name,
            account_name: acc.name,
            account_type: acc.account_type,
            account_mask: '',
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

// Sync Transactions from Plaid (Ownership-enforced)
export async function syncTransactions(req: Request, res: Response) {
    try {
        const userId = getCanonicalUserId(req);
        const { accountId } = req.params;

        // Strict ownership check: account MUST belong to authenticated user
        const { data: account, error: accountError } = await supabase
            .from('bank_accounts')
            .select('access_token_encrypted, item_id')
            .eq('id', accountId)
            .eq('user_id', userId)
            .single();

        if (accountError || !account) {
            return res.status(404).json({ success: false, message: 'Bank account not found' });
        }

        // Decrypt the stored access token
        const rawAccessToken = decryptToken(account.access_token_encrypted);

        // Get transactions from last 30 days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const endDate = new Date();

        const transactionsResponse = await plaidClient.transactionsGet({
            access_token: rawAccessToken,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
        });

        const transactions = transactionsResponse.data.transactions;
        let imported = 0;

        // Import transactions strictly for authenticated user
        for (const tx of transactions) {
            // Check for duplicates within user's transactions
            const { data: existing } = await supabase
                .from('transactions')
                .select('id')
                .eq('user_id', userId)
                .eq('plaid_transaction_id', tx.transaction_id)
                .single();

            if (existing) continue;

            // Insert new transaction
            const { error: insertError } = await supabase.from('transactions').insert({
                user_id: userId,
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
            .eq('id', accountId)
            .eq('user_id', userId);

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

// Disconnect Account (Ownership-enforced)
export async function disconnectAccount(req: Request, res: Response) {
    try {
        const userId = getCanonicalUserId(req);
        const { accountId } = req.params;

        // Strict ownership check before access token retrieval or deletion
        const { data: account, error: fetchError } = await supabase
            .from('bank_accounts')
            .select('access_token_encrypted')
            .eq('id', accountId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !account) {
            return res.status(404).json({ success: false, message: 'Bank account not found' });
        }

        if (account.access_token_encrypted) {
            const rawAccessToken = decryptToken(account.access_token_encrypted);
            try {
                // Remove item from Plaid
                await plaidClient.itemRemove({
                    access_token: rawAccessToken
                });
            } catch (plaidError) {
                console.warn('Plaid remote item removal warning:', plaidError);
            }
        }

        // Delete from database with user ownership constraint
        const { error } = await supabase
            .from('bank_accounts')
            .delete()
            .eq('id', accountId)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true, message: 'Account disconnected successfully' });
    } catch (error: any) {
        console.error('Disconnect error:', error);
        res.status(500).json({ success: false, message: 'Failed to disconnect account' });
    }
}

// Refresh Account Balances (Ownership-enforced)
export async function refreshBalances(req: Request, res: Response) {
    try {
        const userId = getCanonicalUserId(req);
        const { accountId } = req.params;

        // Strict ownership check
        const { data: account, error: fetchError } = await supabase
            .from('bank_accounts')
            .select('access_token_encrypted')
            .eq('id', accountId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !account?.access_token_encrypted) {
            return res.status(404).json({ success: false, message: 'Bank account not found' });
        }

        const rawAccessToken = decryptToken(account.access_token_encrypted);

        const response = await plaidClient.accountsBalanceGet({
            access_token: rawAccessToken
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
                .eq('id', accountId)
                .eq('user_id', userId);
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
