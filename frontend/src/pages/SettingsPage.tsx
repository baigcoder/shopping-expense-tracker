import { useState, useEffect } from 'react';
import { Bell, Volume2, ShieldAlert, LogOut, User, Smartphone, Settings, ChevronRight, Save, Mail, Eye, Key, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../config/supabase';
import { useSound } from '@/hooks/useSound';

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
            toast.success('Sound effects enabled');
        } else {
            toast.info('Sound effects disabled');
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
            toast.success('Profile updated successfully');
            sound.playSuccess();
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error('Failed to update profile');
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Logout failed');
        }
    };

    // Section header component
    const SectionHeader = ({ icon: Icon, title, subtitle, gradient }: {
        icon: any;
        title: string;
        subtitle: string;
        gradient: string;
    }) => (
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className={`p-2 rounded-xl ${gradient} text-white shadow-md`}>
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <h3 className="font-semibold text-slate-800">{title}</h3>
                <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
        </div>
    );

    // Toggle row component
    const ToggleRow = ({ icon: Icon, label, description, checked, onChange }: {
        icon: any;
        label: string;
        description: string;
        checked: boolean;
        onChange: (v: boolean) => void;
    }) => (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-500">
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    <p className="text-xs text-slate-400">{description}</p>
                </div>
            </div>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );

    // Action row component
    const ActionRow = ({ icon: Icon, label, description, onClick, danger = false }: {
        icon: any;
        label: string;
        description: string;
        onClick: () => void;
        danger?: boolean;
    }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-5 py-3.5 border-b border-slate-50 last:border-b-0 transition-colors group ${danger ? "hover:bg-red-50/50" : "hover:bg-slate-50/50"
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${danger ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500"}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="text-left">
                    <p className={`text-sm font-medium ${danger ? "text-red-600" : "text-slate-700"}`}>{label}</p>
                    <p className="text-xs text-slate-400">{description}</p>
                </div>
            </div>
            <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${danger ? "text-red-300" : "text-slate-300"}`} />
        </button>
    );

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/20">
                        <Settings className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Settings</h1>
                        <p className="text-sm text-slate-500">Manage your account and preferences</p>
                    </div>
                </div>
            </motion.div>

            <div className="space-y-4">
                {/* Profile Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                    <SectionHeader
                        icon={User}
                        title="Profile"
                        subtitle="Your personal information"
                        gradient="bg-gradient-to-br from-teal-500 to-teal-600"
                    />
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Full Name</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="h-11 bg-slate-50 border-slate-200 focus:border-teal-400 focus:ring-teal-400/20"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Email</label>
                            <Input
                                value={email}
                                disabled
                                className="h-11 bg-slate-100 border-slate-200 text-slate-500"
                            />
                        </div>
                        <Button
                            onClick={handleUpdateProfile}
                            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md shadow-teal-500/20"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </motion.div>

                {/* Sound Effects Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                    <SectionHeader
                        icon={Volume2}
                        title="Sound Effects"
                        subtitle="Control sounds and volume"
                        gradient="bg-gradient-to-br from-orange-400 to-orange-500"
                    />
                    <div>
                        <ToggleRow
                            icon={Volume2}
                            label="Enable Sounds"
                            description="Play sounds for interactions"
                            checked={soundEnabled}
                            onChange={handleSoundToggle}
                        />
                        {soundEnabled && (
                            <div className="px-5 py-4 bg-slate-50/50">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-slate-600">Volume</span>
                                    <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{Math.round(soundVolume)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={soundVolume}
                                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-teal-500"
                                />
                                <div className="flex gap-2 mt-4">
                                    <Button size="sm" variant="outline" className="h-8 text-xs border-slate-200" onClick={() => sound.playClick()}>Test Click</Button>
                                    <Button size="sm" variant="outline" className="h-8 text-xs border-slate-200" onClick={() => sound.playSuccess()}>Test Success</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Notifications Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                    <SectionHeader
                        icon={Bell}
                        title="Notifications"
                        subtitle="How you receive updates"
                        gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                    />
                    <div>
                        <ToggleRow icon={Mail} label="Email Notifications" description="Receive updates via email" checked={emailNotifications} onChange={setEmailNotifications} />
                        <ToggleRow icon={Bell} label="Push Notifications" description="Browser alerts" checked={pushNotifications} onChange={setPushNotifications} />
                        <ToggleRow icon={Eye} label="Weekly Report" description="Spending summary" checked={weeklyReport} onChange={setWeeklyReport} />
                    </div>
                </motion.div>

                {/* Security Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                    <SectionHeader
                        icon={ShieldAlert}
                        title="Security"
                        subtitle="Account security options"
                        gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                    />
                    <div>
                        <ActionRow icon={Key} label="Change Password" description="Update your password" onClick={() => toast.info('Password change coming soon')} />
                        <ActionRow icon={Smartphone} label="Manage Sessions" description="View active sessions" onClick={() => toast.info('Session management coming soon')} />
                    </div>
                </motion.div>

                {/* Danger Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden"
                >
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-red-50 bg-red-50/30">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md">
                            <ShieldAlert className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-red-600">Danger Zone</h3>
                            <p className="text-xs text-red-400">Irreversible actions</p>
                        </div>
                    </div>
                    <div>
                        <ActionRow icon={LogOut} label="Sign Out" description="Log out of your account" onClick={handleLogout} danger />
                        <ActionRow icon={Trash2} label="Delete Account" description="Permanently delete your data" onClick={() => toast.error('Contact support to delete your account')} danger />
                    </div>
                </motion.div>
            </div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="py-6"
            >
                <p className="text-xs text-slate-400">
                    Cashly v2.0 • Made with ❤️
                </p>
            </motion.div>
        </div>
    );
};

export default SettingsPage;
