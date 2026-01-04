
// Custom Hook to manage Authentication with Extension Sync
import { useEffect } from 'react';
import { useAuthStore } from '../store/useStore';
import { supabase } from '../config/supabase';

// Notify extension of auth state changes with retry for page load reliability
const notifyExtension = (type: 'LOGIN' | 'LOGOUT', data?: any) => {
    try {
        // Clear persistent sync flag on logout
        if (type === 'LOGOUT') {
            localStorage.removeItem('cashly_extension_synced');
            localStorage.removeItem('cashly_extension');
            localStorage.removeItem('cashly_extension_auth');

            // Dispatch event for extension to catch
            window.dispatchEvent(new CustomEvent('extension-logged-out'));

            // Send message to extension via postMessage
            window.postMessage({
                type: 'WEBSITE_TO_EXTENSION',
                action: 'LOGOUT',
                data: {}
            }, '*');

            console.log('🔓 Notified extension of logout');
        }

        // Notify extension of login with retry mechanism
        if (type === 'LOGIN' && data) {
            const sendSyncMessage = () => {
                window.postMessage({
                    type: 'WEBSITE_TO_EXTENSION',
                    action: 'SYNC_SESSION',
                    data: {
                        session: data.session,
                        user: data.user,
                        accessToken: data.session?.access_token
                    }
                }, '*');
            };

            // Send immediately
            sendSyncMessage();
            console.log('🔐 Notified extension of login (attempt 1)');

            // Retry after 500ms - extension content script may not be ready yet
            setTimeout(() => {
                sendSyncMessage();
                console.log('🔐 Notified extension of login (attempt 2)');
            }, 500);

            // Retry after 1.5s - final attempt
            setTimeout(() => {
                sendSyncMessage();
                console.log('🔐 Notified extension of login (attempt 3)');
            }, 1500);

            // Retry after 3s - catch slow loads
            setTimeout(() => {
                sendSyncMessage();
                console.log('🔐 Notified extension of login (attempt 4 - final)');
            }, 3000);
        }
    } catch (error) {
        console.error('Error notifying extension:', error);
    }
};


export const useAuth = () => {
    const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

    useEffect(() => {
        // Initial Session Check
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Session check error:', error);
                    // If error (e.g. refresh token missing), clear session but don't error out app
                    setUser(null);
                    setLoading(false);
                    return;
                }

                if (session?.user) {
                    setUser({
                        id: session.user.id,
                        email: session.user.email!,
                        name: session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
                        avatarUrl: session.user.user_metadata.avatar_url,
                        currency: 'USD',
                        createdAt: session.user.created_at || new Date().toISOString()
                    });

                    // Sync with extension on page load if logged in
                    notifyExtension('LOGIN', { session, user: session.user });
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Auth State Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth State Change:', event);

            if (event === 'SIGNED_IN' && session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email!,
                    name: session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
                    avatarUrl: session.user.user_metadata.avatar_url,
                    currency: 'USD',
                    createdAt: session.user.created_at || new Date().toISOString()
                });

                // Sync login with extension
                notifyExtension('LOGIN', { session, user: session.user });

            } else if (event === 'SIGNED_OUT') {
                setUser(null);

                // Sync logout with extension
                notifyExtension('LOGOUT');
            }
        });

        // Cross-tab auth sync via storage events
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key?.startsWith('sb-') && e.key?.endsWith('-auth-token')) {
                // Auth token changed in another tab, check session
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session?.user) {
                        setUser({
                            id: session.user.id,
                            email: session.user.email!,
                            name: session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
                            avatarUrl: session.user.user_metadata.avatar_url,
                            currency: 'USD',
                            createdAt: session.user.created_at || new Date().toISOString()
                        });
                    } else {
                        setUser(null);
                    }
                });
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [setUser, setLoading]);

    return {
        user,
        isAuthenticated,
        isLoading
    };
};
