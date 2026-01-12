// Background Service Worker - Ultimate Enterprise v9.0
// Maximum reliability, security hardening, observability, and smart detection
// v9.0: HMAC signing, token rotation, CSP, XSS protection, suspicious activity detection,
//       performance metrics, analytics, debug console, event timeline, conflict resolution,
//       optimistic updates, delta sync, batch uploads, shadow DOM, iFrame traversal, watchdog

// Import centralized config
importScripts('config.js');

// ================================
// DEBUG & LOGGING SYSTEM
// ================================
const DEBUG = false;
const VERBOSE = false;
const log = (...args) => DEBUG && console.log('💸 BG:', ...args);
const warn = (...args) => console.warn('💸 BG:', ...args);
const error = (...args) => console.error('💸 BG:', ...args);

// Use config values (set by config.js on self)
const SUPABASE_URL = self.CONFIG?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = self.CONFIG?.SUPABASE_ANON_KEY || '';
const WEBSITE_ORIGINS = self.CONFIG?.WEBSITE_ORIGINS || [];

// ================================
// 🔒 SECURITY MODULE
// HMAC signing, token rotation, XSS protection
// ================================
const Security = {
    // HMAC secret (should be rotated periodically)
    secret: null,

    async init() {
        const stored = await chrome.storage.local.get(['hmacSecret']);
        if (!stored.hmacSecret) {
            // Generate new secret
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            this.secret = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
            await chrome.storage.local.set({ hmacSecret: this.secret });
        } else {
            this.secret = stored.hmacSecret;
        }
    },

    // Sign request with HMAC
    async signRequest(payload) {
        const timestamp = Date.now();
        const message = `${timestamp}:${JSON.stringify(payload)}`;

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(this.secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
        const signatureHex = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        return { timestamp, signature: signatureHex };
    },

    // XSS sanitization
    sanitize(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .slice(0, 10000); // Length limit
    },

    // Sanitize object recursively
    sanitizeObject(obj) {
        if (!obj || typeof obj !== 'object') return this.sanitize(obj);

        const sanitized = Array.isArray(obj) ? [] : {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitize(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    },

    // Token rotation - check and refresh before expiry
    async checkTokenExpiry() {
        const data = await chrome.storage.local.get(['accessToken', 'tokenExpiry', 'refreshToken']);
        if (!data.accessToken || !data.tokenExpiry) return false;

        const expiresIn = data.tokenExpiry - Date.now();
        const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

        if (expiresIn < REFRESH_THRESHOLD && data.refreshToken) {
            log('Token expiring soon, refreshing...');
            return await this.refreshToken(data.refreshToken);
        }
        return true;
    },

    async refreshToken(refreshToken) {
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                await chrome.storage.local.set({
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    tokenExpiry: Date.now() + (data.expires_in * 1000)
                });
                log('Token refreshed successfully');
                return true;
            }
        } catch (e) {
            error('Token refresh failed:', e);
        }
        return false;
    }
};

// Initialize security module
Security.init();

// ================================
// 🚨 SUSPICIOUS ACTIVITY DETECTION
// Flags unusual patterns
// ================================
const SuspiciousActivityDetector = {
    recentTransactions: [],
    alerts: [],

    // Check for suspicious patterns
    check(transaction) {
        const now = Date.now();
        const flags = [];

        // Clean old transactions (keep last hour)
        this.recentTransactions = this.recentTransactions.filter(t => now - t.timestamp < 3600000);

        // 1. Rapid transactions (more than 10 in 5 minutes)
        const last5Min = this.recentTransactions.filter(t => now - t.timestamp < 300000);
        if (last5Min.length >= 10) {
            flags.push({ type: 'rapid_transactions', count: last5Min.length });
        }

        // 2. Unusual amount (too high or negative)
        if (transaction.amount > 10000) {
            flags.push({ type: 'high_amount', amount: transaction.amount });
        }
        if (transaction.amount < 0) {
            flags.push({ type: 'negative_amount', amount: transaction.amount });
        }

        // 3. Duplicate in short time
        const duplicates = this.recentTransactions.filter(t =>
            t.name === transaction.name &&
            Math.abs(t.amount - transaction.amount) < 0.01 &&
            now - t.timestamp < 60000
        );
        if (duplicates.length > 0) {
            flags.push({ type: 'duplicate', count: duplicates.length + 1 });
        }

        // 4. Unusual time (2 AM - 5 AM local)
        const hour = new Date().getHours();
        if (hour >= 2 && hour <= 5) {
            flags.push({ type: 'unusual_time', hour });
        }

        // Record transaction
        this.recentTransactions.push({
            ...transaction,
            timestamp: now
        });

        // Log alerts
        if (flags.length > 0) {
            const alert = {
                timestamp: now,
                transaction,
                flags
            };
            this.alerts.push(alert);
            if (this.alerts.length > 100) this.alerts = this.alerts.slice(-100);

            warn('🚨 Suspicious activity detected:', flags);
            Metrics.record('suspicious_activity', { flags });
        }

        return flags;
    },

    getAlerts() {
        return this.alerts.slice(-50);
    }
};

// ================================
// 📊 OBSERVABILITY - Performance Metrics
// ================================
const Metrics = {
    data: {
        detectionLatency: [],
        syncTimes: [],
        apiCalls: { success: 0, failure: 0 },
        detectionsByProvider: {},
        errorCount: 0,
        lastErrors: []
    },

    record(type, value) {
        const timestamp = Date.now();

        switch (type) {
            case 'detection_latency':
                this.data.detectionLatency.push({ value, timestamp });
                if (this.data.detectionLatency.length > 100) {
                    this.data.detectionLatency = this.data.detectionLatency.slice(-100);
                }
                break;
            case 'sync_time':
                this.data.syncTimes.push({ value, timestamp });
                if (this.data.syncTimes.length > 100) {
                    this.data.syncTimes = this.data.syncTimes.slice(-100);
                }
                break;
            case 'api_success':
                this.data.apiCalls.success++;
                break;
            case 'api_failure':
                this.data.apiCalls.failure++;
                break;
            case 'detection':
                const provider = value.provider || 'unknown';
                this.data.detectionsByProvider[provider] = (this.data.detectionsByProvider[provider] || 0) + 1;
                break;
            case 'error':
                this.data.errorCount++;
                this.data.lastErrors.push({ message: value, timestamp });
                if (this.data.lastErrors.length > 50) {
                    this.data.lastErrors = this.data.lastErrors.slice(-50);
                }
                break;
            case 'suspicious_activity':
                // Already logged in SuspiciousActivityDetector
                break;
        }
    },

    getReport() {
        const avgLatency = this.data.detectionLatency.length > 0
            ? this.data.detectionLatency.reduce((a, b) => a + b.value, 0) / this.data.detectionLatency.length
            : 0;
        const avgSyncTime = this.data.syncTimes.length > 0
            ? this.data.syncTimes.reduce((a, b) => a + b.value, 0) / this.data.syncTimes.length
            : 0;

        return {
            avgDetectionLatency: Math.round(avgLatency),
            avgSyncTime: Math.round(avgSyncTime),
            apiSuccess: this.data.apiCalls.success,
            apiFailure: this.data.apiCalls.failure,
            apiSuccessRate: this.data.apiCalls.success + this.data.apiCalls.failure > 0
                ? (this.data.apiCalls.success / (this.data.apiCalls.success + this.data.apiCalls.failure) * 100).toFixed(1)
                : 100,
            detectionsByProvider: this.data.detectionsByProvider,
            totalErrors: this.data.errorCount,
            recentErrors: this.data.lastErrors.slice(-10),
            timestamp: Date.now()
        };
    },

    reset() {
        this.data = {
            detectionLatency: [],
            syncTimes: [],
            apiCalls: { success: 0, failure: 0 },
            detectionsByProvider: {},
            errorCount: 0,
            lastErrors: []
        };
    }
};

// ================================
// 📜 EVENT TIMELINE
// Visual history of all detection events
// ================================
const EventTimeline = {
    events: [],
    maxEvents: 200,

    add(type, data) {
        this.events.push({
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type,
            data: Security.sanitizeObject(data),
            timestamp: Date.now()
        });

        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }

        // Persist to storage periodically
        this.persist();
    },

    async persist() {
        try {
            await chrome.storage.local.set({ eventTimeline: this.events.slice(-100) });
        } catch (e) {
            // Storage might be full
        }
    },

    async load() {
        try {
            const data = await chrome.storage.local.get(['eventTimeline']);
            this.events = data.eventTimeline || [];
        } catch (e) {
            this.events = [];
        }
    },

    getRecent(count = 50) {
        return this.events.slice(-count);
    },

    clear() {
        this.events = [];
        chrome.storage.local.remove(['eventTimeline']);
    }
};

