// SettingsPage - Stark Gen Z Brutalist System Control
import { useEffect, useState } from 'react';
import {
    Bell, Volume2, ShieldAlert, LogOut, User, Smartphone,
    Settings, ChevronRight, Save, Mail, Key, Trash2,
    Shield, Zap, Sparkles, PieChart, Brain, RefreshCw,
    Database, Activity, Cpu, CheckCircle2, Inbox, CalendarDays,
    ReceiptText, FileBarChart2, ListChecks, ClipboardList, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { useAuthStore, useUIStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import { currencyService, SUPPORTED_CURRENCIES } from '../services/currencyService';
import settingsApi, { SettingsDashboard, UserSettingsPreferences } from '../services/settingsApi';
import styles from './SettingsPage.module.css';

const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

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

const SettingsPage = () => {
    const { user, logout, setUser } = useAuthStore();
    const { setCurrency: setStoreCurrency, setTheme } = useUIStore();
    const navigate = useNavigate();
    const sound = useSound();

    const [dashboard, setDashboard] = useState<SettingsDashboard | null>(null);
    const [preferences, setPreferences] = useState<UserSettingsPreferences>(defaultPreferences);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [resetCategory, setResetCategory] = useState('transactions');
    const [aiTest, setAiTest] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadSettings = async () => {
            try {
                const data = await settingsApi.get();
                if (cancelled) return;
                setDashboard(data);
                setPreferences(data.preferences);
                setName(data.profile.name || user?.name || '');
                setEmail(data.profile.email || user?.email || '');
                sound.setEnabled(data.preferences.soundEnabled);
                sound.setVolume(data.preferences.soundVolume / 100);
                currencyService.setCurrency(data.preferences.currency);
                setStoreCurrency(data.preferences.currency);
                setTheme(data.preferences.theme);
            } catch (error) {
                console.error('Settings load failed:', error);
                toast.error('Couldn’t load settings');
                setName(user?.name || '');
                setEmail(user?.email || '');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        loadSettings();
        return () => { cancelled = true; };
    }, [setStoreCurrency, setTheme, user?.email, user?.name]);

    const savePreferences = async (updates: Partial<UserSettingsPreferences>) => {
        const next = { ...preferences, ...updates };
        setPreferences(next);
        setIsSaving(true);
        try {
            const saved = await settingsApi.updatePreferences(updates);
            setPreferences(saved);
            if (updates.soundEnabled !== undefined) sound.setEnabled(saved.soundEnabled);
            if (updates.soundVolume !== undefined) sound.setVolume(saved.soundVolume / 100);
            if (updates.currency) {
                currencyService.setCurrency(saved.currency);
                setStoreCurrency(saved.currency);
                if (user) setUser({ ...user, currency: saved.currency });
            }
            if (updates.theme) setTheme(saved.theme);
            toast.success('Settings saved');
        } catch (error) {
            console.error('Preference save failed:', error);
            setPreferences(preferences);
            toast.error('Couldn’t save');
        } finally {
            setIsSaving(false);
        }
    };

    const saveAI = async (updates: Partial<UserSettingsPreferences>) => {
        const next = { ...preferences, ...updates };
        setPreferences(next);
        setIsSaving(true);
        try {
            const saved = await settingsApi.updateAI(updates);
            setPreferences(saved);
            toast.success('AI settings saved');
        } catch (error) {
            console.error('AI settings save failed:', error);
            setPreferences(preferences);
            toast.error('Couldn’t save AI settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateProfile = async () => {
        setIsSaving(true);
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
            toast.success('Profile saved');
            sound.playSuccess();
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error('Could not update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            toast.info('Signed out');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Could not sign out');
        }
    };

    const handlePasswordReset = async () => {
        try {
            const result: any = await settingsApi.requestPasswordReset();
            toast.success(result.delivery === 'email_sent' ? 'Password reset email sent' : 'Reset started');
        } catch (error: any) {
            console.error('Password reset failed:', error);
            toast.error('Could not reset password');
        }
    };

    const handleSessionRefresh = async () => {
        try {
            const sessions: any = await settingsApi.getSessions();
            toast.info(`Current session: ${sessions.sessions?.[0]?.ip || 'this device'}`);
        } catch {
            toast.error('Could not load session');
        }
    };

    const handleDataReset = async () => {
        const typed = window.prompt(`Type RESET to request verification for ${resetCategory} purge.`);
        if (typed !== 'RESET') return;

        try {
            await settingsApi.requestResetOtp(resetCategory);
            const otp = window.prompt('Enter the verification code from your email');
            if (!otp) return;
            await settingsApi.confirmReset(otp);
            toast.success('Data reset complete');
            await settingsApi.refreshAI().catch(() => undefined);
        } catch (error: any) {
            console.error('Data reset failed:', error);
            toast.error('Could not reset data');
        }
    };

    const handleRefreshAI = async () => {
        setIsSaving(true);
        try {
            await settingsApi.refreshAI();
            toast.success('AI cache refreshed');
        } catch {
            toast.error('Could not refresh AI');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearChat = async () => {
        try {
            await settingsApi.clearChatMemory();
            toast.success('Chat memory cleared');
        } catch {
            toast.error('Could not clear chat');
        }
    };

    const handleTestAI = async () => {
        setAiTest('Testing AI…');
        try {
            const result = await settingsApi.testAI();
            setAiTest(`${result.status}: ${result.provider || 'ai'} ${result.model}`);
            result.ok ? toast.success('AI is ready') : toast.warning('AI responded slowly');
        } catch (error: any) {
            setAiTest('AI test failed');
            toast.error('Could not reach AI');
        }
    };

    const goToFeature = (path: string) => {
        navigate(path);
    };

    const SectionHeader = ({ icon: Icon, title, subtitle, colorClass }: {
        icon: any;
        title: string;
        subtitle: string;
        colorClass: string;
    }) => (
        <div className={styles.sectionHeader}>
            <div className={cn(styles.sectionIconBox, colorClass)}>
                <Icon size={24} strokeWidth={3} />
            </div>
            <div>
                <h3 className={styles.sectionTitle}>{title}</h3>
                <p className={styles.sectionSubtitle}>{subtitle}</p>
            </div>
            <div />
        </div>
    );

    const ToggleRow = ({ icon: Icon, label, description, checked, onChange }: {
        icon: any;
        label: string;
        description: string;
        checked: boolean;
        onChange: (v: boolean) => void;
    }) => (
        <div className={styles.row}>
            <div className={styles.rowLeft}>
                <div className={styles.rowIcon}><Icon size={20} strokeWidth={3} /></div>
                <div>
                    <p className={styles.rowLabel}>{label}</p>
                    <p className={styles.rowDesc}>{description}</p>
                </div>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={(v) => { onChange(v); sound.playClick(); }}
                className="data-[state=checked]:bg-[#E11D48] border-2 border-black"
            />
        </div>
    );

    const ActionRow = ({ icon: Icon, label, description, onClick, danger = false }: {
        icon: any;
        label: string;
        description: string;
        onClick: () => void;
        danger?: boolean;
    }) => (
        <button
            onClick={() => { onClick(); sound.playClick(); }}
            className={cn(styles.actionBtn, danger && styles.danger)}
        >
            <div className={styles.rowLeft}>
                <div className={cn(styles.rowIcon, danger && 'bg-[#E11D48] text-white border-black')}>
                    <Icon size={20} strokeWidth={3} />
                </div>
                <div className="text-left">
                    <p className={cn(styles.rowLabel, danger && 'text-[#E11D48]')}>{label}</p>
                    <p className={styles.rowDesc}>{description}</p>
                </div>
            </div>
            <ChevronRight className={styles.chevron} size={24} strokeWidth={4} />
        </button>
    );

    const models = dashboard?.ai.provider.models || {};

    return (
        <div className={styles.mainContent}>
            <motion.div className={styles.contentArea} variants={staggerContainer} initial="hidden" animate="show">
                {/* Brutalist Header */}
                <motion.header className={styles.header} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className={styles.headerLeft}>
                        <div className={styles.titleIcon}><Settings size={32} strokeWidth={3} /></div>
                        <div>
                            <h1 className={styles.title}>Settings</h1>
                            <p className={styles.subtitle}>{isLoading ? 'Loading…' : 'Account, notifications, and AI'}</p>
                        </div>
                    </div>
                    <div className="hidden items-center gap-3 rounded-[var(--r-md)] border border-[var(--border)] bg-white px-4 py-2.5 text-[var(--text-muted)] md:flex">
                        <Activity size={16} strokeWidth={2} />
                        <span className="text-sm font-medium">
                            {isSaving ? 'Saving…' : 'Connected'}
                        </span>
                    </div>
                </motion.header>

                <div className="space-y-12">
                    {/* Identity Profile */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader icon={User} title="Profile" subtitle="Name, currency, and account details" colorClass="bg-black" />
                        <div className={styles.formContainer}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className={styles.formField}>
                                    <label className={styles.fieldLabel}>Name</label>
                                    <input className={styles.premiumInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                                </div>
                                <div className={styles.formField}>
                                    <label className={styles.fieldLabel}>Email</label>
                                    <input className={styles.premiumInput} value={email} disabled />
                                </div>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.fieldLabel}>Currency</label>
                                <select
                                    className={styles.premiumInput}
                                    value={preferences.currency}
                                    onChange={(e) => savePreferences({ currency: e.target.value })}
                                >
                                    {SUPPORTED_CURRENCIES.map((currency) => (
                                        <option key={currency.code} value={currency.code}>{currency.code} — {currency.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={handleUpdateProfile} className={styles.primaryBtn}>
                                <Save size={20} strokeWidth={3} />
                                Save profile
                            </button>
                        </div>
                    </motion.div>

                    {/* Auditory Experience */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader icon={Volume2} title="Sound" subtitle="Click and confirmation sounds" colorClass="bg-black" />
                        <ToggleRow icon={Sparkles} label="Click sounds" description="Play sounds when you click" checked={preferences.soundEnabled} onChange={(soundEnabled) => savePreferences({ soundEnabled })} />
                        <AnimatePresence>
                            {preferences.soundEnabled && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={styles.sliderBox}>
                                    <div className={styles.sliderHeader}>
                                        <span className={styles.rowLabel}>Volume</span>
                                        <span className={styles.sliderValue}>{preferences.soundVolume}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={preferences.soundVolume}
                                        onChange={(e) => {
                                            const soundVolume = Number(e.target.value);
                                            setPreferences({ ...preferences, soundVolume });
                                            sound.setVolume(soundVolume / 100);
                                        }}
                                        onMouseUp={() => savePreferences({ soundVolume: preferences.soundVolume })}
                                        onTouchEnd={() => savePreferences({ soundVolume: preferences.soundVolume })}
                                        className={styles.premiumSlider}
                                    />
                                    <div className={styles.testBtnGroup}>
                                        <button className={styles.outlineBtn} onClick={() => sound.playClick()}>Test click</button>
                                        <button className={styles.outlineBtn} onClick={() => sound.playSuccess()}>Test success</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Notification Signal Protocol */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader icon={Bell} title="Notifications" subtitle="Email and in-app updates" colorClass="bg-black" />
                        <ToggleRow icon={Mail} label="Email updates" description="Weekly and monthly summaries" checked={preferences.emailNotifications} onChange={(emailNotifications) => savePreferences({ emailNotifications })} />
                        <ToggleRow icon={Zap} label="Browser alerts" description="Instant alerts in this browser" checked={preferences.pushNotifications} onChange={(pushNotifications) => savePreferences({ pushNotifications })} />
                        <ToggleRow icon={PieChart} label="Weekly report" description="How last week went" checked={preferences.weeklyReport} onChange={(weeklyReport) => savePreferences({ weeklyReport })} />
                        <ToggleRow icon={CheckCircle2} label="Monthly report" description="A fuller picture each month" checked={preferences.monthlyReport} onChange={(monthlyReport) => savePreferences({ monthlyReport })} />
                    </motion.div>

                    {/* AI Controls */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader icon={Brain} title="AI" subtitle="Live answers, memory, and pending data" colorClass="bg-black" />
                        <ToggleRow icon={Cpu} label="Live AI" description="Use live AI answers" checked={preferences.aiLiveEnabled} onChange={(aiLiveEnabled) => saveAI({ aiLiveEnabled })} />
                        <ToggleRow icon={Database} label="Remember chats" description="Keep conversation context" checked={preferences.aiMemoryEnabled} onChange={(aiMemoryEnabled) => saveAI({ aiMemoryEnabled })} />
                        <ToggleRow icon={Activity} label="Include inbox" description="Let AI see pending captures" checked={preferences.aiIncludePendingCandidates} onChange={(aiIncludePendingCandidates) => saveAI({ aiIncludePendingCandidates })} />
                        <ToggleRow icon={RefreshCw} label="Auto-refresh" description="Refresh AI context when your data changes" checked={preferences.aiAutoRefresh} onChange={(aiAutoRefresh) => saveAI({ aiAutoRefresh })} />
                        
                        <div className={styles.sliderBox}>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="border-4 border-black p-6 bg-white">
                                    <p className={styles.rowLabel}>Groq</p>
                                    <p className={cn(styles.rowDesc, "font-black")}>
                                        {dashboard?.ai.provider.groq?.configured ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                                <div className="border-4 border-black p-6 bg-white">
                                    <p className={styles.rowLabel}>OpenRouter</p>
                                    <p className={cn(styles.rowDesc, "font-black")}>
                                        {dashboard?.ai.provider.openrouter?.configured ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                                <div className="border-4 border-black p-6 bg-white">
                                    <p className={styles.rowLabel}>Provider Status</p>
                                    <p className={cn(styles.rowDesc, "font-black")}>
                                        {dashboard?.ai.provider.configured ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                                <div className="border-4 border-black p-6 bg-white">
                                    <p className={styles.rowLabel}>AI cache</p>
                                    <p className={cn(styles.rowDesc, "font-black")}>
                                        {dashboard?.ai.cache.connected ? dashboard.ai.cache.memory || 'Ready' : 'Disconnected'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 border-4 border-black p-6 bg-black text-white">
                                <p className="mb-2 text-xs text-white/60">Active models</p>
                                <p className="text-xs font-black tracking-tighter">
                                    {Object.entries(models).map(([key, value]) => `${key}: ${value}`).join(' · ') || 'No models loaded'}
                                </p>
                            </div>
                            {aiTest && <div className="mt-6 p-4 border-4 border-black bg-[#E11D48] text-white font-black text-xs uppercase tracking-widest">{aiTest}</div>}
                            <div className={styles.testBtnGroup}>
                                <button className={styles.outlineBtn} onClick={handleRefreshAI} disabled={isSaving}>Refresh AI memory</button>
                                <button className={styles.outlineBtn} onClick={handleClearChat}>Clear chat memory</button>
                                <button className={styles.primaryBtn} onClick={handleTestAI} style={{ flex: 1 }}>Test AI</button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature Command Center */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader icon={ListChecks} title="Shortcuts" subtitle="Jump to the workflows you use most" colorClass="bg-black" />
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <ActionRow icon={Inbox} label="Transaction inbox" description="Review captured payments" onClick={() => goToFeature('/transaction-inbox')} />
                            <ActionRow icon={CalendarDays} label="Calendar" description="Upcoming money in and out" onClick={() => goToFeature('/cashflow-calendar')} />
                            <ActionRow icon={ReceiptText} label="Import" description="CSV and PDF statements" onClick={() => goToFeature('/transactions')} />
                            <ActionRow icon={Activity} label="Subscriptions" description="Trials and renewals" onClick={() => goToFeature('/subscriptions')} />
                            <ActionRow icon={FileBarChart2} label="Reports" description="Download spending reports" onClick={() => goToFeature('/reports')} />
                            <ActionRow icon={Database} label="Extension" description="Capture health" onClick={() => goToFeature('/extension-health')} />
                        </div>
                    </motion.div>

                    {/* Sentinel Protocol */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader icon={ShieldAlert} title="Security" subtitle="Password and session" colorClass="bg-black" />
                        <ActionRow icon={Key} label="Change password" description="Send a reset email" onClick={handlePasswordReset} />
                        <ActionRow icon={Smartphone} label="This device" description={dashboard?.session.userAgent || 'Current browser'} onClick={handleSessionRefresh} />
                    </motion.div>

                    {/* Danger Protocol */}
                    <motion.div variants={fadeInUp} className={cn(styles.section, styles.dangerSection)}>
                        <div className={cn(styles.sectionHeader, styles.dangerHeader)}>
                            <div className="p-4 bg-[#E11D48] text-white border-4 border-black shadow-[4px_4px_0px_#000000]"><Target size={24} strokeWidth={3} /></div>
                            <div>
                                <h3 className={cn(styles.sectionTitle, styles.dangerTitle)}>Danger zone</h3>
                                <p className={styles.sectionSubtitle}>These actions cannot be undone</p>
                            </div>
                        </div>
                        <div className={styles.formContainer}>
                            <div className={styles.formField}>
                                <label className={styles.fieldLabel}>What to delete</label>
                                <select className={styles.premiumInput} value={resetCategory} onChange={(e) => setResetCategory(e.target.value)}>
                                    <option value="transactions">Transactions</option>
                                    <option value="goals">Goals</option>
                                    <option value="subscriptions">Subscriptions</option>
                                    <option value="bills">Bills</option>
                                    <option value="cards">Cards</option>
                                    <option value="all">Everything</option>
                                </select>
                            </div>
                        </div>
                        <ActionRow icon={LogOut} label="Sign out" description="Sign out of Cashly" onClick={handleLogout} danger />
                        <ActionRow icon={Trash2} label="Delete selected data" description="You’ll confirm before anything is deleted" onClick={handleDataReset} danger />
                    </motion.div>
                </div>

                {/* Footer */}
                <motion.div variants={fadeInUp} className={styles.footer}>
                    <p className={styles.footerText}>Cashly settings</p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default SettingsPage;
