// Background Service Worker - Enhanced Extension Logic v6.0
// Handles behavior-based detection, sync, notifications, and website communication
// v6.0: Added debug flag, subscription duplicate check, error boundaries

// Import centralized config
importScripts('config.js');

// ================================
// DEBUG FLAG - Set to false in production
// ================================
const DEBUG = false;
const log = (...args) => DEBUG && console.log('💸 BG:', ...args);
const warn = (...args) => DEBUG && console.warn('💸 BG:', ...args);

// Use config values (set by config.js on self)
const SUPABASE_URL = self.CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = self.CONFIG.SUPABASE_ANON_KEY;
const WEBSITE_ORIGINS = self.CONFIG.WEBSITE_ORIGINS;

// ================================
// PENDING CANCELLATION MAP (for notification button clicks)
// ================================
const pendingCancellations = new Map();

// Global notification button click handler (prevents memory leak from multiple listeners)
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (pendingCancellations.has(notificationId) && buttonIndex === 0) {
        const data = pendingCancellations.get(notificationId);
        console.log('User wants to remove subscription:', data.name);
        notifyWebsiteTabs('REMOVE_SUBSCRIPTION_REQUEST', {
            name: data.name,
            hostname: data.hostname
        });
        pendingCancellations.delete(notificationId);
    } else if (pendingCancellations.has(notificationId)) {
        // User clicked "No, keep it"
        pendingCancellations.delete(notificationId);
    }
});

// ================================
// RATE LIMITER CLASS
// ================================
class RateLimiter {
    constructor(maxRequests = 60, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
    }

    canMakeRequest() {
        const now = Date.now();
        // Remove requests outside the window
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        return this.requests.length < this.maxRequests;
    }

    recordRequest() {
        this.requests.push(Date.now());
    }

    async throttledFetch(url, options = {}) {
        if (!this.canMakeRequest()) {
            console.warn('⚠️ Rate limit exceeded, request throttled');
            throw new Error('Rate limit exceeded. Please wait before making more requests.');
        }
        this.recordRequest();
        return fetch(url, options);
    }

    getRemainingRequests() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        return Math.max(0, this.maxRequests - this.requests.length);
    }
}

// Initialize rate limiters with config values
const apiRateLimiter = new RateLimiter(
    self.CONFIG.RATE_LIMIT?.MAX_REQUESTS_PER_MINUTE || 60,
    60000
);
const transactionRateLimiter = new RateLimiter(
    self.CONFIG.RATE_LIMIT?.MAX_TRANSACTIONS_PER_MINUTE || 10,
    60000
);

// ================================
// OFFLINE QUEUE CLASS - Reliable sync with retry
// ================================
class OfflineQueue {
    constructor() {
        this.isOnline = true;
        this.retryTimeouts = new Map();
        this.maxRetries = 5;
        this.baseDelay = 1000; // 1 second
    }

