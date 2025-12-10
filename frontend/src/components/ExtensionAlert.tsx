/* Extension Alert Banner - SIMPLIFIED - Only Install Prompt */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import styles from './ExtensionAlert.module.css';

interface ExtensionAlertProps {
    onDismiss?: () => void;
}

const ExtensionAlert = ({ onDismiss }: ExtensionAlertProps) => {
    const { user } = useAuthStore();
    const [isVisible, setIsVisible] = useState(false);

    // Check extension status and show install prompt if needed
    useEffect(() => {
        // Only show for logged in users
        if (!user?.id) return;

        // Check if dismissed recently (show again after 48 hours)
        const dismissed = localStorage.getItem('extension_alert_dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            if (Date.now() - dismissedTime < 48 * 60 * 60 * 1000) {
                return; // Still within dismiss period
            }
        }

        // Check if extension is already installed/synced
        const isSynced = localStorage.getItem('extension_synced') === 'true';
        const extensionData = localStorage.getItem('vibe_tracker_extension') ||
            localStorage.getItem('expense_tracker_extension');

        // If extension is installed or synced, don't show anything
        if (isSynced || extensionData) {
            return;
        }

        // Listen for show-extension-install-prompt event from useAuth
        const handleShowInstallPrompt = () => {
            const currentSynced = localStorage.getItem('extension_synced') === 'true';
            if (!currentSynced && user?.id) {
                setIsVisible(true);
            }
        };

        window.addEventListener('show-extension-install-prompt', handleShowInstallPrompt);

        // Cleanup
        return () => {
            window.removeEventListener('show-extension-install-prompt', handleShowInstallPrompt);
        };
    }, [user?.id]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('extension_alert_dismissed', Date.now().toString());
        onDismiss?.();
    };

    const handleGetExtension = () => {
        // Open extension section on landing page
        window.open('https://vibe-tracker-expense-genz.vercel.app/#extension', '_blank');
        handleDismiss();
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
                            <Download size={16} />
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
            </motion.div>
        </AnimatePresence>
    );
};

export default ExtensionAlert;
