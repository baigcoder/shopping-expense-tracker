import { useEffect } from 'react';
import { useAuthStore, useUIStore } from '../store/useStore';
import { supabase, handleGoogleRedirect } from '../config/supabase';
import { setCurrency as setCurrencyService } from '../services/currencyService';

let lastExtensionSyncKey: string | null = null;
let lastExtensionSyncAt = 0;
const EXTENSION_SYNC_COOLDOWN_MS = 60_000;

const notifyExtension = (type: 'LOGIN' | 'LOGOUT', data?: any) => {
    try {
        if (type === 'LOGOUT') {
            lastExtensionSyncKey = null;
            lastExtensionSyncAt = 0;
            localStorage.removeItem('cashly_extension_synced');
            localStorage.removeItem('cashly_extension');
            localStorage.removeItem('cashly_extension_auth');

            window.dispatchEvent(new CustomEvent('extension-logged-out'));
            window.postMessage({
                type: 'WEBSITE_TO_EXTENSION',
                action: 'LOGOUT',
                data: {},
            }, '*');

            console.log('Notified extension of logout');
        }

        if (type === 'LOGIN' && data) {
            const syncKey = `${data.user?.id || ''}:${data.session?.access_token?.slice(-16) || ''}`;
            const now = Date.now();
            if (syncKey && lastExtensionSyncKey === syncKey && now - lastExtensionSyncAt < EXTENSION_SYNC_COOLDOWN_MS) {
                return;
            }
            lastExtensionSyncKey = syncKey;
            lastExtensionSyncAt = now;

            const sendSyncMessage = () => {
                window.postMessage({
                    type: 'WEBSITE_TO_EXTENSION',
                    action: 'SYNC_SESSION',
                    data: {
                        session: data.session,
                        user: data.user,
                        accessToken: data.session?.access_token,
                    },
                }, '*');
            };

            sendSyncMessage();
            setTimeout(sendSyncMessage, 1000);
            setTimeout(sendSyncMessage, 2800);
        }
    } catch (error) {
        console.error('Error notifying extension:', error);
    }
};

export const useAuth = () => {
    const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();
    const { setCurrency, setTheme } = useUIStore();

    useEffect(() => {
        const hydrateUser = (sessionUser: any) => {
            const fallbackUser = {
                id: sessionUser.id,
                email: sessionUser.email!,
                name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
                avatarUrl: sessionUser.user_metadata?.avatar_url,
                currency: 'USD',
                createdAt: sessionUser.created_at || new Date().toISOString(),
            };

            setUser(fallbackUser);

            // Hydrate extra settings asynchronously in background so auth never hangs!
            void (async () => {
                try {
                    const { default: settingsApi } = await import('../services/settingsApi');
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
                    const settings = await Promise.race([settingsApi.get(), timeoutPromise]) as any;
                    if (!settings) return;

                    const currency = settings.preferences?.currency || settings.profile?.currency || fallbackUser.currency;
                    const theme = settings.preferences?.theme || 'light';

                    const profile = settings.profile as any;
                    setUser({
                        ...fallbackUser,
                        name: profile?.name || fallbackUser.name,
                        avatarUrl: profile?.avatarUrl || profile?.avatar_url || fallbackUser.avatarUrl,
                        currency,
                        createdAt: profile?.createdAt || fallbackUser.createdAt,
                    });
                    setCurrency(currency);
                    setCurrencyService(currency);
                    setTheme(theme);
                    document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch (error) {
                    console.warn('Settings hydration skipped:', error instanceof Error ? error.message : error);
                }
            })();
        };

        const checkSession = async () => {
            try {
                // Check for OAuth redirect result first (handles popup-blocked fallback)
                const redirectResult = await handleGoogleRedirect();
                if (redirectResult?.user) {
                    hydrateUser(redirectResult.user);
                    notifyExtension('LOGIN', {
                        session: redirectResult.session,
                        user: redirectResult.user,
                    });
                    setLoading(false);
                    return;
                }

                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Session check error:', error);
                    setUser(null);
                    setLoading(false);
                    return;
                }

                if (session?.user) {
                    hydrateUser(session.user);
                    notifyExtension('LOGIN', { session, user: session.user });
                } else if (typeof window !== 'undefined' && localStorage.getItem('cashly_demo_session') === 'true') {
                    const demoUser = {
                        id: 'usr_demo_777',
                        email: 'baigo@cashly.ai',
                        user_metadata: { full_name: 'Baigo Sovereign', name: 'Baigo Sovereign' },
                        created_at: '2026-01-01T00:00:00.000Z'
                    };
                    hydrateUser(demoUser);
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

        // Safety watchdog: Never leave auth in loading state for more than 3 seconds
        const watchdog = setTimeout(() => {
            setLoading(false);
        }, 3000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth State Change:', event);

            if (event === 'SIGNED_IN' && session?.user) {
                await hydrateUser(session.user);
                notifyExtension('LOGIN', { session, user: session.user });
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                notifyExtension('LOGOUT');
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(watchdog);
        };
    }, [setUser, setLoading, setCurrency, setTheme]);

    return {
        user,
        isAuthenticated,
        isLoading,
    };
};
