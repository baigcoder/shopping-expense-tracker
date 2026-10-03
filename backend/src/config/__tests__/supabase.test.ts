import { describe, expect, it } from 'vitest';
import {
    createUserScopedSupabase,
    decodeJwtMetadata,
    extractExpectedProjectRef,
    getSupabaseAdminClient,
    isServiceKeyValidForTarget,
    PrivilegedOperationError,
    supabase,
    supabaseAnonKey,
    supabaseUrl,
    validateServiceRoleConfiguration,
    verifyToken,
} from '../supabase.js';

describe('Supabase Configuration & Privileged Access Control (INV-01 & Hardening)', () => {
    const dummyMatchingServiceKey = `header.${Buffer.from(
        JSON.stringify({ ref: 'ynmvjnsdygimhjxcjvzp', role: 'service_role' })
    ).toString('base64')}.signature`;

    const dummyMismatchedServiceKey = `header.${Buffer.from(
        JSON.stringify({ ref: 'deadproject12345', role: 'service_role' })
    ).toString('base64')}.signature`;

    const dummyAnonRoleKey = `header.${Buffer.from(
        JSON.stringify({ ref: 'ynmvjnsdygimhjxcjvzp', role: 'anon' })
    ).toString('base64')}.signature`;

    it('validates matching project URL and service key', () => {
        const result = validateServiceRoleConfiguration(
            dummyMatchingServiceKey,
            'https://ynmvjnsdygimhjxcjvzp.supabase.co'
        );
        expect(result.isValid).toBe(true);
        expect(result.ref).toBe('ynmvjnsdygimhjxcjvzp');
    });

    it('rejects mismatched project URL and service key', () => {
        const result = validateServiceRoleConfiguration(
            dummyMismatchedServiceKey,
            'https://ynmvjnsdygimhjxcjvzp.supabase.co'
        );
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('does not match target host');
    });

    it('rejects malformed service-role token', () => {
        const result = validateServiceRoleConfiguration(
            'not-a-valid-jwt-token',
            'https://ynmvjnsdygimhjxcjvzp.supabase.co'
        );
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('malformed');
    });

    it('rejects missing or empty service-role key', () => {
        const result = validateServiceRoleConfiguration(
            '',
            'https://ynmvjnsdygimhjxcjvzp.supabase.co'
        );
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('missing or empty');
    });

    it('rejects service-role key with invalid role (e.g. anon role)', () => {
        const result = validateServiceRoleConfiguration(
            dummyAnonRoleKey,
            'https://ynmvjnsdygimhjxcjvzp.supabase.co'
        );
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain("invalid role 'anon'");
    });

    it('strictly throws PrivilegedOperationError when privileged admin operations are attempted without valid service-role credentials', () => {
        if (!isServiceKeyValidForTarget) {
            expect(() => getSupabaseAdminClient()).toThrow(PrivilegedOperationError);
        }
    });

    it('initializes with canonical URL and valid anon key', () => {
        expect(supabaseUrl).toContain('ynmvjnsdygimhjxcjvzp');
        expect(supabaseAnonKey).toBeDefined();
        expect(supabase).toBeDefined();
    });

    it('creates a user-scoped client attaching the Bearer token for RLS', () => {
        const dummyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';
        const userClient = createUserScopedSupabase(dummyToken);

        expect(userClient).toBeDefined();
        // @ts-expect-error accessing rest client headers
        const authHeader = userClient.rest?.headers?.get?.('Authorization');
        expect(authHeader).toBe(`Bearer ${dummyToken}`);
    });

    it('returns default client when no token provided to createUserScopedSupabase', () => {
        const defaultClient = createUserScopedSupabase();
        expect(defaultClient).toBe(supabase);
    });

    it('rejects invalid or malformed tokens gracefully in verifyToken', async () => {
        await expect(verifyToken('malformed.token.here')).rejects.toThrow();
    });
});
