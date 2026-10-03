import { createClient, SupabaseClient } from '@supabase/supabase-js';

const CANONICAL_SUPABASE_URL = 'https://ynmvjnsdygimhjxcjvzp.supabase.co';
const CANONICAL_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlubXZqbnNkeWdpbWhqeGNqdnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMzIwMzgsImV4cCI6MjA4MDcwODAzOH0.yzygIuk3wWRKPNVHCze3HegdeMVHZPj2caNdqZ9O_vY';

export const supabaseUrl = process.env.SUPABASE_URL || CANONICAL_SUPABASE_URL;
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || CANONICAL_ANON_KEY;

export class PrivilegedOperationError extends Error {
    constructor(
        message = 'Privileged server operation rejected: Valid matching service-role credentials required.'
    ) {
        super(message);
        this.name = 'PrivilegedOperationError';
    }
}

export interface JwtMetadata {
    ref: string | null;
    role: string | null;
    isValid: boolean;
}

/**
 * Decodes JWT payload metadata for validation purposes only.
 */
export function decodeJwtMetadata(token?: string): JwtMetadata {
    if (!token || typeof token !== 'string') {
        return { ref: null, role: null, isValid: false };
    }

    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return { ref: null, role: null, isValid: false };
        }

        const payload = parts[1];
        if (!payload) {
            return { ref: null, role: null, isValid: false };
        }

        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
        return {
            ref: decoded?.ref || null,
            role: decoded?.role || null,
            isValid: Boolean(decoded && typeof decoded === 'object'),
        };
    } catch {
        return { ref: null, role: null, isValid: false };
    }
}

export function extractExpectedProjectRef(url: string): string {
    const match = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
    return match ? match[1] : 'ynmvjnsdygimhjxcjvzp';
}

export function validateServiceRoleConfiguration(
    serviceKey: string,
    targetUrl: string
): { isValid: boolean; reason?: string; ref: string | null; expectedRef: string } {
    const expectedRef = extractExpectedProjectRef(targetUrl);
    if (!serviceKey) {
        return {
            isValid: false,
            reason: 'SUPABASE_SERVICE_ROLE_KEY is missing or empty',
            ref: null,
            expectedRef,
        };
    }

    const meta = decodeJwtMetadata(serviceKey);
    if (!meta.isValid) {
        return {
            isValid: false,
            reason: 'SUPABASE_SERVICE_ROLE_KEY is malformed (invalid JWT structure)',
            ref: null,
            expectedRef,
        };
    }

    if (meta.role !== 'service_role') {
        return {
            isValid: false,
            reason: `SUPABASE_SERVICE_ROLE_KEY has invalid role '${meta.role}'; expected 'service_role'`,
            ref: meta.ref,
            expectedRef,
        };
    }

    if (meta.ref !== expectedRef) {
        return {
            isValid: false,
            reason: `SUPABASE_SERVICE_ROLE_KEY project ref '${meta.ref}' does not match target host '${expectedRef}'`,
            ref: meta.ref,
            expectedRef,
        };
    }

    return {
        isValid: true,
        ref: meta.ref,
        expectedRef,
    };
}

const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const serviceRoleValidation = validateServiceRoleConfiguration(rawServiceKey, supabaseUrl);

export const isServiceKeyValidForTarget = serviceRoleValidation.isValid;

// Fail-fast in production if service-role credentials mismatch
if (!isServiceKeyValidForTarget) {
    const warningMessage = `⚠️ [Cashly Config Guard] ${serviceRoleValidation.reason}. Privileged admin operations will be rejected.`;
    if (process.env.NODE_ENV === 'production') {
        console.error(`[CRITICAL_PRODUCTION_CONFIG_ERROR] ${warningMessage}`);
    } else {
        console.warn(warningMessage);
    }
}

/**
 * Public & User-Scoped PostgREST client.
 * For general queries and RLS-protected reads.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

/**
 * Access the privileged server-admin client.
 * Strictly throws PrivilegedOperationError if matching service-role credentials are unavailable.
 * Never silently downgrades to anonymous client!
 */
export function getSupabaseAdminClient(): SupabaseClient {
    if (!isServiceKeyValidForTarget) {
        throw new PrivilegedOperationError(
            `Cannot execute privileged operation: ${serviceRoleValidation.reason}`
        );
    }

    return createClient(supabaseUrl, rawServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

/**
 * Backward compatibility alias for legacy controllers (e.g. otpController).
 * In production, privileged mutations must use getSupabaseAdminClient() to fail fast if key is invalid.
 */
export const supabaseAdmin: SupabaseClient = isServiceKeyValidForTarget
    ? createClient(supabaseUrl, rawServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
      })
    : supabase;

/**
 * Creates a PostgREST client scoped to the authenticated caller's JWT.
 * Guarantees Row-Level Security (RLS) is evaluated with auth.uid() = user.id.
 */
export const createUserScopedSupabase = (accessToken?: string): SupabaseClient => {
    if (!accessToken) return supabase;
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};

/**
 * Verify Supabase Bearer token using the valid anonymous client
 */
export const verifyToken = async (token: string) => {
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await authClient.auth.getUser(token);
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
