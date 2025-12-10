// Content Script for Website - Handles session sharing between website and extension
// This script runs on the Vibe Tracker website to enable seamless sync

(function () {
    'use strict';

    console.log('💸 Vibe Tracker Extension: Website sync loaded');

    // Set a flag so website knows extension is installed
    const setExtensionFlag = () => {
        try {
            const extensionData = {
                installed: true,
                version: chrome.runtime.getManifest().version,
                timestamp: Date.now()
            };
            localStorage.setItem('vibe_tracker_extension', JSON.stringify(extensionData));

            // Also dispatch a custom event
            window.dispatchEvent(new CustomEvent('vibe-tracker-extension-ready', {
                detail: extensionData
            }));
        } catch (e) {
            console.log('Could not set extension flag:', e);
        }
    };

    setExtensionFlag();

    // Listen for messages from the popup or background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('Website received message:', message.type);

        switch (message.type) {
            case 'GET_SUPABASE_SESSION':
                // Get session from localStorage (where Supabase stores it)
                try {
                    const supabaseKey = Object.keys(localStorage).find(key =>
                        key.startsWith('sb-') && key.endsWith('-auth-token')
                    );

                    if (supabaseKey) {
                        const sessionData = JSON.parse(localStorage.getItem(supabaseKey));
                        sendResponse({
                            success: true,
                            session: sessionData
                        });
                    } else {
                        sendResponse({ success: false, error: 'No session found' });
                    }
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
                break;

            case 'EXTENSION_SYNCED':
                // Extension is now synced - notify the website
                window.dispatchEvent(new CustomEvent('extension-synced', {
                    detail: message.data
                }));

                // Show toast notification if possible
                showSyncToast(message.data?.email);
                sendResponse({ received: true });
                break;

            case 'EXTENSION_LOGGED_OUT':
                window.dispatchEvent(new CustomEvent('extension-logged-out'));
                sendResponse({ received: true });
                break;

            case 'NEW_TRANSACTION':
                // New transaction added via extension
                window.dispatchEvent(new CustomEvent('new-transaction', {
                    detail: message.data
                }));
                sendResponse({ received: true });
                break;

            case 'TRANSACTIONS_SYNCED':
                window.dispatchEvent(new CustomEvent('transactions-synced', {
                    detail: message.data
                }));
                sendResponse({ received: true });
                break;
        }

        return true;
    });

    // Listen for messages from the website (postMessage)
    window.addEventListener('message', async (event) => {
        if (event.source !== window) return;

        const message = event.data;
        if (!message || message.type !== 'WEBSITE_TO_EXTENSION') return;

        console.log('Extension received postMessage:', message.action);

        switch (message.action) {
            case 'SYNC_SESSION':
                // Website is sharing session with extension
                try {
                    await chrome.runtime.sendMessage({
                        type: 'SYNC_SESSION_FROM_WEBSITE',
                        data: message.data
                    });
                    console.log('Session forwarded to extension background');
                } catch (e) {
                    console.log('Could not forward session:', e);
                }
                break;

            case 'LOGOUT':
                try {
                    // Clear extension sync flags
                    localStorage.removeItem('extension_synced');
                    localStorage.removeItem('expense_tracker_session');

                    await chrome.runtime.sendMessage({
                        type: 'USER_LOGGED_OUT'
                    });
                    console.log('🚪 Logout forwarded to extension');
                } catch (e) {
                    console.log('Could not forward logout:', e);
                }
                break;

            case 'CHECK_STATUS':
                // Website checking extension status
                try {
                    const data = await chrome.storage.local.get(['accessToken', 'userEmail']);
                    window.postMessage({
                        type: 'EXTENSION_STATUS',
                        installed: true,
                        loggedIn: !!(data.accessToken && data.userEmail),
                        email: data.userEmail
                    }, '*');
                } catch (e) {
                    console.log('Could not check status:', e);
                }
                break;
        }
    });

    // Watch for auth changes in localStorage (when user logs in/out on website)
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
        originalSetItem.apply(this, arguments);

        // Check if this is a Supabase auth token update
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            try {
                const sessionData = JSON.parse(value);
                if (sessionData && sessionData.access_token && sessionData.user) {
                    console.log('🔄 Detected website login, syncing with extension...');

                    // Notify extension of new session
                    chrome.runtime.sendMessage({
                        type: 'WEBSITE_LOGIN',
                        data: {
                            session: sessionData,
                            user: sessionData.user,
                            accessToken: sessionData.access_token
                        }
                    }).catch(e => console.log('Could not notify extension:', e));
                }
            } catch (e) {
                // Not valid JSON, ignore
            }
        }
    };

    // Watch for localStorage removal (logout)
    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = function (key) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            console.log('🔄 Detected website logout, notifying extension...');
            chrome.runtime.sendMessage({
                type: 'USER_LOGGED_OUT'
            }).catch(e => console.log('Could not notify extension:', e));
        }
        originalRemoveItem.apply(this, arguments);
    };

    // Show a toast notification when extension syncs
    function showSyncToast(email) {
        // Create toast element
        const toast = document.createElement('div');
        toast.id = 'extension-sync-toast';
        toast.innerHTML = `
            <div style="
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 999999;
                font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
                display: flex;
                align-items: center;
                gap: 12px;
                animation: slideIn 0.3s ease-out;
                border: 2px solid rgba(255,255,255,0.2);
            ">
                <span style="font-size: 24px;">🔗</span>
                <div>
                    <div style="font-weight: 700; font-size: 14px;">Extension Synced!</div>
                    <div style="font-size: 12px; opacity: 0.9;">Now auto-tracking your purchases</div>
                </div>
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;

        document.body.appendChild(toast);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Check if website already has a session on load
    setTimeout(() => {
        try {
            const supabaseKey = Object.keys(localStorage).find(key =>
                key.startsWith('sb-') && key.endsWith('-auth-token')
            );

            if (supabaseKey) {
                const sessionData = JSON.parse(localStorage.getItem(supabaseKey));
                if (sessionData && sessionData.access_token && sessionData.user) {
                    // Auto-sync on page load if website is logged in
                    chrome.runtime.sendMessage({
                        type: 'WEBSITE_LOGIN',
                        data: {
                            session: sessionData,
                            user: sessionData.user,
                            accessToken: sessionData.access_token
                        }
                    }).catch(e => console.log('Auto-sync failed:', e));
                }
            } else {
                // No session found - make sure extension is logged out too
                chrome.runtime.sendMessage({
                    type: 'USER_LOGGED_OUT'
                }).catch(e => { });
            }
        } catch (e) {
            // Ignore errors
        }
    }, 1000);

    // SECURITY: Watch for storage changes (handles cross-tab logout)
    window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('sb-') && event.key.endsWith('-auth-token')) {
            if (!event.newValue || event.newValue === 'null') {
                console.log('🚪 Detected logout via storage event');
                chrome.runtime.sendMessage({
                    type: 'USER_LOGGED_OUT'
                }).catch(e => { });
            }
        }
    });

    // SECURITY: Periodically verify session is still valid
    setInterval(() => {
        const supabaseKey = Object.keys(localStorage).find(key =>
            key.startsWith('sb-') && key.endsWith('-auth-token')
        );

        if (!supabaseKey) {
            // No session - ensure extension knows
            chrome.runtime.sendMessage({
                type: 'CHECK_AND_LOGOUT_IF_NEEDED'
            }).catch(e => { });
        }
    }, 30000); // Check every 30 seconds

})();
