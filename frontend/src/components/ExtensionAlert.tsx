/* Extension Alert Banner - Gen Z Style */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Zap, CheckCircle } from 'lucide-react';
import { extensionService } from '../services/extensionService';
import styles from './ExtensionAlert.module.css';

interface ExtensionAlertProps {
    onDismiss?: () => void;
}

const ExtensionAlert = ({ onDismiss }: ExtensionAlertProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
    const [isSynced, setIsSynced] = useState(false);

    useEffect(() => {
        checkExtensionStatus();
    }, []);

    const checkExtensionStatus = async () => {
        // Check if user has already dismissed this alert
        const dismissed = localStorage.getItem('extension_alert_dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            // Show again after 7 days
            if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
                return;
            }
        }

        try {
            const status = await extensionService.checkExtension();

            if (status.installed) {
                setIsExtensionInstalled(true);
                setIsSynced(status.syncStatus?.synced || false);

                // Show synced message briefly
                if (status.syncStatus?.synced) {
                    setIsVisible(true);
                    setTimeout(() => {
                        setIsVisible(false);
                    }, 3000);
                }
            } else {
                // Extension not installed - show install prompt
                setIsVisible(true);
            }
        } catch (error) {
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
        // Link to extension download or landing page
        window.location.href = '/#extension';
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={styles.alertContainer}
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {isExtensionInstalled && isSynced ? (
                    // Synced Alert
                    <div className={`${styles.alertCard} ${styles.syncedCard}`}>
                        <motion.div
                            className={styles.iconBounce}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5 }}
                        >
                            <CheckCircle size={24} />
                        </motion.div>
                        <div className={styles.alertContent}>
                            <strong>Extension Synced! ✨</strong>
                            <p>Your purchases will be tracked automatically</p>
                        </div>
                        <button className={styles.closeBtn} onClick={handleDismiss}>
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    // Install Alert
                    <div className={styles.alertCard}>
                        <motion.span
                            className={styles.alertEmoji}
                            animate={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.5, repeat: 2 }}
                        >
                            🧩
                        </motion.span>
                        <div className={styles.alertContent}>
                            <strong>Install Browser Extension</strong>
                            <p>Auto-track your purchases & never miss an expense!</p>
                        </div>
                        <div className={styles.alertActions}>
                            <button className={styles.installBtn} onClick={handleDownload}>
                                <Zap size={16} />
                                Get Extension
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