    // Check network status
    async checkOnline() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
                method: 'HEAD',
                headers: { 'apikey': SUPABASE_ANON_KEY }
            });
            this.isOnline = response.ok;
        } catch {
            this.isOnline = false;
        }
        return this.isOnline;
    }

    // Add transaction to queue
    async queue(transaction) {
        const storage = await chrome.storage.local.get(['offlineQueue']);
        const queue = storage.offlineQueue || [];

        queue.push({
            ...transaction,
            queuedAt: Date.now(),
            retries: 0
        });

        await chrome.storage.local.set({ offlineQueue: queue });
        console.log('📦 Transaction queued for sync:', transaction.description);

        // Try to sync immediately if online
        this.processQueue();
    }

    // Process queued transactions with exponential backoff
    async processQueue() {
        if (!this.isOnline) {
            await this.checkOnline();
            if (!this.isOnline) {
                console.log('📴 Offline - will retry when connection restored');
                return;
            }
        }

        const storage = await chrome.storage.local.get(['offlineQueue', 'accessToken', 'userId']);
        let queue = storage.offlineQueue || [];

        if (queue.length === 0 || !storage.accessToken) return;

        // Filter out expired items (older than 24 hours)
        const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
        const now = Date.now();
        const validQueue = queue.filter(item => now - (item.queuedAt || 0) < MAX_AGE_MS);
        const expiredCount = queue.length - validQueue.length;
        if (expiredCount > 0) {
            console.log(`🗑️ Discarded ${expiredCount} expired queue items (>24h old)`);
        }
        queue = validQueue;

        console.log(`🔄 Processing ${queue.length} queued transactions...`);

        const remaining = [];


        for (const item of queue) {
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
                        ...item
                    })
                });

                if (response.ok) {
                    console.log('✅ Queued transaction synced:', item.description);
                } else if (response.status >= 500) {
                    // Server error - retry with backoff
                    item.retries = (item.retries || 0) + 1;
                    if (item.retries < this.maxRetries) {
                        remaining.push(item);
                    } else {
                        console.error('❌ Max retries reached, discarding:', item.description);
                    }
                }
                // 4xx errors are not retried (bad data)
            } catch (error) {
                // Network error - retry
                item.retries = (item.retries || 0) + 1;
                if (item.retries < this.maxRetries) {
                    remaining.push(item);
                }
                this.isOnline = false;
            }

            // Small delay between requests
            await new Promise(r => setTimeout(r, 200));
        }

        await chrome.storage.local.set({ offlineQueue: remaining });

        // Schedule retry if items remain
        if (remaining.length > 0) {
            const delay = this.baseDelay * Math.pow(2, remaining[0].retries || 0);
            console.log(`⏰ Retrying ${remaining.length} items in ${delay}ms`);
            setTimeout(() => this.processQueue(), delay);
        }
    }
}

// Initialize offline queue
const offlineQueue = new OfflineQueue();

// Process queue when coming online
setInterval(() => offlineQueue.checkOnline().then(online => {
    if (online) offlineQueue.processQueue();
}), 30000); // Check every 30 seconds

// Last sync timestamp for cooldown
let lastSyncTimestamp = 0;
const SYNC_COOLDOWN_MS = self.CONFIG.RATE_LIMIT?.SYNC_COOLDOWN_MS || 5000;

// Helper function for rate-limited API calls
async function rateLimitedFetch(url, options = {}) {
    return apiRateLimiter.throttledFetch(url, options);
}

// Current tracking state (for popup display)
let currentTrackingState = {
    state: 'browsing',
    siteName: '',
    hostname: '',
    url: ''
};

// ================================
// MESSAGE HANDLERS
// ================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received:', message.type);

    switch (message.type) {
        case 'PURCHASE_DETECTED':
            handlePurchaseDetected(message.data);
            break;

        case 'BEHAVIOR_TRANSACTION_DETECTED':
            // NEW: Behavior-based detection (v4.0)
            handleBehaviorTransaction(message.data);
            break;

        case 'TRACKING_STATE_UPDATE':
            // Update tracking state for popup display
            currentTrackingState = message.data;
            // Forward to popup if open
            chrome.runtime.sendMessage(message).catch(() => { });

            // INSTANT SAVE: Persist site visit to chrome.storage
            saveSiteVisit(message.data).then(() => {
                console.log('✅ Site visit saved:', message.data.siteName);
            });

            // Notify website tabs so Shopping Activity page updates INSTANTLY
            notifyWebsiteTabs('SITE_VISIT_TRACKED', {
                siteName: message.data.siteName,
                hostname: message.data.hostname,
                state: message.data.state,
                url: message.data.url,
                timestamp: Date.now()
            });
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

        case 'SUBSCRIPTION_DETECTED':
            handleSubscriptionDetected(message.data);
            break;

        case 'CHECK_EXTENSION_STATUS':
            // Website checking if extension is installed and logged in
            handleExtensionStatusCheck(sendResponse);
            return true; // Keep channel open for async response

        case 'SYNC_SESSION_FROM_WEBSITE':
            // Website sharing session with extension
            handleSessionSync(message.data, sendResponse);
            return true;

        case 'GET_TRACKING_STATE':
            // Popup requesting current tracking state
            sendResponse(currentTrackingState);
            return true;

        case 'CANCELLATION_DETECTED':
            handleCancellationDetected(message.data);
            break;
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

        // Show sync notification ONLY if not suppressed
        if (!data.skipNotification) {
            showSyncNotification(data.user?.email || data.email);
        } else {
            console.log('🔕 Notification suppressed (auto-sync)');
        }

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
        'userName', 'syncedFromWebsite', 'lastSync', 'userAvatar'
    ]);

    // Notify website tabs first
    notifyWebsiteTabs('EXTENSION_LOGGED_OUT', {});

    // Also broadcast to popup (in case it's open)
    try {
        chrome.runtime.sendMessage({ type: 'WEBSITE_LOGGED_OUT' }).catch(() => { });
    } catch (e) {
        // Popup might not be open
    }
}