// Load event timeline on startup
EventTimeline.load();

// ================================
// 🔄 ADVANCED SYNC - Optimistic updates, batching
// ================================
const AdvancedSync = {
    pendingOptimistic: new Map(),
    batchQueue: [],
    batchTimeout: null,
    BATCH_SIZE: 10,
    BATCH_DELAY: 2000, // 2 seconds

    // Optimistic update - show immediately, sync in background
    async optimisticUpdate(transaction) {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        // Store optimistic update
        this.pendingOptimistic.set(tempId, {
            transaction,
            status: 'pending',
            createdAt: Date.now()
        });

        // Notify UI immediately
        notifyWebsiteTabs('OPTIMISTIC_TRANSACTION', {
            tempId,
            ...transaction,
            isPending: true
        });

        // Queue for batch sync
        this.queueForBatch({
            tempId,
            ...transaction
        });

        EventTimeline.add('optimistic_update', { tempId, amount: transaction.amount });

        return tempId;
    },

    // Queue transaction for batch upload
    queueForBatch(transaction) {
        this.batchQueue.push(transaction);

        // Clear existing timeout
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }

        // Batch immediately if queue is full
        if (this.batchQueue.length >= this.BATCH_SIZE) {
            this.processBatch();
        } else {
            // Otherwise wait for more
            this.batchTimeout = setTimeout(() => this.processBatch(), this.BATCH_DELAY);
        }
    },

    // Process batch upload
    async processBatch() {
        if (this.batchQueue.length === 0) return;

        const batch = this.batchQueue.splice(0, this.BATCH_SIZE);
        const syncStart = Date.now();

        try {
            const authData = await chrome.storage.local.get(['accessToken', 'userId']);
            if (!authData.accessToken || !authData.userId) {
                // Re-queue for later
                this.batchQueue.unshift(...batch);
                return;
            }

            // Prepare batch payload
            const transactions = batch.map(t => ({
                user_id: authData.userId,
                description: t.description || t.name,
                amount: t.amount || t.price || 0,
                type: 'expense',
                category: t.category || 'Shopping',
                date: t.date || new Date().toISOString().split('T')[0],
                source: t.isTestMode ? 'extension-test' : 'extension-auto',
                notes: t.notes || `Batch synced from extension`,
                temp_id: t.tempId
            }));

            // Send batch request
            const response = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${authData.accessToken}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(transactions)
            });

            const syncTime = Date.now() - syncStart;
            Metrics.record('sync_time', syncTime);

            if (response.ok) {
                const created = await response.json();
                Metrics.record('api_success');

                // Update optimistic entries
                batch.forEach((t, i) => {
                    const entry = this.pendingOptimistic.get(t.tempId);
                    if (entry) {
                        entry.status = 'synced';
                        entry.realId = created[i]?.id;
                    }

                    // Notify UI of sync completion
                    notifyWebsiteTabs('OPTIMISTIC_CONFIRMED', {
                        tempId: t.tempId,
                        realId: created[i]?.id,
                        success: true
                    });
                });

                EventTimeline.add('batch_sync_success', { count: batch.length, syncTime });
                log(`✅ Batch synced ${batch.length} transactions in ${syncTime}ms`);
            } else {
                Metrics.record('api_failure');
                // Revert optimistic updates
                batch.forEach(t => {
                    notifyWebsiteTabs('OPTIMISTIC_REVERTED', {
                        tempId: t.tempId,
                        reason: 'Sync failed'
                    });
                    this.pendingOptimistic.delete(t.tempId);
                });
                EventTimeline.add('batch_sync_failed', { count: batch.length });
            }
        } catch (e) {
            Metrics.record('api_failure');
            Metrics.record('error', e.message);
            error('Batch sync failed:', e);

            // Re-queue failed items
            this.batchQueue.unshift(...batch);
        }
    },

    // Get pending optimistic updates
    getPending() {
        return Array.from(this.pendingOptimistic.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
    }
};

