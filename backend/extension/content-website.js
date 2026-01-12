// Content Script for Website - Enterprise Connection v9.0
// Handles robust session sharing between website and extension
// Features: Heartbeat, reconnection, message queue, bidirectional ping

(function () {
    'use strict';

    // ================================
    // CONNECTION STATE MANAGEMENT
    // ================================
    const ConnectionState = {
        status: 'connecting', // connecting, connected, disconnected, reconnecting
        lastHeartbeat: Date.now(),
        reconnectAttempts: 0,
        maxReconnectAttempts: 10,
        baseReconnectDelay: 1000,
        maxReconnectDelay: 30000,
        heartbeatInterval: 3000,
        messageQueue: [],
        pendingAcks: new Map(),
        connectionId: `conn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    };

    // Session-based flags
    const SESSION_SYNC_KEY = 'cashly_session_synced';
    const LAST_SYNC_KEY = 'cashly_last_sync_timestamp';
    const SYNC_COOLDOWN_MS = 60 * 1000;
    const CONNECTION_KEY = 'cashly_connection_state';

    // ================================
    // UTILITY FUNCTIONS
    // ================================
    const hasAlreadySyncedInSession = () => sessionStorage.getItem(SESSION_SYNC_KEY) === 'true';

    const canSync = () => {
        if (hasAlreadySyncedInSession()) return false;
        const lastSync = localStorage.getItem(LAST_SYNC_KEY);
        if (!lastSync) return true;
        return Date.now() - parseInt(lastSync, 10) > SYNC_COOLDOWN_MS;
    };

    const markAsSynced = () => {
        sessionStorage.setItem(SESSION_SYNC_KEY, 'true');
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    };

    // Generate message ID for acknowledgment tracking
    const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // ================================
    // ROBUST MESSAGE SENDING
    // ================================
    const sendToBackground = async (message, expectAck = false) => {
        const messageId = generateMessageId();
        const wrappedMessage = { ...message, _messageId: messageId, _timestamp: Date.now() };

        // If disconnected, queue the message
        if (ConnectionState.status === 'disconnected' || ConnectionState.status === 'reconnecting') {
            if (ConnectionState.messageQueue.length < 100) { // Limit queue size
                ConnectionState.messageQueue.push(wrappedMessage);
                console.log(`📤 Message queued (${ConnectionState.messageQueue.length} pending):`, message.type);
            }
            return { queued: true };
        }

        try {
            const response = await chrome.runtime.sendMessage(wrappedMessage);

            // Track pending acknowledgment if needed
            if (expectAck) {
                ConnectionState.pendingAcks.set(messageId, {
                    message: wrappedMessage,
                    sentAt: Date.now()
                });
            }

            // Update last successful communication
            ConnectionState.lastHeartbeat = Date.now();
            if (ConnectionState.status !== 'connected') {
                updateConnectionStatus('connected');
                ConnectionState.reconnectAttempts = 0;
            }

            return response;
        } catch (error) {
            console.error('❌ Message send failed:', error);
            handleConnectionError();

            // Queue the message for retry
            if (ConnectionState.messageQueue.length < 100) {
                ConnectionState.messageQueue.push(wrappedMessage);
            }
            return { error: error.message };
        }
    };

    // ================================
    // CONNECTION STATUS MANAGEMENT
    // ================================
    const updateConnectionStatus = (status) => {
        const prevStatus = ConnectionState.status;
        ConnectionState.status = status;

        // Store connection state for website access
        const connectionData = {
            status,
            connectionId: ConnectionState.connectionId,
            timestamp: Date.now(),
            reconnectAttempts: ConnectionState.reconnectAttempts,
            queuedMessages: ConnectionState.messageQueue.length
        };
        localStorage.setItem(CONNECTION_KEY, JSON.stringify(connectionData));

        // Dispatch event for website to react
        window.dispatchEvent(new CustomEvent('cashly-connection-change', {
            detail: { status, prevStatus, ...connectionData }
        }));

        console.log(`🔌 Connection: ${prevStatus} → ${status}`);
    };

    // ================================
    // RECONNECTION LOGIC
    // ================================
    const handleConnectionError = () => {
        if (ConnectionState.status === 'reconnecting') return; // Already reconnecting

        updateConnectionStatus('disconnected');
        attemptReconnect();
    };

    const attemptReconnect = async () => {
        if (ConnectionState.reconnectAttempts >= ConnectionState.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            updateConnectionStatus('disconnected');
            return;
        }

        updateConnectionStatus('reconnecting');
        ConnectionState.reconnectAttempts++;

        // Exponential backoff with jitter
        const delay = Math.min(
            ConnectionState.baseReconnectDelay * Math.pow(2, ConnectionState.reconnectAttempts - 1),
            ConnectionState.maxReconnectDelay
        ) * (0.5 + Math.random() * 0.5);

        console.log(`🔄 Reconnect attempt ${ConnectionState.reconnectAttempts}/${ConnectionState.maxReconnectAttempts} in ${Math.round(delay)}ms`);

        await new Promise(r => setTimeout(r, delay));

        try {
            // Ping the background script
            const response = await chrome.runtime.sendMessage({ type: 'PING', _timestamp: Date.now() });

            if (response) {
                console.log('✅ Reconnection successful');
                updateConnectionStatus('connected');
                ConnectionState.reconnectAttempts = 0;

                // Process queued messages
                await processMessageQueue();
            } else {
                attemptReconnect();
            }
        } catch (error) {
            attemptReconnect();
        }
    };

    // ================================
    // MESSAGE QUEUE PROCESSING
    // ================================
    const processMessageQueue = async () => {
        if (ConnectionState.messageQueue.length === 0) return;

        console.log(`📬 Processing ${ConnectionState.messageQueue.length} queued messages`);
        const queue = [...ConnectionState.messageQueue];
        ConnectionState.messageQueue = [];

        for (const message of queue) {
            try {
                await chrome.runtime.sendMessage(message);
                console.log('✅ Queued message sent:', message.type);
            } catch (error) {
                // Re-queue failed messages
                ConnectionState.messageQueue.push(message);
            }
            // Small delay between messages
            await new Promise(r => setTimeout(r, 100));
        }
    };

    // ================================
    // HEARTBEAT SYSTEM
    // ================================
    const startHeartbeat = () => {
        setInterval(async () => {
            try {
                await setExtensionFlag();

                // Check if we've lost connection
                const timeSinceLastHeartbeat = Date.now() - ConnectionState.lastHeartbeat;
                if (timeSinceLastHeartbeat > ConnectionState.heartbeatInterval * 3) {
                    console.warn('⚠️ Heartbeat timeout detected');
                    handleConnectionError();
                }
            } catch (error) {
                handleConnectionError();
            }
        }, ConnectionState.heartbeatInterval);
    };

    // ================================
    // EXTENSION FLAG (Enhanced)
    // ================================
    const setExtensionFlag = async () => {
        try {
            const extensionData = {
                installed: true,
                version: chrome.runtime.getManifest().version,
                timestamp: Date.now(),
                connectionId: ConnectionState.connectionId,
                connectionStatus: ConnectionState.status
            };
            localStorage.setItem('cashly_extension', JSON.stringify(extensionData));

            // Also set auth status
            try {
                const data = await chrome.storage.local.get(['accessToken', 'userEmail']);
                const loggedIn = !!(data.accessToken && data.userEmail);

                const prevAuth = localStorage.getItem('cashly_extension_auth');
                let wasLoggedIn = false;
                if (prevAuth) {
                    try { wasLoggedIn = JSON.parse(prevAuth).loggedIn === true; } catch { }
                }

                const authData = {
                    loggedIn,
                    email: data.userEmail || null,
                    timestamp: Date.now(),
                    connectionStatus: ConnectionState.status
                };
                localStorage.setItem('cashly_extension_auth', JSON.stringify(authData));

                if (loggedIn && data.userEmail) {
                    localStorage.setItem('cashly_extension_synced', JSON.stringify({
                        synced: true,
                        email: data.userEmail,
                        timestamp: Date.now()
                    }));

                    if (!wasLoggedIn && !hasAlreadySyncedInSession()) {
                        console.log('🔗 Extension: Dispatching extension-synced event');
                        window.dispatchEvent(new CustomEvent('extension-synced', {
                            detail: { email: data.userEmail, timestamp: Date.now() }
                        }));
                        markAsSynced();
                    }
                }

                // Update connection state
                ConnectionState.lastHeartbeat = Date.now();
                if (ConnectionState.status !== 'connected') {
                    updateConnectionStatus('connected');
                }

            } catch (e) {
                localStorage.setItem('cashly_extension_auth', JSON.stringify({
                    loggedIn: false,
                    email: null,
                    timestamp: Date.now(),
                    error: e.message
                }));
            }

            if (!hasAlreadySyncedInSession()) {
                window.dispatchEvent(new CustomEvent('cashly-extension-ready', {
                    detail: extensionData
                }));
            }
        } catch (e) {
            handleConnectionError();
        }
    };

    // ================================
    // INITIALIZATION
    // ================================
    setExtensionFlag();
    setTimeout(setExtensionFlag, 1000);
    setTimeout(setExtensionFlag, 3000);
    startHeartbeat();

    // Sync site visits to localStorage
    const syncSiteVisitsToLocalStorage = async () => {
        try {
            const result = await chrome.storage.local.get('siteVisits');
            if (result.siteVisits && Object.keys(result.siteVisits).length > 0) {
                localStorage.setItem('cashly_site_visits', JSON.stringify(result.siteVisits));
            }
        } catch (e) { }
    };

    syncSiteVisitsToLocalStorage();
    setTimeout(syncSiteVisitsToLocalStorage, 2000);
    setInterval(syncSiteVisitsToLocalStorage, 5000);

    // Listen for messages from the popup or background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

        switch (message.action) {
            case 'SYNC_SESSION':
                // Website is sharing session with extension
                // Always accept session data to enable instant sync on page refresh
                try {
                    console.log('📥 Extension: Received SYNC_SESSION from website');
                    await chrome.runtime.sendMessage({
                        type: 'SYNC_SESSION_FROM_WEBSITE',
                        data: message.data
                    });
                    // Update localStorage flags immediately
                    setExtensionFlag();
                    markAsSynced();
                } catch (e) {
                    console.log('Extension sync error:', e.message);
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
                    // Silently ignore
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
                    // Silently ignore
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
                        }).catch(() => { });
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
            sessionStorage.removeItem(SESSION_SYNC_KEY);
            localStorage.removeItem(LAST_SYNC_KEY);
            chrome.runtime.sendMessage({
                type: 'USER_LOGGED_OUT'
            }).catch(() => { });
        }
        originalRemoveItem.apply(this, arguments);
    };

    // Check if website already has a session on load (only sync once per session)
    setTimeout(() => {
        // Skip if already synced in this session
        if (hasAlreadySyncedInSession()) {
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
                    }).catch(() => { });
                }
            }
        } catch (e) {
            // Ignore errors
        }
    }, 1000);

})();
