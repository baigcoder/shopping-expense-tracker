# Cashly Backend V11 — Security Engineering & Hardening

## 1. Threat Matrix & Mitigations

| Threat | Target Surface | V11 Defense / Mitigation |
| :--- | :--- | :--- |
| **Insecure Direct Object Reference (IDOR)** | `/api/transactions/:id`, `/api/budgets/:id` | Authenticated principal enforced. DB queries strictly bind `.eq('user_id', canonicalUserId)`. |
| **Service Role Key Leakage** | Supabase Gateway / API responses | Strict audit: Service role key never returned in API payloads; fallback to valid anon client if project ref mismatches. |
| **Double Spending / Replay Attack** | Payment capture, candidate approvals | SHA-256 capture fingerprinting + `IdempotencyCoordinator` in-flight mutex lock. |
| **Credential & Secret Exposure** | Production logs & stack traces | Structured error handler masks sensitive headers, tokens, and DB connection strings. |
| **Brute Force & DoS** | `/api/auth/login`, `/api/otp/*`, `/api/transactions/*` | Tiered rate limiting via `express-rate-limit` (auth: 5 req/15m; general API: 100 req/m). |
| **Cross-Site Scripting (XSS)** | Merchant names, product notes | Input sanitization + Helmet HTTP security headers (CSP, HSTS, X-Content-Type-Options). |
| **Cross-Origin Resource Sharing (CORS)** | Web extension & Web app | Explicit origin whitelisting (`localhost:5173`, `localhost:5174`, chrome-extension IDs). |

---

## 2. Tiered Rate Limiting

```typescript
// Authentication & OTP Endpoints: Strict 5 requests per 15 minutes per IP
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, code: 'RATE_LIMITED', message: 'Too many login attempts. Please retry later.' }
});

// Extension Capture & Bulk Endpoints: 120 requests per minute
export const captureRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    message: { success: false, code: 'RATE_LIMITED', message: 'Capture rate limit exceeded.' }
});

// AI & Voice Endpoints: 20 requests per minute
export const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { success: false, code: 'RATE_LIMITED', message: 'AI rate limit exceeded.' }
});
```

---

## 3. Secret Isolation
1. `SUPABASE_SERVICE_ROLE_KEY` is restricted strictly to backend internal operations; never sent to clients or browser extensions.
2. User-scoped Supabase client (`createUserScopedSupabase`) passes caller's bearer JWT so PostgreSQL evaluates Row Level Security (`auth.uid() = user_id`).
