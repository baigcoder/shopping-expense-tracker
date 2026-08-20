// Supabase client – real @supabase/supabase-js replacing the old Firebase shim.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL || 'https://gmttqefcyqaxhlghcfpo.supabase.co';
const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdHRxZWZjeXFheGhsZ2hjZnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTMwMDYsImV4cCI6MjA5NTM4OTAwNn0.fQXoRZNV8AuwaqWQ-1xgkWGlSzLNTSOZ9o-pCRkEiqI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        // Custom /auth/callback route exchanges the PKCE code explicitly.
        detectSessionInUrl: false,
        flowType: 'pkce',
        persistSession: true,
    },
});

/** Required in Supabase Dashboard → Authentication → URL Configuration */
export const SUPABASE_AUTH_REDIRECT_URLS = [
    'http://localhost:5173/auth/callback',
    'http://localhost:5174/auth/callback',
    'http://127.0.0.1:5173/auth/callback',
    'https://shopping-expense-tracker.vercel.app/auth/callback',
] as const;

const getSiteOrigin = () => {
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }

    return import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:5173';
};

export const getAuthRedirectUrl = (next = '/dashboard') => {
    const origin = getSiteOrigin().replace(/\/+$/, '');
    const url = new URL('/auth/callback', origin);

    if (next && next.startsWith('/')) {
        url.searchParams.set('next', next);
    }

    return url.toString();
};

// ─── Extension session bridge ────────────────────────────────────────────────
const CASHLY_WEB_SESSION_BRIDGE_KEY = 'cashly_web_session_bridge';

if (typeof window !== 'undefined') {
    supabase.auth.onAuthStateChange(async (_event, session) => {
        try {
            if (session?.access_token && session?.user) {
                localStorage.setItem(
                    CASHLY_WEB_SESSION_BRIDGE_KEY,
                    JSON.stringify({
                        access_token: session.access_token,
                        user: {
                            id: session.user.id,
                            email: session.user.email,
                            user_metadata: session.user.user_metadata,
                        },
                    }),
                );
                window.postMessage(
                    {
                        type: 'WEBSITE_TO_EXTENSION',
                        action: 'SYNC_SESSION',
                        data: { session, user: session.user, accessToken: session.access_token },
                    },
                    '*',
                );
            } else {
                localStorage.removeItem(CASHLY_WEB_SESSION_BRIDGE_KEY);
                window.postMessage({ type: 'WEBSITE_TO_EXTENSION', action: 'LOGOUT' }, '*');
            }
        } catch {
            localStorage.removeItem(CASHLY_WEB_SESSION_BRIDGE_KEY);
        }
    });
}

// ─── Auth helpers (same export names as before) ──────────────────────────────

export const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
};

export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: getAuthRedirectUrl('/dashboard'),
            queryParams: {
                access_type: 'offline',
                prompt: 'select_account',
            },
        },
    });
    if (error) throw error;
    // Triggers a full-page redirect to Google → Supabase → /auth/callback.
    return data;
};

export const sendPasswordResetEmail = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl('/login?reset=true'),
    });

    if (error) throw error;
    return data;
};

export const logout = async () => {
    sessionStorage.setItem('explicit_logout', 'true');
    await supabase.auth.signOut();

    if (typeof window !== 'undefined') {
        localStorage.removeItem(CASHLY_WEB_SESSION_BRIDGE_KEY);
        window.postMessage({ type: 'WEBSITE_TO_EXTENSION', action: 'LOGOUT' }, '*');
    }

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
            key &&
            (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))
        ) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
};

export const getCurrentUser = async () => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
};

export const getSession = async () => {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
};

// Handle OAuth redirect result (used by useAuth.ts after redirect back from Google)
export const handleGoogleRedirect = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    return { user: data.session.user, session: data.session };
};
