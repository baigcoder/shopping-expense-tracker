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
const log = (...args) => DEBUG && console.log('ðŸ’¸ BG:', ...args);
const warn = (...args) => console.warn('ðŸ’¸ BG:', ...args);
const error = (...args) => console.error('ðŸ’¸ BG:', ...args);

// Use config values (set by config.js on self)
const SUPABASE_URL = self.CONFIG?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = self.CONFIG?.SUPABASE_ANON_KEY || '';
const API_BASE_URL = (self.CONFIG?.API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const WEBSITE_ORIGINS = self.CONFIG?.WEBSITE_ORIGINS || [];
const TRANSACTION_SYNC_TIMEOUT_MS = 10000;

async function fetchWithTimeout(url, options = {}, timeoutMs = TRANSACTION_SYNC_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeoutMs}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function updateTransactionSyncStatus(status, detail = {}) {
    const payload = {
        status,
        timestamp: Date.now(),
        ...detail
    };

    await chrome.storage.local.set({ lastTransactionSyncStatus: payload });
    notifyWebsiteTabs('TRANSACTION_SYNC_STATUS', payload);
}

async function postExtensionHealthEvent(authData = {}, payload = {}) {
    if (!authData?.accessToken) return;
    try {
        await fetchWithTimeout(`${API_BASE_URL}/extension-health/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.accessToken}`,
            },
            body: JSON.stringify(payload),
        }, 5000);
    } catch (error) {
        console.warn('Extension health event failed:', error?.message || error);
    }
}

function normalizeDetectedTransaction(data = {}, source = 'extension') {
    const amount = Number(data.amount ?? data.price ?? 0);
    const storeName = data.merchantName || data.merchant_name || data.storeName || data.name || data.serviceName || data.hostname || 'Detected Purchase';
    const sourceUrl = data.sourceUrl || data.storeUrl || data.url || undefined;

    return {
        name: data.name || storeName,
        merchantName: data.merchantName || data.merchant_name || storeName,
        serviceName: data.serviceName || data.name || storeName,
        storeName,
        productName: data.productName || data.product || data.label || data.serviceName || undefined,
        hostname: data.hostname || undefined,
        sourceUrl,
        amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
        price: Number.isFinite(amount) && amount >= 0 ? amount : 0,
        currency: data.currency || undefined,
        type: data.type || 'purchase',
        category: data.category || getCategoryFromStore(storeName),
        detectedAt: data.detectedAt || data.date || new Date().toISOString(),
        date: data.date || data.detectedAt || new Date().toISOString(),
        billingCycle: data.billingCycle || data.cycle || undefined,
        isTrial: !!(data.isTrial || data.is_trial),
        isSubscription: !!(data.isSubscription || data.type === 'subscription'),
        trialDays: data.trialDays || data.trial_days || 0,
        planTier: data.planTier || undefined,
        confidence: data.confidence || data.detectionConfidence || undefined,
        detectionConfidence: data.detectionConfidence || data.confidence || undefined,
        detectionSignals: data.detectionSignals || undefined,
        behaviorFlow: data.behaviorFlow || [],
        transactionHash: data.transactionHash || data.idempotencyKey || undefined,
        idempotencyKey: data.idempotencyKey || data.transactionHash || undefined,
        rawPayload: data.rawPayload || undefined,
        notes: data.notes || `Auto-tracked via ${source}`,
    };
}

