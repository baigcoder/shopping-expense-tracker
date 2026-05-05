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
import { Button } from '@/components/ui/button';
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
                toast.error('BACKEND_OFFLINE_MODE');
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
            toast.success('PREFERENCES_SYNCED');
        } catch (error) {
            console.error('Preference save failed:', error);
            setPreferences(preferences);
            toast.error('SYNC_FAILURE');
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
            toast.success('AI_CORE_UPDATED');
        } catch (error) {
            console.error('AI settings save failed:', error);
            setPreferences(preferences);
            toast.error('AI_SYNC_FAILURE');
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
            toast.success('IDENTITY_RECONFIGURED');
            sound.playSuccess();
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error('IDENTITY_UPDATE_FAILURE');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            toast.info('SESSION_TERMINATED');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('TERMINATION_FAILURE');
        }
    };

    const handlePasswordReset = async () => {
        try {
            const result: any = await settingsApi.requestPasswordReset();
            toast.success(result.delivery === 'email_sent' ? 'PASSPHRASE_RESET_DISPATCHED' : 'RESET_NODE_INITIALIZED');
        } catch (error: any) {
            console.error('Password reset failed:', error);
            toast.error('RESET_FAILURE');
        }
    };

    const handleSessionRefresh = async () => {
        try {
            const sessions: any = await settingsApi.getSessions();
            toast.info(`NODE_CHECK: ${sessions.sessions?.[0]?.ip || 'LOCAL_DEVICE'}`);
        } catch {
            toast.error('NODE_LOAD_FAILURE');
        }
    };

    const handleDataReset = async () => {
        const typed = window.prompt(`Type RESET to request verification for ${resetCategory} purge.`);
        if (typed !== 'RESET') return;

        try {
            await settingsApi.requestResetOtp(resetCategory);
            const otp = window.prompt('ENTER_VERIFICATION_KEY_FROM_EMAIL');
            if (!otp) return;
            await settingsApi.confirmReset(otp);
            toast.success('PURGE_COMPLETE');
            await settingsApi.refreshAI().catch(() => undefined);
        } catch (error: any) {
            console.error('Data reset failed:', error);
            toast.error('PURGE_FAILURE');
        }
    };

    const handleRefreshAI = async () => {
        setIsSaving(true);
        try {
            await settingsApi.refreshAI();
            toast.success('NEURAL_CACHE_REFRESHED');
        } catch {
            toast.error('NEURAL_REFRESH_FAILURE');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearChat = async () => {
        try {
            await settingsApi.clearChatMemory();
            toast.success('CHAT_BUFFER_CLEARED');
        } catch {
            toast.error('BUFFER_CLEAR_FAILURE');
        }
    };

    const handleTestAI = async () => {
        setAiTest('TESTING_PROVIDER_PIPELINE...');
        try {
            const result = await settingsApi.testAI();
            setAiTest(`${result.status.toUpperCase()}: ${result.model.toUpperCase()}`);
            result.ok ? toast.success('PROVIDER_READY') : toast.warning('PROVIDER_LATENCY_DETECTED');
        } catch (error: any) {
            setAiTest('PROVIDER_TEST_FAILED');
            toast.error('PIPELINE_ERROR');
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
            <div className="ml-auto bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">SECURE_NODE</div>
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
                            <h1 className={styles.title}>System Control</h1>
                            <p className={styles.subtitle}>{isLoading ? 'SYNCING_NODES...' : 'BACKEND_STABLE_V2.1'}</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-black text-white border-4 border-black shadow-[6px_6px_0px_#E11D48]">
                        <Activity size={18} strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {isSaving ? 'UPLOADING_CHANGES' : 'API_STATUS_CONNECTED'}
                        </span>
                    </div>
                </motion.header>

                <div className="space-y-12">
                    {/* Identity Profile */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader icon={User} title="Identity Profile" subtitle="CORE_USER_CREDENTIALS" colorClass="bg-black" />
                        <div className={styles.formContainer}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className={styles.formField}>
                                    <label className={styles.fieldLabel}>Identity Name</label>
                                    <input className={styles.premiumInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="ENTER_NAME" />
                                </div>
                                <div className={styles.formField}>
                                    <label className={styles.fieldLabel}>Verified Email</label>
                                    <input className={styles.premiumInput} value={email} disabled />
                                </div>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.fieldLabel}>Functional Currency</label>
                                <select
                                    className={styles.premiumInput}
                                    value={preferences.currency}
                                    onChange={(e) => savePreferences({ currency: e.target.value })}
                                >
                                    {SUPPORTED_CURRENCIES.map((currency) => (
                                        <option key={currency.code} value={currency.code}>{currency.code} - {currency.name.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={handleUpdateProfile} className={styles.primaryBtn}>
                                <Save size={20} strokeWidth={3} />
                                Reconfigure_Identity
                            </button>
                        </div>
                    </motion.div>

                    {/* Auditory Experience */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader icon={Volume2} title="Audio Interface" subtitle="SIGNAL_FEEDBACK_PROTOCOLS" colorClass="bg-black" />
                        <ToggleRow icon={Sparkles} label="UI Sound Feedback" description="Enable auditory interaction cues" checked={preferences.soundEnabled} onChange={(soundEnabled) => savePreferences({ soundEnabled })} />
                        <AnimatePresence>
                            {preferences.soundEnabled && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={styles.sliderBox}>
                                    <div className={styles.sliderHeader}>
                                        <span className={styles.rowLabel}>Audio Amplitude</span>
                                        <span className={styles.sliderValue}>{preferences.soundVolume}%_GAIN</span>
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
                                        <button className={styles.outlineBtn} onClick={() => sound.playClick()}>TEST_CLICK_SIGNAL</button>
                                        <button className={styles.outlineBtn} onClick={() => sound.playSuccess()}>TEST_SUCCESS_SIGNAL</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Notification Signal Protocol */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader icon={Bell} title="Signal Protocol" subtitle="DATA_DISPATCH_CHANNELS" colorClass="bg-black" />
                        <ToggleRow icon={Mail} label="Email Manifest" description="Weekly/Monthly finance dispatch" checked={preferences.emailNotifications} onChange={(emailNotifications) => savePreferences({ emailNotifications })} />
                        <ToggleRow icon={Zap} label="Push Telemetry" description="Real-time browser notifications" checked={preferences.pushNotifications} onChange={(pushNotifications) => savePreferences({ pushNotifications })} />
                        <ToggleRow icon={PieChart} label="Weekly Report Audit" description="Summary of weekly outflow" checked={preferences.weeklyReport} onChange={(weeklyReport) => savePreferences({ weeklyReport })} />
                        <ToggleRow icon={CheckCircle2} label="Monthly Cycle Audit" description="Deep dive monthly analytics" checked={preferences.monthlyReport} onChange={(monthlyReport) => savePreferences({ monthlyReport })} />
                    </motion.div>

                    {/* AI Controls */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader icon={Brain} title="Neural Controls" subtitle="AI_MEMORY_AND_PIPELINE" colorClass="bg-black" />
                        <ToggleRow icon={Cpu} label="Neural Provider" description="Activate live AI processing nodes" checked={preferences.aiLiveEnabled} onChange={(aiLiveEnabled) => saveAI({ aiLiveEnabled })} />
                        <ToggleRow icon={Database} label="Neural Memory" description="Persistent context storage for chat" checked={preferences.aiMemoryEnabled} onChange={(aiMemoryEnabled) => saveAI({ aiMemoryEnabled })} />
                        <ToggleRow icon={Activity} label="Inbox Contextualization" description="Allow AI to audit pending candidates" checked={preferences.aiIncludePendingCandidates} onChange={(aiIncludePendingCandidates) => saveAI({ aiIncludePendingCandidates })} />
                        <ToggleRow icon={RefreshCw} label="Neural Auto-Sync" description="Auto-refresh cache on data change" checked={preferences.aiAutoRefresh} onChange={(aiAutoRefresh) => saveAI({ aiAutoRefresh })} />
                        
                        <div className={styles.sliderBox}>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="border-4 border-black p-6 bg-white">
                                    <p className={styles.rowLabel}>Provider Status</p>
                                    <p className={cn(styles.rowDesc, "font-black")}>
                                        {dashboard?.ai.provider.configured ? 'STATUS: ONLINE' : 'STATUS: OFFLINE'}
                                    </p>
                                </div>
                                <div className="border-4 border-black p-6 bg-white">
                                    <p className={styles.rowLabel}>Neural Cache</p>
                                    <p className={cn(styles.rowDesc, "font-black")}>
                                        {dashboard?.ai.cache.connected ? `CACHE_LOAD: ${dashboard.ai.cache.memory || '0.0MB'}` : 'CACHE: DISCONNECTED'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 border-4 border-black p-6 bg-black text-white">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">ACTIVE_MODELS</p>
                                <p className="text-xs font-black tracking-tighter">
                                    {Object.entries(models).map(([key, value]) => `${key.toUpperCase()}: ${value.toString().toUpperCase()}`).join(' // ') || 'NO_MODEL_MAP_LOADED'}
                                </p>
                            </div>
                            {aiTest && <div className="mt-6 p-4 border-4 border-black bg-[#E11D48] text-white font-black text-xs uppercase tracking-widest">{aiTest}</div>}
                            <div className={styles.testBtnGroup}>
                                <button className={styles.outlineBtn} onClick={handleRefreshAI} disabled={isSaving}>REFRESH_NEURAL_MEMORY</button>
                                <button className={styles.outlineBtn} onClick={handleClearChat}>PURGE_CHAT_BUFFER</button>
                                <button className={styles.primaryBtn} onClick={handleTestAI} style={{ flex: 1 }}>TEST_PROVIDER_PIPELINE</button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature Command Center */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader icon={ListChecks} title="Command Center" subtitle="DIRECT_WORKFLOW_ACCESS" colorClass="bg-black" />
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <ActionRow icon={Inbox} label="Transaction Inbox" description="Staged detection review" onClick={() => goToFeature('/transaction-inbox')} />
                            <ActionRow icon={CalendarDays} label="Finance Calendar" description="Upcoming liability view" onClick={() => goToFeature('/cashflow-calendar')} />
                            <ActionRow icon={ReceiptText} label="Import Pipeline" description="CSV/PDF processing hub" onClick={() => goToFeature('/transactions')} />
                            <ActionRow icon={Activity} label="Subscription Hub" description="Trials and renewals monitor" onClick={() => goToFeature('/subscriptions')} />
                            <ActionRow icon={FileBarChart2} label="Audit Reports" description="Generate deep-dive reports" onClick={() => goToFeature('/reports')} />
                            <ActionRow icon={Database} label="Extension Audit" description="System health and telemetry" onClick={() => goToFeature('/extension-health')} />
                        </div>
                    </motion.div>

                    {/* Sentinel Protocol */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader icon={ShieldAlert} title="Sentinel Protocol" subtitle="SECURITY_VAULT_CONTROLS" colorClass="bg-black" />
                        <ActionRow icon={Key} label="Rotate Passphrase" description="Initiate security reset protocol" onClick={handlePasswordReset} />
                        <ActionRow icon={Smartphone} label="Network Node Audit" description={dashboard?.session.userAgent || 'ANALYZE_CURRENT_NODE_METADATA'} onClick={handleSessionRefresh} />
                    </motion.div>

                    {/* Danger Protocol */}
                    <motion.div variants={fadeInUp} className={cn(styles.section, styles.dangerSection)}>
                        <div className={cn(styles.sectionHeader, styles.dangerHeader)}>
                            <div className="p-4 bg-[#E11D48] text-white border-4 border-black shadow-[4px_4px_0px_#000000]"><Target size={24} strokeWidth={3} /></div>
                            <div>
                                <h3 className={cn(styles.sectionTitle, styles.dangerTitle)}>Danger Protocol</h3>
                                <p className={styles.sectionSubtitle}>DESTRUCTIVE_DATA_OPERATIONS</p>
                            </div>
                        </div>
                        <div className={styles.formContainer}>
                            <div className={styles.formField}>
                                <label className={styles.fieldLabel}>Purge Target Area</label>
                                <select className={styles.premiumInput} value={resetCategory} onChange={(e) => setResetCategory(e.target.value)}>
                                    <option value="transactions">TRANSACTIONS_DATABASE</option>
                                    <option value="goals">GOALS_MANIFEST</option>
                                    <option value="subscriptions">SUBSCRIPTION_REGISTRY</option>
                                    <option value="bills">BILL_PIPELINE</option>
                                    <option value="cards">CARD_VAULT</option>
                                    <option value="all">COMPLETE_SYSTEM_PURGE</option>
                                </select>
                            </div>
                        </div>
                        <ActionRow icon={LogOut} label="Terminate Session" description="Securely exit ecosystem" onClick={handleLogout} danger />
                        <ActionRow icon={Trash2} label="Purge Selected Nodes" description="Requires identity verification" onClick={handleDataReset} danger />
                    </motion.div>
                </div>

                {/* Footer */}
                <motion.div variants={fadeInUp} className={styles.footer}>
                    <p className={styles.footerText}>CASHLY_CORE_V2.1 // SYSTEM_AUDIT_STABLE</p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default SettingsPage;
