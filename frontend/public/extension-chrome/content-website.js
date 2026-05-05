// Content Script for Website - Enterprise Connection v9.1
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

    // Local table used by the app's Firebase compatibility layer.
    const tableStorageKey = (table) => `cashly_table_${table}`;

    const readRows = (table) => {
        try {
            const stored = localStorage.getItem(tableStorageKey(table));
            const parsed = stored ? JSON.parse(stored) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const writeRows = (table, rows) => {
        localStorage.setItem(tableStorageKey(table), JSON.stringify(rows));
    };

    const normalizeExtensionTransaction = (detail) => {
        const tx = detail?.transaction || detail || {};
        const amount = Number(tx.amount ?? tx.price ?? 0);
        const id = tx.id || `ext_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const description = tx.description || tx.name || [tx.store, tx.product].filter(Boolean).join(' - ') || tx.storeName || 'Detected Purchase';

        return {
            ...tx,
            id,
            user_id: tx.user_id || tx.userId || null,
            date: tx.date || tx.detectedAt || tx.created_at || new Date().toISOString(),
            description,
            amount: Number.isFinite(amount) ? amount : 0,
            type: tx.type === 'income' ? 'income' : 'expense',
            category: tx.category || 'Shopping',
            source: tx.source || 'extension-detected',
            created_at: tx.created_at || new Date().toISOString(),
        };
    };

    const saveTransactionToLocalTable = (detail) => {
        const row = normalizeExtensionTransaction(detail);
        const rows = readRows('transactions');
        const existingIndex = rows.findIndex((item) => item.id === row.id);

        if (existingIndex >= 0) {
            rows[existingIndex] = { ...rows[existingIndex], ...row };
        } else {
            rows.unshift(row);
        }

        writeRows('transactions', rows);
        return row;
    };

    const dispatchTransaction = (detail, source) => {
        const row = saveTransactionToLocalTable(detail);
        window.dispatchEvent(new CustomEvent('new-transaction', { detail: row }));
        window.dispatchEvent(new CustomEvent('transaction-added-realtime', {
            detail: { transaction: row, source }
        }));
        return row;
    };

    // ================================
    // UTILITY FUNCTIONS
    // ================================
    const hasAlreadySyncedInSession = () => false; // Always allow syncing to ensure freshness

    const canSync = () => {
        const lastSync = localStorage.getItem(LAST_SYNC_KEY);
        if (!lastSync) return true;
        // Reduce cooldown to 5 seconds for better responsiveness
        return Date.now() - parseInt(lastSync, 10) > 5000;
    };

    const markAsSynced = () => {
        sessionStorage.setItem(SESSION_SYNC_KEY, 'true');
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    };

    const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // ================================
    // ROBUST MESSAGE SENDING
    // ================================
    const sendToBackground = async (message, expectAck = false) => {
        const messageId = generateMessageId();
        const wrappedMessage = { ...message, _messageId: messageId, _timestamp: Date.now() };

        if (ConnectionState.status === 'disconnected' || ConnectionState.status === 'reconnecting') {
            if (ConnectionState.messageQueue.length < 100) {
                ConnectionState.messageQueue.push(wrappedMessage);
            }
            return { queued: true };
        }

        try {
            const response = await chrome.runtime.sendMessage(wrappedMessage);
            if (expectAck) {
                ConnectionState.pendingAcks.set(messageId, {
                    message: wrappedMessage,
                    sentAt: Date.now()
                });
            }
            ConnectionState.lastHeartbeat = Date.now();
            if (ConnectionState.status !== 'connected') {
                updateConnectionStatus('connected');
                ConnectionState.reconnectAttempts = 0;
            }
            return response;
        } catch (error) {
            handleConnectionError();
            if (ConnectionState.messageQueue.length < 100) {
                ConnectionState.messageQueue.push(wrappedMessage);
            }
            return { error: error.message };
        }
    };

    const updateConnectionStatus = (status) => {
        const prevStatus = ConnectionState.status;
        ConnectionState.status = status;
        const connectionData = {
            status,
            connectionId: ConnectionState.connectionId,
            timestamp: Date.now(),
            reconnectAttempts: ConnectionState.reconnectAttempts,
            queuedMessages: ConnectionState.messageQueue.length
        };
        localStorage.setItem(CONNECTION_KEY, JSON.stringify(connectionData));
        window.dispatchEvent(new CustomEvent('cashly-connection-change', {
            detail: { status, prevStatus, ...connectionData }
        }));
    };

    const handleConnectionError = () => {
        if (ConnectionState.status === 'reconnecting') return;
        updateConnectionStatus('disconnected');
        attemptReconnect();
    };

    const attemptReconnect = async () => {
        if (ConnectionState.reconnectAttempts >= ConnectionState.maxReconnectAttempts) {
            updateConnectionStatus('disconnected');
            return;
        }
        updateConnectionStatus('reconnecting');
        ConnectionState.reconnectAttempts++;
        const delay = Math.min(
            ConnectionState.baseReconnectDelay * Math.pow(2, ConnectionState.reconnectAttempts - 1),
            ConnectionState.maxReconnectDelay
        ) * (0.5 + Math.random() * 0.5);
        await new Promise(r => setTimeout(r, delay));
        try {
            const response = await chrome.runtime.sendMessage({ type: 'PING', _timestamp: Date.now() });
            if (response) {
                updateConnectionStatus('connected');
                ConnectionState.reconnectAttempts = 0;
                await processMessageQueue();
            } else {
                attemptReconnect();
            }
        } catch (error) {
            attemptReconnect();
        }
    };

    const processMessageQueue = async () => {
        if (ConnectionState.messageQueue.length === 0) return;
        const queue = [...ConnectionState.messageQueue];
        ConnectionState.messageQueue = [];
        for (const message of queue) {
            try {
                await chrome.runtime.sendMessage(message);
            } catch (error) {
                ConnectionState.messageQueue.push(message);
            }
            await new Promise(r => setTimeout(r, 100));
        }
    };

    const startHeartbeat = () => {
        setInterval(async () => {
            try {
                await setExtensionFlag();
                const timeSinceLastHeartbeat = Date.now() - ConnectionState.lastHeartbeat;
                if (timeSinceLastHeartbeat > ConnectionState.heartbeatInterval * 3) {
                    handleConnectionError();
                }
            } catch (error) {
                handleConnectionError();
            }
        }, ConnectionState.heartbeatInterval);
    };

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
                        window.dispatchEvent(new CustomEvent('extension-synced', {
                            detail: { email: data.userEmail, timestamp: Date.now() }
                        }));
                        markAsSynced();
                    }
                }
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
        } catch (e) {
            handleConnectionError();
        }
    };

    // ================================
    // AUTO-SYNC SESSION FROM WEBSITE LOGIN
    // ================================
    const autoSyncSessionIfLoggedIn = async () => {
        try {
            // Check if user is logged in on the website
            const allKeys = Object.keys(localStorage);
            const authRelatedKeys = allKeys.filter(k => 
                k.toLowerCase().includes('firebase') ||
                k.toLowerCase().includes('supabase') ||
                (k.toLowerCase().includes('auth') && k.length > 10)
            );

            console.log('[Cashly Extension] Checking for login... Found auth keys:', authRelatedKeys.length);

            // Check Firebase (most common)
            for (const key of authRelatedKeys) {
                if (key.includes('firebase')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data?.stsTokenManager?.accessToken) {
                            console.log('[Cashly Extension] ✅ Detected Firebase login, syncing...');
                            
                            const session = {
                                access_token: data.stsTokenManager.accessToken,
                                user: {
                                    id: data.uid,
                                    email: data.email,
                                    name: data.displayName || data.email?.split('@')[0]
                                }
                            };

                            // Auto-sync to extension
                            const response = await sendToBackground({
                                type: 'WEBSITE_LOGIN',
                                data: {
                                    session: session,
                                    user: session.user,
                                    accessToken: session.access_token,
                                    autoSync: true,
                                    timestamp: Date.now()
                                }
                            });

                            console.log('[Cashly Extension] Auto-sync response:', response);
                            markAsSynced();
                            break;
                        }
                    } catch (e) {
                        console.log('[Cashly Extension] Firebase parse error:', e.message);
                    }
                }
            }

            // Check Supabase as fallback
            const supabaseKey = allKeys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
            if (supabaseKey) {
                try {
                    const session = JSON.parse(localStorage.getItem(supabaseKey));
                    if (session?.access_token) {
                        console.log('[Cashly Extension] ✅ Detected Supabase login, syncing...');
                        
                        const response = await sendToBackground({
                            type: 'WEBSITE_LOGIN',
                            data: {
                                session: session,
                                user: session.user || { email: 'User', id: 'unknown' },
                                accessToken: session.access_token,
                                autoSync: true,
                                timestamp: Date.now()
                            }
                        });

                        console.log('[Cashly Extension] Auto-sync response:', response);
                        markAsSynced();
                    }
                } catch (e) {
                    console.log('[Cashly Extension] Supabase parse error:', e.message);
                }
            }
        } catch (e) {
            console.error('[Cashly Extension] Auto-sync error:', e);
        }
    };

    // Run auto-sync on page load
    autoSyncSessionIfLoggedIn();
    setTimeout(autoSyncSessionIfLoggedIn, 2000);

    // Monitor localStorage changes for login
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
        const oldValue = this.getItem(key);
        originalSetItem.call(this, key, value);

        // Detect login via localStorage changes
        if ((key.includes('firebase') || key.includes('supabase') || key.includes('auth')) && oldValue !== value) {
            console.log('[Cashly Extension] Detected localStorage change:', key.slice(0, 30) + '...');
            
            // Debounce: only sync if enough time has passed
            const now = Date.now();
            const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0', 10);
            if (now - lastSync > 3000) {
                setTimeout(() => autoSyncSessionIfLoggedIn(), 500);
            }
        }
    };

    setExtensionFlag();
    setTimeout(setExtensionFlag, 1000);
    startHeartbeat();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
            case 'GET_SUPABASE_SESSION':
                try {
                    // Try Supabase pattern
                    const supabaseKey = Object.keys(localStorage).find(key =>
                        key.startsWith('sb-') && key.endsWith('-auth-token')
                    );
                    if (supabaseKey) {
                        const sessionData = JSON.parse(localStorage.getItem(supabaseKey));
                        sendResponse({ success: true, session: sessionData });
                        return true;
                    }
                    // Try Firebase pattern
                    const firebaseKey = Object.keys(localStorage).find(key =>
                        key.startsWith('firebase:authUser:')
                    );
                    if (firebaseKey) {
                        const data = JSON.parse(localStorage.getItem(firebaseKey));
                        if (data?.stsTokenManager) {
                            sendResponse({
                                success: true,
                                session: {
                                    access_token: data.stsTokenManager.accessToken,
                                    refresh_token: data.stsTokenManager.refreshToken,
                                    user: { id: data.uid, email: data.email, user_metadata: { full_name: data.displayName, avatar_url: data.photoURL } }
                                }
                            });
                            return true;
                        }
                    }
                    sendResponse({ success: false, error: 'No session found' });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
                break;
            case 'EXTENSION_SYNCED':
                if (!hasAlreadySyncedInSession()) {
                    window.dispatchEvent(new CustomEvent('extension-synced', { detail: message.data }));
                    markAsSynced();
                }
                setExtensionFlag();
                sendResponse({ received: true });
                break;
            case 'EXTENSION_LOGGED_OUT':
                sessionStorage.removeItem(SESSION_SYNC_KEY);
                localStorage.removeItem(LAST_SYNC_KEY);
                window.dispatchEvent(new CustomEvent('extension-logged-out'));
                sendResponse({ received: true });
                break;
            case 'NEW_TRANSACTION':
            case 'TRANSACTION_ADDED':
                dispatchTransaction(message.data, 'extension');
                sendResponse({ received: true });
                break;
        }
        return true;
    });

    window.addEventListener('message', async (event) => {
        if (event.source !== window || !event.data || event.data.type !== 'WEBSITE_TO_EXTENSION') return;
        const message = event.data;
        if (message.action === 'SYNC_SESSION') {
            try {
                await chrome.runtime.sendMessage({ type: 'SYNC_SESSION_FROM_WEBSITE', data: message.data });
                setExtensionFlag();
                markAsSynced();
            } catch (e) { }
        } else if (message.action === 'LOGOUT') {
            try {
                sessionStorage.removeItem(SESSION_SYNC_KEY);
                localStorage.removeItem(LAST_SYNC_KEY);
                await chrome.runtime.sendMessage({ type: 'USER_LOGGED_OUT' });
            } catch (e) { }
        } else if (message.action === 'CHECK_STATUS') {
            try {
                await setExtensionFlag();
                autoSyncSessionIfLoggedIn();
            } catch (e) { }
        }
    });

    // ─── AUTH SNIFFING HOOKS ───
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
        originalSetItem.apply(this, arguments);
        const isSupabase = key.startsWith('sb-') && key.endsWith('-auth-token');
        const isFirebase = key.includes('firebase') && key.includes('auth');
        
        if (isSupabase || isFirebase) {
            try {
                const data = JSON.parse(value);
                let session = null;
                if (isSupabase && data?.access_token) {
                    session = data;
                } else if (isFirebase) {
                    // Handle Firebase auth data
                    if (data?.stsTokenManager?.accessToken) {
                        session = {
                            access_token: data.stsTokenManager.accessToken,
                            refresh_token: data.stsTokenManager.refreshToken,
                            user: { id: data.uid, email: data.email, user_metadata: { full_name: data.displayName, avatar_url: data.photoURL } }
                        };
                    } else if (data?.access_token && typeof data.access_token === 'string') {
                        session = {
                            access_token: data.access_token,
                            refresh_token: data.refresh_token,
                            user: { id: data.uid, email: data.email, user_metadata: { full_name: data.displayName, avatar_url: data.photoURL } }
                        };
                    }
                }
                
                if (session && canSync()) {
                    console.log('🔐 Auth detected, syncing with extension...');
                    chrome.runtime.sendMessage({
                        type: 'WEBSITE_LOGIN',
                        data: { session, user: session.user, accessToken: session.access_token, skipNotification: false }
                    }).then(() => markAsSynced()).catch(() => { });
                }
            } catch (e) { 
                console.error('Auth sync error:', e);
            }
        }
    };

    // Auto-sync on load - improved Firebase detection
    setTimeout(() => {
        try {
            console.log('🔍 Auto-syncing: checking for active session...');
            
            // Check Supabase first
            const supabaseKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
            let session = null;

            const tryBridge = (key) => {
                try {
                    const raw = localStorage.getItem(key);
                    if (!raw) return null;
                    const parsed = JSON.parse(raw);
                    const token = parsed.access_token || parsed.accessToken;
                    if (!token || typeof token !== 'string') return null;
                    const u = parsed.user || {};
                    return {
                        access_token: token,
                        refresh_token: parsed.refresh_token,
                        user: {
                            id: u.id || parsed.userId,
                            email: u.email || parsed.email,
                            user_metadata: u.user_metadata || { full_name: u.name, avatar_url: u.avatar_url },
                        },
                    };
                } catch {
                    return null;
                }
            };
            
            if (supabaseKey) {
                session = JSON.parse(localStorage.getItem(supabaseKey));
                console.log('✅ Found Supabase session');
            } else if ((session = tryBridge('cashly_web_session_bridge'))) {
                console.log('✅ Found Cashly web session bridge');
            } else if ((session = tryBridge('expense_tracker_session'))) {
                console.log('✅ Found expense_tracker_session bridge');
            } else {
                // Check for any Firebase auth key
                const firebaseKeys = Object.keys(localStorage).filter(k => k.toLowerCase().includes('firebase') && k.toLowerCase().includes('auth'));
                console.log('Firebase auth keys:', firebaseKeys);
                
                for (const firebaseKey of firebaseKeys) {
                    try {
                        const d = JSON.parse(localStorage.getItem(firebaseKey));
                        if (d) {
                            console.log('Checking Firebase key:', firebaseKey);
                            if (d?.stsTokenManager?.accessToken) {
                                session = {
                                    access_token: d.stsTokenManager.accessToken,
                                    refresh_token: d.stsTokenManager.refreshToken,
                                    user: { id: d.uid, email: d.email, user_metadata: { full_name: d.displayName, avatar_url: d.photoURL } }
                                };
                                console.log('✅ Found Firebase session (stsTokenManager)');
                                break;
                            } else if (d?.access_token && typeof d.access_token === 'string') {
                                session = {
                                    access_token: d.access_token,
                                    refresh_token: d.refresh_token,
                                    user: { id: d.uid, email: d.email, user_metadata: { full_name: d.displayName, avatar_url: d.photoURL } }
                                };
                                console.log('✅ Found Firebase session (direct access_token)');
                                break;
                            }
                        }
                    } catch (parseErr) {
                        console.warn('Firebase parse error:', parseErr);
                    }
                }
            }
            
            if (session?.access_token && canSync()) {
                console.log('🔄 Proactive auto-syncing session...');
                chrome.runtime.sendMessage({
                    type: 'WEBSITE_LOGIN',
                    data: { session, user: session.user, accessToken: session.access_token, skipNotification: true }
                }).then(() => markAsSynced()).catch(() => { });
            } else {
                console.log('❌ No active session found yet or sync on cooldown');
            }
        } catch (e) { 
            console.error('Auto-sync error:', e);
        }
    }, 2000);

})();
