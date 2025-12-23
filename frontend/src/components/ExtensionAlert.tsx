// ExtensionAlert Component - Smart, Non-Intrusive Extension Sync Alert
// Only shows when truly needed, remembers sync state across sessions

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Chrome, Sparkles, RefreshCw, CheckCircle, AlertTriangle, Zap, Link2 } from 'lucide-react';
import { useExtensionSync } from '../hooks/useExtensionSync';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './ExtensionAlert.module.css';

// Storage keys for persistent state
const STORAGE_KEYS = {
    SYNCED_AT: 'cashly_extension_synced_at',
    LAST_SYNC_CHECK: 'cashly_extension_last_check',
    DISMISSED_AT: 'cashly_extension_dismissed_at',
    DISMISSED_TYPE: 'cashly_extension_dismissed_type',
};

// Configuration
const CONFIG = {
    // Don't show alerts again within this period after sync (24 hours)
    syncGracePeriodMs: 24 * 60 * 60 * 1000,
    // Don't show dismissed alerts again within this period (1 week)
    dismissGracePeriodMs: 7 * 24 * 60 * 60 * 1000,
    // Delay before showing alert on page load (prevent flash) - reduced for faster feedback
    showDelayMs: 1000,
    // Redirect delay after successful sync
    redirectDelayMs: 2000,
};

type AlertType = 'not_installed' | 'not_synced' | 'extension_removed' | 'sync_success' | null;

