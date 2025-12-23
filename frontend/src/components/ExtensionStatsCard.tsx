// Extension Tracking Stats Card - Shows monitored sites and tracking status
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Activity, ArrowRight, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useExtensionSync } from '../hooks/useExtensionSync';
import styles from './ExtensionStatsCard.module.css';

interface TrackingStats {
    sitesTracked: number;
    pagesMonitored: number;
    isActive: boolean;
}

const ExtensionStatsCard = () => {
    const { extensionStatus, checking } = useExtensionSync();
    const [stats, setStats] = useState<TrackingStats>({
        sitesTracked: 0,
        pagesMonitored: 0,
        isActive: false
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                // Get tracking stats from extension via localStorage
                const trackingData = localStorage.getItem('finzen_tracking_stats');
                if (trackingData) {
                    const data = JSON.parse(trackingData);
                    setStats({
                        sitesTracked: data.sitesTracked || 0,
                        pagesMonitored: data.pagesMonitored || 0,
                        isActive: extensionStatus.installed && extensionStatus.loggedIn
                    });
                } else {
                    // Fallback: Get from chrome storage via extension if available
                    setStats({
                        sitesTracked: 0,
                        pagesMonitored: 0,
                        isActive: extensionStatus.installed && extensionStatus.loggedIn
                    });
                }
            } catch (error) {
                console.error('Error loading tracking stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!checking) {
            loadStats();
        }

        // Listen for stats updates from extension
        const handleStatsUpdate = (event: CustomEvent) => {
            setStats(prev => ({
                ...prev,
                sitesTracked: event.detail.sitesTracked || prev.sitesTracked,
                pagesMonitored: event.detail.pagesMonitored || prev.pagesMonitored
            }));
        };

        window.addEventListener('extension-stats-updated', handleStatsUpdate as EventListener);
        return () => window.removeEventListener('extension-stats-updated', handleStatsUpdate as EventListener);
    }, [checking, extensionStatus.installed, extensionStatus.loggedIn]);

    const isConnected = extensionStatus.installed && extensionStatus.loggedIn;

    return (
        <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <Globe className={styles.icon} size={18} />
                    <span className={styles.title}>Extension Tracking</span>
                </div>
                <div className={`${styles.statusBadge} ${isConnected ? styles.connected : styles.disconnected}`}>
                    {isConnected ? (
                        <>
                            <Wifi size={12} />
                            <span>Active</span>
                        </>
                    ) : (
                        <>
                            <WifiOff size={12} />
                            <span>Offline</span>
                        </>
                    )}
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                    <div className={styles.statValue}>
                        {loading ? (
                            <RefreshCw size={16} className={styles.spinning} />
                        ) : (
                            stats.sitesTracked
                        )}
                    </div>
                    <div className={styles.statLabel}>Sites Tracked</div>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                    <div className={styles.statValue}>
                        {loading ? (
                            <RefreshCw size={16} className={styles.spinning} />
                        ) : (
                            <span className={isConnected ? styles.activeNum : ''}>
                                {isConnected ? '●' : '○'}
                            </span>
                        )}
                    </div>
                    <div className={styles.statLabel}>Monitoring</div>
                </div>
            </div>

            <Link to="/shopping-activity" className={styles.seeMore}>
                <span>View Shopping Activity</span>
                <ArrowRight size={14} />
            </Link>
        </motion.div>
    );
};

export default ExtensionStatsCard;
