// Content Script for Website - Handles session sharing between website and extension
// This script runs on the expense tracker website to enable seamless sync

(function () {
    'use strict';

    console.log('💰 Expense Tracker Extension: Website content script loaded');

    // Set a flag so website knows extension is installed
    const setExtensionFlag = () => {
        try {
            const extensionData = {
                installed: true,
                version: chrome.runtime.getManifest().version,
                timestamp: Date.now()
            };
            localStorage.setItem('expense_tracker_extension', JSON.stringify(extensionData));

            // Also dispatch a custom event
            window.dispatchEvent(new CustomEvent('expense-tracker-extension-ready', {
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
                    await chrome.runtime.sendMessage({
                        type: 'USER_LOGGED_OUT'
                    });
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

    // Toast removed to prevent duplication with frontend toast
    function showSyncToast(email) {
        // No-op
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
            }
        } catch (e) {
            // Ignore errors
        }
    }, 1000);

})();
