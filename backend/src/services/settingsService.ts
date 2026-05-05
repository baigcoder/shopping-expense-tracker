import admin from 'firebase-admin';
import prisma from '../config/prisma.js';
import { supabase } from '../config/supabase.js';
import cacheService from './redisCacheService.js';
import openRouterService from './openRouterService.js';
import {
    SettingsAIInput,
    SettingsPreferencesInput,
    SettingsProfileInput,
} from '../validators/schemas.js';

export interface SettingsUser {
    id: string;
    email: string;
    supabaseId: string;
}

export interface UserSettings {
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

export const DEFAULT_USER_SETTINGS: UserSettings = {
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
    monthlyReport: true,
    soundEnabled: true,
    soundVolume: 70,
    theme: 'light',
    reducedMotion: false,
    currency: 'USD',
    aiLiveEnabled: true,
    aiMemoryEnabled: true,
    aiAutoRefresh: true,
    aiIncludePendingCandidates: true,
};

const asRows = (value: unknown): any[] => Array.isArray(value) ? value : [];
export const getSettingsUserId = (user?: SettingsUser | null) => user?.supabaseId || user?.id || '';

const toCamelSettings = (row: any): UserSettings => ({
    emailNotifications: row?.email_notifications ?? DEFAULT_USER_SETTINGS.emailNotifications,
    pushNotifications: row?.push_notifications ?? DEFAULT_USER_SETTINGS.pushNotifications,
    weeklyReport: row?.weekly_report ?? DEFAULT_USER_SETTINGS.weeklyReport,
    monthlyReport: row?.monthly_report ?? DEFAULT_USER_SETTINGS.monthlyReport,
    soundEnabled: row?.sound_enabled ?? DEFAULT_USER_SETTINGS.soundEnabled,
    soundVolume: Number(row?.sound_volume ?? DEFAULT_USER_SETTINGS.soundVolume),
    theme: row?.theme === 'dark' ? 'dark' : 'light',
    reducedMotion: row?.reduced_motion ?? DEFAULT_USER_SETTINGS.reducedMotion,
    currency: String(row?.currency || DEFAULT_USER_SETTINGS.currency).toUpperCase(),
    aiLiveEnabled: row?.ai_live_enabled ?? DEFAULT_USER_SETTINGS.aiLiveEnabled,
    aiMemoryEnabled: row?.ai_memory_enabled ?? DEFAULT_USER_SETTINGS.aiMemoryEnabled,
    aiAutoRefresh: row?.ai_auto_refresh ?? DEFAULT_USER_SETTINGS.aiAutoRefresh,
    aiIncludePendingCandidates: row?.ai_include_pending_candidates ?? DEFAULT_USER_SETTINGS.aiIncludePendingCandidates,
    updatedAt: row?.updated_at,
});

const toSettingsRow = (userId: string, settings: Partial<UserSettings> = {}) => ({
    user_id: userId,
    email_notifications: settings.emailNotifications,
    push_notifications: settings.pushNotifications,
    weekly_report: settings.weeklyReport,
    monthly_report: settings.monthlyReport,
    sound_enabled: settings.soundEnabled,
    sound_volume: settings.soundVolume,
    theme: settings.theme,
    reduced_motion: settings.reducedMotion,
    currency: settings.currency?.toUpperCase(),
    ai_live_enabled: settings.aiLiveEnabled,
    ai_memory_enabled: settings.aiMemoryEnabled,
    ai_auto_refresh: settings.aiAutoRefresh,
    ai_include_pending_candidates: settings.aiIncludePendingCandidates,
    updated_at: new Date().toISOString(),
});

async function getFirebaseProfile(user: SettingsUser) {
    try {
        const firebaseUser = await admin.auth().getUser(user.supabaseId || user.id);
        return {
            id: firebaseUser.uid,
            email: firebaseUser.email || user.email,
            name: firebaseUser.displayName || null,
            avatarUrl: firebaseUser.photoURL || null,
        };
    } catch {
        return {
            id: user.supabaseId || user.id,
            email: user.email,
            name: null,
            avatarUrl: null,
        };
    }
}

async function getStoredProfile(user: SettingsUser) {
    try {
        const dbUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: user.id },
                    { supabaseId: user.supabaseId },
                    { email: user.email },
                ],
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                currency: true,
                createdAt: true,
            },
        });
        if (dbUser) return dbUser;
    } catch (error) {
        console.warn('Settings profile database lookup failed:', error instanceof Error ? error.message : error);
    }

    const firebaseProfile = await getFirebaseProfile(user);
    return {
        ...firebaseProfile,
        currency: DEFAULT_USER_SETTINGS.currency,
        createdAt: null,
    };
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    if (data) return toCamelSettings(data);

    const { data: created, error: createError } = await supabase
        .from('user_settings')
        .upsert(toSettingsRow(userId, DEFAULT_USER_SETTINGS), { onConflict: 'user_id' })
        .select()
        .single();

    if (createError) throw createError;
    return toCamelSettings(created);
}

