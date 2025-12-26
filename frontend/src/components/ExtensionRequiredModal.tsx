// Extension Required Modal - Ultra Premium AI Chat Theme
import { motion, AnimatePresence } from 'framer-motion';
import { Chrome, ShoppingCart, Bell, Zap, Download, RefreshCw, Home, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { supabase } from '../config/supabase';
import styles from './ExtensionRequiredModal.module.css';

const ExtensionRequiredModal = () => {
    const { setUser } = useAuthStore();

    const handleGoHome = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            window.location.href = '/';
        } catch (error) {
            window.location.href = '/';
        }
    };

    // Advanced animation variants for a "premium" entrance
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.4
            }
        },
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 10 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 20 }
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className={styles.modal}
                    initial={{ scale: 0.85, y: 40, opacity: 0, rotateX: 10 }}
                    animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
                    exit={{ scale: 0.95, y: 20, opacity: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 24,
                        mass: 1.2
                    }}
                >
                    <div className={styles.header}>
                        <motion.div
                            className={styles.iconWrapper}
                            initial={{ scale: 0, rotate: -15 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
                        >
                            <Chrome size={28} strokeWidth={2.5} />

                            {/* Floating Sparkle Animation */}
                            <motion.div
                                style={{ position: 'absolute', top: -4, right: -4 }}
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <Sparkles size={16} fill="#FACC15" color="#FACC15" />
                            </motion.div>
                        </motion.div>

                        <motion.div
                            className={styles.statusBadge}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <span className={styles.statusDot} />
                            <span className={styles.statusText}>Action Required</span>
                        </motion.div>

                        <h2 className={styles.title}>Extension Required</h2>
                        <p className={styles.subtitle}>
                            Install the Finzen extension to unlock real-time purchase tracking & high-frequency syncing.
                        </p>
                    </div>

                    <div className={styles.scrollableContent}>
                        <motion.div
                            className={styles.features}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div className={styles.feature} variants={itemVariants}>
                                <ShoppingCart size={20} />
                                <span>Automatic Purchase Capture</span>
                            </motion.div>
                            <motion.div className={styles.feature} variants={itemVariants}>
                                <Bell size={20} />
                                <span>Real-time Spend Alerts</span>
                            </motion.div>
                            <motion.div className={styles.feature} variants={itemVariants}>
                                <Zap size={20} />
                                <span>Instant Cloud Sync (&lt;100ms)</span>
                            </motion.div>
                        </motion.div>

                        <div className={styles.actions}>
                            <motion.button
                                onClick={() => window.open('/cashly-extension.zip', '_blank')}
                                className={styles.installBtn}
                                whileHover={{ scale: 1.02, translateY: -2 }}
                                whileTap={{ scale: 0.98 }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                <Download size={20} />
                                DOWNLOAD EXTENSION
                            </motion.button>

                            <motion.button
                                onClick={() => window.location.href = '/dashboard'}
                                className={styles.refreshBtn}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                <RefreshCw size={18} />
                                Already Installed? Refresh Page
                            </motion.button>

                            <motion.button
                                onClick={handleGoHome}
                                className={styles.homeBtn}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                            >
                                <Home size={18} />
                                Back to Home
                            </motion.button>
                        </div>

                        <motion.div
                            className={styles.instructions}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1 }}
                        >
                            <h4><Sparkles size={14} fill="currentColor" /> Quick Install Guide</h4>
                            <ol>
                                <li>Download and extract the <code>.zip</code> file</li>
                                <li>Open <code>chrome://extensions</code> in your browser</li>
                                <li>Enable <b>Developer mode</b> toggle</li>
                                <li>Click <b>Load unpacked</b> & select the folder</li>
                            </ol>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ExtensionRequiredModal;
