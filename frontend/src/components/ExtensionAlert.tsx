/* Extension Alert Banner - Gen Z Style */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, CheckCircle, ExternalLink } from 'lucide-react';
import { extensionService } from '../services/extensionService';
import { useAuthStore } from '../store/useStore';
import styles from './ExtensionAlert.module.css';

interface ExtensionAlertProps {
    onDismiss?: () => void;
}

const ExtensionAlert = ({ onDismiss }: ExtensionAlertProps) => {
    const { user } = useAuthStore();
    const [isVisible, setIsVisible] = useState(false);
    const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [showSyncSuccess, setShowSyncSuccess] = useState(false);

    useEffect(() => {
        // Only check if user is logged in
        if (user?.id) {
            // Small delay to let page settle
            const timer = setTimeout(() => {
                checkExtensionStatus();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [user?.id]);

    // Listen for extension sync events
    useEffect(() => {
        const handleExtensionMessage = (event: MessageEvent) => {
            if (event.data?.source === 'extension' && event.data?.type === 'SYNC_COMPLETE') {
                setIsExtensionInstalled(true);
                setIsSynced(true);
                setShowSyncSuccess(true);
                setIsVisible(true);

                // Hide after 4 seconds
                setTimeout(() => {
                    setIsVisible(false);
                    setShowSyncSuccess(false);
                }, 4000);
            }
        };

        window.addEventListener('message', handleExtensionMessage);
        return () => window.removeEventListener('message', handleExtensionMessage);
    }, []);

    const checkExtensionStatus = async () => {
        // Check if user has dismissed recently (24 hours for install prompt)
        const dismissed = localStorage.getItem('extension_alert_dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            // Show again after 24 hours (not 7 days - more frequent reminder)
            if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
                return;
            }
        }

        try {
            const status = await extensionService.checkExtension();
            console.log('Extension status:', status);

            if (status.installed) {
                setIsExtensionInstalled(true);
                const synced = status.loggedIn === true;
                setIsSynced(synced);

                // Show synced message briefly if connected
                if (synced) {
                    setShowSyncSuccess(true);
                    setIsVisible(true);
                    setTimeout(() => {
                        setIsVisible(false);
                        setShowSyncSuccess(false);
                    }, 4000);
                } else {
                    // Extension installed but not synced - prompt to sync
                    setIsVisible(true);
                }
            } else {
                // Extension NOT installed - show install prompt
                console.log('Extension not installed, showing prompt');
                setIsVisible(true);
            }
        } catch (error) {
            console.log('Extension check error, showing install prompt');
            // Extension check failed - show install prompt
            setIsVisible(true);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('extension_alert_dismissed', Date.now().toString());
        onDismiss?.();
    };

    const handleDownload = () => {
        // Open extension section in new tab or scroll
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
                {showSyncSuccess ? (
                    // Synced Alert - Success Message
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
                            <p>Auto-tracking enabled! Your purchases will be logged automatically.</p>
                        </div>
                        <button className={styles.closeBtn} onClick={handleDismiss}>
                            <X size={18} />
                        </button>
                    </div>
                ) : isExtensionInstalled && !isSynced ? (
                    // Extension installed but not synced
                    <div className={`${styles.alertCard} ${styles.warningCard}`}>
                        <motion.span
                            className={styles.alertEmoji}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            🔗
                        </motion.span>
                        <div className={styles.alertContent}>
                            <strong>Extension Found! Login to Sync</strong>
                            <p>Click the extension icon and sign in to enable auto-tracking.</p>
                        </div>
                        <button className={styles.laterBtn} onClick={handleDismiss}>
                            Got it
                        </button>
                        <button className={styles.closeBtn} onClick={handleDismiss}>
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    // Install Alert - Extension not installed
                    <div className={styles.alertCard}>
                        <motion.span
                            className={styles.alertEmoji}
                            animate={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.5, repeat: 3 }}
                        >
                            🧩
                        </motion.span>
                        <div className={styles.alertContent}>
                            <strong>Get the Browser Extension!</strong>
                            <p>Auto-track purchases from Amazon, eBay & 100+ stores 🛒</p>
                        </div>
                        <div className={styles.alertActions}>
                            <button className={styles.installBtn} onClick={handleDownload}>
                                <Zap size={16} />
                                Install Free
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
