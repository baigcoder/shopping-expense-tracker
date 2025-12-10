// Dark Pattern Protection Page - Full stats and management
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Shield, AlertTriangle, DollarSign, Bell, Eye, TrendingUp,
    Zap, ChevronLeft, Clock, Globe, Trash2, Check, X, ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import styles from './ProtectionPage.module.css';

interface ProtectionStats {
    totalDetected: number;
    totalBlocked: number;
    totalSaved: number;
    detections: Array<{
        url: string;
        date: string;
        patterns: Array<{ name: string; severity: string }>;
        priceInfo?: { monthlyPrice: number; currency: string };
    }>;
}

interface TrialReminder {
    id: string;
    service: string;
    url: string;
    hostname: string;
    trialDays: number;
    monthlyPrice: number;
    currency: string;
    reminderDate: string;
    status: string;
}

const ProtectionPage = () => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<ProtectionStats>({
        totalDetected: 0,
        totalBlocked: 0,
        totalSaved: 0,
        detections: []
    });
    const [reminders, setReminders] = useState<TrialReminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'detections' | 'reminders'>('overview');

    useEffect(() => {
        loadProtectionData();
    }, []);

    const loadProtectionData = async () => {
        try {
            // Try to get stats from extension
            const extensionId = localStorage.getItem('vibeTrackerExtensionId');

            if (extensionId && typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage(extensionId, { type: 'GET_PROTECTION_STATS' }, (response) => {
                    if (response?.success) {
                        setStats({
                            totalDetected: response.stats.totalDetected || 0,
                            totalBlocked: response.stats.totalBlocked || 0,
                            totalSaved: response.stats.totalSaved || 0,
                            detections: response.stats.detections || []
                        });
                        setReminders(response.stats.upcomingTrials || []);
                    }
                });
            }

            // Also check localStorage for local stats
            const localStats = localStorage.getItem('vt_dark_pattern_stats');
            if (localStats) {
                const parsed = JSON.parse(localStats);
                setStats(prev => ({ ...prev, ...parsed }));
            }

            const localReminders = localStorage.getItem('vt_trial_reminders');
            if (localReminders) {
                setReminders(JSON.parse(localReminders));
            }
        } catch (error) {
            console.log('Load protection data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteReminder = (id: string) => {
        setReminders(prev => prev.filter(r => r.id !== id));

        // Update localStorage
        const updated = reminders.filter(r => r.id !== id);
        localStorage.setItem('vt_trial_reminders', JSON.stringify(updated));

        // Notify extension
        const extensionId = localStorage.getItem('vibeTrackerExtensionId');
        if (extensionId && typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage(extensionId, {
                type: 'DELETE_TRIAL_REMINDER',
                data: { id }
            });
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return <span className={`${styles.severityBadge} ${styles.critical}`}>CRITICAL</span>;
            case 'HIGH':
                return <span className={`${styles.severityBadge} ${styles.high}`}>HIGH</span>;
            case 'MEDIUM':
                return <span className={`${styles.severityBadge} ${styles.medium}`}>MEDIUM</span>;
            default:
                return <span className={`${styles.severityBadge} ${styles.low}`}>LOW</span>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const daysUntil = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <Link to="/dashboard" className={styles.backBtn}>
                    <ChevronLeft size={20} />
                    Dashboard
                </Link>
                <div className={styles.headerContent}>
                    <motion.div
                        className={styles.headerIcon}
                        animate={{
                            boxShadow: [
                                '0 0 20px rgba(16, 185, 129, 0.3)',
                                '0 0 40px rgba(16, 185, 129, 0.6)',
                                '0 0 20px rgba(16, 185, 129, 0.3)'
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Shield size={32} />
                    </motion.div>
                    <div>
                        <h1>Dark Pattern Protection</h1>
                        <p>Your shield against sneaky subscriptions & hidden charges</p>
                    </div>
                </div>
            </header>

            {/* Stats Overview */}
            <section className={styles.statsSection}>
                <div className={styles.statsGrid}>
                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statNumber}>{stats.totalDetected}</span>
                            <span className={styles.statLabel}>Dark Patterns Detected</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                            <Zap size={24} />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statNumber}>{stats.totalBlocked}</span>
                            <span className={styles.statLabel}>Schemes Blocked</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
                            <DollarSign size={24} />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statNumber}>{formatCurrency(stats.totalSaved)}</span>
                            <span className={styles.statLabel}>Estimated Savings</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                            <Bell size={24} />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statNumber}>{reminders.filter(r => r.status === 'active').length}</span>
                            <span className={styles.statLabel}>Active Reminders</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <Eye size={16} /> Overview
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'detections' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('detections')}
                >
                    <AlertTriangle size={16} /> Detections ({stats.detections.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'reminders' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('reminders')}
                >
                    <Bell size={16} /> Reminders ({reminders.length})
                </button>
            </div>

            {/* Tab Content */}
            <section className={styles.content}>
                <AnimatePresence mode="wait">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.overviewContent}
                        >
                            {/* What We Protect */}
                            <div className={styles.infoCard}>
                                <h3><Shield size={18} /> What We Detect</h3>
                                <div className={styles.protectionGrid}>
                                    <div className={styles.protectionItem}>
                                        <span className={styles.protectionEmoji}>🔄</span>
                                        <div>
                                            <strong>Auto-Renewals</strong>
                                            <p>Subscriptions that automatically renew without clear notice</p>
                                        </div>
                                    </div>
                                    <div className={styles.protectionItem}>
                                        <span className={styles.protectionEmoji}>⏰</span>
                                        <div>
                                            <strong>Hidden Trials</strong>
                                            <p>Free trials that convert to paid without warning</p>
                                        </div>
                                    </div>
                                    <div className={styles.protectionItem}>
                                        <span className={styles.protectionEmoji}>😤</span>
                                        <div>
                                            <strong>Guilt-Trip Buttons</strong>
                                            <p>Confirm-shaming tactics that manipulate your decisions</p>
                                        </div>
                                    </div>
                                    <div className={styles.protectionItem}>
                                        <span className={styles.protectionEmoji}>🐍</span>
                                        <div>
                                            <strong>Sneaky Add-ons</strong>
                                            <p>Extra services silently added to your cart</p>
                                        </div>
                                    </div>
                                    <div className={styles.protectionItem}>
                                        <span className={styles.protectionEmoji}>💳</span>
                                        <div>
                                            <strong>Pre-checked Boxes</strong>
                                            <p>Recurring payments selected by default</p>
                                        </div>
                                    </div>
                                    <div className={styles.protectionItem}>
                                        <span className={styles.protectionEmoji}>🔒</span>
                                        <div>
                                            <strong>Difficult Cancellation</strong>
                                            <p>Websites making it hard to unsubscribe</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* How It Works */}
                            <div className={styles.infoCard}>
                                <h3><TrendingUp size={18} /> How It Works</h3>
                                <div className={styles.steps}>
                                    <div className={styles.step}>
                                        <span className={styles.stepNum}>1</span>
                                        <div>
                                            <strong>Auto-Scan</strong>
                                            <p>Extension scans every checkout and subscription page</p>
                                        </div>
                                    </div>
                                    <div className={styles.step}>
                                        <span className={styles.stepNum}>2</span>
                                        <div>
                                            <strong>Alert</strong>
                                            <p>Get instant warnings when dark patterns are detected</p>
                                        </div>
                                    </div>
                                    <div className={styles.step}>
                                        <span className={styles.stepNum}>3</span>
                                        <div>
                                            <strong>Remind</strong>
                                            <p>Set reminders before free trials convert to paid</p>
                                        </div>
                                    </div>
                                    <div className={styles.step}>
                                        <span className={styles.stepNum}>4</span>
                                        <div>
                                            <strong>Save</strong>
                                            <p>Avoid unwanted charges and track your savings</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Detections Tab */}
                    {activeTab === 'detections' && (
                        <motion.div
                            key="detections"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.detectionsContent}
                        >
                            {stats.detections.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <Shield size={48} />
                                    <h3>No Detections Yet</h3>
                                    <p>Start browsing with the extension installed to detect dark patterns</p>
                                </div>
                            ) : (
                                <div className={styles.detectionList}>
                                    {stats.detections.map((detection, index) => (
                                        <motion.div
                                            key={index}
                                            className={styles.detectionItem}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <div className={styles.detectionHeader}>
                                                <div className={styles.detectionSite}>
                                                    <Globe size={16} />
                                                    <span>{detection.url}</span>
                                                </div>
                                                <span className={styles.detectionDate}>
                                                    <Clock size={12} />
                                                    {formatDate(detection.date)}
                                                </span>
                                            </div>
                                            <div className={styles.detectionPatterns}>
                                                {detection.patterns.map((pattern, pIndex) => (
                                                    <div key={pIndex} className={styles.patternBadge}>
                                                        {getSeverityBadge(pattern.severity)}
                                                        {pattern.name}
                                                    </div>
                                                ))}
                                            </div>
                                            {detection.priceInfo && (
                                                <div className={styles.detectionPrice}>
                                                    💰 Potential charge: {detection.priceInfo.currency} {detection.priceInfo.monthlyPrice}/month
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Reminders Tab */}
                    {activeTab === 'reminders' && (
                        <motion.div
                            key="reminders"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.remindersContent}
                        >
                            {reminders.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <Bell size={48} />
                                    <h3>No Reminders Set</h3>
                                    <p>When you start a trial, you can set reminders to cancel before being charged</p>
                                </div>
                            ) : (
                                <div className={styles.reminderList}>
                                    {reminders.map((reminder, index) => {
                                        const days = daysUntil(reminder.reminderDate);
                                        const isUrgent = days <= 2;

                                        return (
                                            <motion.div
                                                key={reminder.id}
                                                className={`${styles.reminderItem} ${isUrgent ? styles.urgent : ''}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <div className={styles.reminderLeft}>
                                                    <div className={styles.reminderIcon}>
                                                        {reminder.status === 'notified' ?
                                                            <Check size={20} /> :
                                                            <Clock size={20} />
                                                        }
                                                    </div>
                                                    <div className={styles.reminderInfo}>
                                                        <strong>{reminder.service}</strong>
                                                        <span className={styles.reminderUrl}>{reminder.hostname}</span>
                                                        <div className={styles.reminderMeta}>
                                                            <span>{reminder.trialDays} day trial</span>
                                                            <span>{reminder.currency} {reminder.monthlyPrice}/month after</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={styles.reminderRight}>
                                                    <div className={`${styles.daysLeft} ${isUrgent ? styles.urgentDays : ''}`}>
                                                        {days > 0 ? `${days} days left` : 'Due today!'}
                                                    </div>
                                                    <div className={styles.reminderActions}>
                                                        <a href={reminder.url} target="_blank" rel="noreferrer" className={styles.visitBtn}>
                                                            <ExternalLink size={14} /> Visit
                                                        </a>
                                                        <button
                                                            onClick={() => deleteReminder(reminder.id)}
                                                            className={styles.deleteBtn}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
};

export default ProtectionPage;
