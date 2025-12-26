// Enhanced Extension Popup Script - Full Feature Support v4.0
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup script initialized');

    // ================================
    // DOM ELEMENTS
    // ================================
    const loginView = document.getElementById('loginView');
    const mainView = document.getElementById('mainView');
    const settingsView = document.getElementById('settingsView');
    const addManualView = document.getElementById('addManualView');

    // Login elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');

    // Main view elements
    const logoutBtn = document.getElementById('logoutBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    console.log('Button elements found:', { logoutBtn: !!logoutBtn, settingsBtn: !!settingsBtn });

    const userEmailEl = document.getElementById('userEmail');
    const syncStatusEl = document.getElementById('syncStatus');
    const monthlySpentEl = document.getElementById('monthlySpent');
    const transactionCountEl = document.getElementById('transactionCount');
    const sitesTrackedEl = document.getElementById('sitesTracked');
    const totalTransactionsEl = document.getElementById('totalTransactions');
    const recentTransactionsEl = document.getElementById('recentTransactions');
    const categoriesListEl = document.getElementById('categoriesList');
    const budgetAlertEl = document.getElementById('budgetAlert');

    // Monitoring elements - NEW!
    const siteNameEl = document.getElementById('siteName');
    const siteStatusEl = document.getElementById('siteStatus');
    const siteFaviconEl = document.getElementById('siteFavicon');
    const flowIndicatorEl = document.getElementById('flowIndicator');

    // Action buttons
    const clipPageBtn = document.getElementById('clipPageBtn');
    const addManualBtn = document.getElementById('addManualBtn');
    const openDashboardBtn = document.getElementById('openDashboard');
    const viewBudgetsBtn = document.getElementById('viewBudgetsBtn');
    const refreshBtn = document.getElementById('refreshBtn');

    // Settings elements
    const backFromSettings = document.getElementById('backFromSettings');
    const autoTrackToggle = document.getElementById('autoTrackToggle');
    const notificationsToggle = document.getElementById('notificationsToggle');
    const budgetAlertsToggle = document.getElementById('budgetAlertsToggle');
    const darkModeToggle = document.getElementById('darkModeToggle');

    // Manual add elements
    const backFromManual = document.getElementById('backFromManual');
    const manualForm = document.getElementById('manualForm');
    const manualDesc = document.getElementById('manualDesc');
    const manualAmount = document.getElementById('manualAmount');
    const manualCategory = document.getElementById('manualCategory');

    // ================================
    // CONFIGURATION (from config.js loaded in HTML)
    // ================================
    const SUPABASE_URL = window.CONFIG?.SUPABASE_URL || 'https://ebfolvhqjvavrwrfcbhn.supabase.co';
    const SUPABASE_ANON_KEY = window.CONFIG?.SUPABASE_ANON_KEY || '';
    const WEBSITE_URL = window.CONFIG?.WEBSITE_URL || 'http://localhost:5173';
    const DASHBOARD_URL = `${WEBSITE_URL}/dashboard`;
    const BUDGETS_URL = `${WEBSITE_URL}/budgets`;

    // State tracking map - Updated for Smart Site Detection v5.0
    const STATE_DISPLAY = {
        'idle': { stage: 0, status: '💤 Not a payment site', color: '#94A3B8' },
        'monitoring': { stage: 0, status: '👁️ Monitoring...', color: '#10B981' },
        'browsing': { stage: 0, status: '👁️ Monitoring...', color: '#10B981' },
        'checkout_entered': { stage: 1, status: '🛒 In Checkout', color: '#F59E0B' },
        'payment_form_active': { stage: 2, status: '💳 Filling Payment', color: '#6366F1' },
        'payment_submitted': { stage: 2, status: '⏳ Processing...', color: '#2563EB' },
        'awaiting_confirmation': { stage: 3, status: '🔄 Confirming...', color: '#2563EB' },
        'transaction_confirmed': { stage: 3, status: '✅ Saved!', color: '#10B981' }
    };

    // ================================
    // CURRENT TAB MONITORING - Smart Site Detection v5.0
    // ================================
    async function updateCurrentTabInfo() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.url) {
                // No active tab - update UI to show this
                if (siteNameEl) siteNameEl.textContent = 'No active tab';
                if (siteStatusEl) siteStatusEl.textContent = 'Open a website to start';
                return;
            }

            // Check for special URLs that we can't track
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') ||
                tab.url.startsWith('about:') || tab.url.startsWith('edge://')) {
                if (siteNameEl) siteNameEl.textContent = 'Browser Page';
                if (siteStatusEl) siteStatusEl.textContent = '⚙️ System page - not tracked';
                if (siteFaviconEl) siteFaviconEl.src = '';
                return;
            }

            const url = new URL(tab.url);
            const hostname = url.hostname.replace('www.', '');

            // Default site name from hostname (capitalize first letter)
            let siteName = hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
            let siteCategory = 'Browsing';
            let currentState = 'idle';
            let isPaymentSite = false;
            let analysisScore = 0;

            // ALWAYS update favicon from hostname first
            if (siteFaviconEl) {
                siteFaviconEl.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
                siteFaviconEl.onerror = () => { siteFaviconEl.src = ''; };
            }

            // Try to get tracking state from content script
            try {
                const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_CURRENT_SITE' });
                if (response) {
                    siteName = response.siteName || siteName;
                    siteCategory = response.category || 'Shopping';
                    currentState = response.currentState || 'idle';
                    isPaymentSite = response.isPaymentSite || false;
                    analysisScore = response.analysisScore || 0;

                    // Update favicon with content script's better version
                    if (siteFaviconEl && response.favicon) {
                        siteFaviconEl.src = response.favicon;
                    }

                    console.log('📦 Content script response:', { siteName, currentState, isPaymentSite, analysisScore });
                }
            } catch (e) {
                // Content script not loaded - show basic monitoring mode
                console.log('⚠️ Content script not responding, showing basic info for:', hostname);
                currentState = 'browsing'; // Show as browsing, not idle
                isPaymentSite = true; // Assume it could be trackable
            }

            // ALWAYS update site name (even if content script failed)
            if (siteNameEl) {
                siteNameEl.textContent = siteName;
            }

            // Update status with state info
            const stateInfo = STATE_DISPLAY[currentState] || STATE_DISPLAY['idle'];
            if (siteStatusEl) {
                siteStatusEl.textContent = stateInfo.status;
                siteStatusEl.style.color = stateInfo.color || '';

                // Add category if payment site
                if (isPaymentSite && siteCategory && currentState !== 'idle') {
                    siteStatusEl.textContent = `${stateInfo.status} • ${siteCategory}`;
                }

                // Add tracking-active class for pulsing effect
                if (isPaymentSite && currentState !== 'idle') {
                    siteStatusEl.classList.add('tracking-active');
                } else {
                    siteStatusEl.classList.remove('tracking-active');
                }
            }

            // Update flow indicator
            updateFlowIndicator(currentState);

        } catch (e) {
            console.log('Tab info error:', e);
            if (siteNameEl) siteNameEl.textContent = 'Error';
            if (siteStatusEl) siteStatusEl.textContent = 'Could not get tab info';
        }
    }

    function updateFlowIndicator(currentState) {
        if (!flowIndicatorEl) return;

        const stages = flowIndicatorEl.querySelectorAll('.stage');
        const stateInfo = STATE_DISPLAY[currentState] || STATE_DISPLAY['browsing'];
        const activeStage = stateInfo.stage;

        stages.forEach((stage, index) => {
            stage.classList.remove('active', 'completed');
            if (index < activeStage) {
                stage.classList.add('completed');
            } else if (index === activeStage) {
                stage.classList.add('active');
            }
        });
    }

    // ================================
    // INITIALIZATION
    // ================================

    // Load settings
    await loadSettings();

    // Check auth and show appropriate view
    await checkAuthAndShowView();

    // Start monitoring current tab
    await updateCurrentTabInfo();

    // Listen for tracking state updates from background
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'TRACKING_STATE_UPDATE') {
            updateFlowIndicator(message.data.state);
            if (siteNameEl) siteNameEl.textContent = message.data.siteName;
            if (siteStatusEl) {
                const stateInfo = STATE_DISPLAY[message.data.state] || STATE_DISPLAY['browsing'];
                siteStatusEl.textContent = stateInfo.status;
                // Add pulsing effect for active states
                if (message.data.state !== 'browsing') {
                    siteStatusEl.classList.add('tracking-active');
                } else {
                    siteStatusEl.classList.remove('tracking-active');
                }
            }
        }
        // Handle new transaction events - update stats immediately
        if (message.type === 'TRANSACTION_ADDED' || message.type === 'BEHAVIOR_TRANSACTION_ADDED') {
            loadStats();
            loadRecentTransactions();
        }
        // INSTANT UPDATE: Sites tracked count
        if (message.type === 'SITE_VISITS_UPDATED') {
            if (sitesTrackedEl) {
                sitesTrackedEl.textContent = message.count;
                // Flash animation to show update
                sitesTrackedEl.style.transform = 'scale(1.2)';
                sitesTrackedEl.style.color = '#10B981';
                setTimeout(() => {
                    sitesTrackedEl.style.transform = 'scale(1)';
                    sitesTrackedEl.style.color = '';
                }, 300);
            }
        }
    });

    // REAL-TIME TAB MONITORING: Update when user switches tabs
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
        console.log('Tab activated:', activeInfo.tabId);
        await updateCurrentTabInfo();
    });

    // Also listen for URL changes within the same tab (SPA navigation)
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' || changeInfo.url) {
            // Only update if this is the active tab
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab && activeTab.id === tabId) {
                await updateCurrentTabInfo();
            }
        }
    });

    // ================================
    // VIEW NAVIGATION
    // ================================

    function showView(viewName) {
        loginView.style.display = 'none';
        mainView.style.display = 'none';
        settingsView.style.display = 'none';
        addManualView.style.display = 'none';

        switch (viewName) {
            case 'login':
                loginView.style.display = 'flex'; // Flex for centering content
                break;
            case 'main':
                mainView.style.display = 'block';
                break;
            case 'settings':
                settingsView.style.display = 'block';
                break;
            case 'manual':
                addManualView.style.display = 'block';
                break;
        }
    }

    // ================================
    // AUTO-LOGIN FROM WEBSITE
    // ================================

    async function tryAutoLoginFromWebsite() {
        try {
            const [tab] = await chrome.tabs.query({ url: `${WEBSITE_URL}/*` });

            if (tab) {
                const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SUPABASE_SESSION' });

                if (response && response.session) {
                    await chrome.storage.local.set({
                        supabaseSession: response.session,
                        userId: response.session.user.id,
                        userEmail: response.session.user.email,
                        userName: response.session.user.user_metadata?.name || response.session.user.email.split('@')[0],
                        userAvatar: response.session.user.user_metadata?.avatar_url || response.session.user.user_metadata?.picture || '',
                        accessToken: response.session.access_token,
                        syncedFromWebsite: true,
                        lastSync: Date.now()
                    });

                    console.log('✅ Auto-logged in from website session!');
                    return true;
                }
            }
        } catch (error) {
            console.log('Could not auto-login:', error.message);
        }
        return false;
    }

    // ================================
    // AUTH CHECK
    // ================================

    async function checkAuthAndShowView() {
        await tryAutoLoginFromWebsite();

        const authData = await chrome.storage.local.get(['accessToken', 'userEmail', 'userId', 'syncedFromWebsite', 'userAvatar', 'supabaseSession']);

        if (authData.accessToken && authData.userEmail) {
            // CHECK TOKEN EXPIRY & REFRESH IF NEEDED
            const session = authData.supabaseSession;
            if (session?.expires_at) {
                const expiresAt = session.expires_at * 1000; // Convert to ms
                const now = Date.now();
                const fiveMinutes = 5 * 60 * 1000;

                // Refresh if token expires in less than 5 minutes
                if (expiresAt - now < fiveMinutes) {
                    console.log('🔄 Token expiring soon, refreshing...');
                    const refreshed = await refreshToken(session.refresh_token);
                    if (!refreshed) {
                        console.log('⚠️ Token refresh failed, showing login');
                        showView('login');
                        return;
                    }
                }
            }

            showView('main');
            userEmailEl.textContent = authData.userEmail;

            // Render avatar
            const avatarImg = document.getElementById('userAvatarImg');
            const avatarFallback = document.getElementById('userAvatarFallback');
            if (authData.userAvatar && avatarImg && avatarFallback) {
                avatarImg.src = authData.userAvatar;
                avatarImg.style.display = 'block';
                avatarFallback.style.display = 'none';
            }

            if (authData.syncedFromWebsite) {
                syncStatusEl.innerHTML = '<span class="sync-dot"></span> Synced with Website';
            } else {
                syncStatusEl.innerHTML = '<span class="sync-dot"></span> Live Sync Active';
            }

            // Load all data including current tab info
            await Promise.all([
                loadStats(),
                loadRecentTransactions(),
                loadCategories(),
                checkBudgetAlerts(),
                updateCurrentTabInfo() // Update Active Session display
            ]);
        } else {
            showView('login');
        }
    }

    // ================================
    // TOKEN REFRESH
    // ================================
    async function refreshToken(refreshToken) {
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (!response.ok) return false;

            const data = await response.json();

            await chrome.storage.local.set({
                supabaseSession: data,
                accessToken: data.access_token,
                lastSync: Date.now()
            });

            console.log('✅ Token refreshed successfully');
            return true;
        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    }

    // ================================
    // LOGIN HANDLER
    // ================================

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError('Please enter email and password');
            return;
        }

        loginBtn.textContent = 'Signing in...';
        loginBtn.disabled = true;
        loginError.style.display = 'none';

        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error_description || data.error.message || 'Login failed');
            }

            await chrome.storage.local.set({
                supabaseSession: data,
                accessToken: data.access_token,
                userId: data.user.id,
                userEmail: data.user.email,
                userName: data.user.user_metadata?.name || data.user.email.split('@')[0],
                lastSync: Date.now()
            });

            // Notify background script
            chrome.runtime.sendMessage({
                type: 'USER_LOGGED_IN',
                data: { email, userId: data.user.id }
            });

            // Directly inject localStorage flag into any open website tabs
            await injectSyncFlagToWebsite(data.user.email);

            await checkAuthAndShowView();

        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'Login failed. Check your credentials.');
        } finally {
            loginBtn.textContent = 'Sign In →';
            loginBtn.disabled = false;
        }
    });

    // Function to directly inject localStorage flag into website tabs
    async function injectSyncFlagToWebsite(email) {
        try {
            // Find all website tabs
            const tabs = await chrome.tabs.query({});
            const websiteTabs = tabs.filter(tab =>
                tab.url && (
                    tab.url.includes('localhost:5173') ||
                    tab.url.includes('127.0.0.1:5173') ||
                    tab.url.includes('cashly') ||
                    tab.url.includes('vercel.app')
                )
            );

            for (const tab of websiteTabs) {
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: (userEmail) => {
                            // Set persistent sync flag
                            localStorage.setItem('cashly_extension_synced', JSON.stringify({
                                synced: true,
                                email: userEmail,
                                timestamp: Date.now()
                            }));
                            // Also set the real-time flags
                            localStorage.setItem('cashly_extension', JSON.stringify({
                                installed: true,
                                version: '5.0.0',
                                timestamp: Date.now()
                            }));
                            localStorage.setItem('cashly_extension_auth', JSON.stringify({
                                loggedIn: true,
                                email: userEmail,
                                timestamp: Date.now()
                            }));
                            console.log('✅ Cashly Extension sync flag injected!');
                            // Dispatch event to notify React
                            window.dispatchEvent(new CustomEvent('cashly-extension-synced', {
                                detail: { email: userEmail }
                            }));
                        },
                        args: [email]
                    });
                    console.log('✅ Injected sync flag into tab:', tab.id);
                } catch (e) {
                    console.log('Could not inject into tab:', tab.id, e.message);
                }
            }
        } catch (error) {
            console.log('Could not inject sync flags:', error.message);
        }
    }

    // ================================
    // LOGOUT HANDLER
    // ================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            console.log('Logout button clicked');
            if (confirm('Sign out from Cashly? 👋')) {
                await chrome.storage.local.remove([
                    'supabaseSession', 'accessToken', 'userId', 'userEmail',
                    'userName', 'syncedFromWebsite', 'lastSync', 'userAvatar'
                ]);
                chrome.runtime.sendMessage({ type: 'USER_LOGGED_OUT' });
                // Reload the popup to show login view
                window.location.reload();
            }
        });
    } else {
        console.error('logoutBtn not found');
    }

    // ================================
    // NAVIGATION BUTTONS
    // ================================

    // Settings button - opens separate settings page
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            console.log('Settings button clicked - opening settings.html');
            chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
        });
    } else {
        console.error('settingsBtn not found');
    }

    addManualBtn.addEventListener('click', () => showView('manual'));
    backFromManual.addEventListener('click', () => showView('main'));

    openDashboardBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: DASHBOARD_URL });
    });

    viewBudgetsBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: BUDGETS_URL });
    });

    refreshBtn.addEventListener('click', async () => {
        refreshBtn.style.animation = 'spin 0.5s ease';
        await Promise.all([
            loadStats(),
            loadRecentTransactions(),
            loadCategories(),
            checkBudgetAlerts()
        ]);
        setTimeout(() => {
            refreshBtn.style.animation = '';
        }, 500);
    });

    // ================================
    // CLIP PAGE
    // ================================

    clipPageBtn.addEventListener('click', async () => {
        const iconSpan = clipPageBtn.querySelector('.act-icon');
        const originalIcon = iconSpan ? iconSpan.innerHTML : '';

        if (iconSpan) iconSpan.textContent = '⏳';
        clipPageBtn.disabled = true;

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PRODUCT' }, async (response) => {
                if (chrome.runtime.lastError) {
                    showActionFeedback(clipPageBtn, '❌');
                    return;
                }

                if (response && response.success) {
                    await saveTransaction({
                        description: `${response.data.storeName} - ${response.data.productName}`,
                        amount: response.data.amount,
                        category: getCategoryFromStore(response.data.storeName),
                        source: 'extension-clip'
                    });
                    showActionFeedback(clipPageBtn, '✅');
                    await loadStats();
                    await loadRecentTransactions();
                } else {
                    showActionFeedback(clipPageBtn, '🚫');
                }
            });
        } catch (error) {
            console.error('Clip error:', error);
            showActionFeedback(clipPageBtn, '❌');
        }
    });

    // ================================
    // MANUAL ADD
    // ================================

    manualForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const description = manualDesc.value.trim();
        const amount = parseFloat(manualAmount.value);
        const category = manualCategory.value;

        if (!description || isNaN(amount) || amount <= 0) {
            alert('Please enter valid description and amount');
            return;
        }

        try {
            await saveTransaction({
                description,
                amount,
                category,
                source: 'extension-manual'
            });

            // Clear form
            manualDesc.value = '';
            manualAmount.value = '';

            // Go back to main view
            showView('main');
            await loadStats();
            await loadRecentTransactions();

        } catch (error) {
            console.error('Manual add error:', error);
            alert('Failed to add expense');
        }
    });

    // ================================
    // SETTINGS HANDLERS
    // ================================

    async function loadSettings() {
        const settings = await chrome.storage.local.get([
            'autoTrack', 'showNotifications', 'budgetAlerts', 'darkMode'
        ]);

        if (autoTrackToggle) autoTrackToggle.checked = settings.autoTrack !== false;
        if (notificationsToggle) notificationsToggle.checked = settings.showNotifications !== false;
        if (budgetAlertsToggle) budgetAlertsToggle.checked = settings.budgetAlerts !== false;

        // Sync with website theme preference
        let isDarkMode = settings.darkMode || false;

        // Try to get theme from website localStorage via content script
        try {
            const [tab] = await chrome.tabs.query({ url: '*://localhost:5173/*' });
            if (tab) {
                const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_THEME_PREFERENCE' });
                if (response && response.theme === 'dark') {
                    isDarkMode = true;
                } else if (response && response.theme === 'light') {
                    isDarkMode = false;
                }
            }
        } catch (e) {
            // Use stored preference
        }

        if (darkModeToggle) {
            darkModeToggle.checked = isDarkMode;
        }

        // Apply theme
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    if (autoTrackToggle) {
        autoTrackToggle.addEventListener('change', () => {
            chrome.storage.local.set({ autoTrack: autoTrackToggle.checked });
        });
    }

    if (notificationsToggle) {
        notificationsToggle.addEventListener('change', () => {
            chrome.storage.local.set({ showNotifications: notificationsToggle.checked });
        });
    }

    if (budgetAlertsToggle) {
        budgetAlertsToggle.addEventListener('change', () => {
            chrome.storage.local.set({ budgetAlerts: budgetAlertsToggle.checked });
        });
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            const isDark = darkModeToggle.checked;
            chrome.storage.local.set({ darkMode: isDark });
            document.body.classList.toggle('dark-mode', isDark);

            // Also try to sync theme to website
            chrome.tabs.query({ url: '*://localhost:5173/*' }).then(tabs => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'SET_THEME_PREFERENCE',
                        theme: isDark ? 'dark' : 'light'
                    }).catch(() => { });
                });
            });
        });
    }

    // ================================
    // DATA FUNCTIONS
    // ================================

    async function saveTransaction(data) {
        const authData = await chrome.storage.local.get(['accessToken', 'userId']);

        if (!authData.accessToken || !authData.userId) {
            throw new Error('Not authenticated');
        }

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
                description: data.description,
                amount: data.amount,
                type: 'expense',
                category: data.category,
                source: data.source || 'extension',
                date: new Date().toISOString().split('T')[0]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save');
        }

        // Show notification
        const settings = await chrome.storage.local.get(['showNotifications']);
        if (settings.showNotifications !== false) {
            chrome.runtime.sendMessage({
                type: 'TRANSACTION_SYNCED',
                data: { store: data.description, amount: data.amount, product: data.category }
            });
        }

        return await response.json();
    }

    async function loadStats() {
        const authData = await chrome.storage.local.get(['accessToken', 'userId']);

        // Handle Site Visits (doesn't require auth)
        try {
            const result = await chrome.storage.local.get('siteVisits');
            const siteVisits = result.siteVisits || {};
            const sitesCount = Object.keys(siteVisits).length;
            if (sitesTrackedEl) sitesTrackedEl.textContent = sitesCount;
        } catch (e) {
            console.log('Sites tracked error:', e);
        }

        // If not logged in, set defaults
        if (!authData.accessToken || !authData.userId) {
            if (monthlySpentEl) monthlySpentEl.textContent = '--';
            if (transactionCountEl) transactionCountEl.textContent = '--';
            if (totalTransactionsEl) totalTransactionsEl.textContent = '--';
            return;
        }

        // Monthly Stats
        try {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${authData.userId}&type=eq.expense&date=gte.${startOfMonth.toISOString().split('T')[0]}&select=amount`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${authData.accessToken}`
                    }
                }
            );
            if (response.ok) {
                const transactions = await response.json();
                const monthlySpent = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
                if (monthlySpentEl) monthlySpentEl.textContent = `Rs ${monthlySpent.toFixed(0)}`;
                if (transactionCountEl) transactionCountEl.textContent = transactions.length;
            }
        } catch (e) {
            console.log('Monthly stats error:', e);
        }

        // All Time Stats
        try {
            const totalResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${authData.userId}&select=id`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${authData.accessToken}`
                    }
                }
            );
            if (totalResponse.ok) {
                const allTx = await totalResponse.json();
                if (totalTransactionsEl) totalTransactionsEl.textContent = allTx.length;
            } else {
                if (totalTransactionsEl) totalTransactionsEl.textContent = '0';
            }
        } catch (e) {
            console.log('All time stats error:', e);
            if (totalTransactionsEl) totalTransactionsEl.textContent = '0';
        }
    }

    async function loadRecentTransactions() {
        try {
            const authData = await chrome.storage.local.get(['accessToken', 'userId']);

            if (!authData.accessToken || !authData.userId) return;

            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${authData.userId}&order=created_at.desc&limit=5`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${authData.accessToken}`
                    }
                }
            );

            if (response.ok) {
                const transactions = await response.json();
                renderTransactions(transactions);
            }
        } catch (error) {
            console.log('Transactions load error:', error);
        }
    }

    async function loadCategories() {
        try {
            const authData = await chrome.storage.local.get(['accessToken', 'userId']);

            if (!authData.accessToken || !authData.userId) return;

            const startOfMonth = new Date();
            startOfMonth.setDate(1);

            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${authData.userId}&type=eq.expense&date=gte.${startOfMonth.toISOString().split('T')[0]}&select=category,amount`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${authData.accessToken}`
                    }
                }
            );

            if (response.ok) {
                const transactions = await response.json();
                const categories = {};
                let total = 0;

                transactions.forEach(t => {
                    const cat = t.category || 'Other';
                    categories[cat] = (categories[cat] || 0) + parseFloat(t.amount);
                    total += parseFloat(t.amount);
                });

                renderCategories(categories, total);
            }
        } catch (error) {
            console.log('Categories load error:', error);
        }
    }

    async function checkBudgetAlerts() {
        try {
            const authData = await chrome.storage.local.get(['accessToken', 'userId']);
            const settings = await chrome.storage.local.get(['budgetAlerts']);

            if (!authData.accessToken || !authData.userId || settings.budgetAlerts === false) {
                budgetAlertEl.style.display = 'none';
                return;
            }

            // Get budgets
            const budgetResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/budgets?user_id=eq.${authData.userId}&select=*`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${authData.accessToken}`
                    }
                }
            );

            if (!budgetResponse.ok) return;

            const budgets = await budgetResponse.json();
            if (budgets.length === 0) {
                budgetAlertEl.style.display = 'none';
                return;
            }

            // Get current month spending
            const startOfMonth = new Date();
            startOfMonth.setDate(1);

            const spendingResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${authData.userId}&type=eq.expense&date=gte.${startOfMonth.toISOString().split('T')[0]}&select=category,amount`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${authData.accessToken}`
                    }
                }
            );

            if (!spendingResponse.ok) return;

            const transactions = await spendingResponse.json();
            const spending = {};
            transactions.forEach(t => {
                const cat = t.category || 'Other';
                spending[cat] = (spending[cat] || 0) + parseFloat(t.amount);
            });

            // Check for alerts
            let alertText = null;
            for (const budget of budgets) {
                const spent = spending[budget.category] || 0;
                const percent = (spent / budget.limit) * 100;

                if (percent >= 90) {
                    alertText = `${budget.category} budget at ${Math.round(percent)}%`;
                    break;
                }
            }

            if (alertText) {
                budgetAlertEl.style.display = 'flex';
                document.getElementById('budgetAlertText').textContent = alertText;
            } else {
                budgetAlertEl.style.display = 'none';
            }

        } catch (error) {
            console.log('Budget check error:', error);
            budgetAlertEl.style.display = 'none';
        }
    }

    // ================================
    // RENDER FUNCTIONS
    // ================================

    function renderTransactions(transactions) {
        if (!recentTransactionsEl) return;

        if (transactions.length === 0) {
            recentTransactionsEl.innerHTML = `
                <div class="empty-state">
                    <span>🦗</span>
                    <p>No transactions yet</p>
                </div>
            `;
            return;
        }

        recentTransactionsEl.innerHTML = transactions.map(tx => `
            <div class="transaction-item">
                <span class="tx-icon">${getCategoryIcon(tx.category)}</span>
                <div class="tx-info">
                    <span class="tx-name">${tx.description?.slice(0, 25) || tx.category}</span>
                    <span class="tx-time">${formatDate(tx.date)}</span>
                </div>
                <span class="tx-amount">-Rs ${parseFloat(tx.amount).toFixed(0)}</span>
            </div>
        `).join('');
    }

    function renderCategories(categories, total) {
        if (!categoriesListEl) return;

        const sortedCats = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (sortedCats.length === 0) {
            categoriesListEl.innerHTML = `
                <div class="category-item">
                    <span class="cat-icon">📊</span>
                    <div class="cat-info">
                        <span class="cat-name">No spending yet</span>
                        <div class="cat-bar"><div class="cat-fill" style="width: 0%;"></div></div>
                    </div>
                    <span class="cat-amount">Rs 0</span>
                </div>
            `;
            return;
        }

        categoriesListEl.innerHTML = sortedCats.map(([cat, amount]) => {
            const percent = total > 0 ? (amount / total) * 100 : 0;
            return `
                <div class="category-item">
                    <span class="cat-icon">${getCategoryIcon(cat)}</span>
                    <div class="cat-info">
                        <span class="cat-name">${cat}</span>
                        <div class="cat-bar">
                            <div class="cat-fill" style="width: ${percent}%;"></div>
                        </div>
                    </div>
                    <span class="cat-amount">Rs ${amount.toFixed(0)}</span>
                </div>
            `;
        }).join('');
    }

    // ================================
    // HELPER FUNCTIONS
    // ================================

    function showError(message) {
        loginError.textContent = message;
        loginError.style.display = 'block';
    }

    function showActionFeedback(button, emoji) {
        const iconSpan = button.querySelector('.action-icon');
        const originalIcon = iconSpan ? iconSpan.textContent : '';

        if (iconSpan) iconSpan.textContent = emoji;
        button.disabled = true;

        setTimeout(() => {
            if (iconSpan) iconSpan.textContent = originalIcon;
            button.disabled = false;
        }, 1500);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }

    function getCategoryIcon(category) {
        const cat = (category || '').toLowerCase();
        if (cat.includes('food') || cat.includes('dining')) return '🍔';
        if (cat.includes('shopping')) return '🛍️';
        if (cat.includes('transport')) return '🚗';
        if (cat.includes('entertainment')) return '🎬';
        if (cat.includes('bills') || cat.includes('utilities')) return '📱';
        if (cat.includes('health')) return '💊';
        if (cat.includes('education')) return '📚';
        return '📦';
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
    // MESSAGE LISTENER
    // ================================

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'TRANSACTION_ADDED') {
            loadStats();
            loadRecentTransactions();
            loadCategories();
        }
        if (message.type === 'SESSION_UPDATED') {
            checkAuthAndShowView();
        }
        // Handle logout from website
        if (message.type === 'WEBSITE_LOGGED_OUT' || message.type === 'USER_LOGGED_OUT') {
            chrome.storage.local.remove([
                'supabaseSession', 'accessToken', 'userId', 'userEmail',
                'userName', 'syncedFromWebsite', 'lastSync', 'userAvatar'
            ]);
            showView('login');
        }
    });
});
