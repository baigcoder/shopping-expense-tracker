import { supabase } from '../config/supabase.js';
import { invalidateUserAICacheIfEnabled } from './settingsService.js';
import { DetectedTransactionInput } from '../validators/schemas.js';
import { createHash } from 'crypto';

export type TransactionType = 'income' | 'expense';

export interface MoneyTransaction {
    id?: string;
    user_id: string;
    date: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    source?: string;
    confidence?: number;
    store_name?: string | null;
    product_name?: string | null;
    store_url?: string | null;
    hostname?: string | null;
    extension_type?: string | null;
    billing_cycle?: string | null;
    is_trial?: boolean;
    is_subscription?: boolean;
    trial_days?: number;
    behavior_flow?: unknown[];
    notes?: string | null;
    created_at?: string;
}

export interface TransactionListOptions {
    limit?: number;
    since?: Date;
    page?: number;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface TransactionPageResult {
    transactions: MoneyTransaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreateDetectedTransactionResult {
    transaction: MoneyTransaction;
    duplicate: boolean;
    transactionHash: string;
}

export interface UpdateMoneyTransactionInput {
    amount?: number;
    date?: string;
    description?: string | null;
    type?: TransactionType;
    category?: string | null;
    source?: string | null;
    store_name?: string | null;
    product_name?: string | null;
    store_url?: string | null;
    notes?: string | null;
}

const asRows = (value: unknown): any[] => Array.isArray(value) ? value : [];

const toFiniteAmount = (...values: unknown[]) => {
    for (const value of values) {
        const amount = Number(value);
        if (Number.isFinite(amount) && amount >= 0) return amount;
    }

    return 0;
};

const normalizeDate = (value?: string) => {
    if (!value) return new Date().toISOString();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const compact = (...values: Array<string | null | undefined>) =>
    values.map((value) => value?.trim()).find(Boolean);

const toTransactionType = (value: unknown): TransactionType =>
    value === 'income' ? 'income' : 'expense';

const SORT_COLUMNS: Record<string, string> = {
    date: 'date',
    purchaseDate: 'date',
    createdAt: 'created_at',
    created_at: 'created_at',
    amount: 'amount',
    category: 'category',
    description: 'description',
    storeName: 'store_name',
    store_name: 'store_name',
    productName: 'product_name',
    product_name: 'product_name',
};

const DETECTED_HASH_NOTE_PREFIX = 'cashly_hash:';

const normalizeIdempotencyKey = (value?: string | null) => {
    const key = value?.trim();
    if (!key) return null;
    return key.replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 128) || null;
};

const buildServerDetectedHash = (
    userId: string,
    data: DetectedTransactionInput,
    normalized: {
        amount: number;
        date: string;
        storeName: string;
        productName?: string | null;
        sourceUrl?: string | null;
        category: string;
    }
) => createHash('sha256')
    .update(JSON.stringify({
        userId,
        amount: normalized.amount,
        date: normalized.date.slice(0, 10),
        storeName: normalized.storeName.toLowerCase(),
        productName: normalized.productName?.toLowerCase() || '',
        sourceUrl: normalized.sourceUrl || '',
        category: normalized.category.toLowerCase(),
        type: data.type || 'purchase',
    }))
    .digest('hex')
    .slice(0, 32);

const withDetectedHashMarker = (notes: string | null | undefined, transactionHash: string) => {
    const marker = `${DETECTED_HASH_NOTE_PREFIX}${transactionHash}`;
    const base = notes?.trim();
    if (!base) return marker;
    if (base.includes(marker)) return base;
    return `${base}\n${marker}`;
};

async function findExistingDetectedTransaction(
    userId: string,
    transactionHash: string
): Promise<MoneyTransaction | null> {
    const marker = `${DETECTED_HASH_NOTE_PREFIX}${transactionHash}`;
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .ilike('notes', `%${marker}%`)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) throw error;

    return (asRows(data)[0] as MoneyTransaction | undefined) || null;
}

async function invalidateUserDerivedData(userId: string) {
    await invalidateUserAICacheIfEnabled(userId);
}

export async function listUserTransactions(
    userId: string,
    options: TransactionListOptions = {}
): Promise<MoneyTransaction[]> {
    let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (options.since) {
        query = query.gte('date', options.since.toISOString());
    }

    if (options.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return asRows(data) as MoneyTransaction[];
}

export async function listUserTransactionsPage(
    userId: string,
    options: TransactionListOptions = {}
): Promise<TransactionPageResult> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const sortColumn = SORT_COLUMNS[options.sortBy || 'date'] || 'date';

    let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

    if (options.category) {
        query = query.eq('category', options.category);
    }

    if (options.search) {
        const search = options.search.replace(/[%_]/g, '\\$&');
        query = query.or(`description.ilike.%${search}%,store_name.ilike.%${search}%,product_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query
        .order(sortColumn, { ascending: options.sortOrder === 'asc' })
        .range(from, to);

    if (error) throw error;

    const total = count || 0;
    return {
        transactions: asRows(data) as MoneyTransaction[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

export async function getMoneyTransaction(
    userId: string,
    id: string
): Promise<MoneyTransaction | null> {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data as MoneyTransaction | null;
}

export async function createMoneyTransaction(
    transaction: Omit<MoneyTransaction, 'id' | 'created_at'>
): Promise<MoneyTransaction> {
    const normalized = {
        ...transaction,
        amount: Math.abs(Number(transaction.amount) || 0),
        type: toTransactionType(transaction.type),
        date: normalizeDate(transaction.date),
        category: transaction.category || 'Other',
        description: transaction.description || 'Transaction'
    };

    const { data, error } = await supabase
        .from('transactions')
        .insert(normalized)
        .select()
        .single();

    if (error) throw error;

    await invalidateUserDerivedData(normalized.user_id);
    return data as MoneyTransaction;
}

export async function updateMoneyTransaction(
    userId: string,
    id: string,
    updates: UpdateMoneyTransactionInput
): Promise<MoneyTransaction | null> {
    const normalized: Record<string, unknown> = {};

    if (updates.amount !== undefined) normalized.amount = Math.abs(Number(updates.amount) || 0);
    if (updates.date !== undefined) normalized.date = normalizeDate(updates.date);
    if (updates.description !== undefined) normalized.description = updates.description || 'Transaction';
    if (updates.type !== undefined) normalized.type = toTransactionType(updates.type);
    if (updates.category !== undefined) normalized.category = updates.category || 'Other';
    if (updates.source !== undefined) normalized.source = updates.source;
    if (updates.store_name !== undefined) normalized.store_name = updates.store_name;
    if (updates.product_name !== undefined) normalized.product_name = updates.product_name;
    if (updates.store_url !== undefined) normalized.store_url = updates.store_url;
    if (updates.notes !== undefined) normalized.notes = updates.notes;

    if (Object.keys(normalized).length === 0) {
        return getMoneyTransaction(userId, id);
    }

    const { data, error } = await supabase
        .from('transactions')
        .update(normalized)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    await invalidateUserDerivedData(userId);
    return data as MoneyTransaction;
}

export async function createDetectedTransaction(
    userId: string,
    data: DetectedTransactionInput
): Promise<CreateDetectedTransactionResult> {
    const amount = toFiniteAmount(data.amount, data.price);
    const storeName = compact(data.storeName, data.name, data.serviceName, data.hostname, data.description, 'Detected Purchase')!;
    const productName = compact(data.productName, data.serviceName, data.name, data.type);
    const sourceUrl = data.sourceUrl || data.storeUrl || null;
    const category = data.category || (data.isSubscription || data.type === 'subscription' ? 'Subscriptions' : 'Shopping');
    const extensionType = data.isTrial ? 'trial' : data.type;
    const date = normalizeDate(data.detectedAt || data.date);
    const transactionHash = normalizeIdempotencyKey(data.transactionHash || data.idempotencyKey)
        || buildServerDetectedHash(userId, data, { amount, date, storeName, productName, sourceUrl, category });

    const existing = await findExistingDetectedTransaction(userId, transactionHash);
    if (existing) {
        return {
            transaction: existing,
            duplicate: true,
            transactionHash,
        };
    }

    const transaction = await createMoneyTransaction({
        user_id: userId,
        date,
        description: compact(data.description, data.notes, `${storeName}${productName && productName !== storeName ? ` - ${productName}` : ''}`)!,
        amount,
        type: 'expense',
        category,
        source: data.source || (data.isTrial ? 'extension-trial' : 'extension-detected'),
        confidence: amount > 0 ? 0.9 : 0.6,
        store_name: storeName,
        product_name: productName || null,
        store_url: sourceUrl,
        hostname: data.hostname || null,
        extension_type: extensionType || 'purchase',
        billing_cycle: data.billingCycle || null,
        is_trial: !!data.isTrial,
        is_subscription: !!data.isSubscription,
        trial_days: data.trialDays || 0,
        behavior_flow: data.behaviorFlow || [],
        notes: withDetectedHashMarker(data.notes || `Auto-tracked via ${data.source || 'extension'}`, transactionHash)
    });

    return {
        transaction,
        duplicate: false,
        transactionHash,
    };
}

export async function deleteMoneyTransaction(userId: string, id: string): Promise<void> {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw error;
    await invalidateUserDerivedData(userId);
}

export default {
    listUserTransactions,
    listUserTransactionsPage,
    getMoneyTransaction,
    createMoneyTransaction,
    updateMoneyTransaction,
    createDetectedTransaction,
    deleteMoneyTransaction
};
