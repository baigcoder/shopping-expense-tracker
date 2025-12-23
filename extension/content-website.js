// Content Script for Website - Handles session sharing between website and extension
// This script runs on the Vibe Tracker website to enable seamless sync

(function () {
    'use strict';

    console.log('💳 Cashly Extension: Website sync loaded');

    // Session-based flag to prevent repeated notifications
    const SESSION_SYNC_KEY = 'cashly_session_synced';
    const LAST_SYNC_KEY = 'cashly_last_sync_timestamp';
    const SYNC_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown between syncs

    // Check if we've already synced in this session
    const hasAlreadySyncedInSession = () => {
        return sessionStorage.getItem(SESSION_SYNC_KEY) === 'true';
    };

    // Check if enough time has passed since last sync (prevents spam)
    const canSync = () => {
        if (hasAlreadySyncedInSession()) return false;

        const lastSync = localStorage.getItem(LAST_SYNC_KEY);
        if (!lastSync) return true;

        return Date.now() - parseInt(lastSync, 10) > SYNC_COOLDOWN_MS;
    };

    // Mark as synced for this session
    const markAsSynced = () => {
        sessionStorage.setItem(SESSION_SYNC_KEY, 'true');
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
        console.log('✅ Marked as synced for this session');
    };

    // Set a flag so website knows extension is installed
    const setExtensionFlag = async () => {
        try {
            const extensionData = {
                installed: true,
                version: chrome.runtime.getManifest().version,
                timestamp: Date.now()
            };
            localStorage.setItem('cashly_extension', JSON.stringify(extensionData));

            // Also set auth status - with retry logic
            try {
                const data = await chrome.storage.local.get(['accessToken', 'userEmail']);
                const loggedIn = !!(data.accessToken && data.userEmail);
                const authData = {
                    loggedIn: loggedIn,
                    email: data.userEmail || null,
                    timestamp: Date.now()
                };
                localStorage.setItem('cashly_extension_auth', JSON.stringify(authData));

                // CRITICAL: Also set the synced flag that the website checks for fast loading
                if (loggedIn && data.userEmail) {
                    localStorage.setItem('cashly_extension_synced', JSON.stringify({
                        synced: true,
                        email: data.userEmail,
                        timestamp: Date.now()
                    }));
                }

                console.log('✅ Extension flags set:', {
                    installed: true,
                    loggedIn: authData.loggedIn,
                    email: authData.email
                });
            } catch (e) {
                console.log('Could not set auth flag:', e);
                // Set flag as not logged in if error
                localStorage.setItem('cashly_extension_auth', JSON.stringify({
                    loggedIn: false,
                    email: null,
                    timestamp: Date.now()
                }));
            }

            // Also dispatch a custom event (only once per session)
            if (!hasAlreadySyncedInSession()) {
                window.dispatchEvent(new CustomEvent('cashly-extension-ready', {
                    detail: extensionData
                }));
            }
        } catch (e) {
            console.log('Could not set extension flag:', e);
        }
    };

    // Initial flag set
    setExtensionFlag();

    // Retry after 1 second to catch any delayed auth data
    setTimeout(setExtensionFlag, 1000);

    // Retry after 3 seconds as well
    setTimeout(setExtensionFlag, 3000);

    // Refresh flags every 30 seconds to keep them fresh (reduced from 10s)
    setInterval(setExtensionFlag, 30000);

    // SYNC SITE VISITS from chrome.storage to localStorage (for website access)
    const syncSiteVisitsToLocalStorage = async () => {
        try {
            const result = await chrome.storage.local.get('siteVisits');
            if (result.siteVisits && Object.keys(result.siteVisits).length > 0) {
                localStorage.setItem('cashly_site_visits', JSON.stringify(result.siteVisits));
                console.log('✅ Synced', Object.keys(result.siteVisits).length, 'site visits to localStorage');
            }
        } catch (e) {
            console.log('Could not sync site visits:', e);
        }
    };

    // Sync immediately and periodically
    syncSiteVisitsToLocalStorage();
    setTimeout(syncSiteVisitsToLocalStorage, 2000);
    setInterval(syncSiteVisitsToLocalStorage, 5000);

    // Listen for messages from the popup or background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('Website received message:', message.type);

        switch (message.type) {
            case 'GET_SUPABASE_SESSION':
                // Get session from localStorage (where Supabase stores it)
                try {
                    const supabaseKey = Object.keys(localStorage).find(key =>
                        key.startsWith('sb-') && key.endsWith('-auth-token')
                    );

                    if (supabaseKey) {
                        const sessionData = JSON.parse(localStorage.getItem(supabaseKey));
                        sendResponse({
                            success: true,
                            session: sessionData
                        });
                    } else {
                        sendResponse({ success: false, error: 'No session found' });
                    }
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
                break;

            case 'EXTENSION_SYNCED':
                // Extension is now synced - notify the website (only if not already synced)
                if (!hasAlreadySyncedInSession()) {
                    window.dispatchEvent(new CustomEvent('extension-synced', {
                        detail: message.data
                    }));
                    markAsSynced();
                }

                // Refresh flags immediately to update auth status
                setExtensionFlag();
                sendResponse({ received: true });
                break;

            case 'EXTENSION_LOGGED_OUT':
                // Clear sync flags on logout
                sessionStorage.removeItem(SESSION_SYNC_KEY);
                localStorage.removeItem(LAST_SYNC_KEY);
                window.dispatchEvent(new CustomEvent('extension-logged-out'));
                sendResponse({ received: true });
                break;

            case 'NEW_TRANSACTION':
                // New transaction added via extension
                window.dispatchEvent(new CustomEvent('new-transaction', {
                    detail: message.data
                }));
                sendResponse({ received: true });
                break;

            case 'TRANSACTIONS_SYNCED':
                window.dispatchEvent(new CustomEvent('transactions-synced', {
                    detail: message.data
                }));
                sendResponse({ received: true });
                break;

            case 'SITE_VISIT_TRACKED':
                // Live site visit tracking - dispatch to Shopping Activity page
                console.log('🛒 Site visit tracked:', message.data?.siteName);
                window.dispatchEvent(new CustomEvent('cashly-site-detected', {
                    detail: message.data
                }));
                // Also dispatch for stats update
                window.dispatchEvent(new CustomEvent('site-visit-tracked', {
                    detail: message.data
                }));
                // INSTANT SYNC: Update localStorage immediately for website
                syncSiteVisitsToLocalStorage();
                sendResponse({ received: true });
                break;
        }

        return true;
    });

    // Listen for messages from the website (postMessage)
    window.addEventListener('message', async (event) => {
        if (event.source !== window) return;

        const message = event.data;
        if (!message || message.type !== 'WEBSITE_TO_EXTENSION') return;

        console.log('Extension received postMessage:', message.action);

        switch (message.action) {
            case 'SYNC_SESSION':
                // Website is sharing session with extension (only if not already synced)
                if (canSync()) {
                    try {
                        await chrome.runtime.sendMessage({
                            type: 'SYNC_SESSION_FROM_WEBSITE',
                            data: message.data
                        });
                        markAsSynced();
                        console.log('Session forwarded to extension background');
                    } catch (e) {
                        console.log('Could not forward session:', e);
                    }
                }
                break;

            case 'LOGOUT':
                try {
                    sessionStorage.removeItem(SESSION_SYNC_KEY);
                    localStorage.removeItem(LAST_SYNC_KEY);
                    await chrome.runtime.sendMessage({
                        type: 'USER_LOGGED_OUT'
                    });
                } catch (e) {
                    console.log('Could not forward logout:', e);
                }
                break;

            case 'CHECK_STATUS':
                // Website checking extension status
                try {
                    const data = await chrome.storage.local.get(['accessToken', 'userEmail']);
                    window.postMessage({
                        type: 'EXTENSION_STATUS',
                        installed: true,
                        loggedIn: !!(data.accessToken && data.userEmail),
                        email: data.userEmail
                    }, '*');
                } catch (e) {
                    console.log('Could not check status:', e);
                }
                break;
        }
    });

    // Watch for auth changes in localStorage (when user logs in/out on website)
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
        originalSetItem.apply(this, arguments);

        // Check if this is a Supabase auth token update
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            try {
                const sessionData = JSON.parse(value);
                if (sessionData && sessionData.access_token && sessionData.user) {
                    // Only sync if not already synced in this session
                    if (canSync()) {
                        console.log('🔄 Detected website login, syncing with extension...');

                        // Notify extension of new session
                        chrome.runtime.sendMessage({
                            type: 'WEBSITE_LOGIN',
                            data: {
                                session: sessionData,
                                user: sessionData.user,
                                accessToken: sessionData.access_token,
                                skipNotification: hasAlreadySyncedInSession() // Tell background to skip notification
                            }
                        }).then(() => {
                            markAsSynced();
                        }).catch(e => console.log('Could not notify extension:', e));
                    }
                }
            } catch (e) {
                // Not valid JSON, ignore
            }
        }
    };

    // Watch for localStorage removal (logout)
    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = function (key) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            console.log('🔄 Detected website logout, notifying extension...');
            sessionStorage.removeItem(SESSION_SYNC_KEY);
            localStorage.removeItem(LAST_SYNC_KEY);
            chrome.runtime.sendMessage({
                type: 'USER_LOGGED_OUT'
            }).catch(e => console.log('Could not notify extension:', e));
        }
        originalRemoveItem.apply(this, arguments);
    };

    // Check if website already has a session on load (only sync once per session)
    setTimeout(() => {
        // Skip if already synced in this session
        if (hasAlreadySyncedInSession()) {
            console.log('🔕 Already synced in this session, skipping auto-sync');
            return;
        }

        try {
            const supabaseKey = Object.keys(localStorage).find(key =>
                key.startsWith('sb-') && key.endsWith('-auth-token')
            );

            if (supabaseKey) {
                const sessionData = JSON.parse(localStorage.getItem(supabaseKey));
                if (sessionData && sessionData.access_token && sessionData.user) {
                    // Auto-sync on page load if website is logged in (silent - no notification)
                    chrome.runtime.sendMessage({
                        type: 'WEBSITE_LOGIN',
                        data: {
                            session: sessionData,
                            user: sessionData.user,
                            accessToken: sessionData.access_token,
                            skipNotification: true // IMPORTANT: Skip notification on page load
                        }
                    }).then(() => {
                        markAsSynced();
                    }).catch(e => console.log('Auto-sync failed:', e));
                }
            }
        } catch (e) {
            // Ignore errors
        }
    }, 1000);

})();

