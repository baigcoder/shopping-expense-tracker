import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, DollarSign, Bell, Eye, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './DarkPatternShield.module.css';

interface ProtectionStats {
    totalDetected: number;
    totalBlocked: number;
    totalSaved: number;
    activeReminders: number;
    recentDetections: Array<{
        url: string;
        date: string;
        patterns: string[];
    }>;
}

interface DarkPatternShieldProps {
    compact?: boolean;
}

const DarkPatternShield: React.FC<DarkPatternShieldProps> = ({ compact = false }) => {
    const [stats, setStats] = useState<ProtectionStats>({
        totalDetected: 0,
        totalBlocked: 0,
        totalSaved: 0,
        activeReminders: 0,
        recentDetections: []
    });
    const [isExtensionConnected, setIsExtensionConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        checkExtensionAndLoadStats();

        // Listen for protection updates from extension
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'DARK_PATTERN_STATS_UPDATED') {
                setStats(event.data.stats);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const checkExtensionAndLoadStats = async () => {
        try {
            // Check if extension is installed
            const extensionId = localStorage.getItem('vibeTrackerExtensionId');

            if (extensionId && typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage(extensionId, { type: 'GET_PROTECTION_STATS' }, (response) => {
                    if (response?.success) {
                        setIsExtensionConnected(true);
                        setStats({
                            totalDetected: response.stats.totalDetected || 0,
                            totalBlocked: response.stats.totalBlocked || 0,
                            totalSaved: response.stats.totalSaved || 0,
                            activeReminders: response.stats.activeReminders || 0,
                            recentDetections: response.stats.detections?.slice(0, 5) || []
                        });
                    }
                });
            }

            // Also check localStorage for demo/local stats
            const localStats = localStorage.getItem('vt_dark_pattern_stats');
            if (localStats) {
                const parsed = JSON.parse(localStats);
                setStats(prev => ({
                    ...prev,
                    ...parsed
                }));
            }
        } catch (error) {
            console.log('Extension check failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number): string => {
        if (amount >= 1000) {
            return `Rs ${(amount / 1000).toFixed(1)}K`;
        }
        return `Rs ${amount.toFixed(0)}`;
    };

    if (compact) {
        return (
            <Link to="/protection" style={{ textDecoration: 'none' }}>
                <motion.div
                    className={styles.compactCard}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className={styles.compactHeader}>
                        <div className={styles.shieldIcon}>
                            <Shield size={20} />
                        </div>
                        <span className={styles.compactTitle}>Dark Pattern Shield</span>
                        <span className={styles.statusBadge}>
                            <span className={styles.statusDot}></span>
                            Active
                        </span>
                    </div>

                    <div className={styles.compactStats}>
                        <div className={styles.compactStat}>
                            <AlertTriangle size={14} />
                            <span className={styles.statValue}>{stats.totalDetected}</span>
                            <span className={styles.statLabel}>Detected</span>
                        </div>
                        <div className={styles.compactStat}>
                            <Zap size={14} />
                            <span className={styles.statValue}>{stats.totalBlocked}</span>
                            <span className={styles.statLabel}>Blocked</span>
                        </div>
                        <div className={styles.compactStat}>
                            <DollarSign size={14} />
                            <span className={styles.statValue}>{formatCurrency(stats.totalSaved)}</span>
                            <span className={styles.statLabel}>Saved</span>
                        </div>
                    </div>

                    <div className={styles.viewMore}>
                        <span>View Details</span>
                        <ChevronRight size={14} />
                    </div>
                </motion.div>
            </Link>
        );
    }

    return (
        <motion.div
            className={styles.shieldCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Animated background elements */}
            <div className={styles.bgPattern}></div>
            <div className={styles.shieldGlow}></div>

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <motion.div
                        className={styles.shieldIconLarge}
                        animate={{
                            boxShadow: [
                                '0 0 20px rgba(16, 185, 129, 0.3)',
                                '0 0 40px rgba(16, 185, 129, 0.5)',
                                '0 0 20px rgba(16, 185, 129, 0.3)'
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Shield size={28} />
                    </motion.div>
                    <div className={styles.headerText}>
                        <h3 className={styles.title}>Dark Pattern Shield</h3>
                        <p className={styles.subtitle}>Silent Subscription Protection</p>
                    </div>
                </div>

                <div className={styles.statusPill}>
                    <motion.span
                        className={styles.statusDotLarge}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    ></motion.span>
                    Protected
                </div>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <motion.div
                    className={styles.statCard}
                    whileHover={{ scale: 1.03, y: -2 }}
                >
                    <div className={styles.statIconWrap} style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                        <AlertTriangle size={18} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statNumber}>{stats.totalDetected}</span>
                        <span className={styles.statName}>Patterns Detected</span>
                    </div>
                </motion.div>

                <motion.div
                    className={styles.statCard}
                    whileHover={{ scale: 1.03, y: -2 }}
                >
                    <div className={styles.statIconWrap} style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                        <Zap size={18} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statNumber}>{stats.totalBlocked}</span>
                        <span className={styles.statName}>Schemes Blocked</span>
                    </div>
                </motion.div>

                <motion.div
                    className={styles.statCard}
                    whileHover={{ scale: 1.03, y: -2 }}
                >
                    <div className={styles.statIconWrap} style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
                        <DollarSign size={18} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statNumber}>{formatCurrency(stats.totalSaved)}</span>
                        <span className={styles.statName}>Potential Savings</span>
                    </div>
                </motion.div>

                <motion.div
                    className={styles.statCard}
                    whileHover={{ scale: 1.03, y: -2 }}
                >
                    <div className={styles.statIconWrap} style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                        <Bell size={18} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statNumber}>{stats.activeReminders}</span>
                        <span className={styles.statName}>Active Reminders</span>
                    </div>
                </motion.div>
            </div>

            {/* What We Protect Against */}
            <div className={styles.protectionList}>
                <h4 className={styles.listTitle}>
                    <Eye size={16} />
                    What We Detect
                </h4>
                <div className={styles.protectionTags}>
                    <span className={styles.tag}>🔄 Auto-Renewals</span>
                    <span className={styles.tag}>⏰ Hidden Trials</span>
                    <span className={styles.tag}>😤 Guilt-Trip Buttons</span>
                    <span className={styles.tag}>🐍 Sneaky Add-ons</span>
                    <span className={styles.tag}>💳 Pre-checked Boxes</span>
                </div>
            </div>

            {/* Extension Status */}
            {!isExtensionConnected && (
                <motion.div
                    className={styles.extensionPrompt}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <TrendingUp size={16} />
                    <span>Install extension for real-time protection while shopping!</span>
                </motion.div>
            )}

            {/* Expand Button */}
            <AnimatePresence>
                {stats.recentDetections.length > 0 && (
                    <motion.button
                        className={styles.expandBtn}
                        onClick={() => setShowDetails(!showDetails)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {showDetails ? 'Hide Recent Activity' : 'View Recent Activity'}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Recent Detections */}
            <AnimatePresence>
                {showDetails && stats.recentDetections.length > 0 && (
                    <motion.div
                        className={styles.recentActivity}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        {stats.recentDetections.map((detection, index) => (
                            <div key={index} className={styles.activityItem}>
                                <div className={styles.activityIcon}>🛡️</div>
                                <div className={styles.activityContent}>
                                    <span className={styles.activityUrl}>{detection.url}</span>
                                    <span className={styles.activityDate}>
                                        {new Date(detection.date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DarkPatternShield;