// ================================
// PURCHASE DETECTION HANDLER
// ================================


// ================================
// BEHAVIOR-BASED TRANSACTION HANDLER (v4.0)
// ================================
async function handleBehaviorTransaction(data) {
    console.log('🎯 Behavior-based transaction detected:', data);

    const authData = await chrome.storage.local.get(['accessToken', 'userId', 'userEmail']);

    if (!authData.accessToken || !authData.userId) {
        console.log('Not logged in, storing for later sync');
        const pending = await chrome.storage.local.get(['pendingTransactions']) || { pendingTransactions: [] };
        pending.pendingTransactions = pending.pendingTransactions || [];
        pending.pendingTransactions.push({
            ...data,
            timestamp: Date.now(),
            source: 'behavior-detection'
        });
        await chrome.storage.local.set({ pendingTransactions: pending.pendingTransactions });
        return { success: false, pending: true };
    }

    try {
        // Create transaction in Supabase
        const transactionData = {
            user_id: authData.userId,
            description: data.name || 'Purchase',
            amount: data.price || data.amount || 0,
            type: 'expense',
            category: data.category || 'Shopping',
            date: new Date().toISOString().split('T')[0],
            source: 'extension-behavior',
            notes: `Auto-tracked via behavior detection from ${data.hostname || 'web'}. Flow: ${data.behaviorFlow?.map(s => s.to).join(' → ') || 'direct'}`
        };

        // Use rate limiter to prevent API abuse
        const response = await transactionRateLimiter.throttledFetch(`${SUPABASE_URL}/rest/v1/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${authData.accessToken}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(transactionData)
        });


        if (response.ok) {
            const created = await response.json();
            console.log('✅ Behavior transaction saved:', created);

            // Show enhanced notification
            showBehaviorNotification(data);

            // ⚡ INSTANT: Broadcast via Supabase Realtime for < 100ms latency
            broadcastTransaction(authData.userId, {
                ...created[0] || created,
                name: data.name,
                amount: data.price || data.amount,
                type: data.type
            });

            // Notify website to refresh immediately (backup)
            notifyWebsiteTabs('BEHAVIOR_TRANSACTION_ADDED', {
                transaction: created,
                name: data.name,
                amount: data.price || data.amount,
                type: data.type,
                behaviorFlow: data.behaviorFlow
            });

            // Also notify via standard channel for backwards compatibility
            notifyWebsiteTabs('TRANSACTION_ADDED', {
                transaction: created,
                name: data.name,
                amount: data.price || data.amount
            });

            return { success: true };
        } else {
            const error = await response.text();
            console.error('Failed to save behavior transaction:', error);
            return { success: false, error };
        }
    } catch (error) {
        console.error('Behavior transaction save error:', error);
        return { success: false, error: error.message };
    }
}

function showBehaviorNotification(data) {
    const notificationId = `behavior-${Date.now()}`;
    const amount = data.price || data.amount || 0;
    const typeIcon = data.isTrial ? '🎁' : (data.type === 'subscription' ? '💳' : '🛒');
    const typeLabel = data.isTrial ? 'Trial Started' : (data.type === 'subscription' ? 'Subscription' : 'Purchase');

    try {
        chrome.notifications.create(notificationId, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/logo.png'),
            title: `${typeIcon} ${typeLabel} Detected!`,
            message: `${data.name || 'Transaction'} ${amount > 0 ? `- $${amount.toFixed(2)}` : ''}\nBehavior-based detection ✓`,
            priority: 2
        });

        setTimeout(() => {
            chrome.notifications.clear(notificationId);
        }, 8000);
    } catch (error) {
        console.log('Behavior notification error:', error);
    }
}

// ================================
// INSTANT BROADCAST VIA SUPABASE REALTIME
// ================================
async function broadcastTransaction(userId, transaction) {
    try {
        // Use Supabase Realtime broadcast for instant updates (< 100ms)
        const response = await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                messages: [{
                    topic: `realtime-${userId}`,
                    event: 'extension-transaction',
                    payload: transaction
                }]
            })
        });

        if (response.ok) {
            console.log('⚡ Broadcast sent successfully (< 100ms latency)');
        } else {
            console.log('Broadcast failed, falling back to tab messaging');
        }
    } catch (error) {
        console.log('Broadcast error (non-critical):', error.message);
    }
}

// ================================
// SUBSCRIPTION DETECTION HANDLER
// ================================
async function handleSubscriptionDetected(data) {
    log('Subscription detected:', data);

    const authData = await chrome.storage.local.get(['accessToken', 'userId', 'userEmail']);

    if (!authData.accessToken || !authData.userId) {
        log('Not logged in, storing for later sync');
        // Store pending subscription
        const pending = await chrome.storage.local.get(['pendingSubscriptions']) || { pendingSubscriptions: [] };
        pending.pendingSubscriptions = pending.pendingSubscriptions || [];
        pending.pendingSubscriptions.push({
            ...data,
            timestamp: Date.now()
        });
        await chrome.storage.local.set({ pendingSubscriptions: pending.pendingSubscriptions });
        return;
    }

    try {
        // Check for duplicate subscription BEFORE saving
        const subscriptionName = data.name || data.serviceName || 'Unknown';
        const existingCheck = await fetch(
            `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${authData.userId}&name=eq.${encodeURIComponent(subscriptionName)}&select=id,name`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${authData.accessToken}`
                }
            }
        );

        if (existingCheck.ok) {
            const existing = await existingCheck.json();
            if (existing && existing.length > 0) {
                log('Duplicate subscription found, skipping:', subscriptionName);
                return; // Skip duplicate
            }
        }

        // Calculate trial end date
        const today = new Date();
        let trialEndDate = null;
        let trialStartDate = null;

        // Handle both camelCase (from content.js) and snake_case field names
        const isTrial = data.isTrial || data.is_trial || false;
        const trialDays = data.trialDays || data.trial_days || 0;

        if (isTrial && trialDays > 0) {
            trialStartDate = today.toISOString().split('T')[0];
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + trialDays);
            trialEndDate = endDate.toISOString().split('T')[0];
        }

        // Create subscription in Supabase
        const billingCycle = data.billingCycle || data.cycle || 'monthly';

        // Calculate next payment date based on billing cycle
        let nextPaymentDate = null;
        if (!isTrial) {
            const nextDate = new Date(today);
            if (billingCycle === 'yearly') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            } else if (billingCycle === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }
            nextPaymentDate = nextDate.toISOString().split('T')[0];
        }

        const subscriptionData = {
            user_id: authData.userId,
            name: data.name || data.serviceName || 'Unknown',
            logo: data.logo || data.icon || '📦',
            category: data.category || 'Other',
            price: data.price || data.amount || 0,
            cycle: billingCycle,
            color: data.color || '#6366F1',
            is_active: true,
            is_trial: isTrial,
            status: isTrial ? 'trial' : 'active',
            trial_start_date: trialStartDate,
            trial_end_date: trialEndDate,
            trial_days: trialDays,
            start_date: today.toISOString().split('T')[0],
            next_payment_date: nextPaymentDate,
            source_url: data.sourceUrl || null
        };

        const response = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${authData.accessToken}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(subscriptionData)
        });

        if (response.ok) {
            const created = await response.json();
            console.log('✅ Subscription saved:', created);

            // Show notification
            showSubscriptionNotification(data);

            // Notify website to refresh subscriptions
            notifyWebsiteTabs('SUBSCRIPTION_ADDED', {
                subscription: created,
                name: data.name,
                is_trial: data.is_trial,
                trial_days: data.trial_days
            });
        } else {
            const error = await response.text();
            console.error('Failed to save subscription:', error);
        }
    } catch (error) {
        console.error('Subscription save error:', error);
    }
}

