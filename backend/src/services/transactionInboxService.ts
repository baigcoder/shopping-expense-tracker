import { createHash } from 'crypto';
import { supabase } from '../config/supabase.js';
import { invalidateUserAICacheIfEnabled } from './settingsService.js';
import {
    ApproveCandidateInput,
    BulkCandidateInput,
    DetectedTransactionInput,
    MerchantRuleInput,
    TransactionCandidateInput,
} from '../validators/schemas.js';
import {
    createMoneyTransaction,
    getMoneyTransaction,
    MoneyTransaction,
    TransactionType,
    updateMoneyTransaction,
} from './transactionDomainService.js';

export type CandidateStatus = 'pending' | 'approved' | 'rejected' | 'merged';
export type CandidateSource = 'extension' | 'pdf' | 'csv' | 'excel' | 'plaid' | 'ai' | 'manual_review';

export interface TransactionCandidate {
    id: string;
    user_id: string;
    source: CandidateSource;
    status: CandidateStatus;
    description: string;
    amount: number;
    date: string;
    type: TransactionType;
    category: string;
    merchant_name?: string | null;
    raw_payload?: Record<string, unknown>;
    confidence: number;
    transaction_hash?: string | null;
    duplicate_transaction_id?: string | null;
    matched_rule_id?: string | null;
    import_session_id?: string | null;
    approved_transaction_id?: string | null;
    created_at?: string;
    updated_at?: string;
}

interface MerchantRule {
    id: string;
    user_id: string;
    merchant_pattern: string;
    match_type: 'exact' | 'contains' | 'starts_with' | 'regex';
    category: string;
    transaction_type?: TransactionType | null;
    amount_min?: number | null;
    amount_max?: number | null;
    priority: number;
    enabled: boolean;
}

const asRows = (value: unknown): any[] => Array.isArray(value) ? value : [];
const HASH_NOTE_PREFIX = 'cashly_hash:';

const normalizeDate = (value?: string | null) => {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

const normalizeAmount = (value: unknown) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? Math.abs(amount) : 0;
};

const compact = (...values: Array<string | null | undefined>) =>
    values.map((value) => value?.trim()).find(Boolean);

const normalizeHash = (value?: string | null) => {
    const key = value?.trim();
    if (!key) return null;
    return key.replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 128) || null;
};

const buildCandidateHash = (userId: string, candidate: {
    amount: number;
    date: string;
    description: string;
    merchant_name?: string | null;
    source: string;
}) => createHash('sha256')
    .update(JSON.stringify({
        userId,
        amount: candidate.amount,
        date: candidate.date,
        merchant: (candidate.merchant_name || '').toLowerCase(),
        description: candidate.description.toLowerCase(),
        source: candidate.source,
    }))
    .digest('hex')
    .slice(0, 32);

const ruleScore = (rule: MerchantRule) => {
    const matchScore = rule.match_type === 'exact' ? 0 : rule.match_type === 'starts_with' ? 1 : rule.match_type === 'contains' ? 2 : 3;
    return (rule.priority || 100) * 10 + matchScore;
};

const ruleMatches = (rule: MerchantRule, merchant: string, amount: number) => {
    const pattern = rule.merchant_pattern.toLowerCase();
    const target = merchant.toLowerCase();
    const merchantMatch =
        rule.match_type === 'exact' ? target === pattern :
            rule.match_type === 'starts_with' ? target.startsWith(pattern) :
                rule.match_type === 'regex' ? new RegExp(rule.merchant_pattern, 'i').test(merchant) :
                    target.includes(pattern);

    if (!merchantMatch) return false;
    if (rule.amount_min !== null && rule.amount_min !== undefined && amount < Number(rule.amount_min)) return false;
    if (rule.amount_max !== null && rule.amount_max !== undefined && amount > Number(rule.amount_max)) return false;
    return true;
};

export async function listMerchantRules(userId: string) {
    const { data, error } = await supabase
        .from('merchant_rules')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) throw error;
    return asRows(data) as MerchantRule[];
}

async function findMatchingRule(userId: string, merchant: string, amount: number) {
    const rules = (await listMerchantRules(userId)).filter((rule) => rule.enabled);
    return rules
        .filter((rule) => {
            try {
                return ruleMatches(rule, merchant, amount);
            } catch {
                return false;
            }
        })
        .sort((a, b) => ruleScore(a) - ruleScore(b))[0] || null;
}

async function findDuplicateTransaction(userId: string, candidate: {
    transaction_hash?: string | null;
    amount: number;
    date: string;
    description: string;
    merchant_name?: string | null;
}) {
    if (candidate.transaction_hash) {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .ilike('notes', `%${HASH_NOTE_PREFIX}${candidate.transaction_hash}%`)
            .limit(1);

        if (error) throw error;
        const existing = asRows(data)[0];
        if (existing) return existing as MoneyTransaction;
    }

    const day = new Date(candidate.date);
    const start = new Date(day);
    start.setDate(day.getDate() - 3);
    const end = new Date(day);
    end.setDate(day.getDate() + 3);

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('amount', candidate.amount)
        .gte('date', start.toISOString().slice(0, 10))
        .lte('date', end.toISOString().slice(0, 10))
        .limit(20);

    if (error) throw error;

    const merchant = (candidate.merchant_name || '').toLowerCase();
    const description = candidate.description.toLowerCase();
    return (asRows(data).find((tx) => {
        const txText = `${tx.description || ''} ${tx.store_name || ''}`.toLowerCase();
        return (merchant && txText.includes(merchant)) || txText.includes(description.slice(0, 24));
    }) || null) as MoneyTransaction | null;
}

