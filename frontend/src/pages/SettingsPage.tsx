// Settings: profile, preferences, Ask Cashly, sign-in and data deletion around the shared SettingsView (the demo renders the same view).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore, useUIStore } from '../store/useStore';
import { useSound } from '@/hooks/useSound';
import { soundManager } from '@/lib/sounds';
import { currencyService, SUPPORTED_CURRENCIES } from '../services/currencyService';
import settingsApi, { type UserSettingsPreferences } from '../services/settingsApi';
import { SettingsView } from '../features/settings/SettingsView';

const defaultPreferences: UserSettingsPreferences = {
    emailNotifications: true, pushNotifications: true, weeklyReport: true, monthlyReport: true,
    soundEnabled: true, soundVolume: 70, theme: 'light', reducedMotion: false, currency: 'USD',
    aiLiveEnabled: true, aiMemoryEnabled: true, aiAutoRefresh: true, aiIncludePendingCandidates: true,
};

export const SettingsPage = () => {
    const { user, logout, setUser } = useAuthStore();
    const { setCurrency: setStoreCurrency, setTheme, reducedMotion: storeReducedMotion, toggleReducedMotion } = useUIStore();
    const navigate = useNavigate();
    const sound = useSound();
    const [preferences, setPreferences] = useState<UserSettingsPreferences>(defaultPreferences);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');

    useEffect(() => {
        let cancelled = false;
        settingsApi.get().then((data) => {
            if (cancelled) return;
            setPreferences(data.preferences);
            setName(data.profile.name || user?.name || '');
            setEmail(data.profile.email || user?.email || '');
            // Keep the global sound, currency and theme singletons in step with the saved settings.
            soundManager.setEnabled(data.preferences.soundEnabled);
            soundManager.setVolume((data.preferences.soundVolume ?? 70) / 100);
            currencyService.setCurrency(data.preferences.currency);
            setStoreCurrency(data.preferences.currency);
            setTheme(data.preferences.theme);
        }).catch(() => undefined);
        return () => { cancelled = true; };
    }, [setStoreCurrency, setTheme, user?.email, user?.name]);

    const save = async (updates: Partial<UserSettingsPreferences>, ai: boolean) => {
        const before = preferences;
        setPreferences({ ...preferences, ...updates });
        try {
            const saved = ai ? await settingsApi.updateAI(updates) : await settingsApi.updatePreferences(updates);
            setPreferences(saved);
            if (updates.soundEnabled !== undefined) sound.setEnabled(saved.soundEnabled);
            if (updates.currency) {
                currencyService.setCurrency(saved.currency);
                setStoreCurrency(saved.currency);
                if (user) setUser({ ...user, currency: saved.currency });
            }
            if (updates.theme) {
                setTheme(saved.theme);
                document.documentElement.classList.toggle('dark', saved.theme === 'dark');
            }
            if (updates.reducedMotion !== undefined && updates.reducedMotion !== storeReducedMotion) toggleReducedMotion();
            toast.success('Saved', { duration: 1500 });
        } catch {
            setPreferences(before);
            toast.error('That did not save. Try again.');
        }
    };

    return (
        <SettingsView
            key={name}
            name={name}
            email={email}
            prefs={preferences}
            currencies={SUPPORTED_CURRENCIES}
            onSaveName={async (n) => {
                try {
                    const profile = await settingsApi.updateProfile({ name: n }) as { name?: string; avatarUrl?: string };
                    setName(profile.name || n);
                    if (user) setUser({ ...user, name: profile.name || n, avatarUrl: profile.avatarUrl || user.avatarUrl });
                    toast.success('Name saved');
                } catch { toast.error('Could not save your name.'); }
            }}
            onPref={(u) => save(u, false)}
            onAI={(u) => save(u, true)}
            onClearChat={async () => {
                try { await settingsApi.clearChatMemory(); toast.success('Conversation history cleared'); }
                catch { toast.error('Could not clear it. Try again.'); }
            }}
            onPasswordReset={async () => {
                try { await settingsApi.requestPasswordReset(); toast.success(`Reset link sent to ${email || 'your email'}`); }
                catch { toast.error('Could not send the reset link.'); }
            }}
            onSignOut={async () => {
                try { await logout(); navigate('/login'); }
                catch { toast.error('Sign out failed. Try again.'); }
            }}
            onRequestCode={async (category) => {
                try { await settingsApi.requestResetOtp(category); toast.success(`Code sent to ${email || 'your email'}`); return true; }
                catch { toast.error('Could not send the code.'); return false; }
            }}
            onConfirmDelete={async (code) => {
                try {
                    await settingsApi.confirmReset(code);
                    await settingsApi.refreshAI().catch(() => undefined);
                    toast.success('Deleted');
                    return true;
                } catch { toast.error('That code did not work or has expired.'); return false; }
            }}
        />
    );
};

export default SettingsPage;