function showSubscriptionNotification(data) {
    const notificationId = `sub-${Date.now()}`;
    const isTrial = data.isTrial || data.is_trial || false;
    const trialDays = data.trialDays || data.trial_days || 0;
    const name = data.name || data.serviceName || 'Subscription';

    try {
        chrome.notifications.create(notificationId, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/logo.png'),
            title: isTrial ? '⏰ Trial Started!' : '📦 Subscription Added!',
            message: isTrial
                ? `${name} - ${trialDays} days free trial. We'll remind you before it ends!`
                : `${name} - Now tracking your subscription.`,
            priority: 2
        });

        setTimeout(() => {
            chrome.notifications.clear(notificationId);
        }, 8000);

        // Schedule trial expiry reminders
        if (isTrial && trialDays > 0) {
            scheduleTrialReminders(name, trialDays);
        }
    } catch (error) {
        console.log('Subscription notification error:', error);
    }
}

// ================================
// TRIAL EXPIRY REMINDER SYSTEM
// ================================
async function scheduleTrialReminders(subscriptionName, trialDays) {
    const today = new Date();
    const trialEndDate = new Date(today);
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    // Store trial info for alarm handler
    const trialId = `trial_${subscriptionName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
    const trialInfo = {
        name: subscriptionName,
        endDate: trialEndDate.toISOString(),
        trialDays: trialDays
    };

    // Save to storage for alarm handler
    const storage = await chrome.storage.local.get(['scheduledTrialReminders']);
    const reminders = storage.scheduledTrialReminders || {};
    reminders[trialId] = trialInfo;
    await chrome.storage.local.set({ scheduledTrialReminders: reminders });

    // Schedule reminder 2 days before trial ends
    if (trialDays > 2) {
        const twoDaysBefore = new Date(trialEndDate);
        twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
        const delayMs2Days = twoDaysBefore.getTime() - Date.now();

        if (delayMs2Days > 0) {
            chrome.alarms.create(`trial_2day_${trialId}`, {
                when: twoDaysBefore.getTime()
            });
            console.log(`⏰ Trial reminder scheduled: ${subscriptionName} - 2 days before (${twoDaysBefore.toDateString()})`);
        }
    }

    // Schedule reminder 1 day before trial ends
    if (trialDays > 1) {
        const oneDayBefore = new Date(trialEndDate);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);
        const delayMs1Day = oneDayBefore.getTime() - Date.now();

        if (delayMs1Day > 0) {
            chrome.alarms.create(`trial_1day_${trialId}`, {
                when: oneDayBefore.getTime()
            });
            console.log(`⏰ Trial reminder scheduled: ${subscriptionName} - 1 day before (${oneDayBefore.toDateString()})`);
        }
    }

    // Schedule reminder on trial end day
    chrome.alarms.create(`trial_end_${trialId}`, {
        when: trialEndDate.getTime()
    });
    console.log(`⏰ Trial end reminder scheduled: ${subscriptionName} - ends on ${trialEndDate.toDateString()}`);
}

// Alarm listener for trial reminders
chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log('⏰ Alarm triggered:', alarm.name);

    if (alarm.name.startsWith('trial_')) {
        const storage = await chrome.storage.local.get(['scheduledTrialReminders']);
        const reminders = storage.scheduledTrialReminders || {};

        // Extract trial ID from alarm name
        const parts = alarm.name.split('_');
        const reminderType = parts[1]; // '2day', '1day', or 'end'
        const trialId = parts.slice(2).join('_');

        // Find matching reminder
        for (const [id, info] of Object.entries(reminders)) {
            if (id === trialId || alarm.name.includes(id)) {
                showTrialReminderNotification(info, reminderType);

                // Notify website tabs
                notifyWebsiteTabs('TRIAL_REMINDER', {
                    name: info.name,
                    endDate: info.endDate,
                    reminderType: reminderType,
                    daysLeft: reminderType === '2day' ? 2 : reminderType === '1day' ? 1 : 0
                });

                // Clean up expired reminders
                if (reminderType === 'end') {
                    delete reminders[id];
                    await chrome.storage.local.set({ scheduledTrialReminders: reminders });
                }
                break;
            }
        }
    }
});

function showTrialReminderNotification(trialInfo, reminderType) {
    const notificationId = `trial-reminder-${Date.now()}`;
    let title, message;

    if (reminderType === '2day') {
        title = '⚠️ Trial Ending Soon!';
        message = `${trialInfo.name} trial ends in 2 days! Cancel now if you don't want to be charged.`;
    } else if (reminderType === '1day') {
        title = '🚨 Trial Ends Tomorrow!';
        message = `${trialInfo.name} trial ends TOMORROW! Last chance to cancel before being charged.`;
    } else {
        title = '⏰ Trial Ended Today!';
        message = `${trialInfo.name} trial period has ended. Check if you've been charged.`;
    }

    try {
        chrome.notifications.create(notificationId, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/logo.png'),
            title: title,
            message: message,
            priority: 2,
            requireInteraction: reminderType === '1day' || reminderType === 'end' // Keep on screen for urgent reminders
        });

        // Auto-clear after 30 seconds if not urgent
        if (reminderType === '2day') {
            setTimeout(() => {
                chrome.notifications.clear(notificationId);
            }, 30000);
        }
    } catch (error) {
        console.log('Trial reminder notification error:', error);
    }
}

