// Extension Required Modal - Compact Version
import { motion } from 'framer-motion';
import { Chrome, ShoppingCart, Bell, Zap, Download, RefreshCw, Home } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { supabase } from '../config/supabase';
import styles from './ExtensionRequiredModal.module.css';

const ExtensionRequiredModal = () => {
    const { setUser } = useAuthStore();

    const handleGoHome = async () => {
        console.log('Home button clicked - logging out and navigating to landing page');
        try {
            // Logout user
            await supabase.auth.signOut();
            setUser(null);
            // Navigate to home
            window.location.href = '/';
        } catch (error) {
            console.error('Error logging out:', error);
            // Force navigation anyway
            window.location.href = '/';
        }
    };

    return (
        <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className={styles.modal}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
            >
                <div className={styles.header}>
                    <h2 className={styles.title}>Extension Required 🔌</h2>
                    <p className={styles.subtitle}>
                        Install Finzen extension to auto-track purchases and sync everything.
                    </p>
                </div>

                <div className={styles.scrollableContent}>
                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <ShoppingCart size={20} />
                            <span>Auto-Track Purchases</span>
                        </div>
                        <div className={styles.feature}>
                            <Bell size={20} />
                            <span>Smart Notifications</span>
                        </div>
                        <div className={styles.feature}>
                            <Zap size={20} />
                            <span>Real-time Sync</span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button
                            onClick={() => window.open('/finzen-extension-v3.2.1.zip', '_blank')}
                            className={styles.installBtn}
                        >
                            <Download size={20} />
                            DOWNLOAD EXTENSION
                        </button>
                        <button onClick={() => window.location.href = '/dashboard'} className={styles.refreshBtn}>
                            <RefreshCw size={18} />
                            Already Installed? Refresh
                        </button>
                        <button onClick={handleGoHome} className={styles.homeBtn}>
                            <Home size={18} />
                            Go to Home
                        </button>
                    </div>

                    <div className={styles.instructions}>
                        <p><strong>Quick Install:</strong></p>
                        <ol>
                            <li>Download & extract the zip file</li>
                            <li>Go to <code>chrome://extensions/</code></li>
                            <li>Enable "Developer mode" → Click "Load unpacked"</li>
                            <li>Select the extracted folder → Done! 🎉</li>
                        </ol>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ExtensionRequiredModal;