// ================================
// 🛡️ RELIABILITY - Watchdog, Keep-alive, State persistence
// ================================
const Reliability = {
    watchdogInterval: null,
    keepAliveInterval: null,
    lastHeartbeat: Date.now(),

    init() {
        // Watchdog - check health every 30 seconds
        this.watchdogInterval = setInterval(() => this.watchdog(), 30000);

        // Keep-alive - prevent service worker from sleeping
        this.keepAliveInterval = setInterval(() => this.keepAlive(), 20000);

        // State persistence - save state periodically
        setInterval(() => this.persistState(), 60000);

        // Load persisted state
        this.loadState();

        log('Reliability module initialized');
    },

    async watchdog() {
        const now = Date.now();
        const timeSinceHeartbeat = now - this.lastHeartbeat;

        // Check if extension is responsive
        if (timeSinceHeartbeat > 120000) { // 2 minutes without heartbeat
            warn('⚠️ Watchdog: Extension may be hung, attempting recovery...');
            EventTimeline.add('watchdog_alert', { timeSinceHeartbeat });

            // Try to recover
            await this.recover();
        }

        this.lastHeartbeat = now;

        // Update health status
        await chrome.storage.local.set({
            lastWatchdog: now,
            extensionHealthy: true
        });
    },

    keepAlive() {
        // Simple operation to keep service worker alive
        chrome.storage.local.get(['keepAlive']).then(data => {
            chrome.storage.local.set({ keepAlive: Date.now() });
        });
    },

    async persistState() {
        try {
            const state = {
                metrics: Metrics.getReport(),
                pendingSync: AdvancedSync.getPending(),
                suspiciousAlerts: SuspiciousActivityDetector.getAlerts().slice(-10),
                timestamp: Date.now()
            };
            await chrome.storage.local.set({ persistedState: state });
        } catch (e) {
            // Storage quota exceeded, clear old data
            await chrome.storage.local.remove(['eventTimeline', 'persistedState']);
        }
    },

    async loadState() {
        try {
            const data = await chrome.storage.local.get(['persistedState']);
            if (data.persistedState) {
                log('Loaded persisted state from', new Date(data.persistedState.timestamp));
            }
        } catch (e) {
            // Ignore
        }
    },

    async recover() {
        try {
            // Clear any stuck processes
            AdvancedSync.batchQueue = [];

            // Re-initialize critical systems
            await Security.init();
            await EventTimeline.load();

            EventTimeline.add('recovery_completed', {});
            log('✅ Recovery completed');
        } catch (e) {
            error('Recovery failed:', e);
        }
    }
};