// ================================
// WEBSITE TAB COMMUNICATION
// ================================
async function notifyWebsiteTabs(messageType, data) {
    try {
        // Optimized: Query only tabs matching our website origins instead of ALL tabs
        const urlPatterns = WEBSITE_ORIGINS.map(origin => `${origin}/*`);
        const tabs = await chrome.tabs.query({ url: urlPatterns });

        for (const tab of tabs) {
            // Only message tabs with valid URLs
            if (tab.id && tab.url) {
                // Use a separate try-catch for each tab to prevent one failure from stopping others
                chrome.tabs.sendMessage(tab.id, {
                    type: messageType,
                    data: data,
                    source: 'extension'
                }).then(() => {
                    console.log('Notified website tab:', tab.id);
                }).catch(() => {
                    // Silently ignore - tab might not have content script loaded yet
                });
            }
        }
    } catch (error) {
        // Silently handle - this is not critical
    }
}

// Safe message sender that doesn't throw
function safeSendMessage(tabId, message) {
    if (!tabId) return Promise.resolve();

    return new Promise((resolve) => {
        try {
            chrome.tabs.sendMessage(tabId, message, (response) => {
                // Clear any error from chrome.runtime.lastError
                if (chrome.runtime.lastError) {
                    // Expected when content script isn't loaded
                }
                resolve(response);
            });
        } catch (e) {
            resolve();
        }
    });
}

