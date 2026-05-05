import api from './api';

export interface UserSettingsPreferences {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
    soundEnabled: boolean;
    soundVolume: number;
    theme: 'light' | 'dark';
    reducedMotion: boolean;
    currency: string;
    aiLiveEnabled: boolean;
    aiMemoryEnabled: boolean;
    aiAutoRefresh: boolean;
    aiIncludePendingCandidates: boolean;
    updatedAt?: string;
}

export interface SettingsDashboard {
    profile: {
        id: string;
        email: string;
        name?: string | null;
        avatarUrl?: string | null;
        currency?: string;
        createdAt?: string | null;
    };
    preferences: UserSettingsPreferences;
    ai: {
        status: string;
        liveEnabled: boolean;
        memoryEnabled: boolean;
        autoRefresh: boolean;
        includePendingCandidates: boolean;
        provider: {
            configured: boolean;
            error?: string | null;
            models: Record<string, string>;
        };
        cache: {
            connected: boolean;
            memory?: string;
        };
    };
    session: {
        email: string;
        ip?: string | null;
        userAgent?: string | null;
        checkedAt: string;
    };
}

const unwrap = <T>(response: { data: { data: T } }) => response.data.data;

let settingsCache: { value: SettingsDashboard; expiresAt: number } | null = null;
let settingsInFlight: Promise<SettingsDashboard> | null = null;
const SETTINGS_CACHE_MS = 10_000;

const clearSettingsCache = () => {
    settingsCache = null;
    settingsInFlight = null;
};

const getSettings = async (force = false) => {
    const now = Date.now();
    if (!force && settingsCache && settingsCache.expiresAt > now) {
        return settingsCache.value;
    }

    if (!force && settingsInFlight) {
        return settingsInFlight;
    }

    settingsInFlight = api.get('/settings')
        .then((response) => {
            const value = unwrap<SettingsDashboard>(response);
            settingsCache = { value, expiresAt: Date.now() + SETTINGS_CACHE_MS };
            return value;
        })
        .finally(() => {
            settingsInFlight = null;
        });

    return settingsInFlight;
};

export const settingsApi = {
    get: getSettings,
    updateProfile: async (payload: { name?: string | null; avatarUrl?: string | null }) => {
        clearSettingsCache();
        return unwrap(await api.patch('/settings/profile', payload));
    },
    updatePreferences: async (payload: Partial<UserSettingsPreferences>) => {
        clearSettingsCache();
        return unwrap<UserSettingsPreferences>(await api.patch('/settings/preferences', payload));
    },
    updateAI: async (payload: Partial<UserSettingsPreferences>) => {
        clearSettingsCache();
        return unwrap<UserSettingsPreferences>(await api.patch('/settings/ai', payload));
    },
    refreshAI: async () => unwrap(await api.post('/settings/ai/refresh')),
    testAI: async () => unwrap<{ ok: boolean; status: string; model: string; message?: string }>(await api.post('/settings/ai/test')),
    clearChatMemory: async () => (await api.post('/ai/chat/clear')).data,
    requestPasswordReset: async () => unwrap(await api.post('/settings/security/password-reset')),
    getSessions: async () => unwrap(await api.get('/settings/security/sessions')),
    requestResetOtp: async (category: string) => (await api.post('/settings/data/request-reset-otp', { category })).data,
    confirmReset: async (otp: string) => (await api.post('/settings/data/confirm-reset', { otp })).data,
};

export default settingsApi;
