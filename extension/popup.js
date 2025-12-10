// Enhanced Extension Popup Script - Full Feature Support
document.addEventListener('DOMContentLoaded', async () => {
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
    const userEmailEl = document.getElementById('userEmail');
    const syncStatusEl = document.getElementById('syncStatus');
    const monthlySpentEl = document.getElementById('monthlySpent');
    const transactionCountEl = document.getElementById('transactionCount');
    const recentTransactionsEl = document.getElementById('recentTransactions');
    const categoriesListEl = document.getElementById('categoriesList');
    const budgetAlertEl = document.getElementById('budgetAlert');

    // Action buttons
    const clipPageBtn = document.getElementById('clipPageBtn');
    const addManualBtn = document.getElementById('addManualBtn');
    const openDashboardBtn = document.getElementById('openDashboard');
    const viewProtectionBtn = document.getElementById('viewProtection');
    const refreshBtn = document.getElementById('refreshBtn');

    // Shield stats elements
    const patternsBlockedEl = document.getElementById('patternsBlocked');
    const moneySavedEl = document.getElementById('moneySaved');

    // Settings elements
    const backFromSettings = document.getElementById('backFromSettings');
    const autoTrackToggle = document.getElementById('autoTrackToggle');
    const notificationsToggle = document.getElementById('notificationsToggle');
    const budgetAlertsToggle = document.getElementById('budgetAlertsToggle');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkPatternToggle = document.getElementById('darkPatternToggle');
    const trialRemindersToggle = document.getElementById('trialRemindersToggle');

    // Manual add elements
    const backFromManual = document.getElementById('backFromManual');
    const manualForm = document.getElementById('manualForm');
    const manualDesc = document.getElementById('manualDesc');
    const manualAmount = document.getElementById('manualAmount');
    const manualCategory = document.getElementById('manualCategory');

    // ================================
    // CONFIGURATION
    // ================================
    const SUPABASE_URL = 'https://ebfolvhqjvavrwrfcbhn.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZm9sdmhxanZhdnJ3cmZjYmhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NjI0NDgsImV4cCI6MjA0OTIzODQ0OH0.RC7d0vMx1F4Z2J2Ovl9m2hZV8HCmZ2f6pBWSN-GJ3O0';
    const WEBSITE_URL = 'https://vibe-tracker-expense-genz.vercel.app';
    const DASHBOARD_URL = `${WEBSITE_URL}/dashboard`;
    const PROTECTION_URL = `${WEBSITE_URL}/protection`;

    // ================================
    // INITIALIZATION
    // ================================

    // Load settings
    await loadSettings();

    // Check auth and show appropriate view
    await checkAuthAndShowView();

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

        const authData = await chrome.storage.local.get(['accessToken', 'userEmail', 'userId', 'syncedFromWebsite']);

        if (authData.accessToken && authData.userEmail) {
            showView('main');
            userEmailEl.textContent = authData.userEmail;

            if (authData.syncedFromWebsite) {
                syncStatusEl.innerHTML = '<span class="sync-dot"></span> Synced with Website';
            } else {
                syncStatusEl.innerHTML = '<span class="sync-dot"></span> Live Sync Active';
            }

            // Load all data
            await Promise.all([
                loadStats(),
                loadRecentTransactions(),
                loadCategories(),
                checkBudgetAlerts(),
                loadShieldStats()
            ]);
        } else {
            showView('login');
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

            await checkAuthAndShowView();

        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'Login failed. Check your credentials.');
        } finally {
            loginBtn.textContent = 'Sign In →';
            loginBtn.disabled = false;
        }
    });

    // ================================
    // LOGOUT HANDLER
    // ================================

    logoutBtn.addEventListener('click', async () => {
        if (confirm('Sign out from Vibe Tracker? 👋')) {
            await chrome.storage.local.remove([
                'supabaseSession', 'accessToken', 'userId', 'userEmail',
                'userName', 'syncedFromWebsite', 'lastSync'
            ]);
            chrome.runtime.sendMessage({ type: 'USER_LOGGED_OUT' });
            showView('login');
        }
    });

    // ================================
    // NAVIGATION BUTTONS
    // ================================

    settingsBtn.addEventListener('click', () => showView('settings'));
    backFromSettings.addEventListener('click', () => showView('main'));

    addManualBtn.addEventListener('click', () => showView('manual'));
    backFromManual.addEventListener('click', () => showView('main'));

    openDashboardBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: DASHBOARD_URL });
    });

    if (viewProtectionBtn) {
        viewProtectionBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: PROTECTION_URL });
        });
    }

    refreshBtn.addEventListener('click', async () => {
        refreshBtn.style.animation = 'spin 0.5s ease';
        await Promise.all([
            loadStats(),
            loadRecentTransactions(),
            loadCategories(),
            checkBudgetAlerts(),
            loadShieldStats()
        ]);
        setTimeout(() => {
            refreshBtn.style.animation = '';
        }, 500);
    });

    // ================================
    // CLIP PAGE
    // ================================

    clipPageBtn.addEventListener('click', async () => {
        const iconSpan = clipPageBtn.querySelector('.action-icon');
        const originalIcon = iconSpan ? iconSpan.textContent : '📌';

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
        if (darkModeToggle) {
            darkModeToggle.checked = settings.darkMode || false;
            if (settings.darkMode) document.body.classList.add('dark-mode');
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
            chrome.storage.local.set({ darkMode: darkModeToggle.checked });
            document.body.classList.toggle('dark-mode', darkModeToggle.checked);
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
        try {
            const authData = await chrome.storage.local.get(['accessToken', 'userId']);

            if (authData.accessToken && authData.userId) {
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
                    monthlySpentEl.textContent = `Rs ${monthlySpent.toFixed(0)}`;
                    transactionCountEl.textContent = transactions.length;
                }
            }
        } catch (error) {
            console.log('Stats load error:', error);
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
    // DARK PATTERN SHIELD STATS
    // ================================

    async function loadShieldStats() {
        try {
            const stats = await chrome.storage.local.get(['vt_dark_pattern_stats']);
            const data = stats.vt_dark_pattern_stats || { totalBlocked: 0, totalSaved: 0 };

            if (patternsBlockedEl) {
                patternsBlockedEl.textContent = data.totalBlocked || 0;
            }
            if (moneySavedEl) {
                const saved = data.totalSaved || 0;
                moneySavedEl.textContent = saved >= 1000
                    ? `Rs ${(saved / 1000).toFixed(1)}K`
                    : `Rs ${saved.toFixed(0)}`;
            }
        } catch (error) {
            console.log('Shield stats load error:', error);
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
        // SECURITY: Force logout when website logs out
        if (message.type === 'USER_LOGGED_OUT') {
            console.log('🚪 Received logout signal - showing login view');
            showView('login');
        }
    });
});