// ================================
// CANCELLATION DETECTION HANDLER
// ================================
function handleCancellationDetected(data) {
    console.log('🗑️ Cancellation detected:', data.name);

    const notificationId = `cancel-${Date.now()}`;

    try {
        // Store the data for the global button click handler
        pendingCancellations.set(notificationId, {
            name: data.name,
            hostname: data.hostname
        });

        chrome.notifications.create(notificationId, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/logo.png'),
            title: '🗑️ Subscription Canceled?',
            message: `Detected cancellation for ${data.name}. Would you like to remove it from your Cashly dashboard?`,
            buttons: [
                { title: 'Yes, remove it' },
                { title: 'No, keep it' }
            ],
            priority: 2
        });

        // Auto-clear after timeout and remove from pending map
        setTimeout(() => {
            chrome.notifications.clear(notificationId);
            pendingCancellations.delete(notificationId);
        }, 10000);
    } catch (error) {
        console.log('Cancellation notification error:', error);
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
// OFFLINE RETRY QUEUE WITH EXPONENTIAL BACKOFF
// ================================
const retryQueue = {
    attempts: {},
    maxAttempts: 5,
    baseDelay: 5000, // 5 seconds

    getDelay(itemId) {
        const attempts = this.attempts[itemId] || 0;
        return Math.min(this.baseDelay * Math.pow(2, attempts), 300000); // Max 5 min
    },

    recordAttempt(itemId, success) {
        if (success) {
            delete this.attempts[itemId];
        } else {
            this.attempts[itemId] = (this.attempts[itemId] || 0) + 1;
        }
    },

    shouldRetry(itemId) {
        return (this.attempts[itemId] || 0) < this.maxAttempts;
    },

    async scheduleRetry(itemId, callback) {
        if (!this.shouldRetry(itemId)) {
            log('Max retry attempts reached for:', itemId);
            return false;
        }

        const delay = this.getDelay(itemId);
        log(`Scheduling retry for ${itemId} in ${delay}ms`);

        setTimeout(async () => {
            const success = await callback();
            this.recordAttempt(itemId, success);
            if (!success && this.shouldRetry(itemId)) {
                this.scheduleRetry(itemId, callback);
            }
        }, delay);

        return true;
    }
};

// ================================
// NOTIFICATIONS
// ================================
function showNotification(transaction, isSync = false) {
    const notificationId = `expense-${Date.now()}`;

    try {
        chrome.notifications.create(notificationId, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/logo.png'),
            title: isSync ? '✓ Cashly Synced' : '💳 Purchase Tracked!',
            message: isSync
                ? transaction.product
                : `${transaction.store}: Rs ${transaction.amount?.toFixed(0) || '0'} - ${(transaction.product || '').slice(0, 30)}`,
            priority: 2
        });

        setTimeout(() => {
            chrome.notifications.clear(notificationId);
        }, 5000);
    } catch (error) {
        console.log('Notification error:', error);
    }
}

