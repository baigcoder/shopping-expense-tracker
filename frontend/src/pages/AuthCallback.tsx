import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';
import { supabase } from '../config/supabase';
import { CashlyLoader } from '../components/brand/CashlyLoader';

export const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setUser, setLoading } = useAuthStore();
    const handledRef = useRef(false);
    const [takingLong, setTakingLong] = useState(false);

    const hydrateFromSession = useCallback((session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>) => {
        setUser({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            avatarUrl: session.user.user_metadata?.avatar_url,
            currency: 'USD',
            createdAt: new Date().toISOString(),
        });
    }, [setUser]);

    useEffect(() => {
        const longTimer = setTimeout(() => {
            setTakingLong(true);
        }, 3500);

        const watchdog = setTimeout(async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    hydrateFromSession(session);
                    navigate('/dashboard', { replace: true });
                    return;
                }
            } catch {
                // Ignore
            }
            navigate('/login', {
                replace: true,
                state: { authError: 'Authentication connection timed out. Please try signing in again.' },
            });
        }, 7000);

        return () => {
            clearTimeout(longTimer);
            clearTimeout(watchdog);
        };
    }, [navigate, hydrateFromSession]);

    useEffect(() => {
        if (handledRef.current) return;
        handledRef.current = true;

        const handleAuthCallback = async () => {
            try {
                const hashParams = new URLSearchParams(location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');
                const searchParams = new URLSearchParams(location.search);
                const code = searchParams.get('code');
                const next = searchParams.get('next');

                const oauthError =
                    searchParams.get('error_description')
                    || searchParams.get('error')
                    || hashParams.get('error_description')
                    || hashParams.get('error');

                if (oauthError) {
                    throw new Error(decodeURIComponent(oauthError.replace(/\+/g, ' ')));
                }

                const navigateAfterAuth = (fallback = '/dashboard') => {
                    const target = next && next.startsWith('/') && !next.startsWith('//')
                        ? next
                        : fallback;
                    navigate(target, { replace: true });
                };

                // PKCE OAuth — exchange once (React StrictMode safe: reuse existing session)
                if (code) {
                    const { data: { session: existingSession } } = await supabase.auth.getSession();
                    if (existingSession?.user) {
                        hydrateFromSession(existingSession);
                        navigateAfterAuth();
                        return;
                    }

                    try {
                        const exchangePromise = supabase.auth.exchangeCodeForSession(code);
                        const timeoutPromise = new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('PKCE exchange timeout')), 5500)
                        );

                        const { data: { session }, error } = await Promise.race([exchangePromise, timeoutPromise]);
                        if (error) throw error;

                        if (session?.user) {
                            hydrateFromSession(session);
                            navigateAfterAuth();
                            return;
                        }
                    } catch (codeErr) {
                        // Resilient fallback: Check if session was already established
                        const { data: { session: fallbackSession } } = await supabase.auth.getSession();
                        if (fallbackSession?.user) {
                            hydrateFromSession(fallbackSession);
                            navigateAfterAuth();
                            return;
                        }
                        throw codeErr;
                    }
                }

                // Hash tokens (email confirmation / legacy implicit OAuth)
                if (accessToken && refreshToken) {
                    const { data: { session }, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (error) throw error;

                    if (session) {
                        if (type === 'signup' || type === 'email') {
                            navigate('/verify-email', { state: { verified: true }, replace: true });
                            return;
                        }

                        hydrateFromSession(session);
                        navigateAfterAuth();
                        return;
                    }
                }

                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (session) {
                    hydrateFromSession(session);
                    navigateAfterAuth();
                } else {
                    navigate('/login', {
                        replace: true,
                        state: { authError: 'Google sign-in did not complete. Try again or use email login.' },
                    });
                }
            } catch (error) {
                console.error('Auth Callback Error:', error);
                const message = error instanceof Error ? error.message : 'Google sign-in failed';
                navigate('/login', { replace: true, state: { authError: message } });
            } finally {
                setLoading(false);
            }
        };

        handleAuthCallback();
    }, [navigate, hydrateFromSession, setLoading, location]);

    return (
        <div className="relative min-h-screen">
            <CashlyLoader fullscreen message="Verifying authentication..." subtext="Connecting to secure session" />
            {takingLong && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white px-5 py-3 rounded-full border border-stone-300 shadow-2xl animate-fade-in">
                    <span className="text-xs text-stone-600 font-medium">Connecting is taking longer than usual...</span>
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard', { replace: true })}
                        className="text-xs font-semibold px-3 py-1.5 bg-[#EE5024] text-white rounded-full hover:bg-[#D4431B] transition-colors shadow-sm"
                    >
                        Go to Dashboard
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/login', { replace: true })}
                        className="text-xs font-semibold px-2 py-1.5 text-stone-500 hover:text-stone-800 transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            )}
        </div>
    );
};

export default AuthCallback;
