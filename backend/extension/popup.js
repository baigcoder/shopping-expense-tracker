(() => {
    const CONFIG_DATA = window.CONFIG || {};
    const API_BASE_URL = (CONFIG_DATA.API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
    const WEBSITE_URL = CONFIG_DATA.WEBSITE_URL || 'http://localhost:5173';

    const routes = {
        dashboard: '/dashboard',
        inbox: '/transaction-inbox',
        calendar: '/cashflow-calendar',
        reports: '/reports',
        coach: '/insights',
        health: '/extension-health',
        transactions: '/transactions',
        login: '/login',
    };

    const $ = (id) => document.getElementById(id);
    const views = {
        login: $('loginView'),
        main: $('mainView'),
        settings: $('settingsView'),
        manual: $('addManualView'),
    };

    // Debug function to log all relevant info
    const debugInfo = {
        show: async () => {
            const ext = await chrome.storage.local.get(['accessToken', 'userEmail', 'userId', 'lastSync']);
            console.log('=== EXTENSION DEBUG INFO ===');
            console.log('Storage data:', {
                hasAccessToken: !!ext.accessToken,
                userEmail: ext.userEmail,
                userId: ext.userId,
                lastSync: ext.lastSync ? new Date(ext.lastSync).toLocaleString() : 'Never'
            });
            console.log('URL:', window.location.href);
            console.log('API_BASE_URL:', API_BASE_URL);
            return ext;
        }
    };
    
    // Expose for console debugging
    window.CashlyDebug = debugInfo;

    let authData = null;

    const showView = (name) => {
        Object.entries(views).forEach(([key, view]) => {
            if (view) view.hidden = key !== name;
        });
    };

    const showToast = (message, type = 'success') => {
        const container = $('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 200);
        }, 3000);
    };

    const formatCurrency = (amount) => {
        const value = Number(amount || 0);
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 2,
        }).format(value);
    };

    const openWeb = (path) => chrome.tabs.create({ url: `${WEBSITE_URL}${path}` });

    const getAuth = async () => {
        // First check background status (source of truth)
        try {
            const status = await chrome.runtime.sendMessage({ type: 'GET_SYNC_STATUS' });
            if (status?.isAuthenticated) {
                return {
                    accessToken: status.accessToken || (await chrome.storage.local.get('accessToken')).accessToken,
                    userEmail: status.user?.email || (await chrome.storage.local.get('userEmail')).userEmail,
                    userId: status.user?.id || (await chrome.storage.local.get('userId')).userId
                };
            }
        } catch (e) {
            console.log('Background status check failed, falling back to storage');
        }

        const data = await chrome.storage.local.get(['accessToken', 'userEmail', 'userId']);
        if (data.accessToken && data.userEmail) return data;
        return null;
    };

    const apiFetch = async (path, options = {}) => {
        const auth = await getAuth();
        if (!auth?.accessToken) throw new Error('Session lost. Please sync again.');
        
        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.accessToken}`,
                ...(options.headers || {}),
            },
        });
        const text = await response.text();
        const payload = text ? JSON.parse(text) : {};
        if (!response.ok) throw new Error(payload.error || payload.message || text || `Request failed: ${response.status}`);
        return payload.data ?? payload;
    };

    const syncFromWebsite = async () => {
        const btn = $('syncWebsiteBtn');
        const originalText = btn.textContent;
        const brandMark = document.querySelector('.brand-mark');
        
        btn.disabled = true;
        btn.textContent = 'Scanning...';
        brandMark?.classList.add('pulse');
        $('loginError').hidden = true;

        try {
            const origins = CONFIG_DATA.WEBSITE_ORIGINS || [WEBSITE_URL];
            let targetTab = null;

            // First, try to find ANY tab from cashly domain
            for (const origin of origins) {
                const baseOrigin = origin.replace(/\/$/, '');
                const queryPattern = `${baseOrigin}/*`;
                
                const tabs = await chrome.tabs.query({ url: queryPattern });
                if (tabs.length > 0) {
                    targetTab = tabs[0];
                    break;
                }
            }

            // If no tabs found, also check localhost variations
            if (!targetTab) {
                const allTabs = await chrome.tabs.query({});
                for (const tab of allTabs) {
                    if (tab.url && (tab.url.includes('localhost') || tab.url.includes('127.0.0.1'))) {
                        targetTab = tab;
                        break;
                    }
                }
            }

            if (!targetTab) {
                openWeb(routes.login);
                throw new Error('Cashly website not found. Opening login page...');
            }

            btn.textContent = 'Extracting...';
            console.log('📱 Target tab:', targetTab.url);
            
            const injectionResults = await chrome.scripting.executeScript({
                target: { tabId: targetTab.id },
                func: () => {
                    const findSession = (storage) => {
                        const storageName = storage === localStorage ? 'localStorage' : 'sessionStorage';
                        console.log('🔍 Searching for auth session in', storageName);
                        
                        const allKeys = Object.keys(storage);
                        console.log(`📋 Total keys in ${storageName}:`, allKeys.length);
                        console.log('🔑 Keys sample:', allKeys.slice(0, 30).join(', '));
                        
                        // Log all keys that look auth-related
                        const authRelatedKeys = allKeys.filter(k => 
                            k.toLowerCase().includes('auth') ||
                            k.toLowerCase().includes('token') ||
                            k.toLowerCase().includes('firebase') ||
                            k.toLowerCase().includes('supabase') ||
                            k.toLowerCase().includes('user') ||
                            k.toLowerCase().includes('session')
                        );
                        console.log('🔐 Auth-related keys:', authRelatedKeys);

                        // 0. Cashly web bridge + legacy expense_tracker_session (Firebase/IndexedDB has no localStorage key)
                        const bridgeKeyNames = ['cashly_web_session_bridge', 'expense_tracker_session'];
                        for (const bridgeKey of bridgeKeyNames) {
                            try {
                                const raw = storage.getItem(bridgeKey);
                                if (!raw) continue;
                                const parsed = JSON.parse(raw);
                                const token = parsed.access_token || parsed.accessToken;
                                if (token && typeof token === 'string' && token.length > 20) {
                                    const u = parsed.user || {};
                                    console.log('✅ Found Cashly bridge session (' + bridgeKey + ')');
                                    return {
                                        access_token: token,
                                        user: {
                                            id: u.id || parsed.userId || 'unknown',
                                            email: u.email || parsed.email || 'User',
                                            user_metadata: u.user_metadata || {},
                                        },
                                    };
                                }
                            } catch (e) {
                                console.log('Bridge parse skip:', bridgeKey, e && e.message);
                            }
                        }
                        
                        // 1. Try Supabase (Most common for this app)
                        const supabaseKey = Object.keys(storage).find(key =>
                            key.startsWith('sb-') && key.endsWith('-auth-token')
                        );
                        if (supabaseKey) {
                            try {
                                const session = JSON.parse(storage.getItem(supabaseKey));
                                if (session?.access_token) {
                                    console.log('✅ Found Supabase session');
                                    return {
                                        access_token: session.access_token,
                                        user: session.user || { email: 'User', id: 'unknown' }
                                    };
                                }
                            } catch (e) { 
                                console.error('Supabase parse error:', e);
                            }
                        }

                        // 2. Try Firebase - Check ALL keys containing firebase (case-insensitive)
                        const firebaseKeys = Object.keys(storage).filter(key => key.toLowerCase().includes('firebase'));
                        console.log('🔥 Firebase keys found:', firebaseKeys);
                        
                        for (const firebaseKey of firebaseKeys) {
                            try {
                                const value = storage.getItem(firebaseKey);
                                if (!value) {
                                    console.log(`  [${firebaseKey}] = null/empty`);
                                    continue;
                                }
                                
                                const data = JSON.parse(value);
                                console.log(`  [${firebaseKey}] keys:`, Object.keys(data || {}).slice(0, 10));
                                
                                // Check different Firebase storage formats
                                if (data?.stsTokenManager?.accessToken) {
                                    console.log('✅ Found Firebase session (stsTokenManager format)');
                                    return {
                                        access_token: data.stsTokenManager.accessToken,
                                        user: { id: data.uid, email: data.email || 'User' }
                                    };
                                }
                                if (data?.access_token && typeof data.access_token === 'string' && data.access_token.length > 20) {
                                    console.log('✅ Found Firebase session (direct access_token)');
                                    return {
                                        access_token: data.access_token,
                                        user: { id: data.uid || 'unknown', email: data.email || 'User' }
                                    };
                                }
                                // Check if it's a user object with stsTokenManager
                                if (data?.stsTokenManager) {
                                    console.log('✅ Found Firebase stsTokenManager (nested format)');
                                    return {
                                        access_token: data.stsTokenManager.accessToken,
                                        user: { id: data.localId || data.uid, email: data.email || 'User' }
                                    };
                                }
                            } catch (e) { 
                                console.error(`❌ Firebase parse error for key [${firebaseKey}]:`, e.message);
                            }
                        }
                        
                        // 3. Fallback: Generic 'token' or 'session' keys
                        const genericKeys = ['token', 'accessToken', 'session', 'auth_token', 'id_token', 'current_user', 'authToken'];
                        for (const key of genericKeys) {
                            const val = storage.getItem(key);
                            if (val && val.length > 50) { // Looks like a JWT or session object
                                try {
                                    // Try to parse as JSON first
                                    const parsed = JSON.parse(val);
                                    if (parsed?.access_token) {
                                        console.log('✅ Found session in generic key:', key);
                                        return { access_token: parsed.access_token, user: { email: 'User', id: 'unknown' } };
                                    }
                                } catch {
                                    // It's a raw token string
                                    if (val.includes('.') && val.length > 100) { // JWT format
                                        console.log('✅ Found token in generic key:', key);
                                        return { access_token: val, user: { email: 'User', id: 'unknown' } };
                                    }
                                }
                            }
                        }

                        console.log('❌ No session found in', storageName);
                        return null;
                    };
                    
                    // 4. Try checking document.body for user data (some apps embed it)
                    const checkEmbeddedData = () => {
                        try {
                            const scripts = document.querySelectorAll('script[type="application/json"]');
                            for (const script of scripts) {
                                try {
                                    const data = JSON.parse(script.textContent);
                                    if (data?.user?.access_token || data?.access_token) {
                                        console.log('✅ Found embedded auth data in script tag');
                                        return {
                                            access_token: data.user?.access_token || data.access_token,
                                            user: data.user || { email: 'User', id: 'unknown' }
                                        };
                                    }
                                } catch (e) { }
                            }
                        } catch (e) {
                            console.log('Could not check embedded data:', e.message);
                        }
                        return null;
                    };

                    // Try both storages and return whatever is found
                    let result = findSession(localStorage);
                    if (!result) {
                        console.log('📝 localStorage search failed, trying sessionStorage...');
                        result = findSession(sessionStorage);
                    }
                    if (!result) {
                        console.log('📝 sessionStorage search failed, trying embedded data...');
                        result = checkEmbeddedData();
                    }
                    
                    // 5. Try checking common API endpoints for current user endpoint response
                    // (This would be for apps that fetch user data via API)
                    
                    return {
                        success: !!result,
                        data: result,
                        debug: {
                            localStorageSize: Object.keys(localStorage).length,
                            sessionStorageSize: Object.keys(sessionStorage).length,
                            documentTitle: document.title,
                            currentUrl: window.location.href,
                            timestamp: Date.now()
                        }
                    };
                }
            });

            const injectionResult = injectionResults[0]?.result;
            console.log('🔬 Injection result:', injectionResult);

            if (!injectionResult?.success || !injectionResult?.data?.access_token) {
                const debugInfo = injectionResult?.debug ? 
                    `\n[Debug: ${injectionResult.debug.localStorageSize} localStorage, ${injectionResult.debug.sessionStorageSize} sessionStorage items]` : '';
                console.error('Session not found:', injectionResult);
                throw new Error(`❌ No active session found on website.\nPlease ensure you are logged in at ${targetTab.url}${debugInfo}`);
            }

            const session = injectionResult.data;
            btn.textContent = 'Syncing...';

            const SYNC_MESSAGE_TIMEOUT_MS = 20000;
            const syncResponse = await Promise.race([
                chrome.runtime.sendMessage({
                    type: 'SYNC_SESSION_FROM_WEBSITE',
                    data: {
                        session: session,
                        user: session.user,
                        accessToken: session.access_token
                    }
                }),
                new Promise((_, reject) =>
                    setTimeout(
                        () => reject(new Error('Sync timed out. Open chrome://extensions, reload Cashly, then try again.')),
                        SYNC_MESSAGE_TIMEOUT_MS
                    )
                ),
            ]);

            if (!syncResponse?.success) {
                throw new Error(syncResponse?.message || syncResponse?.error || 'Sync failed in background');
            }

            btn.textContent = 'Verifying...';
            await chrome.runtime.sendMessage({ type: 'SYNC_WEBSITE_BRIDGE' }).catch(() => undefined);

            // Wait for storage to persist
            await new Promise(r => setTimeout(r, 200));
            
            const storedAuth = await chrome.storage.local.get(['accessToken', 'userEmail']);
            if (!storedAuth.accessToken || !storedAuth.userEmail) {
                throw new Error('Session data failed to persist. Please try again.');
            }

            console.log('✅ Session verified:', storedAuth.userEmail);
            showToast('Extension Synced! ✨');
            
            setTimeout(() => {
                window.location.reload();
            }, 800);

        } catch (error) {
            console.error('Sync Error:', error);
            showToast(error.message || 'Sync failed', 'error');
            $('loginError').textContent = error.message;
            $('loginError').hidden = false;
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
            brandMark?.classList.remove('pulse');
        }
    };

    const recordHealth = async (payload) => {
        const settings = await chrome.storage.local.get(['healthEvents']);
        if (settings.healthEvents === false || !authData?.accessToken) return;
        try {
            await apiFetch('/extension-health/events', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        } catch {
            // Health events should never break popup usage.
        }
    };

    const getCurrentSite = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url) return null;
        try {
            return new URL(tab.url).hostname;
        } catch {
            return null;
        }
    };

    const loadSettings = async () => {
        const settings = await chrome.storage.local.get(['autoTrack', 'showNotifications', 'healthEvents']);
        $('autoTrackToggle').checked = settings.autoTrack !== false;
        $('notificationsToggle').checked = settings.showNotifications !== false;
        $('healthEventsToggle').checked = settings.healthEvents !== false;
    };

    const saveSettings = async () => {
        await chrome.storage.local.set({
            autoTrack: $('autoTrackToggle').checked,
            showNotifications: $('notificationsToggle').checked,
            healthEvents: $('healthEventsToggle').checked,
        });
    };

    const loadMain = async () => {
        console.log('🔄 Loading main view...');
        authData = await getAuth();
        await chrome.runtime.sendMessage({ type: 'SYNC_WEBSITE_BRIDGE' }).catch(() => undefined);
        
        // CRITICAL FIX: Retry getAuth if it fails on first try (sync might still be settling)
        if (!authData?.accessToken) {
            console.log('⚠️ Auth data not found immediately, retrying...');
            await new Promise(r => setTimeout(r, 300)); // Wait 300ms
            authData = await getAuth();
        }
        
        if (!authData?.accessToken) {
            console.log('⚠️ No auth data found in loadMain after retry');
            showView('login');
            return;
        }

        console.log('✅ Auth verified for:', authData.userEmail);
        showView('main');
        $('userEmail').textContent = authData.userEmail;
        const site = await getCurrentSite();
        $('siteName').textContent = site || 'Unknown';

        try {
            const [storage, summary, inbox, health] = await Promise.all([
                chrome.storage.local.get(['offlineQueue', 'pendingSync', 'lastTransactionSyncStatus', 'lastSync']),
                apiFetch('/dashboard/summary').catch(e => { console.error('Summary fetch failed:', e); return null; }),
                apiFetch('/transaction-inbox?status=pending&limit=1').catch(e => { console.error('Inbox fetch failed:', e); return null; }),
                apiFetch('/extension-health').catch(e => { console.error('Health fetch failed:', e); return null; }),
            ]);

            const pendingSync = Array.isArray(storage.pendingSync) ? storage.pendingSync.length : 0;
            const offlineQueue = Array.isArray(storage.offlineQueue) ? storage.offlineQueue.length : 0;
            const queued = pendingSync + offlineQueue + Number(health?.queuedSyncs || 0);
            const failed = Number(health?.failedDetections || 0);

            $('monthlySpent').textContent = formatCurrency(summary?.stats?.monthlyExpense || 0);
            $('pendingCount').textContent = String(inbox?.pagination?.total ?? summary?.inbox?.pendingCount ?? 0);
            $('queuedCount').textContent = String(queued);
            $('failedCount').textContent = String(failed);
            $('apiStatus').textContent = summary ? 'Connected' : 'Offline Mode';

            const statusDot = $('syncStatus')?.querySelector('.dot');
            if (statusDot) statusDot.classList.toggle('warn', failed > 0 || queued > 0 || !summary);
            
            const lastSyncTime = storage.lastSync ? new Date(storage.lastSync).toLocaleTimeString() : 'Never';
            $('syncStatus').lastElementChild.textContent = !summary 
                ? `Offline (Last Sync: ${lastSyncTime})`
                : failed > 0
                    ? 'Sync needs attention'
                    : queued > 0
                        ? 'Queued syncs pending'
                        : `Live sync active (${lastSyncTime})`;

            const latestCandidate = summary?.inbox?.candidates?.[0];
            const lastSync = storage.lastTransactionSyncStatus;
            $('lastDetection').textContent = latestCandidate
                ? `${latestCandidate.merchant_name || latestCandidate.description} is waiting in the inbox.`
                : lastSync?.message || 'No recent detection loaded.';

            renderRecent(summary?.recentTransactions || []);

            if (site) {
                await recordHealth({
                    eventType: 'site_visit',
                    status: 'success',
                    siteHostname: site,
                    siteName: site,
                    queuedCount: queued,
                    failedCount: failed,
                    permissionStatus: 'granted',
                    message: 'Popup opened on tracked site.',
                });
            }
        } catch (error) {
            console.error('Critical loadMain error:', error);
            $('apiStatus').textContent = 'Degraded';
            $('syncStatus').lastElementChild.textContent = 'Connection error. Re-syncing...';
        }
    };

    const renderRecent = (transactions) => {
        const container = $('recentTransactions');
        container.innerHTML = '';

        if (!transactions.length) {
            container.innerHTML = '<div class="empty">No transactions loaded.</div>';
            return;
        }

        transactions.slice(0, 4).forEach((tx) => {
            const row = document.createElement('div');
            row.className = 'tx-row';
            row.innerHTML = `
                <div>
                    <p>${tx.description || tx.store_name || 'Transaction'}</p>
                    <span>${tx.category || 'Other'}</span>
                </div>
                <strong>${tx.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(Number(tx.amount || 0)))}</strong>
            `;
            container.appendChild(row);
        });
    };

    const clipPage = async () => {
        const site = await getCurrentSite();
        await recordHealth({
            eventType: 'clip_page',
            status: 'success',
            siteHostname: site,
            siteName: site,
            message: 'User clipped current page from popup.',
        });
        showToast('Page Clipped!');
        $('lastDetection').textContent = site ? `${site} clipped for review context.` : 'Page clipped for review context.';
    };

    const saveManualExpense = async (event) => {
        event.preventDefault();
        const description = $('manualDesc').value.trim();
        const amount = Number($('manualAmount').value);
        const category = $('manualCategory').value;
        if (!description || !Number.isFinite(amount) || amount <= 0) return;

        await apiFetch('/transactions', {
            method: 'POST',
            body: JSON.stringify({
                amount,
                currency: 'USD',
                storeName: description,
                category,
                purchaseDate: new Date().toISOString(),
            }),
        });

        await recordHealth({
            eventType: 'manual_transaction',
            status: 'success',
            message: 'Manual popup transaction saved.',
        });

        $('manualForm').reset();
        await loadMain();
        showToast('Transaction Saved!');
    };

    const logout = async () => {
        await chrome.runtime.sendMessage({ type: 'LOGOUT_EXTENSION' }).catch(async () => {
            await chrome.storage.local.remove([
                'supabaseSession',
                'accessToken',
                'userId',
                'userEmail',
                'userAvatar',
                'syncedFromWebsite',
                'lastSync',
            ]);
        });
        authData = null;
        showView('login');
    };

    const bind = () => {
        const on = (id, type, fn) => {
            const el = $(id);
            if (el) el.addEventListener(type, fn);
        };

        on('syncWebsiteBtn', 'click', syncFromWebsite);
        on('openLoginBtn', 'click', () => openWeb(routes.login));
        on('refreshBtn', 'click', loadMain);
        on('settingsBtn', 'click', async () => { await loadSettings(); showView('settings'); });
        on('logoutBtn', 'click', logout);
        on('backFromSettings', 'click', loadMain);
        on('backFromManual', 'click', loadMain);
        on('clipPageBtn', 'click', clipPage);
        on('addManualBtn', 'click', () => showView('manual'));
        on('manualForm', 'submit', saveManualExpense);
        on('autoTrackToggle', 'change', saveSettings);
        on('notificationsToggle', 'change', saveSettings);
        on('healthEventsToggle', 'change', saveSettings);

        on('openDashboard', 'click', () => openWeb(routes.dashboard));
        on('openInboxBtn', 'click', () => openWeb(routes.inbox));
        on('openCalendarBtn', 'click', () => openWeb(routes.calendar));
        on('openReportsBtn', 'click', () => openWeb(routes.reports));
        on('openCoachBtn', 'click', () => openWeb(routes.coach));
        on('openHealthBtn', 'click', () => openWeb(routes.health));
        on('openTransactionsBtn', 'click', () => openWeb(routes.transactions));
    };

    document.addEventListener('DOMContentLoaded', async () => {
        bind();
        await loadSettings();
        await loadMain();

        // Listen for session updates from background (e.g., after sync)
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'SESSION_UPDATED') {
                console.log('SESSION_UPDATED received in popup, refreshing...');
                loadMain(); // Refresh the UI immediately
                sendResponse({ received: true });
            } else if (message.type === 'WEBSITE_LOGGED_OUT') {
                console.log('WEBSITE_LOGGED_OUT received in popup, returning to login view...');
                authData = null;
                showView('login');
                sendResponse({ received: true });
            }
        });
    });
})();
