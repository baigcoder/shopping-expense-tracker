import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://gmttqefcyqaxhlghcfpo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set — admin operations will fail.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const supabaseAdmin = supabase;

export const verifyToken = async (token: string) => {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
        throw error || new Error('Invalid token');
    }
    const user = data.user;
    return {
        id: user.id,
        email: user.email || '',
        user_metadata: {
            name: user.user_metadata?.name || user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
        },
    };
};
