/* Extension Alert Banner - Gen Z Style */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import styles from './ExtensionAlert.module.css';

interface ExtensionAlertProps {
    onDismiss?: () => void;
}

const ExtensionAlert = ({ onDismiss }: ExtensionAlertProps) => {
    const { user } = useAuthStore();
    const [isVisible, setIsVisible] = useState(false);
    const [alertType, setAlertType] = useState<'install' | 'synced'>('install');

    useEffect(() => {
        // Only show for logged in users
        if (!user?.id) return;

        // Check if dismissed recently (show again after 24 hours)
        const dismissed = localStorage.getItem('extension_alert_dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
                return; // Still within 24 hour dismiss period
            }
        }

        // Check if extension is synced
        const extensionSynced = localStorage.getItem('extension_synced');
        if (extensionSynced === 'true') {
            // Show synced message briefly
            setAlertType('synced');
            setIsVisible(true);
            localStorage.removeItem('extension_synced');
            setTimeout(() => setIsVisible(false), 4000);
        } else {
            // Show install prompt after 2 seconds
            const timer = setTimeout(() => {
                setAlertType('install');
                setIsVisible(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [user?.id]);

    // Listen for extension sync message from content script
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.source === 'vibe-tracker-extension' && event.data?.type === 'SYNC_SUCCESS') {
                localStorage.setItem('extension_synced', 'true');
                setAlertType('synced');
                setIsVisible(true);
                setTimeout(() => setIsVisible(false), 4000);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('extension_alert_dismissed', Date.now().toString());
        onDismiss?.();
    };

    const handleGetExtension = () => {
        window.open('/#extension', '_blank');
    };

    if (!isVisible || !user?.id) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={styles.alertContainer}
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {alertType === 'synced' ? (
                    <div className={`${styles.alertCard} ${styles.syncedCard}`}>
                        <motion.div
                            className={styles.iconBounce}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5, repeat: 2 }}
                        >
                            <CheckCircle size={24} />
                        </motion.div>
                        <div className={styles.alertContent}>
                            <strong>🎉 Extension Synced!</strong>
                            <p>Auto-tracking enabled - your purchases will be logged automatically!</p>
                        </div>
                        <button className={styles.closeBtn} onClick={handleDismiss}>
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    <div className={styles.alertCard}>
                        <motion.span
                            className={styles.alertEmoji}
                            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                            transition={{ duration: 1, repeat: 2 }}
                        >
                            🧩
                        </motion.span>
                        <div className={styles.alertContent}>
                            <strong>Supercharge Your Tracking!</strong>
                            <p>Install our extension to auto-track purchases from 100+ stores 🛒</p>
                        </div>
                        <div className={styles.alertActions}>
                            <button className={styles.installBtn} onClick={handleGetExtension}>
                                <Zap size={16} />
                                Get Extension
                                <ExternalLink size={14} />
                            </button>
                            <button className={styles.laterBtn} onClick={handleDismiss}>
                                Later
                            </button>
                        </div>
                        <button className={styles.closeBtn} onClick={handleDismiss}>
                            <X size={18} />
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default ExtensionAlert;