export async function createTransactionCandidate(
    userId: string,
    input: TransactionCandidateInput
) {
    const amount = normalizeAmount(input.amount);
    const description = input.description.trim();
    const merchantName = compact(input.merchantName, input.merchant_name, description.split('-')[0], description);
    const date = normalizeDate(input.date);
    const source = input.source || 'manual_review';
    const rule = merchantName ? await findMatchingRule(userId, merchantName, amount) : null;
    const category = rule?.category || input.category || 'Other';
    const type = rule?.transaction_type || input.type || 'expense';
    const transactionHash = normalizeHash(input.transactionHash || input.transaction_hash)
        || buildCandidateHash(userId, { amount, date, description, merchant_name: merchantName, source });
    const duplicate = await findDuplicateTransaction(userId, {
        transaction_hash: transactionHash,
        amount,
        date,
        description,
        merchant_name: merchantName,
    });

    const payload = {
        user_id: userId,
        source,
        status: 'pending',
        description,
        amount,
        date,
        type,
        category,
        merchant_name: merchantName,
        raw_payload: input.rawPayload || input.raw_payload || input,
        confidence: input.confidence ?? (duplicate ? 0.45 : rule ? 0.95 : 0.75),
        transaction_hash: transactionHash,
        duplicate_transaction_id: duplicate?.id || null,
        matched_rule_id: rule?.id || null,
        import_session_id: input.importSessionId || input.import_session_id || null,
    };

    const { data, error } = await supabase
        .from('transaction_candidates')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;
    await invalidateUserAICacheIfEnabled(userId);

    return {
        candidate: data as TransactionCandidate,
        duplicate: !!duplicate,
        duplicateTransaction: duplicate,
        matchedRule: rule,
    };
}

export async function createDetectedCandidate(userId: string, data: DetectedTransactionInput) {
    const storeName = compact(data.merchantName, data.merchant_name, data.storeName, data.name, data.serviceName, data.hostname, data.description, 'Detected Purchase')!;
    const productName = compact(data.productName, data.serviceName, data.name, data.type);
    const description = compact(data.description, data.notes, `${storeName}${productName && productName !== storeName ? ` - ${productName}` : ''}`)!;
    const isRecurring = data.isSubscription || data.type === 'subscription' || data.type === 'trial';
    const confidence = data.confidence ?? data.detectionConfidence ?? (data.amount || data.price ? 0.9 : 0.6);

    return createTransactionCandidate(userId, {
        source: 'extension',
        description,
        amount: data.amount ?? data.price ?? 0,
        date: data.detectedAt || data.date,
        type: data.type === 'income' ? 'income' : 'expense',
        category: data.category || (isRecurring ? 'Subscriptions' : 'Shopping'),
        merchantName: storeName,
        rawPayload: {
            ...data,
            ingestion: 'auto_transaction_capture',
            normalizedCurrency: data.currency,
            detectionSignals: data.detectionSignals || [],
        },
        confidence,
        transactionHash: data.transactionHash || data.idempotencyKey,
    });
}

export async function listTransactionCandidates(userId: string, options: Record<string, any> = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 25));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('transaction_candidates')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

    if (options.status) query = query.eq('status', options.status);
    if (options.source) query = query.eq('source', options.source);
    if (options.duplicate === 'true' || options.duplicate === true) query = query.not('duplicate_transaction_id', 'is', null);
    if (options.startDate) query = query.gte('date', normalizeDate(options.startDate));
    if (options.endDate) query = query.lte('date', normalizeDate(options.endDate));
    if (options.search) {
        const search = String(options.search).replace(/[%_]/g, '\\$&');
        query = query.or(`description.ilike.%${search}%,merchant_name.ilike.%${search}%,category.ilike.%${search}%`);
    }

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) throw error;

    return {
        data: asRows(data) as TransactionCandidate[],
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
        },
    };
}

export async function getPendingCandidate(userId: string, id: string) {
    const { data, error } = await supabase
        .from('transaction_candidates')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data as TransactionCandidate | null;
}

