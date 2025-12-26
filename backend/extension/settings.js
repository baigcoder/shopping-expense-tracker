// Cashly Extension Settings Script
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Settings script initialized');

    // DOM Elements
    const backBtn = document.getElementById('backBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userEmailEl = document.getElementById('userEmail');
    const autoTrackToggle = document.getElementById('autoTrackToggle');
    const smartDetectionToggle = document.getElementById('smartDetectionToggle');
    const notificationsToggle = document.getElementById('notificationsToggle');
    const budgetAlertsToggle = document.getElementById('budgetAlertsToggle');

    // Load user info
    const authData = await chrome.storage.local.get(['userEmail']);
    if (userEmailEl && authData.userEmail) {
        userEmailEl.textContent = authData.userEmail;
    }

    // Load settings
    const settings = await chrome.storage.local.get([
        'autoTrack', 'smartDetection', 'notifications', 'budgetAlerts'
    ]);

    if (autoTrackToggle) autoTrackToggle.checked = settings.autoTrack !== false;
    if (smartDetectionToggle) smartDetectionToggle.checked = settings.smartDetection !== false;
    if (notificationsToggle) notificationsToggle.checked = settings.notifications !== false;
    if (budgetAlertsToggle) budgetAlertsToggle.checked = settings.budgetAlerts !== false;

    // Back button - go back to popup
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.close();
        });
    }

    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Sign out from Cashly? 👋')) {
                await chrome.storage.local.remove([
                    'supabaseSession', 'accessToken', 'userId', 'userEmail',
                    'userName', 'syncedFromWebsite', 'lastSync', 'userAvatar'
                ]);
                chrome.runtime.sendMessage({ type: 'USER_LOGGED_OUT' });
                window.close();
            }
        });
    }

    // Save settings on toggle change
    const saveSettings = async () => {
        await chrome.storage.local.set({
            autoTrack: autoTrackToggle?.checked ?? true,
            smartDetection: smartDetectionToggle?.checked ?? true,
            notifications: notificationsToggle?.checked ?? true,
            budgetAlerts: budgetAlertsToggle?.checked ?? true
        });
        console.log('Settings saved');
    };

    autoTrackToggle?.addEventListener('change', saveSettings);
    smartDetectionToggle?.addEventListener('change', saveSettings);
    notificationsToggle?.addEventListener('change', saveSettings);
    budgetAlertsToggle?.addEventListener('change', saveSettings);
});