function showSyncNotification(email) {
    const notificationId = `sync-${Date.now()}`;

    try {
        chrome.notifications.create(notificationId, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/logo.png'),
            title: '🔗 Extension Synced!',
            message: `Connected to ${email}. Auto-tracking is now active.`,
            priority: 2
        });

        setTimeout(() => {
            chrome.notifications.clear(notificationId);
        }, 5000);
    } catch (error) {
        console.log('Sync notification error:', error);
    }
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
    console.log('🚀 Cashly extension started');
});

chrome.runtime.onInstalled.addListener(() => {
    console.log('📦 Cashly extension installed');

    // Show welcome notification
    try {
        chrome.notifications.create('welcome', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/logo.png'),
            title: '💳 Cashly Installed!',
            message: 'Sign in to start auto-tracking your purchases.',
            priority: 2
        });
    } catch (error) {
        console.log('Welcome notification error:', error);
    }
});

// Periodic sync check (every 5 minutes)
setInterval(() => {
    syncPendingTransactions();
}, 5 * 60 * 1000);

// ================================
// SITE VISIT TRACKING (Instant Storage)
// ================================

// Save a site visit to chrome.storage (persists across sessions)
async function saveSiteVisit(data) {
    console.log('📝 saveSiteVisit called with:', data);

    // More robust data extraction
    const siteName = data?.siteName || 'Unknown Site';
    const hostname = data?.hostname || (data?.url ? new URL(data.url).hostname : null);

    if (!hostname) {
        console.warn('⚠️ Cannot save - no hostname:', data);
        return;
    }

    try {
        const result = await chrome.storage.local.get('siteVisits');
        const siteVisits = result.siteVisits || {};
        const key = hostname.toLowerCase().replace('www.', '');

        console.log('🔑 Saving with key:', key);

        if (siteVisits[key]) {
            // Update existing site
            siteVisits[key].visitCount = (siteVisits[key].visitCount || 1) + 1;
            siteVisits[key].lastVisited = Date.now();
            siteVisits[key].lastState = data.state;
            console.log('📊 Updated visit count:', siteVisits[key].visitCount);
        } else {
            // Add new site
            siteVisits[key] = {
                siteName: siteName,
                hostname: hostname,
                url: data.url || `https://${hostname}`,
                visitCount: 1,
                firstVisited: Date.now(),
                lastVisited: Date.now(),
                lastState: data.state,
                category: categorizeSite(hostname, siteName)
            };
            console.log('✨ Added new site:', key);
        }

        await chrome.storage.local.set({ siteVisits });
        console.log('💾 Site visits saved! Total:', Object.keys(siteVisits).length, 'sites');

        // Broadcast updated count to popup
        chrome.runtime.sendMessage({
            type: 'SITE_VISITS_UPDATED',
            count: Object.keys(siteVisits).length,
            sites: siteVisits
        }).catch(() => { });

    } catch (error) {
        console.error('❌ Failed to save site visit:', error);
    }
}