export async function saveUserSettings(userId: string, updates: Partial<UserSettings>) {
    const current = await getUserSettings(userId);
    const next = { ...current, ...updates };
    const { data, error } = await supabase
        .from('user_settings')
        .upsert(toSettingsRow(userId, next), { onConflict: 'user_id' })
        .select()
        .single();

    if (error) throw error;
    return toCamelSettings(data);
}

export async function getSettingsDashboard(user: SettingsUser, requestInfo: { ip?: string; userAgent?: string }) {
    const userId = getSettingsUserId(user);
    const [profile, preferences, cacheStats] = await Promise.all([
        getStoredProfile(user),
        getUserSettings(userId),
        cacheService.getCacheStats(),
    ]);

    return {
        profile: {
            ...profile,
            currency: preferences.currency || profile.currency || DEFAULT_USER_SETTINGS.currency,
        },
        preferences,
        ai: {
            status: openRouterService.isConfigured() && preferences.aiLiveEnabled ? 'ready' : 'degraded',
            liveEnabled: preferences.aiLiveEnabled,
            memoryEnabled: preferences.aiMemoryEnabled,
            autoRefresh: preferences.aiAutoRefresh,
            includePendingCandidates: preferences.aiIncludePendingCandidates,
            provider: {
                configured: openRouterService.isConfigured(),
                error: openRouterService.getConfigurationError(),
                models: openRouterService.getModelMap(),
            },
            cache: cacheStats,
        },
        session: {
            email: user.email,
            ip: requestInfo.ip || null,
            userAgent: requestInfo.userAgent || null,
            checkedAt: new Date().toISOString(),
        },
    };
}

export async function updateSettingsProfile(user: SettingsUser, input: SettingsProfileInput) {
    const name = input.name?.trim() || null;
    const avatarUrl = input.avatarUrl || input.avatar_url || null;

    if (user.supabaseId) {
        try {
            await admin.auth().updateUser(user.supabaseId, {
                ...(name !== undefined ? { displayName: name || undefined } : {}),
                ...(avatarUrl ? { photoURL: avatarUrl } : {}),
            });
        } catch (error) {
            console.warn('Firebase profile update failed:', error instanceof Error ? error.message : error);
        }
    }

    try {
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: user.id },
                    { supabaseId: user.supabaseId },
                    { email: user.email },
                ],
            },
        });

        const saved = existing
            ? await prisma.user.update({
                where: { id: existing.id },
                data: { name, ...(avatarUrl ? { avatarUrl } : {}) },
                select: { id: true, email: true, name: true, avatarUrl: true, currency: true, createdAt: true },
            })
            : await prisma.user.create({
                data: {
                    supabaseId: user.supabaseId,
                    email: user.email,
                    name,
                    avatarUrl,
                },
                select: { id: true, email: true, name: true, avatarUrl: true, currency: true, createdAt: true },
            });

        return saved;
    } catch (error) {
        console.warn('Settings profile persistence failed:', error instanceof Error ? error.message : error);
        const firebaseProfile = await getFirebaseProfile(user);
        return {
            ...firebaseProfile,
            name: name || firebaseProfile.name,
            avatarUrl: avatarUrl || firebaseProfile.avatarUrl,
            currency: DEFAULT_USER_SETTINGS.currency,
            createdAt: null,
        };
    }
}

export function normalizePreferenceInput(input: SettingsPreferencesInput): Partial<UserSettings> {
    return {
        emailNotifications: input.emailNotifications ?? input.email_notifications,
        pushNotifications: input.pushNotifications ?? input.push_notifications,
        weeklyReport: input.weeklyReport ?? input.weekly_report,
        monthlyReport: input.monthlyReport ?? input.monthly_report,
        soundEnabled: input.soundEnabled ?? input.sound_enabled,
        soundVolume: input.soundVolume ?? input.sound_volume,
        theme: input.theme,
        reducedMotion: input.reducedMotion ?? input.reduced_motion,
        currency: input.currency?.toUpperCase(),
    };
}

