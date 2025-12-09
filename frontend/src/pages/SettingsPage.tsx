// Settings Page - Gen Z Edition
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Moon, Lock, Globe, Volume2, ShieldAlert, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout as supabaseLogout } from '../config/supabase';
import ConfirmModal from '../components/ConfirmModal';
import styles from './SettingsPage.module.css';

const SettingsPage = () => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [sound, setSound] = useState(true);
    const [language, setLanguage] = useState('en');

    // Modal states
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleLogout = async () => {
        try {
            // Clear Supabase session first
            await supabaseLogout();
            // Clear Zustand store
            logout();
            // Clear ALL localStorage
            localStorage.clear();
            toast.success("Later skater! 👋");
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout anyway
            logout();
            localStorage.clear();
            navigate('/login');
        }
    };

    const handleDeleteAccount = () => {
        toast.error("Can't do that yet, but I admire the boldness.");
    };

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>Settings ⚙️</h1>
                <p>Tweak it 'til it breaks. (JK, don't break it).</p>
            </motion.div>

            <motion.div
                className={styles.settingsGrid}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
            >
                {/* Visuals & Sound */}
                <motion.div
                    className={styles.settingsGroup}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                >
                    <div className={styles.groupHeader}>
                        <Moon size={24} />
                        <h2>Vibe & Feel</h2>
                    </div>

                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>Dark Mode</h3>
                            <p>Join the dark side (Coming Soon)</p>
                        </div>
                        <input
                            type="checkbox"
                            className={styles.toggle}
                            checked={darkMode}
                            onChange={(e) => {
                                setDarkMode(e.target.checked);
                                toast.info("Still working on the goth vibes! 🖤");
                            }}
                        />
                    </div>

                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>Sound Effects</h3>
                            <p>Boops and bops when you click stuff</p>
                        </div>
                        <input
                            type="checkbox"
                            className={styles.toggle}
                            checked={sound}
                            onChange={(e) => setSound(e.target.checked)}
                        />
                    </div>
                </motion.div>

                {/* Notifications */}
                <motion.div
                    className={styles.settingsGroup}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className={styles.groupHeader}>
                        <Bell size={24} />
                        <h2>Notifications</h2>
                    </div>

                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>Push Notifications</h3>
                            <p>Get bugged about your spending</p>
                        </div>
                        <input
                            type="checkbox"
                            className={styles.toggle}
                            checked={notifications}
                            onChange={(e) => setNotifications(e.target.checked)}
                        />
                    </div>

                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>Weekly Report</h3>
                            <p>The "Where did my money go?" summary</p>
                        </div>
                        <input
                            type="checkbox"
                            className={styles.toggle}
                            defaultChecked
                        />
                    </div>
                </motion.div>

                {/* General */}
                <motion.div
                    className={styles.settingsGroup}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className={styles.groupHeader}>
                        <Globe size={24} />
                        <h2>General</h2>
                    </div>

                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>Language</h3>
                            <p>What do you speak?</p>
                        </div>
                        <select
                            className={styles.select}
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="en">English (Gen Z)</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                        </select>
                    </div>

                    <div className={styles.settingItem} style={{ cursor: 'pointer' }} onClick={() => setShowLogoutModal(true)}>
                        <div className={styles.settingInfo}>
                            <h3 style={{ color: '#EF4444' }}>Log Out</h3>
                            <p>See ya later!</p>
                        </div>
                        <LogOut size={20} color="#EF4444" />
                    </div>
                </motion.div>

                {/* Danger Zone */}
                <motion.div
                    className={`${styles.settingsGroup} ${styles.dangerZone}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className={styles.groupHeader}>
                        <ShieldAlert size={24} />
                        <h2>Danger Zone ⚠️</h2>
                    </div>

                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>Delete Account</h3>
                            <p>Nuke everything. No take-backs.</p>
                        </div>
                        <button className={styles.dangerBtn} onClick={() => setShowDeleteModal(true)}>
                            Delete My A/C
                        </button>
                    </div>
                </motion.div>

            </motion.div>

            {/* Logout Confirmation Modal */}
            <ConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
                title="Bailing Already?"
                message="Are you sure you want to log out? We'll miss you!"
                confirmText="Yes, Log Out"
                cancelText="Stay"
                type="warning"
            />

            {/* Delete Account Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account?"
                message="This action is permanent. All your data will be gone forever!"
                confirmText="Delete Forever"
                cancelText="Keep My Account"
                type="danger"
            />
        </div>
    );
};

export default SettingsPage;
