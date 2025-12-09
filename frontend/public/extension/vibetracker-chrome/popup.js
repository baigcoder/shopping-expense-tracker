// Enhanced Extension Popup Script with Login & Live Sync
document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const loginView = document.getElementById('loginView');
    const mainView = document.getElementById('mainView');
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const userEmailEl = document.getElementById('userEmail');
    const statusBadge = document.getElementById('statusBadge');
    const clipPageBtn = document.getElementById('clipPageBtn');
    const openDashboardBtn = document.getElementById('openDashboard');
    const monthlySpentEl = document.getElementById('monthlySpent');
    const transactionCountEl = document.getElementById('transactionCount');
    const recentTransactionsEl = document.getElementById('recentTransactions');

    // ================================
    // CONFIGURATION - CHANGE FOR PRODUCTION
    // ================================
    // For development: use localhost
    // For production: change to your deployed backend URL
    // Example: 'https://your-backend.vercel.app/api'
    const API_BASE = 'http://localhost:3001/api';

    // Dashboard URL - change this to your deployed frontend
    // Example: 'https://vibetracker.vercel.app/dashboard'
    const DASHBOARD_URL = 'http://localhost:5173/dashboard';

    // Check auth status on load
    await checkAuthAndShowView();

    // ===== LOGIN FUNCTIONALITY =====
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError('Please enter email and password');
            return;
        }

        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;
        loginError.style.display = 'none';

        try {
            // Call backend login API
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Login failed');
            }

            // Save auth data to chrome storage
            await chrome.storage.local.set({
                authToken: data.data.token,
                userId: data.data.user.id,
                userEmail: data.data.user.email,
                userName: data.data.user.name
            });

            // Show main view
            await checkAuthAndShowView();

            // Notify background script of login
            chrome.runtime.sendMessage({ type: 'USER_LOGGED_IN', data: { email } });

        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'Login failed. Check your credentials.');
        } finally {
            loginBtn.textContent = 'Login 🚀';
            loginBtn.disabled = false;
        }
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        if (confirm('Logout from Vibe Tracker?')) {
            await chrome.storage.local.remove([
                'authToken', 'userId', 'userEmail', 'userName'
            ]);
            chrome.runtime.sendMessage({ type: 'USER_LOGGED_OUT' });
            await checkAuthAndShowView();
        }
    });

    // ===== MAIN FUNCTIONALITY =====

    // Open Dashboard
    openDashboardBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: DASHBOARD_URL });
    });

    // Clip Current Page
    clipPageBtn.addEventListener('click', async () => {
        clipPageBtn.textContent = 'Clipping... ⏳';
        clipPageBtn.disabled = true;

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PRODUCT' }, async (response) => {
                if (chrome.runtime.lastError) {
                    clipPageBtn.textContent = 'Error - Reload page';
                    setTimeout(() => {
                        clipPageBtn.textContent = 'Clip Page 📌';
                        clipPageBtn.disabled = false;
                    }, 2000);
                    return;
                }

                if (response && response.success) {
                    // Save and sync the transaction
                    await saveAndSyncTransaction(response.data);
                    clipPageBtn.textContent = 'Clipped! ✅';

                    setTimeout(async () => {
                        await loadRecentTransactions();
                        await loadStats();
                        clipPageBtn.textContent = 'Clip Page 📌';
                        clipPageBtn.disabled = false;
                    }, 1000);
                } else {
                    clipPageBtn.textContent = 'No product found 😅';
                    setTimeout(() => {
                        clipPageBtn.textContent = 'Clip Page 📌';
                        clipPageBtn.disabled = false;
                    }, 2000);
                }
            });
        } catch (error) {
            console.error('Clip error:', error);
            clipPageBtn.textContent = 'Error 😬';
            setTimeout(() => {
                clipPageBtn.textContent = 'Clip Page 📌';
                clipPageBtn.disabled = false;
            }, 2000);
        }
    });

    // ===== HELPER FUNCTIONS =====

    async function checkAuthAndShowView() {
        const authData = await chrome.storage.local.get(['authToken', 'userEmail']);

        if (authData.authToken && authData.userEmail) {
            // Show main view
            loginView.style.display = 'none';
            mainView.style.display = 'block';
            userEmailEl.textContent = authData.userEmail;
            statusBadge.textContent = 'SYNCED 🔗';
            statusBadge.style.background = '#D1FAE5';

            // Load data
            await loadStats();
            await loadRecentTransactions();
        } else {
            // Show login view
            loginView.style.display = 'block';
            mainView.style.display = 'none';
        }
    }

    function showError(message) {
        loginError.textContent = message;
        loginError.style.display = 'block';
    }

    async function saveAndSyncTransaction(data) {
        try {
            const authData = await chrome.storage.local.get(['authToken', 'userId', 'userEmail']);

            const transaction = {
                id: Date.now().toString(),
                store: data.storeName || 'Unknown Store',
                product: data.productName || 'Unknown Product',
                amount: data.amount || 0,
                icon: getCategoryIcon(data.storeName),
                storeUrl: data.storeUrl || '',
                date: new Date().toISOString(),
                synced: false
            };

            // Get existing data
            const storage = await chrome.storage.local.get(['recentTransactions', 'monthlySpent', 'transactionCount']);
            const transactions = storage.recentTransactions || [];
            const currentSpent = storage.monthlySpent || 0;
            const currentCount = storage.transactionCount || 0;

            // Add new transaction
            transactions.unshift(transaction);

            // Update local storage first
            await chrome.storage.local.set({
                recentTransactions: transactions.slice(0, 100),
                monthlySpent: currentSpent + transaction.amount,
                transactionCount: currentCount + 1
            });

            // SYNC TO BACKEND API if logged in
            if (authData.authToken) {
                try {
                    statusBadge.textContent = 'SYNCING...';

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
                        statusBadge.textContent = 'SYNCED ✓';

                        // Notify background to send push notification
                        chrome.runtime.sendMessage({
                            type: 'TRANSACTION_SYNCED',
                            data: transaction
                        });
                    } else {
                        statusBadge.textContent = 'SYNC FAILED';
                        console.error('Sync failed:', result.message);
                    }
                } catch (syncError) {
                    console.error('Sync error:', syncError);
                    statusBadge.textContent = 'OFFLINE 📴';
                }

                // Reset status after delay
                setTimeout(() => {
                    statusBadge.textContent = 'SYNCED 🔗';
                }, 2000);
            }

            return transaction;
        } catch (error) {
            console.error('Save error:', error);
            throw error;
        }
    }

    async function loadStats() {
        try {
            const authData = await chrome.storage.local.get(['authToken']);

            // Try to fetch from API first if logged in
            if (authData.authToken) {
                try {
                    const response = await fetch(`${API_BASE}/transactions/stats`, {
                        headers: {
                            'Authorization': `Bearer ${authData.authToken}`
                        }
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            monthlySpentEl.textContent = `$${(result.data.monthlySpent || 0).toFixed(2)}`;
                            transactionCountEl.textContent = result.data.transactionCount || 0;
                            return;
                        }
                    }
                } catch (apiError) {
                    console.log('API fetch failed, using local data');
                }
            }

            // Fallback to local storage
            const result = await chrome.storage.local.get(['monthlySpent', 'transactionCount']);
            monthlySpentEl.textContent = `$${(result.monthlySpent || 0).toFixed(2)}`;
            transactionCountEl.textContent = result.transactionCount || 0;
        } catch (error) {
            console.log('Stats load error:', error);
        }
    }

    async function loadRecentTransactions() {
        try {
            const authData = await chrome.storage.local.get(['authToken']);
            let transactions = [];

            // Try API first if logged in
            if (authData.authToken) {
                try {
                    const response = await fetch(`${API_BASE}/transactions/recent?limit=5`, {
                        headers: {
                            'Authorization': `Bearer ${authData.authToken}`
                        }
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            transactions = result.data.map(t => ({
                                id: t.id,
                                store: t.storeName,
                                product: t.productName,
                                amount: parseFloat(t.amount),
                                icon: getCategoryIcon(t.storeName),
                                date: t.purchaseDate,
                                synced: true
                            }));
                        }
                    }
                } catch (apiError) {
                    console.log('API fetch failed, using local');
                }
            }

            // Fallback or merge with local
            if (transactions.length === 0) {
                const result = await chrome.storage.local.get(['recentTransactions']);
                transactions = result.recentTransactions || [];
            }

            renderTransactions(transactions.slice(0, 5));
        } catch (error) {
            console.log('Transactions load error:', error);
        }
    }

    function renderTransactions(transactions) {
        if (transactions.length === 0) {
            recentTransactionsEl.innerHTML = '<div class="empty-state">No vibes yet 🦗</div>';
            return;
        }

        recentTransactionsEl.innerHTML = '';
        transactions.forEach((tx, index) => {
            const html = `
                <div class="transaction-item ${index === 0 && tx.synced ? 'new' : ''}">
                    <div class="t-icon">${tx.icon || '🛍️'}</div>
                    <div class="t-details">
                        <span class="t-store">${tx.store}</span>
                        <span class="t-product">${tx.product}</span>
                    </div>
                    <span class="t-amount">-$${(tx.amount || 0).toFixed(2)}</span>
                </div>
            `;
            recentTransactionsEl.insertAdjacentHTML('beforeend', html);
        });
    }

    function getCategoryIcon(storeName) {
        const store = (storeName || '').toLowerCase();
        if (store.includes('amazon')) return '📦';
        if (store.includes('netflix') || store.includes('hulu') || store.includes('disney')) return '📺';
        if (store.includes('spotify') || store.includes('apple music')) return '🎵';
        if (store.includes('uber') || store.includes('doordash') || store.includes('grubhub')) return '🍔';
        if (store.includes('nike') || store.includes('adidas') || store.includes('zara')) return '👕';
        if (store.includes('apple') || store.includes('best buy')) return '📱';
        if (store.includes('walmart') || store.includes('target')) return '🛒';
        if (store.includes('starbucks') || store.includes('coffee')) return '☕';
        return '🛍️';
    }

    // Listen for updates from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'TRANSACTION_ADDED') {
            loadStats();
            loadRecentTransactions();
        }
    });
});
