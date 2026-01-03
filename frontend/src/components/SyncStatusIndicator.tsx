// Sync Status Indicator - Shows realtime connection health
import { motion } from 'framer-motion';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import styles from './SyncStatusIndicator.module.css';

const SyncStatusIndicator = () => {
    const { connectionStatus, reconnect } = useRealtimeSync();

    const getStatusConfig = () => {
        switch (connectionStatus) {
            case 'connected':
                return {
                    icon: Wifi,
                    color: 'var(--success-500, #10B981)',
                    label: 'Synced',
                    bgClass: styles.connected
                };
            case 'connecting':
                return {
                    icon: Loader2,
                    color: 'var(--warning-500, #F59E0B)',
                    label: 'Connecting...',
                    bgClass: styles.connecting
                };
            case 'disconnected':
            default:
                return {
                    icon: WifiOff,
                    color: 'var(--error-500, #EF4444)',
                    label: 'Offline',
                    bgClass: styles.disconnected
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <motion.div
            className={`${styles.indicator} ${config.bgClass}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={connectionStatus === 'disconnected' ? reconnect : undefined}
            title={connectionStatus === 'disconnected' ? 'Click to reconnect' : `Status: ${config.label}`}
            style={{ cursor: connectionStatus === 'disconnected' ? 'pointer' : 'default' }}
        >
            <Icon
                size={12}
                color={config.color}
                className={connectionStatus === 'connecting' ? styles.spinning : ''}
            />
            <span className={styles.label} style={{ color: config.color }}>
                {config.label}
            </span>
        </motion.div>
    );
};

export default SyncStatusIndicator;