const ExtensionAlert = () => {
    const [alertType, setAlertType] = useState<AlertType>(null);
    const [showSteps, setShowSteps] = useState(false);
    const [syncInProgress, setSyncInProgress] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [initialCheckDone, setInitialCheckDone] = useState(false);
    const lastKnownStatusRef = useRef<{ installed: boolean; loggedIn: boolean } | null>(null);
    const hasShownSyncSuccessRef = useRef(false);

    const { extensionStatus, checking, checkExtension } = useExtensionSync();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if user is logged into the website
    const isWebsiteLoggedIn = useCallback(() => {
        return localStorage.getItem('supabase.auth.token') ||
            Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    }, []);

    // Check if we recently synced (within grace period)
    const wasRecentlySynced = useCallback(() => {
        const syncedAt = localStorage.getItem(STORAGE_KEYS.SYNCED_AT);
        if (!syncedAt) return false;
        return Date.now() - parseInt(syncedAt, 10) < CONFIG.syncGracePeriodMs;
    }, []);

    // Check if alert was recently dismissed
    const wasRecentlyDismissed = useCallback((type: AlertType) => {
        const dismissedAt = localStorage.getItem(STORAGE_KEYS.DISMISSED_AT);
        const dismissedType = localStorage.getItem(STORAGE_KEYS.DISMISSED_TYPE);
        if (!dismissedAt || dismissedType !== type) return false;
        return Date.now() - parseInt(dismissedAt, 10) < CONFIG.dismissGracePeriodMs;
    }, []);

    // Mark as synced (prevents alerts for 24 hours)
    const markAsSynced = useCallback(() => {
        localStorage.setItem(STORAGE_KEYS.SYNCED_AT, Date.now().toString());
        console.log('✅ Extension sync recorded - no alerts for 24 hours');
    }, []);

    // Main effect to determine alert type
    useEffect(() => {
        // Don't process while checking
        if (checking) return;

        const currentStatus = { installed: extensionStatus.installed, loggedIn: extensionStatus.loggedIn };
        const lastStatus = lastKnownStatusRef.current;

        // Wait for initial delay on first check
        if (!initialCheckDone) {
            const timer = setTimeout(() => setInitialCheckDone(true), CONFIG.showDelayMs);
            return () => clearTimeout(timer);
        }

        // User not logged into website - no alerts needed
        if (!isWebsiteLoggedIn()) {
            setAlertType(null);
            lastKnownStatusRef.current = currentStatus;
            return;
        }

        // CASE 1: Extension is installed AND synced - NO ALERT!
        if (currentStatus.installed && currentStatus.loggedIn) {
            // If this is a NEW sync (wasn't synced before), show success briefly
            if (lastStatus && !lastStatus.loggedIn && !hasShownSyncSuccessRef.current) {
                hasShownSyncSuccessRef.current = true;
                markAsSynced();
                setAlertType('sync_success');
                setRedirecting(true);

                // Redirect to dashboard after delay
                setTimeout(() => {
                    if (location.pathname !== '/dashboard') {
                        navigate('/dashboard');
                    }
                    setAlertType(null);
                    setRedirecting(false);
                }, CONFIG.redirectDelayMs);
            } else {
                // Already synced - no alert needed
                setAlertType(null);
            }
            lastKnownStatusRef.current = currentStatus;
            return;
        }

        // CASE 2: Extension was REMOVED (was installed, now not)
        if (lastStatus?.installed && !currentStatus.installed) {
            console.log('⚠️ Extension removed!');
            // Clear sync state - this is urgent
            localStorage.removeItem(STORAGE_KEYS.SYNCED_AT);
            localStorage.removeItem(STORAGE_KEYS.DISMISSED_AT);
            setAlertType('extension_removed');
            lastKnownStatusRef.current = currentStatus;
            return;
        }

        // CASE 3: Extension not installed or not synced
        // Check if we should suppress the alert
        if (wasRecentlySynced()) {
            console.log('🔕 Recently synced - suppressing alert');
            setAlertType(null);
            lastKnownStatusRef.current = currentStatus;
            return;
        }

        // Determine alert type
        if (!currentStatus.installed) {
            if (!wasRecentlyDismissed('not_installed')) {
                setAlertType('not_installed');
            } else {
                setAlertType(null);
            }
        } else if (!currentStatus.loggedIn) {
            if (!wasRecentlyDismissed('not_synced')) {
                setAlertType('not_synced');
            } else {
                setAlertType(null);
            }
        }

        lastKnownStatusRef.current = currentStatus;
    }, [checking, extensionStatus.installed, extensionStatus.loggedIn, isWebsiteLoggedIn, initialCheckDone, navigate, location.pathname, wasRecentlySynced, wasRecentlyDismissed, markAsSynced]);

    // Handle dismiss with persistence
    const handleDismiss = useCallback(() => {
        localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, Date.now().toString());
        localStorage.setItem(STORAGE_KEYS.DISMISSED_TYPE, alertType || '');
        setAlertType(null);
        setShowSteps(false);
    }, [alertType]);

    // Handle refresh/recheck extension
    const handleRefresh = useCallback(async () => {
        setSyncInProgress(true);
        try {
            // Clear cached data to force fresh check
            localStorage.removeItem('cashly_extension');
            localStorage.removeItem('cashly_extension_auth');

            await new Promise(resolve => setTimeout(resolve, 500));
            await checkExtension();

            // If now synced, hide alert
            if (extensionStatus.installed && extensionStatus.loggedIn) {
                markAsSynced();
                setAlertType(null);
            }
        } catch (error) {
            console.error('Refresh error:', error);
        } finally {
            setSyncInProgress(false);
        }
    }, [checkExtension, extensionStatus.installed, extensionStatus.loggedIn, markAsSynced]);

    // Handle download click
    const handleDownload = useCallback(() => {
        window.open('/finzen-extension-v5.0.zip', '_blank');
    }, []);

    // Don't render if no alert type
    if (!alertType) return null;

    // Render different alert content based on type
    const renderAlertContent = () => {
        switch (alertType) {
            case 'extension_removed':
                return (
                    <div className={`${styles.alertCard} ${styles.dangerCard}`}>
                        <div className={styles.alertEmoji}>
                            <AlertTriangle className="w-7 h-7 text-red-500" />
                        </div>
                        <div className={styles.alertContent}>
                            <strong>Extension Removed! ⚠️</strong>
                            <p>Auto-tracking is disabled. Reinstall to continue.</p>
                        </div>
                        <div className={styles.alertActions}>
                            <button onClick={() => setShowSteps(true)} className={styles.installBtn}>
                                <Download size={16} />
                                Reinstall
                            </button>
                            <button
                                onClick={handleRefresh}
                                className={styles.refreshBtn}
                                disabled={syncInProgress}
                            >
                                <RefreshCw size={14} className={syncInProgress ? styles.spinning : ''} />
                                {syncInProgress ? 'Checking...' : 'Refresh'}
                            </button>
                        </div>
                        <button className={styles.closeBtn} onClick={handleDismiss}>
                            <X size={16} />
                        </button>
                    </div>
                );

            case 'not_synced':
                return (
                    <div className={`${styles.alertCard} ${styles.infoCard}`}>
                        <div className={styles.alertEmoji}>
                            <Link2 className="w-7 h-7 text-violet-500" />
                        </div>
                        <div className={styles.alertContent}>
                            <strong>Extension Not Synced</strong>
                            <p>Click refresh to sync with your account</p>
                        </div>
                        <div className={styles.alertActions}>
                            <button
                                onClick={handleRefresh}
                                className={styles.syncBtn}
                                disabled={syncInProgress}
                            >
                                <Zap size={16} />
                                {syncInProgress ? 'Syncing...' : 'Sync Now'}
                            </button>
                            <button className={styles.laterBtn} onClick={handleDismiss}>
                                Later
                            </button>
                        </div>
                        <button className={styles.closeBtn} onClick={handleDismiss}>
                            <X size={16} />
                        </button>
                    </div>
                );

            case 'sync_success':
                return (
                    <div className={`${styles.alertCard} ${styles.successCard}`}>
                        <div className={styles.alertEmoji}>
                            <CheckCircle className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div className={styles.alertContent}>
                            <strong>Extension Synced! 🎉</strong>
                            <p>{redirecting ? 'Redirecting to dashboard...' : 'Auto-tracking is now active!'}</p>
                        </div>
                        {redirecting && (
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill}></div>
                            </div>
                        )}
                    </div>
                );

            case 'not_installed':
            default:
                return (
                    <div className={`${styles.alertCard} ${styles.warningCard}`}>
                        <div className={styles.alertEmoji}>🧩</div>
                        <div className={styles.alertContent}>
                            <strong>Auto-Track Your Purchases! ✨</strong>
                            <p>Get our browser extension for automatic expense tracking</p>
                        </div>
                        <div className={styles.alertActions}>
                            <button onClick={() => setShowSteps(true)} className={styles.installBtn}>
                                <Sparkles size={16} />
                                Get Extension
                            </button>
                            <button className={styles.laterBtn} onClick={handleDismiss}>
                                Later
                            </button>
                        </div>
                        <button className={styles.closeBtn} onClick={handleDismiss}>
                            <X size={16} />
                        </button>
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className={styles.alertContainer}
                initial={{ opacity: 0, y: -30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
                {!showSteps ? (
                    renderAlertContent()
                ) : (
                    // Installation Steps View
                    <motion.div
                        className={`${styles.alertCard} ${styles.stepsCard}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className={styles.stepsHeader}>
                            <Chrome size={24} className={styles.chromeIcon} />
                            <div>
                                <strong>Install Cashly Extension</strong>
                                <p>3 easy steps to auto-track purchases</p>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className={styles.refreshBtnSmall}
                                disabled={syncInProgress}
                                title="Check if extension is installed"
                            >
                                <RefreshCw size={16} className={syncInProgress ? styles.spinning : ''} />
                            </button>
                        </div>

                        <div className={styles.stepsContainer}>
                            <div className={styles.step}>
                                <span className={styles.stepNumber}>1</span>
                                <div>
                                    <strong>Download</strong>
                                    <p>Click below to get the extension file</p>
                                </div>
                            </div>

                            <div className={styles.step}>
                                <span className={styles.stepNumber}>2</span>
                                <div>
                                    <strong>Open Extensions</strong>
                                    <p>Go to chrome://extensions and enable Developer mode</p>
                                </div>
                            </div>

                            <div className={styles.step}>
                                <span className={styles.stepNumber}>3</span>
                                <div>
                                    <strong>Load Extension</strong>
                                    <p>Drag & drop the ZIP file or use Load unpacked</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.stepsActions}>
                            <button onClick={handleDownload} className={styles.downloadBtn}>
                                <Download size={16} />
                                Download Extension
                            </button>
                            <button
                                onClick={() => setShowSteps(false)}
                                className={styles.backBtn}
                            >
                                Back
                            </button>
                        </div>

                        <button className={styles.closeBtn} onClick={handleDismiss}>
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default ExtensionAlert;
