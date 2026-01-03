// Extension Sync Hook - Manages extension communication and auto-login
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { genZToast } from '../services/genZToast';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/useStore';

interface ExtensionStatus {
    installed: boolean;
    loggedIn: boolean;
    version?: string;
    userEmail?: string;
    lastSync?: number;
}

// Persistent key for extension sync status (doesn't expire unless explicitly cleared)
const EXTENSION_SYNCED_KEY = 'cashly_extension_synced';

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

    // OPTIMIZATION: Check cached sync status immediately (synchronous)
    // CRITICAL: Must also check timestamp to avoid stale cache causing false positives
    const getCachedStatus = (): ExtensionStatus => {
        try {
            const syncedData = localStorage.getItem(EXTENSION_SYNCED_KEY);
            if (syncedData) {
                const data = JSON.parse(syncedData);
                // Only trust the cache if timestamp is recent (within 60 seconds)
                const isRecent = data.timestamp && (Date.now() - data.timestamp < 60 * 1000);
                if (data.synced && data.email && isRecent) {
                    return { installed: true, loggedIn: true, userEmail: data.email };
                }
            }
        } catch (e) { /* ignore */ }
        return { installed: false, loggedIn: false };
    };

    const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>(getCachedStatus);
    // OPTIMIZATION: If already synced from cache, don't show as "checking"
    const [checking, setChecking] = useState(() => !getCachedStatus().loggedIn);
    const [syncing, setSyncing] = useState(false);

    // Consolidated extension tracking state (use ref for synchronous access)
    // CRITICAL: Initialize wasInstalled based on cached sync state so we can detect removal on first load
    const extensionState = useRef({
        wasInstalled: getCachedStatus().loggedIn, // If previously synced, assume was installed
        hasAlertedRemoval: false,
        lastSyncEventDispatch: 0, // Prevent recursive event dispatch
        lastToastTime: 0 // Debounce toast notifications (3 second cooldown)
    });


    // Check if extension is installed and synced
    const checkExtension = useCallback(async () => {
        try {
            // FIRST: Check if extension is ACTIVELY present (not just cached)
            // Look for real-time flag that extension updates every 10 seconds
            const extensionData = localStorage.getItem('cashly_extension');
            const extensionAuth = localStorage.getItem('cashly_extension_auth');

            let extensionIsActive = false;

            if (extensionData) {
                try {
                    const data = JSON.parse(extensionData);
                    // Extension must have updated within last 60 seconds to be considered active
                    // Increased from 30s to reduce false positives during slow networks
                    extensionIsActive = Date.now() - data.timestamp < 60000;
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
                        if (parsed.synced && parsed.timestamp && Date.now() - parsed.timestamp < 60 * 1000) {
                            extensionIsActive = true;
                        } else {
                            // Stale sync flag - extension is gone, clear it immediately
                            console.log('🧹 Clearing stale sync flag - timestamp too old');
                            localStorage.removeItem(EXTENSION_SYNCED_KEY);
                            localStorage.removeItem('cashly_extension');
                            localStorage.removeItem('cashly_extension_auth');
                        }
                    } catch (e) {
                        // Parse error - clear the corrupt data
                        localStorage.removeItem(EXTENSION_SYNCED_KEY);
                    }
                }
            }

            // CRITICAL: Detect extension REMOVAL immediately (only alert once)
            if (!extensionIsActive && extensionState.current.wasInstalled && !extensionState.current.hasAlertedRemoval) {


                // Mark as alerted to prevent duplicates
                extensionState.current.hasAlertedRemoval = true;

                // Clear all sync data
                localStorage.removeItem(EXTENSION_SYNCED_KEY);
                localStorage.removeItem('extension-alert-dismissed');
                localStorage.removeItem('cashly_extension');
                localStorage.removeItem('cashly_extension_auth');

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
                    const loggedIn = authData.loggedIn === true;
                    const userEmail = authData.email;



                    setExtensionStatus({
                        installed: true,
                        loggedIn,
                        userEmail,
                        lastSync: Date.now()
                    });

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

            // Extension is active but not logged in

            setExtensionStatus({ installed: true, loggedIn: false });
            setChecking(false);
            return false;

        } catch (error) {
            console.error('Extension check error:', error);
            setExtensionStatus({ installed: false, loggedIn: false });
            setChecking(false);
            return false;
        }
    }, [user?.id]); // extensionState is a ref, no need in deps

    // Sync session with extension
    const syncSession = useCallback(async (session: any, user: any) => {
        if (!extensionStatus.installed) {

            return false;
        }

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
                const handler = (event: MessageEvent) => {
                    if (event.data?.type === 'EXTENSION_STATUS' && event.data?.loggedIn) {
                        setExtensionStatus(prev => ({
                            ...prev,
                            loggedIn: true,
                            userEmail: user.email,
                            lastSync: Date.now()
                        }));
                        window.removeEventListener('message', handler);
                        resolve(true);
                    }
                };
                window.addEventListener('message', handler);

                setTimeout(() => {
                    window.removeEventListener('message', handler);
                    resolve(false);
                }, 3000);
            });

            return true;
        } catch (error) {
            console.error('Session sync error:', error);
            return false;
        } finally {
            setSyncing(false);
        }
    }, [extensionStatus.installed]);

    // Listen for extension events
    useEffect(() => {
        const handleExtensionReady = (event: CustomEvent) => {

            setExtensionStatus({
                installed: true,
                loggedIn: false,
                version: event.detail.version
            });
            setChecking(false);
        };

        const handleExtensionSynced = (event: CustomEvent) => {


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
                    window.dispatchEvent(new CustomEvent('new-transaction', { detail: data }));
                    window.dispatchEvent(new CustomEvent('transaction-added-realtime', { detail: data }));

                    // Show toast notification
                    const amount = data.amount || 0;
                    const name = data.name || data.transaction?.description || 'Transaction';
                    const iconType = data.type === 'trial' ? '🎁' : (data.type === 'subscription' ? '💳' : '🛒');
                    toast.success(`${iconType} ${name} ${amount > 0 ? `• $${amount.toFixed(2)}` : ''} tracked!`);
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

        window.addEventListener('cashly-extension-ready', handleExtensionReady as EventListener);
        window.addEventListener('extension-synced', handleExtensionSynced as EventListener);
        window.addEventListener('extension-logged-out', handleExtensionLoggedOut as EventListener);
        window.addEventListener('message', handleBehaviorTransaction);

        // Listen for storage changes from other tabs/windows
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'cashly_extension_synced' || e.key === 'cashly_extension_auth') {
                // Another tab/window changed extension state, re-check
                checkExtension();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        // Initial check
        checkExtension();

        // Periodic check every 3 seconds for fast detection
        // This quickly catches extension install/uninstall events
        const interval = setInterval(checkExtension, 3000);

        return () => {
            window.removeEventListener('cashly-extension-ready', handleExtensionReady as EventListener);
            window.removeEventListener('extension-synced', handleExtensionSynced as EventListener);
            window.removeEventListener('extension-logged-out', handleExtensionLoggedOut as EventListener);
            window.removeEventListener('message', handleBehaviorTransaction);
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [checkExtension]);

    return {
        extensionStatus,
        checking,
        syncing,
        checkExtension,
        syncSession
    };
};