// Get all saved site visits
async function getSiteVisits() {
    try {
        const result = await chrome.storage.local.get('siteVisits');
        return result.siteVisits || {};
    } catch (error) {
        console.error('Failed to get site visits:', error);
        return {};
    }
}

// Categorize site based on hostname/name
function categorizeSite(hostname, siteName) {
    const h = (hostname + siteName).toLowerCase();

    // Finance & Banking
    if (/bank|hbl|ubl|meezan|alfalah|mcb|chase|wellsfargo|citibank|hsbc|barclays|coinbase|binance|crypto|robinhood|fidelity|schwab|mint|ynab/.test(h)) {
        return 'finance';
    }
    // Payment
    if (/paypal|stripe|jazzcash|easypaisa|paypak|razorpay|paytm|venmo|cashapp|wise|transferwise|moneygram/.test(h)) {
        return 'payment';
    }
    // Streaming & Subscriptions
    if (/netflix|spotify|youtube|disney|hbo|max|peacock|paramount|appletv|crunchyroll|twitch|audible|kindle|deezer|tidal/.test(h)) {
        return 'streaming';
    }
    // SaaS & Subscriptions
    if (/chatgpt|openai|canva|figma|notion|adobe|microsoft|slack|zoom|github|atlassian|dropbox/.test(h)) {
        return 'subscription';
    }
    // Food Delivery
    if (/foodpanda|careem|uber|deliveroo|doordash|grubhub|instacart|zomato|swiggy/.test(h)) {
        return 'food';
    }
    // Travel
    if (/booking|airbnb|expedia|agoda|kayak|skyscanner|emirates|pia|grab|lyft/.test(h)) {
        return 'travel';
    }
    // Gaming
    if (/steam|epicgames|playstation|xbox|nintendo|roblox|blizzard|riot/.test(h)) {
        return 'gaming';
    }
    // Shopping (default for e-commerce)
    if (/daraz|amazon|aliexpress|ebay|walmart|flipkart|shopify|etsy|groovy|outfitters|khaadi|zara|nike|shein|temu/.test(h)) {
        return 'shopping';
    }
    return 'shopping'; // Default to shopping
}

// Handle GET_SITE_VISITS message from popup/website
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_SITE_VISITS') {
        getSiteVisits().then(visits => {
            sendResponse({ success: true, siteVisits: visits });
        });
        return true; // Keep channel open for async response
    }
});
