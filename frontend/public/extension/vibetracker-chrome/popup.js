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

    let authData = null;

    const showView = (name) => {
        Object.entries(views).forEach(([key, view]) => {
            if (view) view.hidden = key !== name;
        });
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
        const data = await chrome.storage.local.get(['accessToken', 'userEmail', 'userId', 'supabaseSession']);
        if (data.accessToken && data.userEmail) return data;
        return null;
    };

    const apiFetch = async (path, options = {}) => {
        if (!authData?.accessToken) throw new Error('Extension is not synced with Cashly.');
        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.accessToken}`,
                ...(options.headers || {}),
            },
        });
        const text = await response.text();
        const payload = text ? JSON.parse(text) : {};
        if (!response.ok) throw new Error(payload.error || payload.message || text || `Request failed: ${response.status}`);
        return payload.data ?? payload;
    };

    const syncFromWebsite = async () => {
        $('loginError').hidden = true;

        try {
            const [tab] = await chrome.tabs.query({ url: `${WEBSITE_URL}/*` });
            if (!tab?.id) {
                openWeb(routes.login);
                throw new Error('Cashly is opening. Sign in there, then click sync again.');
            }

            const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SUPABASE_SESSION' });
            if (!response?.session?.access_token || !response?.session?.user) {
                throw new Error('No active Cashly session found in the website tab.');
            }

            await chrome.storage.local.set({
                supabaseSession: response.session,
                accessToken: response.session.access_token,
                userId: response.session.user.id,
                userEmail: response.session.user.email,
                userAvatar: response.session.user.user_metadata?.avatar_url || null,
                syncedFromWebsite: true,
                lastSync: Date.now(),
            });

            await chrome.runtime.sendMessage({
                type: 'SYNC_SESSION_FROM_WEBSITE',
                data: {
                    session: response.session,
                    user: response.session.user,
                    accessToken: response.session.access_token,
                },
            }).catch(() => undefined);

            authData = await getAuth();
            await loadMain();
        } catch (error) {
            $('loginError').textContent = error.message || String(error);
            $('loginError').hidden = false;
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
        authData = await getAuth();
        if (!authData) {
            showView('login');
            return;
        }

        showView('main');
        $('userEmail').textContent = authData.userEmail;
        const site = await getCurrentSite();
        $('siteName').textContent = site || 'Unknown';

        const [storage, summary, inbox, health] = await Promise.all([
            chrome.storage.local.get(['offlineQueue', 'pendingSync', 'lastTransactionSyncStatus']),
            apiFetch('/dashboard/summary').catch(() => null),
            apiFetch('/transaction-inbox?status=pending&limit=1').catch(() => null),
            apiFetch('/extension-health').catch(() => null),
        ]);

        const pendingSync = Array.isArray(storage.pendingSync) ? storage.pendingSync.length : 0;
        const offlineQueue = Array.isArray(storage.offlineQueue) ? storage.offlineQueue.length : 0;
        const queued = pendingSync + offlineQueue + Number(health?.queuedSyncs || 0);
        const failed = Number(health?.failedDetections || 0);

        $('monthlySpent').textContent = formatCurrency(summary?.stats?.monthlyExpense || 0);
        $('pendingCount').textContent = String(inbox?.pagination?.total ?? summary?.inbox?.pendingCount ?? 0);
        $('queuedCount').textContent = String(queued);
        $('failedCount').textContent = String(failed);
        $('apiStatus').textContent = summary ? 'Connected' : 'Degraded';

        const statusDot = $('syncStatus')?.querySelector('.dot');
        if (statusDot) statusDot.classList.toggle('warn', failed > 0 || queued > 0);
        $('syncStatus').lastElementChild.textContent = failed > 0
            ? 'Sync needs attention'
            : queued > 0
                ? 'Queued syncs pending'
                : 'Live sync ready';

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
    };

    const logout = async () => {
        await chrome.storage.local.remove([
            'supabaseSession',
            'accessToken',
            'userId',
            'userEmail',
            'userAvatar',
            'syncedFromWebsite',
            'lastSync',
        ]);
        authData = null;
        showView('login');
    };

    const bind = () => {
        $('syncWebsiteBtn').addEventListener('click', syncFromWebsite);
        $('openLoginBtn').addEventListener('click', () => openWeb(routes.login));
        $('refreshBtn').addEventListener('click', loadMain);
        $('settingsBtn').addEventListener('click', async () => { await loadSettings(); showView('settings'); });
        $('logoutBtn').addEventListener('click', logout);
        $('backFromSettings').addEventListener('click', loadMain);
        $('backFromManual').addEventListener('click', loadMain);
        $('clipPageBtn').addEventListener('click', clipPage);
        $('addManualBtn').addEventListener('click', () => showView('manual'));
        $('manualForm').addEventListener('submit', saveManualExpense);
        $('autoTrackToggle').addEventListener('change', saveSettings);
        $('notificationsToggle').addEventListener('change', saveSettings);
        $('healthEventsToggle').addEventListener('change', saveSettings);

        $('openDashboard').addEventListener('click', () => openWeb(routes.dashboard));
        $('openInboxBtn').addEventListener('click', () => openWeb(routes.inbox));
        $('openCalendarBtn').addEventListener('click', () => openWeb(routes.calendar));
        $('openReportsBtn').addEventListener('click', () => openWeb(routes.reports));
        $('openCoachBtn').addEventListener('click', () => openWeb(routes.coach));
        $('openHealthBtn').addEventListener('click', () => openWeb(routes.health));
        $('openTransactionsBtn').addEventListener('click', () => openWeb(routes.transactions));
    };

    document.addEventListener('DOMContentLoaded', async () => {
        bind();
        await loadSettings();
        await loadMain();
    });
})();
