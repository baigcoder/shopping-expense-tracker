// Offline Indicator Component
// Shows when user is offline and sync status

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, CloudOff, Cloud } from 'lucide-react';
import styles from './OfflineIndicator.module.css';

interface Props {
    onRetry?: () => void;
}

const OfflineIndicator = ({ onRetry }: Props) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showMessage, setShowMessage] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (wasOffline) {
                setShowMessage(true);
                // Auto-hide success message after 3 seconds
                setTimeout(() => setShowMessage(false), 3000);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
            setShowMessage(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [wasOffline]);

    // Don't show anything if online and no recent offline event
    if (isOnline && !showMessage) return null;

    return (
        <AnimatePresence>
            {showMessage && (
                <motion.div
                    className={`${styles.container} ${isOnline ? styles.online : styles.offline}`}
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                    <div className={styles.content}>
                        <div className={styles.icon}>
                            {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
                        </div>
                        <div className={styles.text}>
                            <span className={styles.title}>
                                {isOnline ? 'Back Online! 🎉' : 'You\'re Offline 📴'}
                            </span>
                            <span className={styles.subtitle}>
                                {isOnline
                                    ? 'Your data will sync automatically'
                                    : 'Changes will be saved when you reconnect'}
                            </span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {!isOnline && onRetry && (
                            <button onClick={onRetry} className={styles.retryBtn}>
                                <RefreshCw size={16} /> Retry
                            </button>
                        )}
                        <button
                            onClick={() => setShowMessage(false)}
                            className={styles.dismissBtn}
                        >
                            ✕
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Compact sync status indicator
export const SyncStatus = ({
    status
}: {
    status: 'synced' | 'syncing' | 'offline' | 'error'
}) => {
    const configs = {
        synced: { icon: Cloud, color: '#10B981', label: 'Synced' },
        syncing: { icon: RefreshCw, color: '#F59E0B', label: 'Syncing...' },
        offline: { icon: CloudOff, color: '#6B7280', label: 'Offline' },
        error: { icon: CloudOff, color: '#EF4444', label: 'Sync Error' },
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
        <div className={styles.syncStatus} style={{ color: config.color }}>
            <Icon
                size={14}
                className={status === 'syncing' ? styles.spinning : ''}
            />
            <span>{config.label}</span>
        </div>
    );
};

export default OfflineIndicator;