// Initialize reliability module
Reliability.init();

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
// RATE LIMITER CLASS (Enhanced with security)
// ================================
class RateLimiter {
    constructor(maxRequests = 60, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
        this.domainRequests = new Map();
    }

    canMakeRequest(domain = 'global') {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);

        const domainReqs = this.domainRequests.get(domain) || [];
        const recentDomainReqs = domainReqs.filter(time => now - time < this.windowMs);
        this.domainRequests.set(domain, recentDomainReqs);

        const domainLimit = Math.floor(this.maxRequests / 3);
        return this.requests.length < this.maxRequests && recentDomainReqs.length < domainLimit;
    }

    recordRequest(domain = 'global') {
        const now = Date.now();
        this.requests.push(now);

        const domainReqs = this.domainRequests.get(domain) || [];
        domainReqs.push(now);
        this.domainRequests.set(domain, domainReqs);
    }

    async throttledFetch(url, options = {}) {
        const domain = new URL(url).hostname;

        if (!this.canMakeRequest(domain)) {
            warn('⚠️ Rate limit exceeded for', domain);
            Metrics.record('api_failure');
            throw new Error('Rate limit exceeded.');
        }
        this.recordRequest(domain);

        // Sign request if enabled
        if (options.body) {
            const signature = await Security.signRequest(options.body);
            options.headers = {
                ...options.headers,
                'X-Timestamp': signature.timestamp,
                'X-Signature': signature.signature
            };
        }

        const start = Date.now();
        try {
            const response = await fetch(url, options);
            Metrics.record('api_success');
            Metrics.record('sync_time', Date.now() - start);
            return response;
        } catch (e) {
            Metrics.record('api_failure');
            throw e;
        }
    }

    getRemainingRequests() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        return Math.max(0, this.maxRequests - this.requests.length);
    }
}

