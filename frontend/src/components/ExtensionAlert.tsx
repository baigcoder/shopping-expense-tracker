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
    NEVER_SHOW: 'cashly_extension_never_show',
};

// Configuration
const CONFIG = {
    // Don't show alerts again within this period after sync (24 hours)
    syncGracePeriodMs: 24 * 60 * 60 * 1000,
    // Don't show dismissed alerts again within this period (1 week)
    dismissGracePeriodMs: 7 * 24 * 60 * 60 * 1000,
    // Delay before showing alert on page load (prevent flash)
    showDelayMs: 1000,
    // Redirect delay after successful sync
    redirectDelayMs: 2000,
    // Current extension version
    extensionVersion: '6.0.0',
};

// Mobile detection
const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth < 1024;
};

type AlertType = 'not_installed' | 'not_synced' | 'extension_removed' | 'sync_success' | null;

const ExtensionAlert = () => {
    const [alertType, setAlertType] = useState<AlertType>(null);
    const [showSteps, setShowSteps] = useState(false);
    const [syncInProgress, setSyncInProgress] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [initialCheckDone, setInitialCheckDone] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const lastKnownStatusRef = useRef<{ installed: boolean; loggedIn: boolean } | null>(null);
    const hasShownSyncSuccessRef = useRef(false);

    const { extensionStatus, checking, checkExtension } = useExtensionSync();
    const navigate = useNavigate();
    const location = useLocation();

    // Force refresh the status when extension events happen
    const forceRefreshRef = useRef(0);

    // Check if on mobile device
    useEffect(() => {
        setIsMobile(isMobileDevice());
        const handleResize = () => setIsMobile(isMobileDevice());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Recheck when tab becomes visible (user returns to tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('👁️ ExtensionAlert: Tab visible, rechecking...');
                forceRefreshRef.current++;
                checkExtension();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [checkExtension]);

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
        // Check for permanent dismiss first
        if (localStorage.getItem(STORAGE_KEYS.NEVER_SHOW) === 'true') return true;

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
        // Don't process while still in initial checking phase
        if (checking && !initialCheckDone) return;

        const currentStatus = { installed: extensionStatus.installed, loggedIn: extensionStatus.loggedIn };
        const lastStatus = lastKnownStatusRef.current;

        // Wait for initial delay on first check (reduced to 500ms for faster feedback)
        if (!initialCheckDone) {
            const timer = setTimeout(() => setInitialCheckDone(true), 500);
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
    }, [checking, extensionStatus.installed, extensionStatus.loggedIn, isWebsiteLoggedIn, initialCheckDone, navigate, location.pathname, wasRecentlySynced, wasRecentlyDismissed, markAsSynced, forceRefreshRef.current]);

    // NEW: Listen for extension events directly for instant updates
    // Add debounce ref to prevent recursive calls
    const lastEventHandledRef = useRef(0);

    useEffect(() => {
        const handleExtensionSynced = (event: CustomEvent) => {
            // DEBOUNCE: Prevent handling same event multiple times
            const now = Date.now();
            if (now - lastEventHandledRef.current < 2000) {
                console.log('📡 ExtensionAlert: Debounced extension-synced event');
                return;
            }
            lastEventHandledRef.current = now;

            console.log('📡 ExtensionAlert: Received extension-synced event', event.detail);
            forceRefreshRef.current++;
            lastKnownStatusRef.current = { installed: true, loggedIn: false }; // Force transition detection
            setInitialCheckDone(true);
            // Don't call checkExtension here - it dispatches the same event and causes recursion!
            // Instead, just update state directly
        };

        const handleExtensionRemoved = () => {
            console.log('📡 ExtensionAlert: Received extension-removed event');
            forceRefreshRef.current++;
            localStorage.removeItem(STORAGE_KEYS.SYNCED_AT);
            localStorage.removeItem(STORAGE_KEYS.DISMISSED_AT);
            setAlertType('extension_removed');
            setInitialCheckDone(true);
        };

        // Listen for storage changes from extension (works across tabs)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'cashly_extension_auth' || e.key === 'cashly_extension') {
                console.log('📡 ExtensionAlert: Storage changed, rechecking...');
                forceRefreshRef.current++;
                checkExtension();
            }
        };

        window.addEventListener('extension-synced', handleExtensionSynced as EventListener);
        window.addEventListener('extension-removed', handleExtensionRemoved as EventListener);
        window.addEventListener('storage', handleStorageChange);

        // SAME-TAB storage monitoring: Poll localStorage every 2 seconds for changes
        // This catches changes that 'storage' event misses (same-tab writes)
        let lastAuthData = localStorage.getItem('cashly_extension_auth');
        let lastExtData = localStorage.getItem('cashly_extension');

        const pollStorageInterval = setInterval(() => {
            const currentAuthData = localStorage.getItem('cashly_extension_auth');
            const currentExtData = localStorage.getItem('cashly_extension');

            if (currentAuthData !== lastAuthData || currentExtData !== lastExtData) {
                console.log('📡 ExtensionAlert: localStorage changed (same-tab), rechecking...');
                lastAuthData = currentAuthData;
                lastExtData = currentExtData;
                forceRefreshRef.current++;
                checkExtension();
            }
        }, 2000);

        return () => {
            window.removeEventListener('extension-synced', handleExtensionSynced as EventListener);
            window.removeEventListener('extension-removed', handleExtensionRemoved as EventListener);
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(pollStorageInterval);
        };
    }, [checkExtension]);

    // Handle dismiss with persistence
    const handleDismiss = useCallback(() => {
        localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, Date.now().toString());
        localStorage.setItem(STORAGE_KEYS.DISMISSED_TYPE, alertType || '');
        setAlertType(null);
        setShowSteps(false);
    }, [alertType]);

    // Handle permanent dismiss (never show again)
    const handleNeverShow = useCallback(() => {
        localStorage.setItem(STORAGE_KEYS.NEVER_SHOW, 'true');
        setAlertType(null);
        setShowSteps(false);
    }, []);

    // Handle refresh/recheck extension
    const handleRefresh = useCallback(async () => {
        setSyncInProgress(true);
        try {
            // Request extension to update its localStorage flags
            window.postMessage({
                type: 'WEBSITE_TO_EXTENSION',
                action: 'CHECK_STATUS'
            }, '*');

            // Wait for extension to respond and update localStorage
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Now check the updated status
            await checkExtension();

            // Check status after recheck
            const authData = localStorage.getItem('cashly_extension_auth');
            if (authData) {
                try {
                    const parsed = JSON.parse(authData);
                    if (parsed.loggedIn) {
                        markAsSynced();
                        setAlertType(null);
                        return;
                    }
                } catch { /* ignore */ }
            }
        } catch (error) {
            console.error('Refresh error:', error);
        } finally {
            setSyncInProgress(false);
        }
    }, [checkExtension, markAsSynced]);

    // Handle download click - direct download
    const handleDownload = useCallback(() => {
        const link = document.createElement('a');
        link.href = '/cashly-extension.zip';
        link.download = `cashly-extension-v${CONFIG.extensionVersion}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    // Copy extensions URL to clipboard
    const handleCopyExtensionsUrl = useCallback(async () => {
        try {
            await navigator.clipboard.writeText('chrome://extensions');
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = 'chrome://extensions';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }, []);

    // Don't render on mobile - extensions not supported
    if (isMobile) return null;

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
                    <div className={`${styles.alertCard} ${styles.successCard}`} role="alert" aria-live="polite">
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
                        {/* Confetti particles */}
                        <div className={styles.confetti}>
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className={styles.confettiPiece} style={{ '--delay': `${i * 0.1}s`, '--x': `${(i % 4) * 25}%` } as React.CSSProperties} />
                            ))}
                        </div>
                    </div>
                );

            case 'not_installed':
            default:
                return (
                    <div className={`${styles.alertCard} ${styles.warningCard}`} role="alert" aria-live="polite">
                        <div className={styles.alertEmoji}>🧩</div>
                        <div className={styles.alertContent}>
                            <strong>Auto-Track Your Purchases! ✨</strong>
                            <p>Get our browser extension for automatic expense tracking</p>
                        </div>
                        <div className={styles.alertActions}>
                            <button onClick={() => setShowSteps(true)} className={styles.installBtn} aria-label="Get extension">
                                <Sparkles size={16} />
                                Get Extension
                            </button>
                            <button className={styles.laterBtn} onClick={handleDismiss} aria-label="Dismiss for now">
                                Later
                            </button>
                        </div>
                        <button className={styles.closeBtn} onClick={handleDismiss} aria-label="Close alert">
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
                                    <p>Click the button below to download the extension</p>
                                </div>
                            </div>

                            <div className={styles.step}>
                                <span className={styles.stepNumber}>2</span>
                                <div>
                                    <strong>Extract & Open Extensions</strong>
                                    <p>
                                        Unzip the file, then go to <button onClick={handleCopyExtensionsUrl} className={styles.copyLink}>chrome://extensions</button> and enable <strong>Developer mode</strong>
                                    </p>
                                </div>
                            </div>

                            <div className={styles.step}>
                                <span className={styles.stepNumber}>3</span>
                                <div>
                                    <strong>Load Extension</strong>
                                    <p>Click <strong>Load unpacked</strong> and select the extracted folder</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.stepsActions}>
                            <button onClick={handleDownload} className={styles.downloadBtn} aria-label="Download extension">
                                <Download size={16} />
                                Download v{CONFIG.extensionVersion}
                            </button>
                            <button
                                onClick={() => setShowSteps(false)}
                                className={styles.backBtn}
                                aria-label="Go back"
                            >
                                Back
                            </button>
                        </div>

                        <div className={styles.neverShowContainer}>
                            <button onClick={handleNeverShow} className={styles.neverShowBtn}>
                                Don't show this again
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
