import React, { useEffect, useState } from 'react';
import {
    User, Sliders, Brain, Shield, Database,
    AlertTriangle, LogOut, Key, Copy, Check, FileSpreadsheet,
    FileText, CheckCircle2, Volume2, VolumeX, RefreshCw, Zap, Lock, Activity,
    Trash2, ShieldCheck, ArrowRight, Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore, useUIStore } from '../store/useStore';
import { useSound } from '@/hooks/useSound';
import { soundManager } from '@/lib/sounds';
import { cn } from '@/lib/utils';
import { currencyService, SUPPORTED_CURRENCIES } from '../services/currencyService';
import settingsApi, { SettingsDashboard, UserSettingsPreferences } from '../services/settingsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';

type SettingsTab = 'account' | 'preferences' | 'ai' | 'security' | 'data' | 'danger';

const defaultPreferences: UserSettingsPreferences = {
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

export const SettingsPage = () => {
    const { user, logout, setUser } = useAuthStore();
    const {
        setCurrency: setStoreCurrency,
        setTheme,
        reducedMotion: storeReducedMotion,
        toggleReducedMotion
    } = useUIStore();
    const navigate = useNavigate();
    const sound = useSound();
    const [searchParams, setSearchParams] = useSearchParams();

    // Active tab from URL query params or fallback to 'account'
    const activeTab = (searchParams.get('tab') as SettingsTab) || 'account';
    const setActiveTab = (tab: SettingsTab) => {
        setSearchParams({ tab }, { replace: true });
        sound.playClick();
    };

    // State
    const [dashboard, setDashboard] = useState<SettingsDashboard | null>(null);
    const [preferences, setPreferences] = useState<UserSettingsPreferences>(defaultPreferences);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    // AI State
    const [aiLatencyStatus, setAiLatencyStatus] = useState<{ status: string; ok: boolean; ms?: number; model?: string } | null>(null);
    const [isTestingAI, setIsTestingAI] = useState(false);
    const [isClearingMemory, setIsClearingMemory] = useState(false);

    // Danger Zone State
    const [purgeCategory, setPurgeCategory] = useState<'transactions' | 'budgets' | 'subscriptions' | 'goals'>('transactions');
    const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
    const [purgeConfirmText, setPurgeConfirmText] = useState('');
    const [purgeOtp, setPurgeOtp] = useState('');
    const [purgeStep, setPurgeStep] = useState<1 | 2>(1);
    const [isRequestingOtp, setIsRequestingOtp] = useState(false);
    const [isExecutingPurge, setIsExecutingPurge] = useState(false);

    // Load initial settings
    useEffect(() => {
        let isCancelled = false;

        const loadData = async () => {
            try {
                const data = await settingsApi.get();
                if (isCancelled) return;
                setDashboard(data);
                setPreferences(data.preferences);
                setName(data.profile.name || user?.name || '');
                setEmail(data.profile.email || user?.email || '');

                // Synchronize global sound and currency singletons
                soundManager.setEnabled(data.preferences.soundEnabled);
                soundManager.setVolume((data.preferences.soundVolume ?? 70) / 100);
                currencyService.setCurrency(data.preferences.currency);
                setStoreCurrency(data.preferences.currency);
                setTheme(data.preferences.theme);
            } catch {
                setName(user?.name || '');
                setEmail(user?.email || '');
            }
        };

        loadData();
        return () => { isCancelled = true; };
    }, [setStoreCurrency, setTheme, user?.email, user?.name]);

    // Save preferences auto-mutation
    const handleUpdatePreference = async (updates: Partial<UserSettingsPreferences>) => {
        const optimistic = { ...preferences, ...updates };
        setPreferences(optimistic);

        try {
            const saved = await settingsApi.updatePreferences(updates);
            setPreferences(saved);

            if (updates.soundEnabled !== undefined) {
                sound.setEnabled(saved.soundEnabled);
            }
            if (updates.soundVolume !== undefined) {
                sound.setVolume(saved.soundVolume / 100);
            }
            if (updates.currency) {
                currencyService.setCurrency(saved.currency);
                setStoreCurrency(saved.currency);
                if (user) setUser({ ...user, currency: saved.currency });
            }
            if (updates.theme) {
                setTheme(saved.theme);
                document.documentElement.classList.toggle('dark', saved.theme === 'dark');
            }
            if (updates.reducedMotion !== undefined) {
                if (updates.reducedMotion !== storeReducedMotion) {
                    toggleReducedMotion();
                }
            }

            sound.playClick();
            toast.success('Preference updated', { duration: 2000 });
        } catch {
            setPreferences(preferences);
            toast.error('Could not save preference');
            sound.playError();
        }
    };

    // Save AI auto-mutation
    const handleUpdateAI = async (updates: Partial<UserSettingsPreferences>) => {
        const optimistic = { ...preferences, ...updates };
        setPreferences(optimistic);

        try {
            const saved = await settingsApi.updateAI(updates);
            setPreferences(saved);
            sound.playClick();
            toast.success('AI intelligence settings updated', { duration: 2000 });
        } catch {
            setPreferences(preferences);
            toast.error('Could not update AI setting');
            sound.playError();
        }
    };

    // Profile form submission
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);

        try {
            const profile: any = await settingsApi.updateProfile({ name });
            if (user) {
                setUser({
                    ...user,
                    name: profile.name || name,
                    avatarUrl: profile.avatarUrl || user.avatarUrl,
                    currency: preferences.currency,
                });
            }
            sound.playSuccess();
            toast.success('Identity profile updated successfully');
        } catch {
            sound.playError();
            toast.error('Failed to update profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Copy user ID
    const handleCopyId = () => {
        if (!user?.id) return;
        navigator.clipboard.writeText(user.id);
        setCopiedId(true);
        sound.playClick();
        toast.info('Account ID copied to clipboard');
        setTimeout(() => setCopiedId(false), 2000);
    };

    // Password reset dispatch
    const handlePasswordReset = async () => {
        try {
            sound.playClick();
            const result: any = await settingsApi.requestPasswordReset();
            toast.success(
                result.delivery === 'email_sent'
                    ? 'Password recovery link dispatched to your email'
                    : 'Password reset initiated'
            );
        } catch {
            sound.playError();
            toast.error('Could not initiate password reset');
        }
    };

    // Diagnostic AI Ping
    const handleTestAI = async () => {
        setIsTestingAI(true);
        const startTime = Date.now();
        try {
            const res = await settingsApi.testAI();
            const elapsed = Date.now() - startTime;
            setAiLatencyStatus({
                status: res.status || '200 OK',
                ok: res.ok,
                ms: elapsed,
                model: res.model || 'Groq Llama 3.3',
            });
            if (res.ok) {
                sound.playSuccess();
                toast.success(`AI Engine reachable (${elapsed}ms)`);
            } else {
                sound.playError();
                toast.warning('AI Engine responded with warnings');
            }
        } catch {
            setAiLatencyStatus({
                status: 'Connection Failed',
                ok: false,
                ms: Date.now() - startTime,
            });
            sound.playError();
            toast.error('Could not connect to AI Engine');
        } finally {
            setIsTestingAI(false);
        }
    };

    // Clear Chat History
    const handleClearChat = async () => {
        setIsClearingMemory(true);
        try {
            await settingsApi.clearChatMemory();
            sound.playSuccess();
            toast.success('Co-Pilot chat history cleared from Redis cache');
        } catch {
            sound.playError();
            toast.error('Could not clear chat memory');
        } finally {
            setIsClearingMemory(false);
        }
    };

    // Sign out handler
    const handleSignOut = async () => {
        try {
            sound.playClick();
            await logout();
            toast.info('Signed out of Cashly workspace');
            navigate('/login');
        } catch {
            toast.error('Sign out failed');
        }
    };

    // Danger Zone Purge Flow
    const handleOpenPurgeModal = () => {
        setPurgeStep(1);
        setPurgeConfirmText('');
        setPurgeOtp('');
        setIsPurgeModalOpen(true);
        sound.playError();
    };

    const handleRequestPurgeOtp = async () => {
        if (purgeConfirmText.trim().toUpperCase() !== 'PURGE') {
            toast.error('Please type PURGE to proceed');
            return;
        }

        setIsRequestingOtp(true);
        try {
            await settingsApi.requestResetOtp(purgeCategory);
            sound.playSuccess();
            toast.info(`Verification OTP sent to ${email || 'your email'}`);
            setPurgeStep(2);
        } catch {
            sound.playError();
            toast.error('Failed to dispatch verification code');
        } finally {
            setIsRequestingOtp(false);
        }
    };

    const handleExecutePurge = async () => {
        if (!purgeOtp || purgeOtp.trim().length < 4) {
            toast.error('Please enter the verification code');
            return;
        }

        setIsExecutingPurge(true);
        try {
            await settingsApi.confirmReset(purgeOtp.trim());
            sound.playSuccess();
            toast.success(`Successfully purged ${purgeCategory} from ledger`);
            setIsPurgeModalOpen(false);
            await settingsApi.refreshAI().catch(() => undefined);
        } catch {
            sound.playError();
            toast.error('Invalid OTP or purge authorization expired');
        } finally {
            setIsExecutingPurge(false);
        }
    };

    const userInitials = (name || user?.email || 'User')
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const activeCurrencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === preferences.currency) || {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        locale: 'en-US'
    };

    const navItems: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
        { id: 'account', label: 'Account & Identity', icon: User },
        { id: 'preferences', label: 'Interface & Currency', icon: Sliders },
        { id: 'ai', label: 'AI Intelligence', icon: Brain, badge: 'Active' },
        { id: 'security', label: 'Security & Sessions', icon: Shield },
        { id: 'data', label: 'Data & Exports', icon: Database },
        { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
    ];

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)] pb-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-ink)] text-white text-[10px] font-mono tracking-wider uppercase mb-3 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EE5024] animate-pulse" />
                            System Governance & Workspace
                        </div>
                        <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.04em] text-[var(--color-ink)] uppercase leading-none">
                            Control Center
                        </h1>
                        <p className="text-sm text-[var(--color-ink)]/70 mt-2 max-w-xl font-medium leading-relaxed">
                            Workspace configuration, intelligence behavior, base currency, and security posture.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSignOut}
                            className="rounded-full border-[var(--color-border)] bg-white text-xs h-10 px-5 font-bold text-[var(--color-ink)] hover:bg-[#EE5024] hover:text-white hover:border-[#EE5024] transition-all shadow-2xs"
                        >
                            <LogOut className="h-3.5 w-3.5 mr-2 text-[#EE5024]" />
                            Sign Out
                        </Button>
                    </div>
                </div>

                {/* Two-Zone Settings Workspace */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT ZONE: Settings Navigation Rail */}
                    <div className="lg:col-span-4 xl:col-span-3">
                        {/* Mobile & Tablet: Horizontal Scrollable Pills */}
                        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {navItems.map(item => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                const isDanger = item.id === 'danger';
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={cn(
                                            'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0',
                                            isActive
                                                ? isDanger
                                                    ? 'bg-rose-600 text-white shadow-xs'
                                                    : 'bg-[#111111] text-white shadow-xs'
                                                : isDanger
                                                ? 'text-rose-600 hover:bg-rose-50'
                                                : 'text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] hover:bg-white'
                                        )}
                                    >
                                        <Icon className={cn('h-3.5 w-3.5', isActive ? (isDanger ? 'text-white' : 'text-[#EE5024]') : 'text-stone-400')} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Desktop: Sticky Vertical Rail */}
                        <nav
                            role="tablist"
                            aria-label="Settings Categories"
                            className="hidden lg:flex flex-col gap-1.5 sticky top-24 p-2.5 rounded-[24px] bg-white border border-[var(--color-border)] shadow-xs"
                        >
                            <div className="px-3 py-2 text-[10px] font-mono font-bold tracking-wider text-[var(--color-ink)]/50 uppercase">
                                Navigation Matrix
                            </div>

                            {navItems.map(item => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                const isDanger = item.id === 'danger';

                                return (
                                    <button
                                        key={item.id}
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() => setActiveTab(item.id)}
                                        className={cn(
                                            'group relative flex items-center justify-between w-full px-4 py-3 rounded-[16px] text-xs font-bold uppercase tracking-wider transition-all text-left',
                                            isActive
                                                ? isDanger
                                                    ? 'bg-rose-600 text-white shadow-xs'
                                                    : 'bg-[#111111] text-white shadow-xs'
                                                : isDanger
                                                ? 'text-rose-600 hover:bg-rose-50'
                                                : 'text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] hover:bg-[var(--color-canvas)]'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={cn('h-4 w-4 transition-colors', isActive ? (isDanger ? 'text-white' : 'text-[#EE5024]') : 'text-stone-400 group-hover:text-[var(--color-ink)]')} />
                                            <span>{item.label}</span>
                                        </div>

                                        {item.badge && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700 font-mono">
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}

                            <div className="mt-4 pt-3 border-t border-stone-200/60 px-3 pb-1">
                                <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                                    <span>Cashly Financial OS</span>
                                    <span>v7.2</span>
                                </div>
                            </div>
                        </nav>
                    </div>

                    {/* RIGHT ZONE: Active Settings Content Canvas */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                        {/* TAB 1: ACCOUNT & IDENTITY */}
                        {activeTab === 'account' && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-6"
                            >
                                {/* Identity Block */}
                                <div className="p-6 rounded-xl bg-white border border-stone-200/90 shadow-2xs">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-stone-100">
                                        <div className="h-16 w-16 rounded-xl bg-stone-900 text-white font-mono text-xl font-bold flex items-center justify-center shadow-xs">
                                            {userInitials}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-base font-bold text-stone-900">
                                                    {name || 'Account Holder'}
                                                </h2>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Active Workspace
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-500 mt-0.5">
                                                {email || 'No email attached'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCopyId}
                                                className="rounded-lg h-8 text-xs font-mono border-stone-200 text-stone-600 hover:text-stone-900"
                                            >
                                                {copiedId ? <Check className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1 text-stone-400" />}
                                                {copiedId ? 'Copied' : 'Copy ID'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Profile Form */}
                                    <form onSubmit={handleProfileSubmit} className="pt-6 space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="displayName" className="text-xs font-semibold text-stone-800">
                                                    Display Name
                                                </Label>
                                                <Input
                                                    id="displayName"
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    placeholder="Alex Morgan"
                                                    className="rounded-lg h-10 text-xs bg-white border-stone-300 text-stone-900 focus-visible:ring-2 focus-visible:ring-[#E11D48]"
                                                />
                                                <p className="text-[11px] text-stone-500">
                                                    Used across transaction ledgers and reports.
                                                </p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="emailAddress" className="text-xs font-semibold text-stone-800">
                                                    Email Address
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="emailAddress"
                                                        value={email}
                                                        disabled
                                                        className="rounded-lg h-10 text-xs bg-stone-50 border-stone-200 text-stone-600 cursor-not-allowed pr-20"
                                                    />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                        Verified
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-stone-500">
                                                    Managed via Supabase Authentication.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                                            <div className="text-[11px] font-mono text-stone-500">
                                                Member Since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Jan 2024'}
                                            </div>
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={isSavingProfile}
                                                className="rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs h-9 px-5 shadow-2xs transition-colors"
                                            >
                                                {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 2: INTERFACE & CURRENCY PREFERENCES */}
                        {activeTab === 'preferences' && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-6"
                            >
                                {/* Financial Currency Highlight Card */}
                                <div className="p-6 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-[#E11D48]">
                                                    Financial Baseline
                                                </span>
                                            </div>
                                            <h2 className="text-base font-bold text-stone-900 mt-0.5">
                                                Base Operating Currency
                                            </h2>
                                            <p className="text-xs text-stone-500 mt-0.5 max-w-lg">
                                                Authoritative currency for all ledger transactions, budget burn rates, commitments, and export sheets.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Select
                                                value={preferences.currency}
                                                onValueChange={(val) => handleUpdatePreference({ currency: val })}
                                            >
                                                <SelectTrigger className="w-48 rounded-lg h-10 text-xs bg-stone-50 border-stone-300 text-stone-900 font-mono font-medium focus:ring-2 focus:ring-[#E11D48]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-stone-200 text-stone-900">
                                                    {SUPPORTED_CURRENCIES.map(curr => (
                                                        <SelectItem key={curr.code} value={curr.code} className="font-mono text-xs">
                                                            {curr.code} ({curr.symbol}) — {curr.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Numerical Tabular Preview Box */}
                                    <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                                                Active Formatting Preview
                                            </span>
                                            <div className="text-2xl font-bold font-mono text-stone-900 tracking-tight mt-1">
                                                {activeCurrencyInfo.symbol} 12,450.00
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-mono font-medium text-stone-700 bg-white px-2.5 py-1 rounded border border-stone-200">
                                                {activeCurrencyInfo.code} ({activeCurrencyInfo.name})
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Sensory & Motion Controls */}
                                <div className="p-6 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
                                    <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3">
                                        Sensory & Interface Comfort
                                    </h3>

                                    <div className="divide-y divide-stone-100">
                                        {/* Sound Effects */}
                                        <div className="py-3.5 flex items-center justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-stone-100 text-stone-600 mt-0.5">
                                                    {preferences.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <span className="text-xs font-semibold text-stone-900 block">
                                                        Auditory Feedback
                                                    </span>
                                                    <span className="text-[11px] text-stone-500 leading-relaxed block">
                                                        Tactile acoustic feedback on ledger approvals, button clicks, and sync completions.
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {preferences.soundEnabled && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => sound.playSuccess()}
                                                        className="h-8 px-2.5 text-[11px] text-stone-600 hover:text-stone-900 border border-stone-200 rounded-md"
                                                    >
                                                        Test Chime
                                                    </Button>
                                                )}
                                                <Switch
                                                    checked={preferences.soundEnabled}
                                                    onCheckedChange={(checked) => handleUpdatePreference({ soundEnabled: checked })}
                                                    aria-label="Toggle sound effects"
                                                />
                                            </div>
                                        </div>

                                        {/* Reduced Motion */}
                                        <div className="py-3.5 flex items-center justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-stone-100 text-stone-600 mt-0.5">
                                                    <Activity className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-semibold text-stone-900 block">
                                                        Reduced Motion
                                                    </span>
                                                    <span className="text-[11px] text-stone-500 leading-relaxed block">
                                                        Suppresses non-essential transitions and spring physics across drawers and sheets.
                                                    </span>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences.reducedMotion}
                                                onCheckedChange={(checked) => handleUpdatePreference({ reducedMotion: checked })}
                                                aria-label="Toggle reduced motion"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Scheduled Digests & Notifications */}
                                <div className="p-6 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
                                    <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3">
                                        Scheduled Digests & Telemetry Reports
                                    </h3>

                                    <div className="divide-y divide-stone-100">
                                        <div className="py-3.5 flex items-center justify-between gap-4">
                                            <div>
                                                <span className="text-xs font-semibold text-stone-900 block">Weekly Financial Summary</span>
                                                <span className="text-[11px] text-stone-500">Curated audit of burn rate and upcoming recurring obligations</span>
                                            </div>
                                            <Switch
                                                checked={preferences.weeklyReport}
                                                onCheckedChange={(checked) => handleUpdatePreference({ weeklyReport: checked })}
                                                aria-label="Toggle weekly summary"
                                            />
                                        </div>

                                        <div className="py-3.5 flex items-center justify-between gap-4">
                                            <div>
                                                <span className="text-xs font-semibold text-stone-900 block">Monthly Ledger Statement Digest</span>
                                                <span className="text-[11px] text-stone-500">Automated end-of-month reconciliation package</span>
                                            </div>
                                            <Switch
                                                checked={preferences.monthlyReport}
                                                onCheckedChange={(checked) => handleUpdatePreference({ monthlyReport: checked })}
                                                aria-label="Toggle monthly statement digest"
                                            />
                                        </div>

                                        <div className="py-3.5 flex items-center justify-between gap-4">
                                            <div>
                                                <span className="text-xs font-semibold text-stone-900 block">Email Notifications</span>
                                                <span className="text-[11px] text-stone-500">Transaction approval confirmations and high-priority alerts</span>
                                            </div>
                                            <Switch
                                                checked={preferences.emailNotifications}
                                                onCheckedChange={(checked) => handleUpdatePreference({ emailNotifications: checked })}
                                                aria-label="Toggle email notifications"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 3: AI INTELLIGENCE */}
                        {activeTab === 'ai' && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-6"
                            >
                                {/* AI Engine Telemetry Card */}
                                <div className="p-6 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-200 mt-0.5">
                                                <Brain className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-base font-bold text-stone-900">
                                                        AI Engine & Context Grounding
                                                    </h2>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-violet-50 text-violet-700 border border-violet-200">
                                                        Groq / OpenRouter
                                                    </span>
                                                </div>
                                                <p className="text-xs text-stone-500 mt-0.5">
                                                    Neural Co-Pilot calibrated for automated receipt extraction and predictive cashflow trajectories.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={isTestingAI}
                                                onClick={handleTestAI}
                                                className="rounded-lg h-8 text-xs font-mono border-violet-200 text-violet-700 hover:bg-violet-50 transition-colors"
                                            >
                                                <Zap className="h-3 w-3 mr-1.5 text-violet-600" />
                                                {isTestingAI ? 'Pinging...' : 'Test AI Latency'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Telemetry Status Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                        <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/80">
                                            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block font-mono">
                                                Active Model
                                            </span>
                                            <span className="text-xs font-bold text-stone-900 font-mono mt-0.5 block truncate">
                                                {dashboard?.ai?.provider?.groq?.model || 'llama-3.3-70b-versatile'}
                                            </span>
                                        </div>

                                        <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/80">
                                            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block font-mono">
                                                Engine Status
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                <span className="text-xs font-medium text-stone-900 font-mono">
                                                    {aiLatencyStatus ? `${aiLatencyStatus.status} (${aiLatencyStatus.ms}ms)` : 'Operational'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/80">
                                            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block font-mono">
                                                Cache Protocol
                                            </span>
                                            <span className="text-xs font-medium text-stone-900 font-mono mt-0.5 block">
                                                Redis Distributed (10m TTL)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Context Grounding Rules */}
                                <div className="p-6 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
                                    <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3">
                                        Context Grounding & Memory Boundaries
                                    </h3>

                                    <div className="divide-y divide-stone-100">
                                        <div className="py-3.5 flex items-center justify-between gap-4">
                                            <div>
                                                <span className="text-xs font-semibold text-stone-900 block">
                                                    Live Context Grounding
                                                </span>
                                                <span className="text-[11px] text-stone-500 leading-relaxed block">
                                                    Restricts AI answers to confirmed ledger data and prevents generative hallucinations.
                                                </span>
                                            </div>
                                            <Switch
                                                checked={preferences.aiLiveEnabled}
                                                onCheckedChange={(checked) => handleUpdateAI({ aiLiveEnabled: checked })}
                                                aria-label="Toggle Live Context Grounding"
                                            />
                                        </div>

                                        <div className="py-3.5 flex items-center justify-between gap-4">
                                            <div>
                                                <span className="text-xs font-semibold text-stone-900 block">
                                                    Automatic Context Refresh
                                                </span>
                                                <span className="text-[11px] text-stone-500 leading-relaxed block">
                                                    Invalidates stale embeddings immediately when new transactions are approved or imported.
                                                </span>
                                            </div>
                                            <Switch
                                                checked={preferences.aiAutoRefresh}
                                                onCheckedChange={(checked) => handleUpdateAI({ aiAutoRefresh: checked })}
                                                aria-label="Toggle Automatic Context Refresh"
                                            />
                                        </div>

                                        <div className="py-3.5 flex items-center justify-between gap-4">
                                            <div>
                                                <span className="text-xs font-semibold text-stone-900 block">
                                                    Include Staged Review Candidates
                                                </span>
                                                <span className="text-[11px] text-stone-500 leading-relaxed block">
                                                    Factors unposted browser captures into predictive runway headroom calculations.
                                                </span>
                                            </div>
                                            <Switch
                                                checked={preferences.aiIncludePendingCandidates}
                                                onCheckedChange={(checked) => handleUpdateAI({ aiIncludePendingCandidates: checked })}
                                                aria-label="Toggle Include Staged Candidates"
                                            />
                                        </div>
                                    </div>

                                    {/* Chat Memory Reset */}
                                    <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-semibold text-stone-900 block">Clear Conversation Memory</span>
                                            <span className="text-[11px] text-stone-500">Purges ephemeral Co-Pilot chat context from Redis cache</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isClearingMemory}
                                            onClick={handleClearChat}
                                            className="rounded-lg h-8 text-xs border-stone-300 text-stone-700 hover:bg-stone-50"
                                        >
                                            <RefreshCw className="h-3 w-3 mr-1.5 text-stone-500" />
                                            {isClearingMemory ? 'Clearing...' : 'Clear Memory Cache'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 4: SECURITY & SESSIONS */}
                        {activeTab === 'security' && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-6"
                            >
                                {/* Password Recovery Card */}
                                <div className="p-6 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                                        <div>
                                            <h2 className="text-base font-bold text-stone-900">
                                                Credential Access & Password
                                            </h2>
                                            <p className="text-xs text-stone-500 mt-0.5">
                                                Manage your authentication credentials and account recovery options.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handlePasswordReset}
                                            className="rounded-lg h-9 text-xs border-stone-300 text-stone-800 hover:bg-stone-50 font-medium"
                                        >
                                            <Key className="h-3.5 w-3.5 mr-1.5 text-[#E11D48]" />
                                            Send Password Reset Link
                                        </Button>
                                    </div>

                                    {/* Encryption Posture Badges */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div className="flex items-center gap-3 p-3.5 rounded-lg bg-stone-50 border border-stone-200/70">
                                            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                                            <div>
                                                <span className="text-xs font-semibold text-stone-900 block">Row-Level Security (RLS)</span>
                                                <span className="text-[11px] text-stone-500 font-mono">Enforced at Postgres engine</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3.5 rounded-lg bg-stone-50 border border-stone-200/70">
                                            <Lock className="h-5 w-5 text-stone-700 shrink-0" />
                                            <div>
                                                <span className="text-xs font-semibold text-stone-900 block">Transport Encryption</span>
                                                <span className="text-[11px] text-stone-500 font-mono">TLS 1.3 / AES-256-GCM</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Session Audit */}
                                <div className="p-6 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
                                    <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3">
                                        Active Device Session
                                    </h3>

                                    <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/80 space-y-3">
                                        <div className="flex items-center justify-between text-xs font-mono">
                                            <span className="text-stone-500">Client IP Address:</span>
                                            <span className="font-semibold text-stone-900">{dashboard?.session?.ip || '127.0.0.1 (Localhost)'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-mono">
                                            <span className="text-stone-500">Browser Environment:</span>
                                            <span className="text-stone-800 truncate max-w-xs">{navigator.userAgent.split(' ')[0]} (Verified)</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-mono">
                                            <span className="text-stone-500">Last Telemetry Ping:</span>
                                            <span className="text-stone-800">{new Date().toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 5: DATA & EXPORTS */}
                        {activeTab === 'data' && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-6"
                            >
                                <div className="p-6 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
                                    <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                                        <div>
                                            <h2 className="text-base font-bold text-stone-900">
                                                Financial Ledger Portability
                                            </h2>
                                            <p className="text-xs text-stone-500 mt-0.5">
                                                Export your raw transaction entries, category burn rates, and statements.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate('/reports')}
                                            className="rounded-lg h-8 text-xs border-stone-300 text-stone-700 hover:text-stone-900"
                                        >
                                            View Tax Reports
                                            <ArrowRight className="h-3 w-3 ml-1.5" />
                                        </Button>
                                    </div>

                                    {/* Export Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                        <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/80 space-y-3">
                                            <FileText className="h-5 w-5 text-stone-700" />
                                            <div>
                                                <span className="text-xs font-bold text-stone-900 block">Raw CSV Export</span>
                                                <span className="text-[11px] text-stone-500">Universal ledger dump compatible with Excel and Google Sheets</span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate('/reports')}
                                                className="w-full text-xs h-8 border-stone-200 bg-white"
                                            >
                                                Export CSV
                                            </Button>
                                        </div>

                                        <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/80 space-y-3">
                                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                            <div>
                                                <span className="text-xs font-bold text-stone-900 block">Excel Workbook</span>
                                                <span className="text-[11px] text-stone-500">Formatted spreadsheet with category tabs and formulas</span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate('/reports')}
                                                className="w-full text-xs h-8 border-stone-200 bg-white"
                                            >
                                                Export XLSX
                                            </Button>
                                        </div>

                                        <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/80 space-y-3">
                                            <Layers className="h-5 w-5 text-[#E11D48]" />
                                            <div>
                                                <span className="text-xs font-bold text-stone-900 block">PDF Statement</span>
                                                <span className="text-[11px] text-stone-500">Printable monthly statement with verified audit signatures</span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate('/reports')}
                                                className="w-full text-xs h-8 border-stone-200 bg-white"
                                            >
                                                Print Statement
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 6: DANGER ZONE */}
                        {activeTab === 'danger' && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-6"
                            >
                                <div className="p-6 rounded-xl bg-red-50/60 border border-red-200/80 shadow-2xs space-y-5">
                                    <div className="flex items-start gap-3.5 pb-5 border-b border-red-200/60">
                                        <div className="p-2.5 rounded-xl bg-red-100 text-red-700 mt-0.5">
                                            <AlertTriangle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-red-950">
                                                Irreversible Data Purge & Reset
                                            </h2>
                                            <p className="text-xs text-red-800/80 mt-0.5 leading-relaxed max-w-xl">
                                                Selectively delete confirmed financial records from your private database. Once purged, records cannot be recovered by support or database snapshots.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-red-950">Target Data Domain</Label>
                                            <Select
                                                value={purgeCategory}
                                                onValueChange={(val: any) => setPurgeCategory(val)}
                                            >
                                                <SelectTrigger className="rounded-lg h-10 text-xs bg-white border-red-300 text-stone-900 focus:ring-2 focus:ring-red-500 font-medium">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-stone-200 text-stone-900">
                                                    <SelectItem value="transactions" className="text-xs font-medium">Purge All Transactions</SelectItem>
                                                    <SelectItem value="budgets" className="text-xs font-medium">Purge All Budgets</SelectItem>
                                                    <SelectItem value="subscriptions" className="text-xs font-medium">Purge All Subscriptions</SelectItem>
                                                    <SelectItem value="goals" className="text-xs font-medium">Purge All Goals</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="sm:pt-5 flex justify-end">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={handleOpenPurgeModal}
                                                className="rounded-lg text-xs h-10 px-5 bg-red-600 hover:bg-red-700 text-white font-medium shadow-2xs transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                                Initiate Purge Sequence
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* DANGER PURGE ACCESSIBLE MODAL */}
            <Dialog open={isPurgeModalOpen} onOpenChange={setIsPurgeModalOpen}>
                <DialogContent className="rounded-2xl max-w-md p-6 bg-white border border-stone-200 shadow-xl">
                    <DialogHeader className="text-left space-y-2">
                        <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-lg font-bold text-stone-900">
                            Confirm {purgeCategory.toUpperCase()} Purge
                        </DialogTitle>
                        <DialogDescription className="text-xs text-stone-500 leading-relaxed">
                            This operation will permanently purge all <span className="font-semibold text-stone-800">{purgeCategory}</span> records from your private workspace database.
                        </DialogDescription>
                    </DialogHeader>

                    {purgeStep === 1 ? (
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPurgeInput" className="text-xs font-semibold text-stone-700">
                                    Type <span className="font-mono text-red-600">PURGE</span> to unlock confirmation:
                                </Label>
                                <Input
                                    id="confirmPurgeInput"
                                    value={purgeConfirmText}
                                    onChange={e => setPurgeConfirmText(e.target.value)}
                                    placeholder="PURGE"
                                    className="rounded-lg h-9 text-xs font-mono border-stone-300 uppercase focus-visible:ring-red-500"
                                />
                            </div>

                            <DialogFooter className="pt-2 gap-2 sm:gap-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsPurgeModalOpen(false)}
                                    className="rounded-lg text-xs h-9 border-stone-200"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={purgeConfirmText.trim().toUpperCase() !== 'PURGE' || isRequestingOtp}
                                    onClick={handleRequestPurgeOtp}
                                    className="rounded-lg text-xs h-9 bg-red-600 hover:bg-red-700 text-white font-medium"
                                >
                                    {isRequestingOtp ? 'Dispatching...' : 'Request Email Verification Code'}
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="otpPurgeInput" className="text-xs font-semibold text-stone-700">
                                    Enter 6-Digit Email Confirmation Code:
                                </Label>
                                <Input
                                    id="otpPurgeInput"
                                    value={purgeOtp}
                                    onChange={e => setPurgeOtp(e.target.value)}
                                    placeholder="123456"
                                    className="rounded-lg h-9 text-xs font-mono tracking-widest text-center border-stone-300 focus-visible:ring-red-500"
                                />
                                <p className="text-[11px] text-stone-400">
                                    Sent to {email || 'your registered email address'}.
                                </p>
                            </div>

                            <DialogFooter className="pt-2 gap-2 sm:gap-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPurgeStep(1)}
                                    className="rounded-lg text-xs h-9 border-stone-200"
                                >
                                    Back
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={isExecutingPurge || purgeOtp.trim().length < 4}
                                    onClick={handleExecutePurge}
                                    className="rounded-lg text-xs h-9 bg-red-600 hover:bg-red-700 text-white font-medium"
                                >
                                    {isExecutingPurge ? 'Purging Data...' : 'Confirm Permanent Purge'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SettingsPage;
