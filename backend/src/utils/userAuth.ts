import { Request } from 'express';

/**
 * Returns the canonical Supabase Auth user ID (UUID) for database operations.
 * Supabase tables enforce foreign keys to auth.users(id).
 * req.user.supabaseId contains this canonical UUID.
 */
export function getCanonicalUserId(req: Request): string {
    const user = (req as any).user;
    if (!user) {
        throw new Error('Authentication required: user context missing from request');
    }
    const id = user.supabaseId || user.id;
    if (!id || typeof id !== 'string') {
        throw new Error('Invalid user context: missing canonical user ID');
    }
    return id;
}

/**
 * Returns canonical user ID if request is authenticated, or null.
 */
export function getOptionalUserId(req: Request): string | null {
    const user = (req as any).user;
    if (!user) return null;
    return user.supabaseId || user.id || null;
}
