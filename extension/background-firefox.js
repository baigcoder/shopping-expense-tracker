// Background Script for Firefox (Manifest V2 compatible)
// Uses browser.* API with Promise-based callbacks

const API_BASE = 'http://localhost:3001/api';

// Polyfill for cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Listen for messages from content script and popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received:', message.type);

    // Handle async operations
    handleMessage(message, sender).then(response => {
        sendResponse(response);
    }).catch(error => {
        console.error('Message handling error:', error);
        sendResponse({ error: error.message });
    });

    return true; // Keep channel open for async
});

async function handleMessage(message, sender) {
    switch (message.type) {
        case 'PURCHASE_DETECTED':
            await handlePurchaseDetected(message.data);
            return { received: true };
        case 'TRANSACTION_SYNCED':
            showNotification(message.data);
            return { received: true };
        case 'USER_LOGGED_IN':
            console.log('User logged in:', message.data.email);
            await syncPendingTransactions();
            return { received: true };
        case 'USER_LOGGED_OUT':
            console.log('User logged out');
            return { received: true };
        default:
            return { received: true };
    }
}

// Handle auto-detected purchase
async function handlePurchaseDetected(data) {
    console.log('Purchase detected:', data);

    try {
        const authData = await browserAPI.storage.local.get(['authToken', 'userId', 'userEmail']);

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

        const storage = await browserAPI.storage.local.get(['recentTransactions', 'monthlySpent', 'transactionCount', 'pendingSync']);
        const transactions = storage.recentTransactions || [];
        const pendingSync = storage.pendingSync || [];

        transactions.unshift(transaction);

        await browserAPI.storage.local.set({
            recentTransactions: transactions.slice(0, 100),
            monthlySpent: (storage.monthlySpent || 0) + transaction.amount,
            transactionCount: (storage.transactionCount || 0) + 1
        });

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
                    showNotification(transaction);
                    browserAPI.runtime.sendMessage({ type: 'TRANSACTION_ADDED' });
                } else {
                    pendingSync.push(transaction);
                    await browserAPI.storage.local.set({ pendingSync });
                }
            } catch (syncError) {
                console.error('Sync error:', syncError);
                pendingSync.push(transaction);
                await browserAPI.storage.local.set({ pendingSync });
            }
        } else {
            pendingSync.push(transaction);
            await browserAPI.storage.local.set({ pendingSync });
            showNotification(transaction);
        }

    } catch (error) {
        console.error('Handle purchase error:', error);
    }
}

// Sync pending transactions when user logs in
async function syncPendingTransactions() {
    try {
        const storage = await browserAPI.storage.local.get(['pendingSync', 'authToken']);
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

        await browserAPI.storage.local.set({ pendingSync: failed });

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

    browserAPI.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: isSync ? '✓ Vibe Tracker Synced' : '💸 Purchase Tracked!',
        message: isSync
            ? transaction.product
            : `${transaction.store}: $${transaction.amount.toFixed(2)} - ${transaction.product.slice(0, 30)}`
    });

    setTimeout(() => {
        browserAPI.notifications.clear(notificationId);
    }, 5000);
}

// Helper functions
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

// Periodic sync
setInterval(() => {
    syncPendingTransactions();
}, 5 * 60 * 1000);
