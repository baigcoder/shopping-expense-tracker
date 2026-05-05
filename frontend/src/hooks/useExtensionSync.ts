// Extension Sync Hook - Enterprise Connection v9.0
// Manages robust extension communication with connection status tracking
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { genZToast } from '../services/genZToast';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/useStore';
import { emitFinancialDataEvent } from '../services/financialDataEvents';

interface ExtensionStatus {
    installed: boolean;
    loggedIn: boolean;
    version?: string;
    userEmail?: string;
    lastSync?: number;
    lastTransactionSync?: {
        status: 'pending' | 'syncing' | 'synced' | 'duplicate' | 'error';
        timestamp: number;
        error?: string;
        queuedMessages?: number;
    };
    connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
    connectionId?: string;
    queuedMessages?: number;
}

interface ConnectionState {
    status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
    connectionId: string;
    timestamp: number;
    reconnectAttempts: number;
    queuedMessages: number;
}

// Persistent key for extension sync status
const EXTENSION_SYNCED_KEY = 'cashly_extension_synced';
const CONNECTION_STATE_KEY = 'cashly_connection_state';
const EXTENSION_PRESENCE_KEY = 'cashly_extension';
const EXTENSION_AUTH_KEY = 'cashly_extension_auth';

const parseStorageJson = <T,>(key: string): T | null => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const normalizeEmail = (email?: string | null) => (email || '').trim().toLowerCase();

const isSameAccount = (extensionEmail?: string | null, websiteEmail?: string | null) => {
    const expected = normalizeEmail(websiteEmail);
    if (!expected) return true;
    return normalizeEmail(extensionEmail) === expected;
};

const getStoredSyncedStatus = (websiteEmail?: string | null): ExtensionStatus | null => {
    const authData = parseStorageJson<{
        loggedIn?: boolean;
        email?: string | null;
        timestamp?: number;
        connectionStatus?: ExtensionStatus['connectionStatus'];
    }>(EXTENSION_AUTH_KEY);

    if (authData?.loggedIn && authData.email && isSameAccount(authData.email, websiteEmail)) {
        return {
            installed: true,
            loggedIn: true,
            userEmail: authData.email,
            lastSync: authData.timestamp || Date.now(),
            connectionStatus: authData.connectionStatus || 'connected'
        };
    }

    const syncedData = parseStorageJson<{ synced?: boolean; email?: string | null; timestamp?: number }>(EXTENSION_SYNCED_KEY);
    const isRecent = !!(syncedData?.timestamp && Date.now() - syncedData.timestamp < 60 * 1000);
    if (syncedData?.synced && syncedData.email && isRecent && isSameAccount(syncedData.email, websiteEmail)) {
        return {
            installed: true,
            loggedIn: true,
            userEmail: syncedData.email,
            lastSync: syncedData.timestamp,
            connectionStatus: 'connected'
        };
    }

    return null;
};

// Broadcast extension sync status to all tabs via Supabase Realtime
// Uses proper channel subscription to avoid REST fallback deprecation warning
const broadcastSyncStatus = async (userId: string, eventType: 'synced' | 'removed', data: any) => {
    try {
        // Verify we have a valid session before broadcasting
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && eventType === 'synced') {
            console.warn('Cannot broadcast sync - no valid session');
            return;
        }

        const channelName = `realtime-${userId}`;
        const channel = supabase.channel(channelName, {
            config: { broadcast: { self: false } }
        });

        // Subscribe first, then send
        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: eventType === 'synced' ? 'extension-synced' : 'extension-removed',
                    payload: { ...data, timestamp: Date.now() }
                });


                // Unsubscribe after sending to avoid leaks
                setTimeout(() => channel.unsubscribe(), 1000);
            }
        });
    } catch (e) {

    }
};

