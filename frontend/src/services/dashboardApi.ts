import api from './api';

export interface DashboardSummary {
    generatedAt: string;
    stats: {
        totalBalance: number;
        totalIncome: number;
        totalExpense: number;
        monthlyIncome: number;
        monthlyExpense: number;
        transactionsToday: number;
        transactionCount: number;
        cardCount: number;
        healthScore: number;
        budgetUsed: number;
        budgetTotal: number;
        budgetPercentage: number;
        expenseTrend: number;
    };
    chart: Array<{ date: string; day: string; income: number; expense: number }>;
    recentTransactions: any[];
    categoryBreakdown: Array<{ name: string; amount: number; count: number }>;
    merchantBreakdown: Array<{ name: string; amount: number; count: number }>;
    inbox: { pendingCount: number; duplicateWarnings: number; candidates: any[] };
    cashflow: { upcoming: any[]; totalEvents: number };
    subscriptions: {
        activeCount: number;
        monthlyCost: number;
        trialsEndingSoon: any[];
        priceIncreases: any[];
        unusedAlerts: any[];
    };
    extensionHealth: {
        sites: any[];
        recentEvents: any[];
        queuedSyncs: number;
        failedDetections: number;
        lastSuccessfulSync: string | null;
        permissionStatus: string;
    };
    coach: { plan?: any; actions?: any[] } | null;
    reports: { recentExports: any[]; exportCount: number };
    emptyState: {
        hasTransactions: boolean;
        nextActions: Array<{ id: string; label: string; path: string }>;
    };
}

export interface OnboardingStatus {
    completedStepIds: string[];
    dismissedExtensionPrompt: boolean;
    completed: boolean;
    progress: number;
    steps: Array<{ id: string; label: string; path: string; completed: boolean }>;
    updatedAt: string | null;
}

const unwrap = <T>(response: any): T => response.data?.data ?? response.data;

type CacheEntry<T> = { value: T; expiresAt: number };
const CACHE_MS = 5_000;
let summaryCache: CacheEntry<DashboardSummary> | null = null;
let summaryInFlight: Promise<DashboardSummary> | null = null;
let onboardingCache: CacheEntry<OnboardingStatus> | null = null;
let onboardingInFlight: Promise<OnboardingStatus> | null = null;

const clearSummaryCache = () => {
    summaryCache = null;
    summaryInFlight = null;
};

const clearOnboardingCache = () => {
    onboardingCache = null;
    onboardingInFlight = null;
};

const cachedGet = async <T>(
    cache: CacheEntry<T> | null,
    setCache: (entry: CacheEntry<T> | null) => void,
    inFlight: Promise<T> | null,
    setInFlight: (promise: Promise<T> | null) => void,
    request: () => Promise<T>,
) => {
    const now = Date.now();
    if (cache && cache.expiresAt > now) return cache.value;
    if (inFlight) return inFlight;

    const promise = request()
        .then((value) => {
            setCache({ value, expiresAt: Date.now() + CACHE_MS });
            return value;
        })
        .finally(() => setInFlight(null));

    setInFlight(promise);
    return promise;
};

export const dashboardApi = {
    summary: async (options?: { force?: boolean }) => {
        if (options?.force) {
            clearSummaryCache();
        }

        return cachedGet(
            summaryCache,
            (entry) => { summaryCache = entry; },
            summaryInFlight,
            (promise) => { summaryInFlight = promise; },
            async () => unwrap<DashboardSummary>(await api.get('/dashboard/summary')),
        );
    },
    invalidate: clearSummaryCache,
};

export const onboardingApi = {
    status: async (options?: { force?: boolean }) => {
        if (options?.force) {
            clearOnboardingCache();
        }

        return cachedGet(
            onboardingCache,
            (entry) => { onboardingCache = entry; },
            onboardingInFlight,
            (promise) => { onboardingInFlight = promise; },
            async () => unwrap<OnboardingStatus>(await api.get('/onboarding/status')),
        );
    },
    update: async (payload: Record<string, any>) => {
        clearOnboardingCache();
        return unwrap<OnboardingStatus>(await api.patch('/onboarding/status', payload));
    },
    invalidate: clearOnboardingCache,
};

export default dashboardApi;
