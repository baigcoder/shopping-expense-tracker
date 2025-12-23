// Extension Sync Hook - Manages extension communication and auto-login
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { genZToast } from '../services/genZToast';

interface ExtensionStatus {
    installed: boolean;
    loggedIn: boolean;
    version?: string;
    userEmail?: string;
    lastSync?: number;
}

// Persistent key for extension sync status (doesn't expire unless explicitly cleared)
const EXTENSION_SYNCED_KEY = 'cashly_extension_synced';

export const useExtensionSync = () => {
    const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>({
        installed: false,
        loggedIn: false
    });
    const [checking, setChecking] = useState(true);
    const [syncing, setSyncing] = useState(false);

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
                    // Extension must have updated within last 30 seconds to be considered active
                    extensionIsActive = Date.now() - data.timestamp < 30000;
                } catch (e) {
                    extensionIsActive = false;
                }
            }

            // If extension is NOT active, clear any cached sync data
            if (!extensionIsActive) {
                console.log('⚠️ Extension not active - clearing sync flag');
                localStorage.removeItem(EXTENSION_SYNCED_KEY);
                localStorage.removeItem('extension-alert-dismissed'); // Show alert again
                setExtensionStatus({ installed: false, loggedIn: false });
                setChecking(false);
                return false;
            }

            // PRIORITY 2: Extension is active, check auth status
            if (extensionAuth) {
                try {
                    const authData = JSON.parse(extensionAuth);
                    const loggedIn = authData.loggedIn === true;
                    const userEmail = authData.email;

                    console.log('✅ Extension active:', { loggedIn, userEmail });

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
                    }

                    setChecking(false);
                    return true;
                } catch (e) {
                    console.error('Error parsing extension auth:', e);
                }
            }

            // Extension is active but not logged in
            console.log('📦 Extension installed but not synced');
            setExtensionStatus({ installed: true, loggedIn: false });
            setChecking(false);
            return false;

        } catch (error) {
            console.error('Extension check error:', error);
            setExtensionStatus({ installed: false, loggedIn: false });
            setChecking(false);
            return false;
        }
    }, []);

    // Sync session with extension
    const syncSession = useCallback(async (session: any, user: any) => {
        if (!extensionStatus.installed) {
            console.log('Extension not installed, skipping sync');
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
            console.log('Extension ready:', event.detail);
            setExtensionStatus({
                installed: true,
                loggedIn: false,
                version: event.detail.version
            });
            setChecking(false);
        };

        const handleExtensionSynced = (event: CustomEvent) => {
            console.log('🎉 Extension synced:', event.detail);

            // Save persistent sync flag (no expiration)
            const syncData = {
                synced: true,
                email: event.detail.email,
                timestamp: Date.now()
            };
            localStorage.setItem(EXTENSION_SYNCED_KEY, JSON.stringify(syncData));
            console.log('💾 Saved persistent sync flag (permanent)');

            setExtensionStatus(prev => ({
                ...prev,
                installed: true,
                loggedIn: true,
                userEmail: event.detail.email,
                lastSync: Date.now()
            }));
            setChecking(false);

            // Trigger styled toast via helper with unique ID
            genZToast.extensionSynced({
                toastId: 'extension-synced-hook'
            });
        };

        // NEW: Listen for behavior-based transaction events from extension
        const handleBehaviorTransaction = (event: MessageEvent) => {
            if (event.data?.source === 'cashly-extension') {
                const { type, data } = event.data;

                if (type === 'BEHAVIOR_TRANSACTION_ADDED' || type === 'TRANSACTION_ADDED') {
                    console.log('🎯 Behavior transaction received from extension:', data);

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
            console.log('Extension logged out - clearing persistent flag');
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

        // Initial check
        checkExtension();

        // Periodic check every 30 seconds (less aggressive)
        // This is mainly to catch initial extension installation
        // Check every 10 seconds to quickly detect extension removal
        const interval = setInterval(checkExtension, 10000);

        return () => {
            window.removeEventListener('cashly-extension-ready', handleExtensionReady as EventListener);
            window.removeEventListener('extension-synced', handleExtensionSynced as EventListener);
            window.removeEventListener('extension-logged-out', handleExtensionLoggedOut as EventListener);
            window.removeEventListener('message', handleBehaviorTransaction);
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