export const useExtensionSync = () => {
    const { user } = useAuthStore();

    // Get connection state from localStorage
    const getConnectionState = (): ConnectionState | null => {
        try {
            const data = localStorage.getItem(CONNECTION_STATE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) { /* ignore */ }
        return null;
    };

    // OPTIMIZATION: Check cached sync status immediately (synchronous)
    const getCachedStatus = (): ExtensionStatus => {
        try {
            const connectionState = getConnectionState();
            const storedSyncedStatus = getStoredSyncedStatus(user?.email);

            if (storedSyncedStatus) {
                return {
                    ...storedSyncedStatus,
                    connectionStatus: connectionState?.status || storedSyncedStatus.connectionStatus || 'connected',
                    connectionId: connectionState?.connectionId,
                    queuedMessages: connectionState?.queuedMessages || 0
                };
            }
        } catch (e) { /* ignore */ }
        return { installed: false, loggedIn: false, connectionStatus: 'disconnected' };
    };

    const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>(getCachedStatus);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionState | null>(getConnectionState);
    // OPTIMIZATION: If already synced from cache, don't show as "checking"
    const [checking, setChecking] = useState(() => !getCachedStatus().loggedIn);
    const [syncing, setSyncing] = useState(false);

    // Consolidated extension tracking state (use ref for synchronous access)
    const extensionState = useRef({
        wasInstalled: getCachedStatus().loggedIn,
        hasAlertedRemoval: false,
        lastSyncEventDispatch: 0,
        lastToastTime: 0
    });


    // Check if extension is installed and synced
    const checkExtension = useCallback(async () => {
        try {
            // FIRST: Check if extension is ACTIVELY present (not just cached)
            // Look for real-time flag that extension updates every 10 seconds
            const extensionData = localStorage.getItem(EXTENSION_PRESENCE_KEY);
            const extensionAuth = localStorage.getItem(EXTENSION_AUTH_KEY);
            const storedSyncedStatus = getStoredSyncedStatus(user?.email);

            let extensionIsActive = false;

            if (extensionData) {
                try {
                    const data = JSON.parse(extensionData);
                    // Extension must have updated within last 10 seconds to be considered active
                    // This ensures fast detection when extension is removed
                    extensionIsActive = Date.now() - data.timestamp < 10000;
                } catch (e) {
                    extensionIsActive = false;
                }
            }

            // DOUBLE-CHECK: If extension seems inactive, verify localStorage sync flag
            // The extension writes sync data that persists even if heartbeat is delayed
            // REDUCED: From 5 minutes to 30 seconds to detect removal faster
            if (!extensionIsActive) {
                const syncedData = localStorage.getItem(EXTENSION_SYNCED_KEY);
                if (syncedData) {
                    try {
                        const parsed = JSON.parse(syncedData);
                        // If synced within last 60 SECONDS, extension is likely still working
                        if (parsed.synced && parsed.timestamp && Date.now() - parsed.timestamp < 60 * 1000 && isSameAccount(parsed.email, user?.email)) {
                            extensionIsActive = true;
                        } else {
                            // Stale sync flag - but check auth before clearing
                            console.log('🧹 Sync flag stale, checking auth before clearing...');
                        }
                    } catch (e) {
                        // Parse error - clear the corrupt data
                        localStorage.removeItem(EXTENSION_SYNCED_KEY);
                    }
                }
            }

            // TRIPLE-CHECK: If still not active, check cashly_extension_auth directly
            // The extension may have just synced (loggedIn: true) but heartbeat hasn't updated yet
            if (!extensionIsActive && extensionAuth) {
                try {
                    const authParsed = JSON.parse(extensionAuth);
                    if (authParsed.loggedIn && authParsed.email && isSameAccount(authParsed.email, user?.email)) {
                        // Extension auth says logged in — trust it, don't clear
                        console.log('✅ Extension auth shows loggedIn, considering active');
                        extensionIsActive = true;
                    }
                } catch (e) { /* ignore parse error */ }
            }

            // Only clear stale data if auth also doesn't show loggedIn
            if (!extensionIsActive) {
                console.log('🧹 No active signals found, clearing stale data');
                localStorage.removeItem(EXTENSION_SYNCED_KEY);
                localStorage.removeItem(EXTENSION_PRESENCE_KEY);
                localStorage.removeItem(EXTENSION_AUTH_KEY);
            }

            // CRITICAL: Detect extension REMOVAL immediately (only alert once)
            if (!extensionIsActive && extensionState.current.wasInstalled && !extensionState.current.hasAlertedRemoval) {


                // Mark as alerted to prevent duplicates
                extensionState.current.hasAlertedRemoval = true;

                // Clear all sync data
                localStorage.removeItem(EXTENSION_SYNCED_KEY);
                localStorage.removeItem('extension-alert-dismissed');
                localStorage.removeItem(EXTENSION_PRESENCE_KEY);
                localStorage.removeItem(EXTENSION_AUTH_KEY);

                setExtensionStatus({ installed: false, loggedIn: false });
                extensionState.current.wasInstalled = false;
                setChecking(false);

                // Dispatch removal event for immediate UI reaction
                window.dispatchEvent(new CustomEvent('extension-removed', {
                    detail: { timestamp: Date.now() }
                }));

                // Broadcast to other tabs via Supabase Realtime
                if (user?.id) {
                    broadcastSyncStatus(user.id, 'removed', { timestamp: Date.now() });
                }

                // Show toast only once per session
                if (!sessionStorage.getItem('extension-removal-toast-shown')) {
                    sessionStorage.setItem('extension-removal-toast-shown', 'true');
                    genZToast.error('Extension disconnected! Please reinstall for auto-tracking.');
                }

                return false;
            }

            // If extension is NOT active
            if (!extensionIsActive) {

                setExtensionStatus({ installed: false, loggedIn: false });
                setChecking(false);
                return false;
            }

            // Mark that extension is now installed
            if (!extensionState.current.wasInstalled) {
                extensionState.current.wasInstalled = true;
                // Reset alert flag so we can alert again if removed in future
                extensionState.current.hasAlertedRemoval = false;
            }

            // PRIORITY 2: Extension is active, check auth status
            if (extensionAuth) {
                try {
                    const authData = JSON.parse(extensionAuth);
                    const loggedIn = authData.loggedIn === true && isSameAccount(authData.email, user?.email);
                    const userEmail = authData.email;



                    setExtensionStatus(prev => ({
                        ...prev,
                        installed: true,
                        loggedIn,
                        userEmail,
                        lastSync: Date.now()
                    }));

                    // Update persistent sync flag if logged in
                    if (loggedIn && userEmail) {
                        localStorage.setItem(EXTENSION_SYNCED_KEY, JSON.stringify({
                            synced: true,
                            email: userEmail,
                            timestamp: Date.now()
                        }));

                        // Dispatch sync event for immediate dashboard access
                        // DEBOUNCE: Only dispatch if last dispatch was more than 2 seconds ago
                        const now = Date.now();
                        if (now - extensionState.current.lastSyncEventDispatch > 2000) {
                            extensionState.current.lastSyncEventDispatch = now;
                            window.dispatchEvent(new CustomEvent('extension-synced', {
                                detail: { email: userEmail, timestamp: now }
                            }));

                            // Broadcast to other tabs via Supabase Realtime
                            if (user?.id) {
                                broadcastSyncStatus(user.id, 'synced', { email: userEmail });
                            }
                        }
                    }

                    setChecking(false);
                    return true;
                } catch (e) {
                    console.error('Error parsing extension auth:', e);
                }
            }

            if (storedSyncedStatus) {
                setExtensionStatus(prev => ({
                    ...prev,
                    ...storedSyncedStatus,
                    installed: true,
                    loggedIn: true,
                    lastSync: Date.now()
                }));
                setChecking(false);
                return true;
            }

            // Extension is active but not logged in

            setExtensionStatus(prev => ({ ...prev, installed: true, loggedIn: false }));
            setChecking(false);
            return false;

        } catch (error) {
            console.error('Extension check error:', error);
            setExtensionStatus({ installed: false, loggedIn: false });
            setChecking(false);
            return false;
        }
    }, [user?.email, user?.id]); // extensionState is a ref, no need in deps

    // Sync session with extension
    const syncSession = useCallback(async (session: any, user: any) => {
        setSyncing(true);

        try {
            window.postMessage({
                type: 'WEBSITE_TO_EXTENSION',
                action: 'SYNC_SESSION',
                data: {
                    session,
                    user,
                    accessToken: session.access_token
                }
            }, '*');

            await new Promise((resolve) => {
                let settled = false;
                let poll: number | undefined;
                let timeout: number | undefined;

                const finish = (value: boolean) => {
                    if (settled) return;
                    settled = true;
                    if (poll) window.clearInterval(poll);
                    if (timeout) window.clearTimeout(timeout);
                    window.removeEventListener('message', handler);
                    resolve(value);
                };

                const handler = (event: MessageEvent) => {
                    if (event.data?.type === 'EXTENSION_STATUS' && event.data?.loggedIn) {
                        setExtensionStatus(prev => ({
                            ...prev,
                            installed: true,
                            loggedIn: true,
                            userEmail: user.email,
                            lastSync: Date.now()
                        }));
                        finish(true);
                    }
                };
                window.addEventListener('message', handler);

                poll = window.setInterval(() => {
                    const storedSyncedStatus = getStoredSyncedStatus(user.email);
                    if (!storedSyncedStatus) return;
                    setExtensionStatus(prev => ({
                        ...prev,
                        ...storedSyncedStatus,
                        installed: true,
                        loggedIn: true,
                        lastSync: Date.now()
                    }));
                    setChecking(false);
                    finish(true);
                }, 150);

                timeout = window.setTimeout(() => {
                    finish(false);
                }, 3000);
            });

            return true;
        } catch (error) {
            console.error('Session sync error:', error);
            return false;
        } finally {
            setSyncing(false);
        }
    }, []);

    // Listen for extension events
    useEffect(() => {
        const handleExtensionReady = (event: CustomEvent) => {

            setExtensionStatus(prev => ({
                ...prev,
                installed: true,
                loggedIn: false,
                version: event.detail.version
            }));
            setChecking(false);
        };

        const handleExtensionSynced = (event: CustomEvent) => {


            if (!isSameAccount(event.detail?.email, user?.email)) {
                setExtensionStatus(prev => ({
                    ...prev,
                    installed: true,
                    loggedIn: false,
                    userEmail: event.detail?.email
                }));
                setChecking(false);
                return;
            }

            // Save persistent sync flag (no expiration)
            const syncData = {
                synced: true,
                email: event.detail.email,
                timestamp: Date.now()
            };
            localStorage.setItem(EXTENSION_SYNCED_KEY, JSON.stringify(syncData));

            setExtensionStatus(prev => ({
                ...prev,
                installed: true,
                loggedIn: true,
                userEmail: event.detail.email,
                lastSync: Date.now()
            }));
            setChecking(false);

            // Trigger styled toast via helper (with 3 second debounce to prevent spam)
            const now = Date.now();
            if (now - extensionState.current.lastToastTime > 3000) {
                extensionState.current.lastToastTime = now;
                genZToast.extensionSynced();
            }
        };

        // NEW: Listen for behavior-based transaction events from extension
        const handleBehaviorTransaction = (event: MessageEvent) => {
            if (event.data?.source === 'cashly-extension') {
                const { type, data } = event.data;

                if (type === 'BEHAVIOR_TRANSACTION_ADDED' || type === 'TRANSACTION_ADDED') {


                    // Dispatch event for components to refresh
                    emitFinancialDataEvent('transaction-added', data);
                    window.dispatchEvent(new CustomEvent('transaction-added-realtime', { detail: data }));

                    // Show toast notification
                    const amount = data.amount || 0;
                    const name = data.name || data.transaction?.description || 'Transaction';
                    const iconType = data.type === 'trial' ? '🎁' : (data.type === 'subscription' ? '💳' : '🛒');
                    toast.success(`${iconType} ${name} ${amount > 0 ? `• $${amount.toFixed(2)}` : ''} tracked!`);
                } else if (type === 'TRANSACTION_CANDIDATE_ADDED') {
                    emitFinancialDataEvent('transaction-candidate-added', data);
                    toast.info('New transaction is waiting in your inbox for review.');
                } else if (type === 'CASHLY_DATA_UPDATED') {
                    emitFinancialDataEvent('cashly-data-updated', data);
                    window.dispatchEvent(new CustomEvent('cashly-data-updated', { detail: data }));
                } else if (type === 'SUBSCRIPTION_ADDED') {
                    emitFinancialDataEvent('subscription-added', data);
                    toast.info('Subscription activity is waiting for review.');
                }
            }
        };

        const handleExtensionLoggedOut = () => {

            // ONLY clear persistent flag on explicit logout
            localStorage.removeItem(EXTENSION_SYNCED_KEY);
            setExtensionStatus(prev => ({
                ...prev,
                loggedIn: false,
                userEmail: undefined
            }));
        };

        // NEW: Handle connection status changes
        const handleConnectionChange = (event: CustomEvent) => {
            const detail = event.detail;
            console.log('🔌 Connection changed:', detail.status);

            setConnectionStatus({
                status: detail.status,
                connectionId: detail.connectionId,
                timestamp: detail.timestamp,
                reconnectAttempts: detail.reconnectAttempts || 0,
                queuedMessages: detail.queuedMessages || 0
            });

            setExtensionStatus(prev => ({
                ...prev,
                connectionStatus: detail.status,
                connectionId: detail.connectionId,
                queuedMessages: detail.queuedMessages
            }));

            // Show toast for disconnection
            if (detail.status === 'disconnected' && detail.prevStatus === 'connected') {
                toast.warning('Extension connection lost. Reconnecting...');
            } else if (detail.status === 'connected' && detail.prevStatus === 'reconnecting') {
                toast.success('Extension reconnected!');
            }
        };

        const handleTransactionSyncStatus = (event: MessageEvent) => {
            if (event.data?.source !== 'cashly-extension' || event.data?.type !== 'TRANSACTION_SYNC_STATUS') return;

            const data = event.data.data || {};
            setExtensionStatus(prev => ({
                ...prev,
                lastSync: data.timestamp || Date.now(),
                lastTransactionSync: data,
                queuedMessages: data.queuedMessages ?? prev.queuedMessages
            }));

            if (data.status === 'pending') {
                toast.info('Transaction queued until the extension is logged in.');
            } else if (data.status === 'error') {
                toast.error(data.error || 'Extension transaction sync failed.');
            }
        };

        window.addEventListener('cashly-extension-ready', handleExtensionReady as EventListener);
        window.addEventListener('extension-synced', handleExtensionSynced as EventListener);
        window.addEventListener('extension-logged-out', handleExtensionLoggedOut as EventListener);
        window.addEventListener('cashly-connection-change', handleConnectionChange as EventListener);
        window.addEventListener('message', handleBehaviorTransaction);
        window.addEventListener('message', handleTransactionSyncStatus);

        // Listen for storage changes from other tabs/windows
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'cashly_extension_synced' || e.key === 'cashly_extension_auth') {
                checkExtension();
            }
            // Also check for connection state changes
            if (e.key === CONNECTION_STATE_KEY) {
                const newState = getConnectionState();
                if (newState) {
                    setConnectionStatus(newState);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);

        // Initial check
        checkExtension();

        // Periodic check every 3 seconds for fast detection
        const interval = setInterval(checkExtension, 3000);

        return () => {
            window.removeEventListener('cashly-extension-ready', handleExtensionReady as EventListener);
            window.removeEventListener('extension-synced', handleExtensionSynced as EventListener);
            window.removeEventListener('extension-logged-out', handleExtensionLoggedOut as EventListener);
            window.removeEventListener('cashly-connection-change', handleConnectionChange as EventListener);
            window.removeEventListener('message', handleBehaviorTransaction);
            window.removeEventListener('message', handleTransactionSyncStatus);
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [checkExtension, user?.email]);

    /** When the extension becomes active on a logged-in tab, push session again (install-after-login or slow start). */
    const lastAutoSessionPushRef = useRef(0);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!user?.id || checking) return;
        if (!extensionStatus.installed || extensionStatus.loggedIn) return;

        const now = Date.now();
        if (now - lastAutoSessionPushRef.current < 4500) return;
        lastAutoSessionPushRef.current = now;

        let cancelled = false;
        (async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user || cancelled) return;
                window.postMessage({
                    type: 'WEBSITE_TO_EXTENSION',
                    action: 'SYNC_SESSION',
                    data: {
                        session,
                        user: session.user,
                        accessToken: session.access_token,
                    },
                }, '*');
                window.postMessage({
                    type: 'WEBSITE_TO_EXTENSION',
                    action: 'CHECK_STATUS',
                }, '*');
            } catch {
                /* ignore */
            }
        })();

        const t = window.setTimeout(() => {
            if (!cancelled) checkExtension();
        }, 1000);

        return () => {
            cancelled = true;
            window.clearTimeout(t);
        };
    }, [user?.id, checking, extensionStatus.installed, extensionStatus.loggedIn, checkExtension]);

    return {
        extensionStatus,
        connectionStatus,
        checking,
        syncing,
        checkExtension,
        syncSession
    };
};
