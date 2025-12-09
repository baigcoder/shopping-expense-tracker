// Background Service Worker - Handles sync and notifications

// ================================
// CONFIGURATION - CHANGE FOR PRODUCTION
// ================================
// For development: use localhost
// For production: change to your deployed backend URL
// Example: 'https://your-backend.vercel.app/api'
const API_BASE = 'http://localhost:3001/api';

// Listen for messages from content script and popup
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
            console.log('User logged in:', message.data.email);
            syncPendingTransactions();
            break;
        case 'USER_LOGGED_OUT':
            console.log('User logged out');
            break;
    }

    sendResponse({ received: true });
    return true;
});

// Handle auto-detected purchase
async function handlePurchaseDetected(data) {
    console.log('Purchase detected:', data);

    try {
        // Get auth data
        const authData = await chrome.storage.local.get(['authToken', 'userId', 'userEmail']);

        // Create transaction object
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

        // If logged in, sync to database via backend API
        if (authData.authToken) {
            try {
                const response = await fetch(`${API_BASE}/transactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authData.authToken}`
                    },
                    body: JSON.stringify({
                        storeName: transaction.store,
                        productName: transaction.product,
                        amount: transaction.amount,
                        storeUrl: transaction.storeUrl,
                        purchaseDate: transaction.date
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    transaction.synced = true;
                    console.log('Transaction synced to database!');

                    // Show success notification
                    showNotification(transaction);

                    // Notify popup to refresh
                    chrome.runtime.sendMessage({ type: 'TRANSACTION_ADDED' });
                } else {
                    // Add to pending sync queue
                    pendingSync.push(transaction);
                    await chrome.storage.local.set({ pendingSync });
                    console.log('Sync failed, added to pending queue');
                }
            } catch (syncError) {
                console.error('Sync error:', syncError);
                pendingSync.push(transaction);
                await chrome.storage.local.set({ pendingSync });
            }
        } else {
            // Not logged in, add to pending sync
            pendingSync.push(transaction);
            await chrome.storage.local.set({ pendingSync });

            // Still show notification (local tracking)
            showNotification(transaction);
        }

    } catch (error) {
        console.error('Handle purchase error:', error);
    }
}

// Sync pending transactions when user logs in
async function syncPendingTransactions() {
    try {
        const storage = await chrome.storage.local.get(['pendingSync', 'authToken']);
        const pending = storage.pendingSync || [];

        if (pending.length === 0 || !storage.authToken) return;

        console.log(`Syncing ${pending.length} pending transactions...`);

        const synced = [];
        const failed = [];

        for (const transaction of pending) {
            try {
                const response = await fetch(`${API_BASE}/transactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${storage.authToken}`
                    },
                    body: JSON.stringify({
                        storeName: transaction.store,
                        productName: transaction.product,
                        amount: transaction.amount,
                        storeUrl: transaction.storeUrl,
                        purchaseDate: transaction.date
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    synced.push(transaction.id);
                } else {
                    failed.push(transaction);
                }
            } catch (error) {
                failed.push(transaction);
            }
        }

        // Update pending list
        await chrome.storage.local.set({ pendingSync: failed });

        if (synced.length > 0) {
            console.log(`Synced ${synced.length} transactions`);
            showNotification({
                store: 'Sync Complete',
                product: `${synced.length} transactions synced`,
                amount: 0
            }, true);
        }

    } catch (error) {
        console.error('Pending sync error:', error);
    }
}

// Show browser notification
function showNotification(transaction, isSync = false) {
    const notificationId = `vibe-${Date.now()}`;

    chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: isSync ? '✓ Vibe Tracker Synced' : '💸 Purchase Tracked!',
        message: isSync
            ? transaction.product
            : `${transaction.store}: $${transaction.amount.toFixed(2)} - ${transaction.product.slice(0, 30)}`,
        priority: 2
    });

    // Auto-close notification after 5 seconds
    setTimeout(() => {
        chrome.notifications.clear(notificationId);
    }, 5000);
}

// Helper: Get category icon
function getCategoryIcon(storeName) {
    const store = (storeName || '').toLowerCase();
    if (store.includes('amazon')) return '📦';
    if (store.includes('netflix') || store.includes('hulu') || store.includes('disney')) return '📺';
    if (store.includes('spotify') || store.includes('apple music')) return '🎵';
    if (store.includes('uber') || store.includes('doordash')) return '🍔';
    if (store.includes('nike') || store.includes('adidas')) return '👕';
    if (store.includes('apple') || store.includes('best buy')) return '📱';
    return '🛍️';
}

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
    console.log('Vibe Tracker extension started');
});

chrome.runtime.onInstalled.addListener(() => {
    console.log('Vibe Tracker extension installed');
});

// Periodic sync check (every 5 minutes when browser is active)
setInterval(() => {
    syncPendingTransactions();
}, 5 * 60 * 1000);