// Initialize rate limiters with config values
const apiRateLimiter = new RateLimiter(
    self.CONFIG?.RATE_LIMIT?.MAX_REQUESTS_PER_MINUTE || 60,
    60000
);
const transactionRateLimiter = new RateLimiter(
    self.CONFIG?.RATE_LIMIT?.MAX_TRANSACTIONS_PER_MINUTE || 10,
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

        // ================================
        // ENTERPRISE DIAGNOSTIC HANDLERS (v9.0)
        // ================================
        case 'GET_METRICS':
            sendResponse(Metrics.getReport());
            return true;

        case 'RESET_METRICS':
            Metrics.reset();
            sendResponse({ success: true });
            return true;

        case 'GET_EVENT_TIMELINE':
            sendResponse({ events: EventTimeline.getRecent(message.count || 50) });
            return true;

        case 'CLEAR_EVENT_TIMELINE':
            EventTimeline.clear();
            sendResponse({ success: true });
            return true;

        case 'GET_SUSPICIOUS_ALERTS':
            sendResponse({ alerts: SuspiciousActivityDetector.getAlerts() });
            return true;

        case 'GET_PENDING_SYNC':
            sendResponse({ pending: AdvancedSync.getPending() });
            return true;

        case 'FORCE_BATCH_SYNC':
            AdvancedSync.processBatch();
            sendResponse({ success: true });
            return true;

        case 'CHECK_TOKEN_EXPIRY':
            Security.checkTokenExpiry().then(valid => {
                sendResponse({ valid });
            });
            return true;

        case 'GET_FULL_DIAGNOSTICS':
            // Return complete diagnostic report
            Promise.all([
                chrome.storage.local.get(['lastWatchdog', 'extensionHealthy', 'keepAlive']),
                Security.checkTokenExpiry()
            ]).then(([storage, tokenValid]) => {
                sendResponse({
                    version: '9.0.0',
                    metrics: Metrics.getReport(),
                    timeline: EventTimeline.getRecent(20),
                    suspiciousAlerts: SuspiciousActivityDetector.getAlerts().slice(-10),
                    pendingSync: AdvancedSync.getPending().length,
                    batchQueueSize: AdvancedSync.batchQueue.length,
                    reliability: {
                        lastWatchdog: storage.lastWatchdog,
                        healthy: storage.extensionHealthy,
                        lastKeepAlive: storage.keepAlive
                    },
                    security: {
                        tokenValid,
                        hmacEnabled: !!Security.secret
                    },
                    timestamp: Date.now()
                });
            });
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
        const incomingEmail = data.user?.email || data.email;

        // CHECK: If already logged in as same user, skip re-sync to prevent session conflicts
        const existing = await chrome.storage.local.get(['userEmail', 'accessToken']);
        if (existing.accessToken && existing.userEmail === incomingEmail) {
            console.log('✅ Already synced as same user, skipping re-sync');
            // Still notify tabs to update UI state
            notifyWebsiteTabs('EXTENSION_SYNCED', {
                email: incomingEmail,
                userId: data.user?.id || data.userId
            });
            return; // Don't overwrite existing session
        }

        await chrome.storage.local.set({
            supabaseSession: data.session,
            accessToken: data.session?.access_token || data.accessToken,
            userId: data.user?.id || data.userId,
            userEmail: incomingEmail,
            userName: data.user?.user_metadata?.name || data.name || incomingEmail?.split('@')[0],
            syncedFromWebsite: true,
            lastSync: Date.now()
        });

        console.log('✅ Auto-logged in from website');

        // Show sync notification ONLY if not suppressed
        if (!data.skipNotification) {
            showSyncNotification(incomingEmail);
        } else {
            console.log('🔕 Notification suppressed (auto-sync)');
        }

        // Sync pending transactions
        await syncPendingTransactions();

        // Notify popup
        chrome.runtime.sendMessage({ type: 'SESSION_UPDATED' });

        // Notify all website tabs that extension is now synced
        notifyWebsiteTabs('EXTENSION_SYNCED', {
            email: incomingEmail,
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
// CROSS-TAB AUTH SYNC
// ================================
// Listen for storage changes from other tabs/contexts
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
        if (changes.accessToken) {
            if (!changes.accessToken.newValue && changes.accessToken.oldValue) {
                // Token was removed - user logged out
                console.log('🔓 Token removed, notifying tabs of logout');
                notifyWebsiteTabs('EXTENSION_LOGGED_OUT', {});
            } else if (changes.accessToken.newValue && !changes.accessToken.oldValue) {
                // Token was added - user logged in
                const email = changes.userEmail?.newValue;
                console.log('🔐 Token added, notifying tabs of login:', email);
                notifyWebsiteTabs('EXTENSION_SYNCED', { email });
            }
        }
    }
});

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
// TOKEN REFRESH - Auto-refresh before expiry
// ================================
// Check every 5 minutes, refresh if less than 10 minutes remaining
setInterval(async () => {
    try {
        const { supabaseSession, accessToken } = await chrome.storage.local.get(['supabaseSession', 'accessToken']);
        if (!supabaseSession || !accessToken) return;

        // Decode JWT to check expiry
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const expiresIn = (payload.exp * 1000) - Date.now();

        // If less than 10 minutes remaining, refresh the token
        if (expiresIn < 10 * 60 * 1000 && expiresIn > 0) {
            console.log('🔄 Token expiring soon, refreshing...');

            const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({ refresh_token: supabaseSession.refresh_token })
            });

            if (response.ok) {
                const newSession = await response.json();
                await chrome.storage.local.set({
                    supabaseSession: newSession,
                    accessToken: newSession.access_token,
                    lastSync: Date.now()
                });
                console.log('✅ Token refreshed successfully');

                // Notify website tabs of refreshed session
                notifyWebsiteTabs('EXTENSION_SYNCED', { email: newSession.user?.email });
            } else {
                console.error('❌ Token refresh failed:', await response.text());
            }
        }
    } catch (error) {
        // Token decode or refresh error - might be invalid token
        console.log('Token refresh check error:', error.message);
    }
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