export async function approveCandidate(userId: string, id: string, updates: ApproveCandidateInput = {}) {
    const candidate = await getPendingCandidate(userId, id);
    if (!candidate) return null;
    if (candidate.status === 'approved' && candidate.approved_transaction_id) {
        return { candidate, transaction: await getMoneyTransaction(userId, candidate.approved_transaction_id), alreadyProcessed: true };
    }
    if (candidate.status !== 'pending') {
        return { candidate, transaction: null, alreadyProcessed: true };
    }

    const transaction = await createMoneyTransaction({
        user_id: userId,
        date: normalizeDate(updates.date || candidate.date),
        description: updates.description || candidate.description,
        amount: updates.amount ?? candidate.amount,
        type: updates.type || candidate.type || 'expense',
        category: updates.category || candidate.category || 'Other',
        source: `${candidate.source}_approved`,
        confidence: candidate.confidence,
        store_name: updates.merchantName || candidate.merchant_name || null,
        product_name: null,
        store_url: null,
        notes: candidate.transaction_hash ? `${HASH_NOTE_PREFIX}${candidate.transaction_hash}` : null,
    });

    const { data, error } = await supabase
        .from('transaction_candidates')
        .update({
            status: 'approved',
            approved_transaction_id: transaction.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw error;
    await invalidateUserAICacheIfEnabled(userId);
    return { candidate: data as TransactionCandidate, transaction, alreadyProcessed: false };
}

export async function rejectCandidate(userId: string, id: string) {
    const { data, error } = await supabase
        .from('transaction_candidates')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .select()
        .maybeSingle();

    if (error) throw error;
    await invalidateUserAICacheIfEnabled(userId);
    return data as TransactionCandidate | null;
}

export async function mergeCandidate(userId: string, id: string, transactionId: string) {
    const existing = await getMoneyTransaction(userId, transactionId);
    if (!existing) return null;

    const { data, error } = await supabase
        .from('transaction_candidates')
        .update({
            status: 'merged',
            duplicate_transaction_id: transactionId,
            approved_transaction_id: transactionId,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .select()
        .maybeSingle();

    if (error) throw error;
    await invalidateUserAICacheIfEnabled(userId);
    return { candidate: data as TransactionCandidate | null, transaction: existing };
}

export async function bulkCandidates(userId: string, input: BulkCandidateInput) {
    const results = [];
    for (const id of input.ids) {
        try {
            if (input.action === 'approve') results.push({ id, success: true, result: await approveCandidate(userId, id) });
            else if (input.action === 'reject') results.push({ id, success: true, result: await rejectCandidate(userId, id) });
            else {
                const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
                if (input.action === 'category') updates.category = input.updates?.category || 'Other';
                if (input.action === 'type') updates.type = input.updates?.type || 'expense';
                if (input.action === 'date') updates.date = normalizeDate(input.updates?.date);
                const { data, error } = await supabase
                    .from('transaction_candidates')
                    .update(updates)
                    .eq('id', id)
                    .eq('user_id', userId)
                    .eq('status', 'pending')
                    .select()
                    .maybeSingle();
                if (error) throw error;
                results.push({ id, success: true, result: data });
            }
        } catch (error) {
            results.push({ id, success: false, error: error instanceof Error ? error.message : String(error) });
        }
    }

    await invalidateUserAICacheIfEnabled(userId);
    return results;
}

export async function createMerchantRule(userId: string, input: MerchantRuleInput) {
    const payload = {
        user_id: userId,
        merchant_pattern: input.merchantPattern || input.merchant_pattern,
        match_type: input.matchType || input.match_type || 'contains',
        category: input.category,
        transaction_type: input.transactionType || input.transaction_type || 'expense',
        amount_min: input.amountMin ?? input.amount_min ?? null,
        amount_max: input.amountMax ?? input.amount_max ?? null,
        priority: input.priority ?? 100,
        enabled: input.enabled ?? true,
    };

    const { data, error } = await supabase
        .from('merchant_rules')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;
    await invalidateUserAICacheIfEnabled(userId);
    return data;
}

export async function updateMerchantRule(userId: string, id: string, input: Partial<MerchantRuleInput>) {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.merchantPattern || input.merchant_pattern) payload.merchant_pattern = input.merchantPattern || input.merchant_pattern;
    if (input.matchType || input.match_type) payload.match_type = input.matchType || input.match_type;
    if (input.category !== undefined) payload.category = input.category;
    if (input.transactionType || input.transaction_type) payload.transaction_type = input.transactionType || input.transaction_type;
    if (input.amountMin !== undefined || input.amount_min !== undefined) payload.amount_min = input.amountMin ?? input.amount_min ?? null;
    if (input.amountMax !== undefined || input.amount_max !== undefined) payload.amount_max = input.amountMax ?? input.amount_max ?? null;
    if (input.priority !== undefined) payload.priority = input.priority;
    if (input.enabled !== undefined) payload.enabled = input.enabled;

    const { data, error } = await supabase
        .from('merchant_rules')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

    if (error) throw error;
    await invalidateUserAICacheIfEnabled(userId);
    return data;
}

export async function deleteMerchantRule(userId: string, id: string) {
    const { error } = await supabase
        .from('merchant_rules')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw error;
    await invalidateUserAICacheIfEnabled(userId);
}

export async function updateApprovedTransaction(userId: string, transactionId: string, updates: Record<string, unknown>) {
    return updateMoneyTransaction(userId, transactionId, updates);
}
