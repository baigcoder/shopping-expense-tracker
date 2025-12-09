// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const signUpWithEmail = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name || '',
                full_name: name || '',
            },
            // Skip email confirmation - auto-confirm for this app
            // To enable email confirmation, remove this and configure in Supabase Dashboard
            emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
    });

    if (error) throw error;

    // Check if user needs email confirmation
    if (data.user && !data.session) {
        // Email confirmation required - Supabase setting
        // For development, you can disable this in Supabase Dashboard:
        // Authentication > Providers > Email > Confirm email = OFF
        console.log('Email confirmation may be required. Check Supabase settings.');
    }

    return data;
};

export const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
};

export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });

    if (error) throw error;
    return data;
};

export const logout = async () => {
    // Set a flag to indicate explicit logout
    sessionStorage.setItem('explicit_logout', 'true');

    // Use 'global' scope to sign out from all tabs/windows and clear all tokens
    try {
        await supabase.auth.signOut({ scope: 'global' });
    } catch (e) {
        console.log('Supabase signOut error (continuing anyway):', e);
    }

    // Clear ALL Supabase-related localStorage keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
};

export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
};

export const getSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
};

// Auth state listener
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
};