export function normalizeAIInput(input: SettingsAIInput): Partial<UserSettings> {
    return {
        aiLiveEnabled: input.aiLiveEnabled ?? input.ai_live_enabled,
        aiMemoryEnabled: input.aiMemoryEnabled ?? input.ai_memory_enabled,
        aiAutoRefresh: input.aiAutoRefresh ?? input.ai_auto_refresh,
        aiIncludePendingCandidates: input.aiIncludePendingCandidates ?? input.ai_include_pending_candidates,
    };
}

export async function updateSettingsPreferences(user: SettingsUser, input: SettingsPreferencesInput) {
    const userId = getSettingsUserId(user);
    const preferences = await saveUserSettings(userId, normalizePreferenceInput(input));

    if (input.currency) {
        try {
            await prisma.user.updateMany({
                where: { OR: [{ id: user.id }, { supabaseId: user.supabaseId }, { email: user.email }] },
                data: { currency: input.currency.toUpperCase() },
            });
        } catch (error) {
            console.warn('Currency profile update failed:', error instanceof Error ? error.message : error);
        }
    }

    return preferences;
}

export async function updateSettingsAI(userId: string, input: SettingsAIInput) {
    const settings = await saveUserSettings(userId, normalizeAIInput(input));
    await cacheService.invalidateUserCache(userId);
    if (settings.aiMemoryEnabled === false) {
        await cacheService.clearChatHistory(userId);
    }
    return settings;
}

export async function refreshSettingsAI(userId: string) {
    await cacheService.invalidateUserCache(userId);
    const { getFinancialSummary } = await import('./financialContextService.js');
    const summary = await getFinancialSummary(userId, { force: true });
    return {
        refreshedAt: new Date().toISOString(),
        summary,
    };
}

export async function testSettingsAI(userId: string) {
    const settings = await getUserSettings(userId);
    if (!settings.aiLiveEnabled) {
        return {
            ok: false,
            status: 'disabled',
            model: 'local-fallback',
            message: 'Live AI is disabled in Settings.',
        };
    }

    if (!openRouterService.isConfigured()) {
        return {
            ok: false,
            status: 'not_configured',
            model: 'local-fallback',
            message: openRouterService.getConfigurationError(),
        };
    }

    try {
        const response = await openRouterService.chatCompletion(
            [
                { role: 'system', content: 'Return a short health-check response for Cashly AI.' },
                { role: 'user', content: 'Say ready.' },
            ],
            { useCase: 'fastChat', maxTokens: 20, temperature: 0, user: userId }
        );

        return {
            ok: true,
            status: 'ready',
            model: response.model,
            message: response.content,
        };
    } catch (error) {
        return {
            ok: false,
            status: 'error',
            model: 'local-fallback',
            message: error instanceof Error ? error.message : String(error),
        };
    }
}

export async function requestPasswordReset(user: SettingsUser) {
    const email = user.email;
    if (!email) throw new Error('No email address is available for this account.');

    const apiKey = process.env.FIREBASE_API_KEY
        || process.env.FIREBASE_WEB_API_KEY
        || process.env.VITE_FIREBASE_API_KEY
        || 'AIzaSyAbveJm46vlt1CKqEdYQE-c21QbZBrNpEY';
    if (apiKey) {
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
        });
        if (!response.ok) {
            throw new Error(await response.text());
        }
        return { delivery: 'email_sent', email };
    }

    await admin.auth().generatePasswordResetLink(email);
    return {
        delivery: 'link_generated',
        email,
        message: 'Password reset link generated. Configure FIREBASE_API_KEY on the backend to send the email automatically.',
    };
}

export async function getSessionMetadata(user: SettingsUser, requestInfo: { ip?: string; userAgent?: string }) {
    return {
        sessions: [
            {
                id: 'current',
                email: user.email,
                ip: requestInfo.ip || null,
                userAgent: requestInfo.userAgent || null,
                current: true,
                lastSeenAt: new Date().toISOString(),
            },
        ],
    };
}

export async function invalidateUserAICacheIfEnabled(userId: string) {
    const settings = await getUserSettings(userId);
    if (settings.aiAutoRefresh) {
        await cacheService.invalidateUserCache(userId);
    }
}

export async function listPendingCandidatesForContext(userId: string) {
    const { data, error } = await supabase
        .from('transaction_candidates')
        .select('description, amount, date, type, category, merchant_name, confidence')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) return [];
    return asRows(data);
}
