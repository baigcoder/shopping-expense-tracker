// Background Service Worker - Enhanced Extension Logic
// Handles auto-detection, sync, notifications, and website communication

// ================================
// SUPABASE CONFIGURATION
// ================================
const SUPABASE_URL = 'https://ebfolvhqjvavrwrfcbhn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZm9sdmhxanZhdnJ3cmZjYmhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NjI0NDgsImV4cCI6MjA0OTIzODQ0OH0.RC7d0vMx1F4Z2J2Ovl9m2hZV8HCmZ2f6pBWSN-GJ3O0';

const WEBSITE_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://expense-tracker.vercel.app' // Add production URL when deployed
];

// ================================
// MESSAGE HANDLERS
// ================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received:', message.type);

    switch (message.type) {
        case 'PURCHASE_DETECTED':
            handlePurchaseDetected(message.data);
            break;

        case 'TRANSACTION_SYNCED':
            showNotification(message.data);
            break;

        case 'USER_LOGGED_IN':
            handleUserLoggedIn(message.data);
            break;

        case 'USER_LOGGED_OUT':
            handleUserLoggedOut();
            break;

        case 'WEBSITE_LOGIN':
            // Website notifying extension of login
            handleWebsiteLogin(message.data);
            break;

        case 'CHECK_EXTENSION_STATUS':
            // Website checking if extension is installed and logged in
            handleExtensionStatusCheck(sendResponse);
            return true; // Keep channel open for async response

        case 'SYNC_SESSION_FROM_WEBSITE':
            // Website sharing session with extension
            handleSessionSync(message.data, sendResponse);
            return true;
    }

    sendResponse({ received: true });
    return true;
});

// ================================
// EXTERNAL MESSAGE HANDLER (from website)
// ================================
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('External message from:', sender.origin, message.type);

    // Verify the sender is our website
    if (!WEBSITE_ORIGINS.some(origin => sender.origin?.includes(origin) || sender.url?.includes(origin))) {
        console.log('Rejected message from unknown origin');
        sendResponse({ error: 'Unknown origin' });
        return;
    }

    switch (message.type) {
        case 'CHECK_EXTENSION':
            // Website checking if extension is installed
            sendResponse({
                installed: true,
                version: chrome.runtime.getManifest().version
            });
            break;

        case 'SYNC_SESSION':
            // Website sending session to extension
            handleSessionSync(message.data, sendResponse);
            return true;

        case 'GET_EXTENSION_STATUS':
            handleExtensionStatusCheck(sendResponse);
            return true;

        case 'WEBSITE_USER_LOGGED_IN':
            // Auto-login extension when website logs in
            handleWebsiteLogin(message.data);
            sendResponse({ success: true });
            break;

        case 'WEBSITE_USER_LOGGED_OUT':
            handleUserLoggedOut();
            sendResponse({ success: true });
            break;
    }
});

