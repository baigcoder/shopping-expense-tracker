// Extension Tracking Stats Card - Premium Obsidian Tracking Widget
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Activity, ArrowRight, RefreshCw, Wifi, WifiOff, Puzzle, Shield } from 'lucide-react';
import { useExtensionSync } from '../hooks/useExtensionSync';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
                const trackingData = localStorage.getItem('finzen_tracking_stats');
                if (trackingData) {
                    const data = JSON.parse(trackingData);
                    setStats({
                        sitesTracked: data.sitesTracked || 0,
                        pagesMonitored: data.pagesMonitored || 0,
                        isActive: !!(extensionStatus.installed && extensionStatus.loggedIn)
                    });
                } else {
                    setStats({
                        sitesTracked: 0,
                        pagesMonitored: 0,
                        isActive: !!(extensionStatus.installed && extensionStatus.loggedIn)
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

    const isConnected = !checking && extensionStatus.installed && extensionStatus.loggedIn;

    return (
        <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <div className={styles.icon}>
                        <Shield size={18} strokeWidth={2.5} />
                    </div>
                    <span className={styles.title}>Extension Monitor</span>
                </div>
                <div className={cn(styles.statusBadge, isConnected ? styles.connected : styles.disconnected)}>
                    {isConnected ? (
                        <>
                            <Wifi size={12} strokeWidth={2.5} />
                            <span>Active</span>
                        </>
                    ) : (
                        <>
                            <WifiOff size={12} strokeWidth={2.5} />
                            <span>Inactive</span>
                        </>
                    )}
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                    <div className={styles.statValue}>
                        {loading ? (
                            <RefreshCw size={20} className={styles.spinning} strokeWidth={2.5} />
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
                            <RefreshCw size={20} className={styles.spinning} strokeWidth={2.5} />
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" : "bg-rose-500 shadow-[0_0_8px_#e11d48]")} />
                                <span className={cn("text-xs font-bold", isConnected ? "text-emerald-500" : "text-rose-500")}>
                                    {isConnected ? "Live" : "Offline"}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className={styles.statLabel}>Signal Status</div>
                </div>
            </div>

            <div className={styles.actionButtons}>
                {isConnected ? (
                    <button
                        className={styles.openExtensionBtn}
                        onClick={() => {
                            toast.info(
                                <div className="flex flex-col gap-2 p-1">
                                    <div className="flex items-center gap-2 text-blue-400 font-bold">
                                        <Puzzle size={16} />
                                        <span>Open Extension</span>
                                    </div>
                                    <p className="text-xs text-white/70 leading-relaxed">
                                        Click the puzzle icon in your browser toolbar and select Cashly to manage your tracking.
                                    </p>
                                </div>,
                                {
                                    style: { background: '#0f111a', border: '1px solid rgba(255,255,255,0.1)', color: 'white' },
                                    duration: 5000
                                }
                            );
                        }}
                    >
                        <Puzzle size={14} />
                        <span>Manage</span>
                    </button>
                ) : (
                    <a
                        href="/cashly-extension.zip"
                        download="cashly-extension-v6.0.0.zip"
                        className={styles.installExtensionBtn}
                    >
                        <Activity size={14} />
                        <span>Install</span>
                    </a>
                )}

                <Link to="/shopping-activity" className={styles.seeMore}>
                    <span>Activity</span>
                    <ArrowRight size={14} />
                </Link>
            </div>
        </motion.div>
    );
};

export default ExtensionStatsCard;
