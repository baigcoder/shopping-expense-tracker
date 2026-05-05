import api from './api';

type CacheEntry<T> = { value: T; expiresAt: number };
const READ_CACHE_MS = 5_000;
const readCache = new Map<string, CacheEntry<any>>();
const readInFlight = new Map<string, Promise<any>>();

const cachedRead = async <T>(key: string, request: () => Promise<T>): Promise<T> => {
    const cached = readCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const inflight = readInFlight.get(key);
    if (inflight) return inflight;

    const promise = request()
        .then((value) => {
            readCache.set(key, { value, expiresAt: Date.now() + READ_CACHE_MS });
            return value;
        })
        .finally(() => readInFlight.delete(key));

    readInFlight.set(key, promise);
    return promise;
};

const clearReadCache = (prefix?: string) => {
    if (!prefix) {
        readCache.clear();
        readInFlight.clear();
        return;
    }

    [...readCache.keys()].forEach((key) => {
        if (key.startsWith(prefix)) readCache.delete(key);
    });
    [...readInFlight.keys()].forEach((key) => {
        if (key.startsWith(prefix)) readInFlight.delete(key);
    });
};

export interface TransactionCandidate {
    id: string;
    source: string;
    status: 'pending' | 'approved' | 'rejected' | 'merged';
    description: string;
    amount: number;
    date: string;
    type: 'income' | 'expense';
    category: string;
    merchant_name?: string;
    confidence: number;
    duplicate_transaction_id?: string | null;
    matched_rule_id?: string | null;
    created_at?: string;
}

export interface MerchantRule {
    id: string;
    merchant_pattern: string;
    match_type: 'exact' | 'contains' | 'starts_with' | 'regex';
    category: string;
    transaction_type: 'income' | 'expense';
    amount_min?: number | null;
    amount_max?: number | null;
    priority: number;
    enabled: boolean;
}

export const transactionInboxApi = {
    list: async (params: Record<string, any> = {}) => {
        const key = `inbox:${JSON.stringify(params)}`;
        return cachedRead(key, async () => {
            const { data } = await api.get('/transaction-inbox', { params });
            return data;
        });
    },
    approve: async (id: string, updates: Partial<TransactionCandidate> = {}) => {
        clearReadCache('inbox:');
        const { data } = await api.post(`/transaction-inbox/${id}/approve`, updates);
        return data;
    },
    reject: async (id: string) => {
        clearReadCache('inbox:');
        const { data } = await api.post(`/transaction-inbox/${id}/reject`);
        return data;
    },
    merge: async (id: string, transactionId: string) => {
        clearReadCache('inbox:');
        const { data } = await api.post(`/transaction-inbox/${id}/merge`, { transactionId });
        return data;
    },
    bulk: async (ids: string[], action: string, updates?: Record<string, any>) => {
        clearReadCache('inbox:');
        const { data } = await api.post('/transaction-inbox/bulk', { ids, action, updates });
        return data;
    },
};

export const merchantRulesApi = {
    list: async (): Promise<MerchantRule[]> => {
        const { data } = await api.get('/merchant-rules');
        return data.data || [];
    },
    create: async (rule: Partial<MerchantRule> & { merchantPattern?: string }) => {
        const { data } = await api.post('/merchant-rules', rule);
        return data.data;
    },
    update: async (id: string, rule: Partial<MerchantRule>) => {
        const { data } = await api.patch(`/merchant-rules/${id}`, rule);
        return data.data;
    },
    delete: async (id: string) => {
        const { data } = await api.delete(`/merchant-rules/${id}`);
        return data;
    },
};

export const importsApi = {
    createSession: async (payload: {
        fileName: string;
        fileType?: 'pdf' | 'csv' | 'excel' | 'image' | 'docx' | 'unknown';
        rows: any[];
    }) => {
        const { data } = await api.post('/imports/sessions', payload);
        return data.data;
    },
    commitSession: async (id: string, rowIds?: string[]) => {
        const { data } = await api.post(`/imports/sessions/${id}/commit`, { rowIds });
        return data.data;
    },
};

export const featureExpansionApi = {
    cashflowCalendar: async () => {
        const { data } = await api.get('/cashflow-calendar');
        return data.data || [];
    },
    subscriptionCommandCenter: async () => {
        const { data } = await api.get('/subscription-command-center');
        return data.data;
    },
    extensionHealth: async () => {
        return cachedRead('extension-health', async () => {
            const { data } = await api.get('/extension-health');
            return data.data;
        });
    },
    recordExtensionHealthEvent: async (payload: Record<string, any>) => {
        const { data } = await api.post('/extension-health/events', payload);
        return data.data;
    },
    generateReport: async (payload: Record<string, any>) => {
        const { data } = await api.post('/reports/generate', payload);
        return data.data;
    },
    reportExports: async () => {
        const { data } = await api.get('/reports/exports');
        return data.data || [];
    },
    currentCoach: async () => {
        return cachedRead('coach-current', async () => {
            const { data } = await api.get('/coach/current');
            return data.data;
        });
    },
    generateCoach: async () => {
        clearReadCache('coach-current');
        const { data } = await api.post('/coach/generate-weekly');
        return data.data;
    },
    updateCoachAction: async (id: string, status: 'pending' | 'done' | 'skipped') => {
        clearReadCache('coach-current');
        const { data } = await api.patch(`/coach/actions/${id}`, { status });
        return data.data;
    },
};
