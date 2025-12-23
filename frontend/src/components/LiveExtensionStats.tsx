// Live Extension Stats - Shows real-time extension activity
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, Clock, Wifi, WifiOff, ShoppingCart, ArrowRight, Eye, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './LiveExtensionStats.module.css';

interface ExtensionStats {
    todayTracked: number;
    weeklyTracked: number;
    pendingSync: number;
    lastSync: number | null;
    isOnline: boolean;
    currentSite: string | null;
    siteVisits: number;
}

const LiveExtensionStats = () => {
    const [stats, setStats] = useState<ExtensionStats>({
        todayTracked: 0,
        weeklyTracked: 0,
        pendingSync: 0,
        lastSync: null,
        isOnline: false,
        currentSite: null,
        siteVisits: 0
    });

    const [showSitePopup, setShowSitePopup] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch site visits from localStorage and calculate today/week counts
    const fetchSiteVisits = () => {
        try {
            const siteVisitsData = localStorage.getItem('cashly_site_visits');
            if (siteVisitsData) {
                const sites = JSON.parse(siteVisitsData);
                const siteCount = Object.keys(sites).length;

                // Calculate today's start and week's start
                const now = Date.now();
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - 7);
                weekStart.setHours(0, 0, 0, 0);

                // Count visits today and this week
                let todayCount = 0;
                let weekCount = 0;
                let totalVisits = 0;

                Object.values(sites).forEach((site: any) => {
                    const visitCount = site.visitCount || 1;
                    totalVisits += visitCount;

                    // Check if visited today
                    const lastVisited = site.lastVisited || site.firstVisited;
                    if (lastVisited >= todayStart.getTime()) {
                        todayCount += visitCount;
                    }
                    // Check if visited this week
                    if (lastVisited >= weekStart.getTime()) {
                        weekCount += visitCount;
                    }
                });

                setStats(prev => ({
                    ...prev,
                    siteVisits: siteCount,
                    todayTracked: todayCount,
                    weeklyTracked: weekCount
                }));
            }
        } catch (error) {
            console.error('Error fetching site visits:', error);
        }
    };

    useEffect(() => {
        // Check extension status
        const checkStatus = async () => {
            try {
                // Check for extension presence and sync status with EXACT keys the extension uses
                const extensionSynced = localStorage.getItem('cashly_extension_synced');
                const extensionData = localStorage.getItem('cashly_extension');
                const extensionAuth = localStorage.getItem('cashly_extension_auth');

                let isOnline = false;
                let lastSyncTime = null;

                // Check synced status (most reliable)
                if (extensionSynced) {
                    const syncedData = JSON.parse(extensionSynced);
                    const isSyncedRecently = Date.now() - syncedData.timestamp < 60000; // 1 minute
                    isOnline = syncedData.synced === true || isSyncedRecently;
                    lastSyncTime = syncedData.timestamp;
                }

                // Check extension data (ping)
                if (extensionData) {
                    const data = JSON.parse(extensionData);
                    const isRecent = Date.now() - data.timestamp < 60000; // 1 minute
                    isOnline = isOnline || (data.installed && isRecent);
                    lastSyncTime = lastSyncTime || data.timestamp;
                }

                // Check auth status (logged in)
                if (extensionAuth) {
                    const authData = JSON.parse(extensionAuth);
                    isOnline = isOnline || authData.loggedIn === true;
                }

                setStats(prev => ({
                    ...prev,
                    isOnline,
                    lastSync: lastSyncTime
                }));

                // Fetch real data from localStorage
                fetchSiteVisits();

            } catch (error) {
                console.error('Stats check error:', error);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();

        // Poll every 10 seconds
        const interval = setInterval(checkStatus, 10000);

        return () => clearInterval(interval);
    }, []);

    // Listen for real-time updates
    useEffect(() => {
        const handleNewTransaction = () => {
            setStats(prev => ({
                ...prev,
                todayTracked: prev.todayTracked + 1,
                weeklyTracked: prev.weeklyTracked + 1,
                lastSync: Date.now()
            }));
        };

        // Live site visit tracking
        const handleSiteVisit = (e: CustomEvent) => {
            const siteName = e.detail?.siteName || 'Shopping Site';
            setStats(prev => ({
                ...prev,
                currentSite: siteName,
                siteVisits: prev.siteVisits + 1
            }));
            setShowSitePopup(true);
            setTimeout(() => setShowSitePopup(false), 3000);
        };

        // Storage change listener for cross-tab sync
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'cashly_site_visits') {
                fetchSiteVisits();
            }
        };

        window.addEventListener('new-transaction', handleNewTransaction);
        window.addEventListener('transaction-added-realtime', handleNewTransaction);
        window.addEventListener('site-visit-tracked', handleSiteVisit as EventListener);
        window.addEventListener('shopping-site-detected', handleSiteVisit as EventListener);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('new-transaction', handleNewTransaction);
            window.removeEventListener('transaction-added-realtime', handleNewTransaction);
            window.removeEventListener('site-visit-tracked', handleSiteVisit as EventListener);
            window.removeEventListener('shopping-site-detected', handleSiteVisit as EventListener);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const formatLastSync = (timestamp: number | null) => {
        if (!timestamp) return 'Never';

        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                    <span>Checking extension...</span>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className={styles.header}>
                <h3>🔌 Extension Status</h3>
                <div className={`${styles.status} ${stats.isOnline ? styles.online : styles.offline}`}>
                    {stats.isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                    <span>{stats.isOnline ? 'LIVE' : 'OFFLINE'}</span>
                </div>
            </div>

            <div className={styles.stats}>
                <motion.div
                    className={styles.stat}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className={styles.statIcon} style={{ background: '#FBBF24' }}>
                        <Zap size={24} fill="#000" />
                    </div>
                    <div className={styles.statInfo}>
                        <strong>{stats.todayTracked}</strong>
                        <span>Tracked Today</span>
                    </div>
                </motion.div>

                <motion.div
                    className={styles.stat}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className={styles.statIcon} style={{ background: '#10B981' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <strong>{stats.weeklyTracked}</strong>
                        <span>This Week</span>
                    </div>
                </motion.div>

                <motion.div
                    className={styles.stat}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className={styles.statIcon} style={{ background: '#3B82F6' }}>
                        <Clock size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <strong>{formatLastSync(stats.lastSync)}</strong>
                        <span>Last Sync</span>
                    </div>
                </motion.div>

                {/* Sites Tracked Stat */}
                <motion.div
                    className={styles.stat}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className={styles.statIcon} style={{ background: '#EC4899' }}>
                        <Globe size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <strong>{stats.siteVisits}</strong>
                        <span>Sites Tracked</span>
                    </div>
                </motion.div>
            </div>

            {stats.pendingSync > 0 && (
                <motion.div
                    className={styles.pending}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                >
                    <span>⏳</span>
                    <p>{stats.pendingSync} transaction(s) pending sync</p>
                </motion.div>
            )}

            {/* Live Site Popup */}
            <AnimatePresence>
                {showSitePopup && stats.currentSite && (
                    <motion.div
                        className={styles.sitePopup}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <ShoppingCart size={16} />
                        <span>Tracking: <strong>{stats.currentSite}</strong></span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* See More Link */}
            <Link to="/shopping-activity" className={styles.seeMore}>
                <Eye size={16} />
                <span>See All Activity</span>
                <ArrowRight size={16} />
            </Link>
        </motion.div>
    );
};

export default LiveExtensionStats;