// ================================
// SESSION SYNC HANDLERS
// ================================
async function handleSessionSync(data, sendResponse) {
    try {
        if (data.session && data.user) {
            await chrome.storage.local.set({
                supabaseSession: data.session,
                accessToken: data.session.access_token,
                userId: data.user.id,
                userEmail: data.user.email,
                userName: data.user.user_metadata?.name || data.user.email.split('@')[0],
                syncedFromWebsite: true,
                lastSync: Date.now()
            });

            console.log('✅ Session synced from website:', data.user.email);

            // Show sync notification
            showSyncNotification(data.user.email);

            // Sync pending transactions
            await syncPendingTransactions();

            // Notify popup to refresh
            chrome.runtime.sendMessage({ type: 'SESSION_UPDATED' });

            sendResponse({ success: true, message: 'Session synced' });
        } else {
            sendResponse({ success: false, message: 'Invalid session data' });
        }
    } catch (error) {
        console.error('Session sync error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

async function handleExtensionStatusCheck(sendResponse) {
    try {
        const data = await chrome.storage.local.get(['accessToken', 'userEmail', 'userId', 'lastSync']);

        sendResponse({
            installed: true,
            version: chrome.runtime.getManifest().version,
            loggedIn: !!(data.accessToken && data.userEmail),
            userEmail: data.userEmail || null,
            lastSync: data.lastSync || null
        });
    } catch (error) {
        sendResponse({
            installed: true,
            loggedIn: false,
            error: error.message
        });
    }
}

async function handleWebsiteLogin(data) {
    try {
        await chrome.storage.local.set({
            supabaseSession: data.session,
            accessToken: data.session?.access_token || data.accessToken,
            userId: data.user?.id || data.userId,
            userEmail: data.user?.email || data.email,
            userName: data.user?.user_metadata?.name || data.name || data.email?.split('@')[0],
            syncedFromWebsite: true,
            lastSync: Date.now()
        });

        console.log('✅ Auto-logged in from website');

        // Show sync notification
        showSyncNotification(data.user?.email || data.email);

        // Sync pending transactions
        await syncPendingTransactions();

        // Notify popup
        chrome.runtime.sendMessage({ type: 'SESSION_UPDATED' });

        // Notify all website tabs that extension is now synced
        notifyWebsiteTabs('EXTENSION_SYNCED', {
            email: data.user?.email || data.email,
            userId: data.user?.id || data.userId
        });

    } catch (error) {
        console.error('Website login sync error:', error);
    }
}

async function handleUserLoggedIn(data) {
    console.log('User logged in via extension:', data.email);

    // Sync pending transactions
    await syncPendingTransactions();

    // Notify website tabs that extension is now logged in
    notifyWebsiteTabs('EXTENSION_SYNCED', {
        email: data.email,
        userId: data.userId
    });

    // Show notification
    showSyncNotification(data.email);
}

async function handleUserLoggedOut() {
    console.log('User logged out');

    await chrome.storage.local.remove([
        'supabaseSession', 'accessToken', 'userId', 'userEmail',
        'userName', 'syncedFromWebsite', 'lastSync'
    ]);

    // Notify website tabs
    notifyWebsiteTabs('EXTENSION_LOGGED_OUT', {});
}

// ================================
// WEBSITE TAB COMMUNICATION
// ================================
async function notifyWebsiteTabs(messageType, data) {
    try {
        const tabs = await chrome.tabs.query({});

        for (const tab of tabs) {
            if (tab.url && WEBSITE_ORIGINS.some(origin => tab.url.startsWith(origin))) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        type: messageType,
                        data: data,
                        source: 'extension'
                    });
                    console.log('Notified website tab:', tab.id);
                } catch (e) {
                    // Tab might not have content script loaded
                }
            }
        }
    } catch (error) {
        console.log('Could not notify website tabs:', error.message);
    }
}

// ================================
// PURCHASE DETECTION
// ================================
async function handlePurchaseDetected(data) {
    console.log('🛒 Purchase detected:', data);

    try {
        const authData = await chrome.storage.local.get(['accessToken', 'userId', 'userEmail']);

        const transaction = {
            id: Date.now().toString(),
            store: data.storeName,
            product: data.productName,
            amount: data.amount,
            storeUrl: data.storeUrl,
            date: data.detectedAt || new Date().toISOString(),
            synced: false,
            icon: getCategoryIcon(data.storeName)
        };

        // Save locally first
        const storage = await chrome.storage.local.get(['recentTransactions', 'monthlySpent', 'transactionCount', 'pendingSync']);
        const transactions = storage.recentTransactions || [];
        const pendingSync = storage.pendingSync || [];

        transactions.unshift(transaction);

        await chrome.storage.local.set({
            recentTransactions: transactions.slice(0, 100),
            monthlySpent: (storage.monthlySpent || 0) + transaction.amount,
            transactionCount: (storage.transactionCount || 0) + 1
        });

        // Sync to Supabase if logged in
        if (authData.accessToken && authData.userId) {
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${authData.accessToken}`,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        user_id: authData.userId,
                        description: `${transaction.store} - ${transaction.product}`,
                        amount: transaction.amount,
                        type: 'expense',
                        category: getCategoryFromStore(transaction.store),
                        source: 'extension',
                        date: new Date().toISOString().split('T')[0]
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    transaction.synced = true;
                    console.log('✅ Transaction synced to Supabase!', result);

                    showNotification(transaction);
                    chrome.runtime.sendMessage({ type: 'TRANSACTION_ADDED' });

                    // Notify website to refresh
                    notifyWebsiteTabs('NEW_TRANSACTION', transaction);
                } else {
                    pendingSync.push(transaction);
                    await chrome.storage.local.set({ pendingSync });
                }
            } catch (syncError) {
                console.error('Sync error:', syncError);
                pendingSync.push(transaction);
                await chrome.storage.local.set({ pendingSync });
            }
        } else {
            pendingSync.push(transaction);
            await chrome.storage.local.set({ pendingSync });
            showNotification(transaction);
        }

    } catch (error) {
        console.error('Handle purchase error:', error);
    }
}

// ================================
// PENDING SYNC
// ================================
async function syncPendingTransactions() {
    try {
        const storage = await chrome.storage.local.get(['pendingSync', 'accessToken', 'userId']);
        const pending = storage.pendingSync || [];

        if (pending.length === 0 || !storage.accessToken || !storage.userId) return;

        console.log(`⏳ Syncing ${pending.length} pending transactions...`);

        const synced = [];
        const failed = [];

        for (const transaction of pending) {
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${storage.accessToken}`,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        user_id: storage.userId,
                        description: `${transaction.store} - ${transaction.product}`,
                        amount: transaction.amount,
                        type: 'expense',
                        category: getCategoryFromStore(transaction.store),
                        source: 'extension',
                        date: transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0]
                    })
                });

                if (response.ok) {
                    synced.push(transaction.id);
                } else {
                    failed.push(transaction);
                }
            } catch (error) {
                failed.push(transaction);
            }
        }

        await chrome.storage.local.set({ pendingSync: failed });

        if (synced.length > 0) {
            console.log(`✅ Synced ${synced.length} transactions`);
            showNotification({
                store: 'Sync Complete',
                product: `${synced.length} transactions synced`,
                amount: 0
            }, true);

            // Notify website
            notifyWebsiteTabs('TRANSACTIONS_SYNCED', { count: synced.length });
        }

    } catch (error) {
        console.error('Pending sync error:', error);
    }
}

