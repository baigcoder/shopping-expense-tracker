import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { encryptToken, decryptToken, isEncryptedToken } from '../services/encryptionService.js';
import { getCanonicalUserId, getOptionalUserId } from '../utils/userAuth.js';
import { getCache, setCache, deleteCache } from '../services/redisCacheService.js';
import { confirmReset, MAX_RESET_ATTEMPTS } from '../controllers/resetController.js';

describe('SECURITY REGRESSION SUITE (VIBECODER-REVIEW REMEDIATION)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('SEC-01 & SEC-05: Plaid Zero-Auth IDOR & Access Token Encryption', () => {
        it('rejects unauthenticated requests to Plaid endpoints with 401', async () => {
            const endpoints = [
                { method: 'post', path: '/api/plaid/create-link-token', body: {} },
                { method: 'post', path: '/api/plaid/exchange-token', body: { public_token: 'tok_123' } },
                { method: 'get', path: '/api/plaid/accounts' },
                { method: 'post', path: '/api/plaid/sync-transactions/acc_999' },
                { method: 'delete', path: '/api/plaid/disconnect/acc_999' },
                { method: 'get', path: '/api/plaid/balance/acc_999' },
            ];

            for (const ep of endpoints) {
                let res;
                if (ep.method === 'post') {
                    res = await request(app).post(ep.path).send(ep.body);
                } else if (ep.method === 'delete') {
                    res = await request(app).delete(ep.path);
                } else {
                    res = await request(app).get(ep.path);
                }
                expect(res.status).toBe(401);
                expect(res.body.success).toBe(false);
            }
        });

        it('encrypts and decrypts Plaid tokens with AES-256-GCM and integrity authentication', () => {
            const rawToken = 'access-sandbox-9b81b2bf-0cb3-4877-9818-479e0f6e9b41';
            const encrypted = encryptToken(rawToken);

            expect(isEncryptedToken(encrypted)).toBe(true);
            expect(encrypted).not.toContain(rawToken);

            const parts = encrypted.split(':');
            expect(parts.length).toBe(3); // iv:authTag:encryptedData

            const decrypted = decryptToken(encrypted);
            expect(decrypted).toBe(rawToken);
        });

        it('fails tamper detection when an encrypted token tag or ciphertext is modified', () => {
            const rawToken = 'access-sandbox-live-secret-12345';
            const encrypted = encryptToken(rawToken);
            const parts = encrypted.split(':');

            // Tamper with the ciphertext payload
            const tamperedCiphertext = parts[0] + ':' + parts[1] + ':' + parts[2].slice(0, -2) + 'ff';
            expect(() => decryptToken(tamperedCiphertext)).toThrow();

            // Tamper with the authTag
            const tamperedTag = parts[0] + ':' + '00000000000000000000000000000000' + ':' + parts[2];
            expect(() => decryptToken(tamperedTag)).toThrow();
        });
    });

    describe('SEC-02: Card Data Model & PCI-DSS Compliance', () => {
        it('ensures safe column projection excludes cvv, pin, and raw number from queries', async () => {
            // Check that the controller imports and uses safe columns
            const { SAFE_CARD_COLUMNS } = await import('../controllers/cardController.js');
            expect(SAFE_CARD_COLUMNS).toContain('last4');
            expect(SAFE_CARD_COLUMNS).toContain('holder');
            expect(SAFE_CARD_COLUMNS).toContain('expiry');
            expect(SAFE_CARD_COLUMNS).not.toContain('cvv');
            expect(SAFE_CARD_COLUMNS).not.toContain('pin');
            expect(SAFE_CARD_COLUMNS).not.toContain('number');
        });

        it('rejects unauthenticated attempts to access card APIs', async () => {
            const getRes = await request(app).get('/api/cards');
            expect(getRes.status).toBe(401);

            const postRes = await request(app).post('/api/cards').send({
                last4: '4242',
                holder: 'Alice Smith',
                expiry: '12/28',
            });
            expect(postRes.status).toBe(401);
        });
    });

    describe('SEC-06 & SEC-12: Reset OTP Brute-Force Rate Limiting & Auto-Invalidation', () => {
        it('tracks failed attempts, rejects invalid OTP, and invalidates after 5 attempts', async () => {
            const testUserId = 'victim-test-uid-42';
            const cacheKey = `reset:otp:${testUserId}`;

            // Seed active OTP
            await setCache(cacheKey, {
                otp: '849201',
                expiresAt: Date.now() + 600000,
                category: 'all',
                userId: testUserId,
                attempts: 0,
            }, 600);

            // Attempt 1 to 4: Wrong OTP
            for (let i = 1; i <= 4; i++) {
                const req = {
                    user: { supabaseId: testUserId },
                    body: { otp: '000000' },
                } as any;
                let statusCode = 200;
                let jsonResponse: any = {};
                const res = {
                    status: (code: number) => {
                        statusCode = code;
                        return res;
                    },
                    json: (data: any) => {
                        jsonResponse = data;
                        return res;
                    },
                } as any;

                await confirmReset(req, res);
                expect(statusCode).toBe(400);
                expect(jsonResponse.error).toContain('Invalid verification code');
                expect(jsonResponse.remainingAttempts).toBe(MAX_RESET_ATTEMPTS - i);

                const cached = await getCache<{ attempts: number }>(cacheKey);
                expect(cached?.attempts).toBe(i);
            }

            // Attempt 5: Final failed attempt triggering lockout & invalidation
            const req5 = {
                user: { supabaseId: testUserId },
                body: { otp: '000000' },
            } as any;
            let statusCode5 = 200;
            let jsonResponse5: any = {};
            const res5 = {
                status: (code: number) => {
                    statusCode5 = code;
                    return res5;
                },
                json: (data: any) => {
                    jsonResponse5 = data;
                    return res5;
                },
            } as any;

            await confirmReset(req5, res5);
            expect(statusCode5).toBe(429); // Rate limited / locked out
            expect(jsonResponse5.error).toContain('Too many incorrect attempts');

            // Verify cache key was completely purged to prevent further brute force
            const cachedAfterPurge = await getCache(cacheKey);
            expect(cachedAfterPurge).toBeNull();
        });

        it('invalidates OTP immediately upon successful verification to prevent replay', async () => {
            const testUserId = 'replay-check-uid-88';
            const cacheKey = `reset:otp:${testUserId}`;
            const validOtp = '719342';

            await setCache(cacheKey, {
                otp: validOtp,
                expiresAt: Date.now() + 600000,
                category: 'transactions',
                userId: testUserId,
                attempts: 0,
            }, 600);

            const req = {
                user: { supabaseId: testUserId },
                body: { otp: validOtp },
            } as any;
            let statusCode = 200;
            let jsonResponse: any = {};
            const res = {
                status: (code: number) => {
                    statusCode = code;
                    return res;
                },
                json: (data: any) => {
                    jsonResponse = data;
                    return res;
                },
            } as any;

            await confirmReset(req, res);
            expect(statusCode).toBe(200);
            expect(jsonResponse.message).toContain('Successfully reset');

            // Verify OTP was consumed
            const cachedAfterUse = await getCache(cacheKey);
            expect(cachedAfterUse).toBeNull();

            // Attempting to reuse valid OTP immediately fails because it was consumed
            let replayCode = 200;
            const resReplay = {
                status: (code: number) => {
                    replayCode = code;
                    return resReplay;
                },
                json: () => resReplay,
            } as any;
            await confirmReset(req, resReplay);
            expect(replayCode).toBe(400);
        });
    });

    describe('SEC-07: Canonical User Identity Abstraction', () => {
        it('resolves canonical Supabase ID prioritized over Prisma ID', () => {
            const req = {
                user: {
                    id: 'prisma-user-uuid-1',
                    supabaseId: 'supabase-auth-uuid-2',
                    email: 'test@cashly.com',
                },
            };

            const canonicalId = getCanonicalUserId(req as any);
            expect(canonicalId).toBe('supabase-auth-uuid-2');
        });

        it('falls back to id if supabaseId is missing', () => {
            const req = {
                user: {
                    id: 'fallback-uuid-3',
                    email: 'test@cashly.com',
                },
            };

            const canonicalId = getCanonicalUserId(req as any);
            expect(canonicalId).toBe('fallback-uuid-3');
        });

        it('throws an unauthorized error if no user identity exists', () => {
            const req = {} as any;
            expect(() => getCanonicalUserId(req)).toThrow('Authentication required');
        });

        it('safely handles getOptionalUserId without throwing', () => {
            expect(getOptionalUserId({} as any)).toBeNull();
            expect(getOptionalUserId({ user: { id: 'usr-123' } } as any)).toBe('usr-123');
        });
    });

    describe('SEC-04: Password Storage Redesign & Reversible Encryption Removal', () => {
        it('verifies otpController does not export or employ symmetric AES password encryption', async () => {
            const otpModule = await import('../controllers/otpController.js');
            expect((otpModule as any).encryptPassword).toBeUndefined();
            expect((otpModule as any).decryptPassword).toBeUndefined();
            expect((otpModule as any).ENCRYPTION_KEY).toBeUndefined();
        });
    });
});
