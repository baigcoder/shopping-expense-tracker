// SettingsPage - Cashly Premium Redesign
// Midnight Coral Theme - Light Mode
import { useState, useEffect } from 'react';
import {
    Bell, Volume2, ShieldAlert, LogOut, User, Smartphone,
    Settings, ChevronRight, Save, Mail, Eye, Key, Trash2,
    Shield, CheckCircle2, Crown, Zap, Sparkles, PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../config/supabase';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import styles from './SettingsPage.module.css';

// Animation Variants
const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', damping: 25, stiffness: 100 }
    }
};

const SettingsPage = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const sound = useSound();

    // Sound settings
    const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());
    const [soundVolume, setSoundVolume] = useState(sound.getVolume() * 100);

    // Notification settings
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [weeklyReport, setWeeklyReport] = useState(true);

    // Profile
    const [name, setName] = useState(user?.name || '');
    const [email] = useState(user?.email || '');

    const handleSoundToggle = (enabled: boolean) => {
        setSoundEnabled(enabled);
        sound.setEnabled(enabled);
        if (enabled) {
            sound.playClick();
            toast.success('Auditory feedback enabled');
        } else {
            toast.info('Auditory feedback disabled');
        }
    };

    const handleVolumeChange = (value: number) => {
        setSoundVolume(value);
        sound.setVolume(value / 100);
    };

    const handleUpdateProfile = async () => {
        try {
            const { error } = await supabase.auth.updateUser({ data: { name } });
            if (error) throw error;
            toast.success('Identity profile updated');
            sound.playSuccess();
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error('Failed to update identity');
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            toast.info('Session terminated: Securely logged out.');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Logout failed');
        }
    };

    // Premium Section Header
    const SectionHeader = ({ icon: Icon, title, subtitle, colorClass }: {
        icon: any;
        title: string;
        subtitle: string;
        colorClass: string;
    }) => (
        <div className={styles.sectionHeader}>
            <div className={cn(styles.sectionIconBox, colorClass)}>
                <Icon size={18} strokeWidth={2.5} />
            </div>
            <div>
                <h3 className={styles.sectionTitle}>{title}</h3>
                <p className={styles.sectionSubtitle}>{subtitle}</p>
            </div>
        </div>
    );

    // Premium Toggle Row
    const ToggleRow = ({ icon: Icon, label, description, checked, onChange }: {
        icon: any;
        label: string;
        description: string;
        checked: boolean;
        onChange: (v: boolean) => void;
    }) => (
        <div className={styles.row}>
            <div className={styles.rowLeft}>
                <div className={styles.rowIcon}>
                    <Icon size={18} />
                </div>
                <div>
                    <p className={styles.rowLabel}>{label}</p>
                    <p className={styles.rowDesc}>{description}</p>
                </div>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={(v) => { onChange(v); sound.playClick(); }}
                className="data-[state=checked]:bg-teal-500 scale-110"
            />
        </div>
    );

    // Premium Action Row
    const ActionRow = ({ icon: Icon, label, description, onClick, danger = false }: {
        icon: any;
        label: string;
        description: string;
        onClick: () => void;
        danger?: boolean;
    }) => (
        <motion.button
            whileHover={{ x: 10 }}
            onClick={() => { onClick(); sound.playClick(); }}
            className={cn(styles.actionBtn, danger && styles.danger)}
        >
            <div className={styles.rowLeft}>
                <div className={cn(styles.rowIcon, danger && "bg-rose-50 text-rose-500 border-rose-100")}>
                    <Icon size={18} />
                </div>
                <div className="text-left">
                    <p className={cn(styles.rowLabel, danger && "text-rose-600")}>{label}</p>
                    <p className={styles.rowDesc}>{description}</p>
                </div>
            </div>
            <ChevronRight className={styles.chevron} size={18} strokeWidth={3} />
        </motion.button>
    );

    return (
        <div className={styles.mainContent}>
            <motion.div
                className={styles.contentArea}
                variants={staggerContainer}
                initial="hidden"
                animate="show"
            >
                {/* Premium Header */}
                <motion.header
                    className={styles.header}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className={styles.headerLeft}>
                        <div className={styles.titleIcon}>
                            <Settings size={28} />
                        </div>
                        <div>
                            <h1 className={styles.title}>System Control</h1>
                            <p className={styles.subtitle}>Ecosystem Calibration</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border-2 border-slate-100">
                        <Shield size={16} className="text-teal-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End-to-End Encrypted</span>
                    </div>
                </motion.header>

                <div className="space-y-8">
                    {/* Identity Section */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader
                            icon={User}
                            title="Identity Profile"
                            subtitle="Personal Credentials"
                            colorClass="bg-teal-500"
                        />
                        <div className={styles.formContainer}>
                            <div className={styles.formField}>
                                <label className={styles.fieldLabel}>Full Legal Name</label>
                                <input
                                    className={styles.premiumInput}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.fieldLabel}>Registered Email</label>
                                <input
                                    className={styles.premiumInput}
                                    value={email}
                                    disabled
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleUpdateProfile}
                                className={styles.primaryBtn}
                            >
                                <Save size={18} />
                                Synchronize Identity
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Auditory Feedback Section */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader
                            icon={Volume2}
                            title="Auditory Experience"
                            subtitle="Haptic & Sound Design"
                            colorClass="bg-orange-500"
                        />
                        <div>
                            <ToggleRow
                                icon={Sparkles}
                                label="Interface Sounds"
                                description="Enable premium auditory interactions"
                                checked={soundEnabled}
                                onChange={handleSoundToggle}
                            />
                            <AnimatePresence>
                                {soundEnabled && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className={styles.sliderBox}
                                    >
                                        <div className={styles.sliderHeader}>
                                            <span className={styles.rowLabel}>Intensity Level</span>
                                            <span className={styles.sliderValue}>{Math.round(soundVolume)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={soundVolume}
                                            onChange={(e) => handleVolumeChange(Number(e.target.value))}
                                            className={styles.premiumSlider}
                                        />
                                        <div className={styles.testBtnGroup}>
                                            <button className={styles.outlineBtn} onClick={() => sound.playClick()}>Simulate Interaction</button>
                                            <button className={styles.outlineBtn} onClick={() => sound.playSuccess()}>Validate Sync</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Signals Section */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader
                            icon={Bell}
                            title="Signal Protocol"
                            subtitle="Update Channels"
                            colorClass="bg-blue-500"
                        />
                        <div>
                            <ToggleRow icon={Mail} label="Email Dispatch" description="Weekly ecosystem summaries" checked={emailNotifications} onChange={setEmailNotifications} />
                            <ToggleRow icon={Zap} label="Push Signals" description="Real-time browser telemetry" checked={pushNotifications} onChange={setPushNotifications} />
                            <ToggleRow icon={PieChart} label="Analytics Pulse" description="Bi-weekly spending clusters" checked={weeklyReport} onChange={setWeeklyReport} />
                        </div>
                    </motion.div>

                    {/* Security Protocol Section */}
                    <motion.div variants={fadeInUp} className={styles.section}>
                        <SectionHeader
                            icon={ShieldAlert}
                            title="Sentinel Protocol"
                            subtitle="Vault Security"
                            colorClass="bg-emerald-500"
                        />
                        <div>
                            <ActionRow icon={Key} label="Rotate Passphrase" description="Update secure account key" onClick={() => toast.info('Feature locked: Scheduled for next update.')} />
                            <ActionRow icon={Smartphone} label="Network Sessions" description="Monitor active access points" onClick={() => toast.info('Feature locked: Scheduled for next update.')} />
                        </div>
                    </motion.div>

                    {/* Termination Zone */}
                    <motion.div variants={fadeInUp} className={cn(styles.section, styles.dangerSection)}>
                        <div className={cn(styles.sectionHeader, styles.dangerHeader)}>
                            <div className="p-3 rounded-xl bg-rose-500 text-white shadow-lg">
                                <Zap size={18} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className={cn(styles.sectionTitle, styles.dangerTitle)}>Danger Protocol</h3>
                                <p className={styles.sectionSubtitle}>Irreversible Operations</p>
                            </div>
                        </div>
                        <div>
                            <ActionRow icon={LogOut} label="Terminate Session" description="Securely exit ecosystem" onClick={handleLogout} danger />
                            <ActionRow icon={Trash2} label="Purge Data Archive" description="Wipe all cloud credentials" onClick={() => toast.error('Purge restricted: Contact Core Admin.')} danger />
                        </div>
                    </motion.div>
                </div>

                {/* Footer Metadata */}
                <motion.div variants={fadeInUp} className={styles.footer}>
                    <p className={styles.footerText}>
                        CASHLY CORE V2.0 <span className="mx-2 opacity-30">•</span> HIGH-FIDELITY BUILD
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default SettingsPage;