// ================================
// NOTIFICATIONS
// ================================
function showNotification(transaction, isSync = false) {
    const notificationId = `expense-${Date.now()}`;

    chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: isSync ? '✓ Expense Tracker Synced' : '💸 Purchase Tracked!',
        message: isSync
            ? transaction.product
            : `${transaction.store}: Rs ${transaction.amount?.toFixed(0) || '0'} - ${(transaction.product || '').slice(0, 30)}`,
        priority: 2
    });

    setTimeout(() => {
        chrome.notifications.clear(notificationId);
    }, 5000);
}

function showSyncNotification(email) {
    const notificationId = `sync-${Date.now()}`;

    chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '🔗 Extension Synced!',
        message: `Connected to ${email}. Auto-tracking is now active.`,
        priority: 2
    });

    setTimeout(() => {
        chrome.notifications.clear(notificationId);
    }, 5000);
}

// ================================
// HELPERS
// ================================
function getCategoryIcon(storeName) {
    const store = (storeName || '').toLowerCase();
    if (store.includes('amazon') || store.includes('daraz')) return '📦';
    if (store.includes('netflix') || store.includes('hulu') || store.includes('disney')) return '📺';
    if (store.includes('spotify') || store.includes('apple music')) return '🎵';
    if (store.includes('uber') || store.includes('doordash') || store.includes('foodpanda')) return '🍔';
    if (store.includes('nike') || store.includes('adidas')) return '👕';
    if (store.includes('apple') || store.includes('best buy')) return '📱';
    return '🛍️';
}

function getCategoryFromStore(storeName) {
    const store = (storeName || '').toLowerCase();
    if (store.includes('food') || store.includes('restaurant') || store.includes('foodpanda')) return 'Food & Dining';
    if (store.includes('amazon') || store.includes('daraz') || store.includes('shopping')) return 'Shopping';
    if (store.includes('netflix') || store.includes('spotify')) return 'Entertainment';
    if (store.includes('uber') || store.includes('careem')) return 'Transport';
    return 'Shopping';
}

// ================================
// LIFECYCLE EVENTS
// ================================
chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 Expense Tracker extension started');
});

chrome.runtime.onInstalled.addListener(() => {
    console.log('📦 Expense Tracker extension installed');

    // Show welcome notification
    chrome.notifications.create('welcome', {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '💰 Expense Tracker Installed!',
        message: 'Sign in to start auto-tracking your purchases.',
        priority: 2
    });
});

// Periodic sync check (every 5 minutes)
setInterval(() => {
    syncPendingTransactions();
}, 5 * 60 * 1000);