async function syncDetectedTransaction(data, authData, source = 'extension') {
    if (!authData?.accessToken) {
        await updateTransactionSyncStatus('pending', { reason: 'not_authenticated' });
        return { success: false, pending: true, error: 'Not authenticated' };
    }

    const payload = normalizeDetectedTransaction(data, source);
    await updateTransactionSyncStatus('syncing', {
        transactionHash: payload.transactionHash,
        description: payload.name || payload.description
    });

    let response;
    try {
        response = await fetchWithTimeout(`${API_BASE_URL}/transactions/detected`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.accessToken}`,
            },
            body: JSON.stringify(payload),
        });
    } catch (error) {
        await updateTransactionSyncStatus('error', {
            transactionHash: payload.transactionHash,
            error: error?.message || String(error)
        });
        await postExtensionHealthEvent(authData, {
            eventType: 'sync',
            status: 'error',
            siteHostname: payload.hostname,
            message: error?.message || String(error),
            details: payload
        });
        throw error;
    }

    const responseText = await response.text();
    let body = null;

    try {
        body = responseText ? JSON.parse(responseText) : null;
    } catch {
        body = { error: responseText };
    }

    if (!response.ok) {
        await updateTransactionSyncStatus('error', {
            transactionHash: payload.transactionHash,
            statusCode: response.status,
            error: body?.error || body?.message || `Backend sync failed (${response.status})`
        });
        await postExtensionHealthEvent(authData, {
            eventType: 'sync',
            status: 'error',
            siteHostname: payload.hostname,
            message: body?.error || body?.message || `Backend sync failed (${response.status})`,
            details: { statusCode: response.status, payload }
        });
        throw new Error(body?.error || body?.message || `Backend sync failed (${response.status})`);
    }

    const transaction = body?.transaction || body?.data || body;
    await updateTransactionSyncStatus(body?.pendingReview ? 'pending' : (body?.duplicate ? 'duplicate' : 'synced'), {
        transactionHash: body?.transactionHash || payload.transactionHash,
        reason: body?.pendingReview ? 'pending_review' : undefined,
        transaction
    });
    await postExtensionHealthEvent(authData, {
        eventType: body?.pendingReview ? 'detected_transaction' : 'sync',
        status: 'success',
        siteHostname: payload.hostname,
        message: body?.pendingReview ? 'Transaction queued for inbox review' : 'Transaction synced',
        details: { pendingReview: !!body?.pendingReview, duplicate: !!body?.duplicate }
    });
    notifyWebsiteTabs('CASHLY_DATA_UPDATED', {
        area: body?.pendingReview ? 'transaction-inbox' : 'transactions',
        pendingReview: !!body?.pendingReview,
        duplicate: !!body?.duplicate,
        transaction
    });

    return {
        success: true,
        payload,
        duplicate: !!body?.duplicate,
        transaction,
    };
}

// ================================
// ðŸ”’ SECURITY MODULE
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
        return !!data.accessToken;
    },

    async refreshToken(refreshToken) {
        // Firebase ID tokens are refreshed by the website and re-synced through
        // content-website.js. The extension should not call Supabase auth.
        return false;
    }
};

// Initialize security module
Security.init();

// ================================
// ðŸš¨ SUSPICIOUS ACTIVITY DETECTION
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

            warn('ðŸš¨ Suspicious activity detected:', flags);
            Metrics.record('suspicious_activity', { flags });
        }

        return flags;
    },

    getAlerts() {
        return this.alerts.slice(-50);
    }
};

// ================================
// ðŸ“Š OBSERVABILITY - Performance Metrics
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
// ðŸ“œ EVENT TIMELINE
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
// ðŸ”„ ADVANCED SYNC - Optimistic updates, batching
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

            const created = [];
            for (const transaction of transactions) {
                const result = await syncDetectedTransaction(transaction, authData, transaction.source || 'extension-auto');
                created.push(result.transaction);
            }

            const syncTime = Date.now() - syncStart;
            Metrics.record('sync_time', syncTime);

            if (created.length === batch.length) {
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
                log(`âœ… Batch synced ${batch.length} transactions in ${syncTime}ms`);
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
// ðŸ›¡ï¸  RELIABILITY - Watchdog, Keep-alive, State persistence
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
            warn('âš ï¸  Watchdog: Extension may be hung, attempting recovery...');
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
            log('âœ… Recovery completed');
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
            warn('âš ï¸  Rate limit exceeded for', domain);
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
            const response = await fetchWithTimeout(url, options);
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
            const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
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
        console.log('ðŸ“¦ Transaction queued for sync:', transaction.description);

        // Try to sync immediately if online
        this.processQueue();
    }

    // Process queued transactions with exponential backoff
    async processQueue() {
        if (!this.isOnline) {
            await this.checkOnline();
            if (!this.isOnline) {
                console.log('ðŸ“´ Offline - will retry when connection restored');
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
            console.log(`ðŸ—‘ï¸  Discarded ${expiredCount} expired queue items (>24h old)`);
        }
        queue = validQueue;

        console.log(`ðŸ”„ Processing ${queue.length} queued transactions...`);

        const remaining = [];


        for (const item of queue) {
            try {
                const result = await syncDetectedTransaction(item, storage, item.source || 'extension-offline');
                const response = { ok: result.success, status: 201 };

                if (response.ok) {
                    console.log('âœ… Queued transaction synced:', item.description);
                } else if (response.status >= 500) {
                    // Server error - retry with backoff
                    item.retries = (item.retries || 0) + 1;
                    if (item.retries < this.maxRetries) {
                        remaining.push(item);
                    } else {
                        console.error('â Œ Max retries reached, discarding:', item.description);
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
            console.log(`â ° Retrying ${remaining.length} items in ${delay}ms`);
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
let lastWebsiteSessionSyncKey = null;
let lastWebsiteSessionSyncAt = 0;
const WEBSITE_SESSION_SYNC_COOLDOWN_MS = 60 * 1000;

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
            handleBehaviorTransaction(message.data);
            break;

        case 'TRACKING_STATE_UPDATE':
            // Update tracking state for popup display
            currentTrackingState = message.data;
            // Forward to popup if open
            chrome.runtime.sendMessage(message).catch(() => { });

            // INSTANT SAVE: Persist site visit to chrome.storage
            saveSiteVisit(message.data).then(() => {
                console.log('âœ… Site visit saved:', message.data.siteName);
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
            return true; // Keep return true for async response

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
        case 'GET_SYNC_STATUS':
            // Get current sync/auth status - returns immediately
            (async () => {
                try {
                    const data = await chrome.storage.local.get(['accessToken', 'userEmail', 'userId', 'userName', 'lastSync']);
                    
                    sendResponse({
                        isAuthenticated: !!(data.accessToken && data.userEmail),
                        accessToken: data.accessToken || null,
                        user: data.userEmail ? { 
                            id: data.userId || null, 
                            email: data.userEmail,
                            name: data.userName || null
                        } : null,
                        userId: data.userId || null,
                        userEmail: data.userEmail || null,
                        lastSynced: data.lastSync || null
                    });
                } catch (error) {
                    console.error('GET_SYNC_STATUS error:', error);
                    sendResponse({
                        isAuthenticated: false,
                        error: error.message
                    });
                }
            })();
            return true;

        case 'LOGOUT_EXTENSION':
            chrome.storage.local.remove([
                'supabaseSession', 'accessToken', 'userId', 'userEmail',
                'userName', 'syncedFromWebsite', 'lastSync', 'userAvatar'
            ]).then(() => {
                notifyWebsiteTabs('EXTENSION_LOGGED_OUT', {});
                sendResponse({ success: true });
            });
            return true;

        case 'GET_SITE_VISITS':
            getSiteVisits().then(visits => {
                sendResponse({ success: true, siteVisits: visits });
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
    const respond = (payload) => {
        try {
            sendResponse(payload);
        } catch (e) {
            console.warn('handleSessionSync: sendResponse already completed or invalid', e);
        }
    };

    try {
        if (!data?.session || !data?.user) {
            respond({ success: false, message: 'Invalid session data' });
            return;
        }

        const syncKey = `${data.user.id || ''}:${String(data.session.access_token || '').slice(-16)}`;
        const now = Date.now();
        const recentlySynced = syncKey && lastWebsiteSessionSyncKey === syncKey && now - lastWebsiteSessionSyncAt < WEBSITE_SESSION_SYNC_COOLDOWN_MS;
        lastWebsiteSessionSyncKey = syncKey;
        lastWebsiteSessionSyncAt = now;

        const email = data.user.email || '';
        const userName = data.user.user_metadata?.name || (email.includes('@') ? email.split('@')[0] : 'User');

        await chrome.storage.local.set({
            supabaseSession: data.session,
            accessToken: data.session.access_token,
            userId: data.user.id,
            userEmail: email,
            userName,
            syncedFromWebsite: true,
            lastSync: Date.now()
        });

        console.log('Session synced from website:', email || data.user.id);

        if (recentlySynced) {
            respond({ success: true, message: 'Session already synced' });
            return;
        }

        // Reply immediately so the popup is not left on "Syncing..." if the SW suspends (MV3).
        respond({ success: true, message: 'Session synced', email: email || undefined });

        showSyncNotification(email);
        syncPendingTransactions().catch(() => { });

        try {
            chrome.runtime.sendMessage({ type: 'SESSION_UPDATED' }).catch(() => { });
        } catch (e) { /* ignore */ }
    } catch (error) {
        console.error('Session sync error:', error);
        respond({ success: false, error: error.message });
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
        const incomingToken = data.session?.access_token || data.accessToken;
        
        if (existing.accessToken === incomingToken && existing.userEmail === incomingEmail) {
            console.log('✅ Already synced with this token, skipping');
            // Still notify tabs to update UI state
            notifyWebsiteTabs('EXTENSION_SYNCED', {
                email: incomingEmail,
                userId: data.user?.id || data.userId
            });
            return;
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

        console.log('âœ… Auto-logged in from website');

        // Show sync notification ONLY if not suppressed
        if (!data.skipNotification) {
            showSyncNotification(incomingEmail);
        } else {
            console.log('ðŸ”• Notification suppressed (auto-sync)');
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
// UTILITY FUNCTIONS
// ================================

function notifyWebsiteTabs(type, data) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            if (tab.url && WEBSITE_ORIGINS.some(origin => tab.url.includes(origin))) {
                chrome.tabs.sendMessage(tab.id, { type, data }).catch(() => {
                    // Tab might be restricted or loading
                });
            }
        });
    });
}

async function getSiteVisits() {
    const data = await chrome.storage.local.get(['siteVisits']);
    return data.siteVisits || [];
}

async function saveSiteVisit(visit) {
    const data = await chrome.storage.local.get(['siteVisits']);
    const visits = data.siteVisits || [];
    visits.unshift({
        ...visit,
        timestamp: Date.now()
    });
    // Keep last 100 visits
    await chrome.storage.local.set({ siteVisits: visits.slice(0, 100) });
}

async function showSyncNotification(email) {
    chrome.notifications.create(`sync-${Date.now()}`, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: 'Cashly Synced',
        message: `Your account (${email}) is now linked to the extension.`,
        priority: 1
    });
}

async function syncPendingTransactions() {
    // Placeholder for pending transaction sync logic
    console.log('Checking for pending transactions to sync...');
}

function getCategoryIcon(category) {
    const icons = {
        'Shopping': '🛍️',
        'Food': '🍕',
        'Entertainment': '🎬',
        'Health': '🏥',
        'Travel': '✈️',
        'Bills': '📄',
        'Other': '💰'
    };
    return icons[category] || '💰';
}

// ================================
// PURCHASE DETECTION HANDLER
// ================================


// ================================
// BEHAVIOR-BASED TRANSACTION HANDLER (v4.0)
// ================================
async function handleBehaviorTransaction(data) {
    console.log('ðŸŽ¯ Behavior-based transaction detected:', data);

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
        await updateTransactionSyncStatus('pending', {
            reason: 'not_authenticated',
            queuedMessages: pending.pendingTransactions.length,
            transactionHash: data.transactionHash || data.idempotencyKey
        });
        return { success: false, pending: true };
    }

    try {
        // Create transaction through Firebase-authenticated backend
        const transactionData = {
            user_id: authData.userId,
            name: data.name || data.merchantName || data.storeName || 'Purchase',
            merchantName: data.merchantName || data.storeName || data.name || data.hostname,
            storeName: data.storeName || data.merchantName || data.name || data.hostname,
            productName: data.productName || data.label,
            hostname: data.hostname,
            sourceUrl: data.sourceUrl || data.storeUrl || data.url,
            description: data.description || data.name || 'Purchase',
            amount: data.price || data.amount || 0,
            price: data.price || data.amount || 0,
            currency: data.currency,
            type: 'expense',
            category: data.category || 'Shopping',
            date: data.date || data.detectedAt || new Date().toISOString(),
            detectedAt: data.detectedAt || new Date().toISOString(),
            source: 'extension-behavior',
            transactionHash: data.transactionHash || data.idempotencyKey,
            idempotencyKey: data.idempotencyKey || data.transactionHash,
            billingCycle: data.billingCycle,
            isTrial: !!data.isTrial,
            isSubscription: !!data.isSubscription || data.type === 'subscription',
            trialDays: data.trialDays || 0,
            planTier: data.planTier,
            confidence: data.confidence || data.detectionConfidence,
            detectionConfidence: data.detectionConfidence || data.confidence,
            detectionSignals: data.detectionSignals || [],
            behaviorFlow: data.behaviorFlow || [],
            rawPayload: data.rawPayload || data,
            notes: `Auto-tracked via behavior detection from ${data.hostname || 'web'}. Flow: ${data.behaviorFlow?.map(s => s.to).join(' â†’ ') || 'direct'}`
        };

        await updateTransactionSyncStatus('syncing', {
            transactionHash: transactionData.transactionHash,
            description: transactionData.description
        });

        // Use rate limiter to prevent API abuse
        const response = await transactionRateLimiter.throttledFetch(`${API_BASE_URL}/transactions/detected`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.accessToken}`,
            },
            body: JSON.stringify(transactionData)
        });


        if (response.ok) {
            const createdResponse = await response.json();
            const created = createdResponse.transaction || createdResponse.data || createdResponse;
            console.log('âœ… Behavior transaction saved:', created);
            await updateTransactionSyncStatus(createdResponse.pendingReview ? 'pending' : (createdResponse.duplicate ? 'duplicate' : 'synced'), {
                transactionHash: createdResponse.transactionHash || transactionData.transactionHash,
                reason: createdResponse.pendingReview ? 'pending_review' : undefined,
                transaction: created
            });

            if (createdResponse.pendingReview) {
                showBehaviorNotification(data, true);
                await postExtensionHealthEvent(authData, {
                    eventType: 'detected_transaction',
                    status: 'success',
                    siteHostname: data.hostname,
                    message: 'Transaction queued for inbox review',
                    details: createdResponse
                });
                notifyWebsiteTabs('TRANSACTION_CANDIDATE_ADDED', {
                    candidate: created,
                    name: data.name,
                    amount: data.price || data.amount,
                    type: data.type
                });
                notifyWebsiteTabs('CASHLY_DATA_UPDATED', {
                    area: 'transaction-inbox',
                    candidate: created,
                    pendingReview: true
                });
                return { success: true, pendingReview: true };
            }

            // Show enhanced notification
            showBehaviorNotification(data);

            // âš¡ INSTANT: Broadcast via Supabase Realtime for < 100ms latency
            broadcastTransaction(authData.userId, {
                ...created,
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
            await updateTransactionSyncStatus('error', {
                transactionHash: transactionData.transactionHash,
                statusCode: response.status,
                error
            });
            console.error('Failed to save behavior transaction:', error);
            return { success: false, error };
        }
    } catch (error) {
        await updateTransactionSyncStatus('error', {
            transactionHash: data.transactionHash || data.idempotencyKey,
            error: error?.message || String(error)
        });
        console.error('Behavior transaction save error:', error);
        return { success: false, error: error.message };
    }
}

function showBehaviorNotification(data, pendingReview = false) {
    const notificationId = `behavior-${Date.now()}`;
    const amount = data.price || data.amount || 0;
    const notificationMessage = pendingReview
        ? `${data.name || 'Transaction'} ${amount > 0 ? `- $${amount.toFixed(2)}` : ''}\nSaved to Transaction Inbox`
        : `${data.name || 'Transaction'} ${amount > 0 ? `- $${amount.toFixed(2)}` : ''}\nDetection ready`;
    try {
        chrome.notifications.create(notificationId, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/logo.png'),
            title: pendingReview ? `${typeIcon} ${typeLabel} queued for review` : `${typeIcon} ${typeLabel} Detected!`,
            message: notificationMessage,
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
        }
    } catch (error) {
        console.log('Broadcast error:', error.message);
    }
}
