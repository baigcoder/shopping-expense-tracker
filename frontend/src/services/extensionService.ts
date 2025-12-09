// Extension Detection & Sync Service
// Handles communication between website and browser extension

// Your extension ID - this needs to be updated after loading the extension in Chrome
// You can find it at chrome://extensions when developer mode is enabled
const EXTENSION_ID = 'YOUR_EXTENSION_ID_HERE'; // Update this after installing extension

interface ExtensionStatus {
    installed: boolean;
    version?: string;
    loggedIn?: boolean;
    userEmail?: string | null;
    lastSync?: number | null;
    error?: string;
}

interface ExtensionMessage {
    type: string;
    data?: any;
    source?: string;
}

type ExtensionCallback = (message: ExtensionMessage) => void;

class ExtensionService {
    private extensionId: string;
    private listeners: ExtensionCallback[] = [];
    private isExtensionInstalled: boolean = false;
    private lastStatus: ExtensionStatus | null = null;

    constructor() {
        this.extensionId = EXTENSION_ID;
        this.setupMessageListener();
    }

    // Setup listener for messages from extension
    private setupMessageListener() {
        if (typeof window !== 'undefined') {
            window.addEventListener('message', (event) => {
                // Only accept messages from our window
                if (event.source !== window) return;

                const message = event.data;
                if (message && message.source === 'extension') {
                    this.handleExtensionMessage(message);
                }
            });
        }
    }

    // Handle incoming messages from extension
    private handleExtensionMessage(message: ExtensionMessage) {
        console.log('📨 Message from extension:', message.type);

        // Notify all registered listeners
        this.listeners.forEach(callback => {
            try {
                callback(message);
            } catch (error) {
                console.error('Extension listener error:', error);
            }
        });
    }

    // Register a listener for extension messages
    onMessage(callback: ExtensionCallback): () => void {
        this.listeners.push(callback);
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    // Check if extension is installed (via content script injection check)
    async checkExtension(): Promise<ExtensionStatus> {
        try {
            // Method 1: Try using chrome.runtime.sendMessage if available
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        resolve({ installed: false });
                    }, 1000);

                    try {
                        chrome.runtime.sendMessage(
                            this.extensionId,
                            { type: 'GET_EXTENSION_STATUS' },
                            (response: any) => {
                                clearTimeout(timeout);
                                if (chrome.runtime.lastError) {
                                    resolve({ installed: false });
                                } else if (response) {
                                    this.isExtensionInstalled = true;
                                    this.lastStatus = response;
                                    resolve(response);
                                } else {
                                    resolve({ installed: false });
                                }
                            }
                        );
                    } catch {
                        clearTimeout(timeout);
                        resolve({ installed: false });
                    }
                });
            }

            // Method 2: Check via localStorage flag set by content script
            const extensionFlag = localStorage.getItem('expense_tracker_extension');
            if (extensionFlag) {
                const data = JSON.parse(extensionFlag);
                this.isExtensionInstalled = true;
                return {
                    installed: true,
                    version: data.version,
                    loggedIn: data.loggedIn,
                    userEmail: data.email
                };
            }

            return { installed: false };
        } catch (error) {
            console.log('Extension check error:', error);
            return { installed: false };
        }
    }

    // Send session to extension when user logs in on website
    async syncSessionToExtension(session: any, user: any): Promise<boolean> {
        try {
            // Method 1: Via chrome.runtime.sendMessage
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => resolve(false), 2000);

                    try {
                        chrome.runtime.sendMessage(
                            this.extensionId,
                            {
                                type: 'SYNC_SESSION',
                                data: { session, user }
                            },
                            (response: any) => {
                                clearTimeout(timeout);
                                if (chrome.runtime.lastError) {
                                    console.log('Extension sync failed:', chrome.runtime.lastError);
                                    resolve(false);
                                } else {
                                    resolve(response?.success || false);
                                }
                            }
                        );
                    } catch {
                        clearTimeout(timeout);
                        resolve(false);
                    }
                });
            }

            // Method 2: Via window.postMessage (for content script)
            window.postMessage({
                type: 'WEBSITE_TO_EXTENSION',
                action: 'SYNC_SESSION',
                data: { session, user }
            }, '*');

            return true;
        } catch (error) {
            console.error('Session sync error:', error);
            return false;
        }
    }

    // Notify extension when user logs in
    async notifyLogin(session: any, user: any): Promise<boolean> {
        try {
            const synced = await this.syncSessionToExtension(session, user);

            if (synced) {
                console.log('✅ Extension synced with website login');
            }

            // Also store in localStorage for content script detection
            localStorage.setItem('expense_tracker_session', JSON.stringify({
                email: user.email,
                userId: user.id,
                accessToken: session.access_token,
                timestamp: Date.now()
            }));

            return synced;
        } catch (error) {
            console.error('Login notification error:', error);
            return false;
        }
    }

    // Notify extension when user logs out
    async notifyLogout(): Promise<void> {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage(
                    this.extensionId,
                    { type: 'WEBSITE_USER_LOGGED_OUT' }
                );
            }

            // Clear localStorage
            localStorage.removeItem('expense_tracker_session');
            localStorage.removeItem('expense_tracker_extension');

            window.postMessage({
                type: 'WEBSITE_TO_EXTENSION',
                action: 'LOGOUT'
            }, '*');
        } catch (error) {
            console.log('Logout notification error:', error);
        }
    }

    // Get cached extension status
    getStatus(): ExtensionStatus | null {
        return this.lastStatus;
    }

    // Check if extension is installed (cached)
    isInstalled(): boolean {
        return this.isExtensionInstalled;
    }
}

// Singleton instance
export const extensionService = new ExtensionService();

// Import React hooks at runtime
import { useState, useEffect } from 'react';

// Hook for React components to detect extension
export function useExtensionDetection() {
    const [status, setStatus] = useState<ExtensionStatus>({ installed: false });
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkExtension = async () => {
            setChecking(true);
            const result = await extensionService.checkExtension();
            setStatus(result);
            setChecking(false);
        };

        checkExtension();

        // Check again after a short delay (extension might load after page)
        const timer = setTimeout(checkExtension, 2000);

        // Listen for extension messages
        const unsubscribe = extensionService.onMessage((message) => {
            if (message.type === 'EXTENSION_SYNCED') {
                setStatus(prev => ({
                    ...prev,
                    installed: true,
                    loggedIn: true,
                    userEmail: message.data?.email
                }));
            }
            if (message.type === 'EXTENSION_LOGGED_OUT') {
                setStatus(prev => ({
                    ...prev,
                    loggedIn: false,
                    userEmail: null
                }));
            }
        });

        return () => {
            clearTimeout(timer);
            unsubscribe();
        };
    }, []);

    return { status, checking };
}
