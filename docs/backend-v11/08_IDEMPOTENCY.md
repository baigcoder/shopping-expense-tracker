# CASHLY BACKEND V11 — IDEMPOTENCY & CONCURRENCY SYSTEM
**Document:** `/docs/backend-v11/08_IDEMPOTENCY.md`  
**Execution Date:** October 4, 2026  
**Implementation:** `backend/src/utils/idempotencyGuard.ts`, `backend/src/utils/candidateDedupe.ts`  
**Tests:** `backend/src/utils/__tests__/idempotencyGuard.test.ts` (100% Passing)

---

## 1. Concurrency Challenges in Modern Fintech

Financial backends are continuously exposed to race conditions and network instability:
1. **Network Retries:** Client loses connection after submitting, browser or SDK retries POST request.
2. **Double-Taps / Double-Clicks:** User taps `[ Approve ]` or `[ Post to Ledger ]` multiple times in rapid succession.
3. **Multi-Tab Races:** User opens the app in two browser tabs; both perform background sync simultaneously.
4. **Webhook Replays:** Payment providers (Plaid, Stripe) re-send webhook events when acknowledgments are delayed.

---

## 2. Cashly V11 Idempotency Architecture

```
                               IDEMPOTENCY PIPELINE
                               
                        Incoming Request [Key / Hash]
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │  IdempotencyCoordinator Lock  │
                      └───────────────┬───────────────┘
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
     [ Key Exists? ]                                     [ Key New ]
            │                                                   │
     ┌──────┴──────┐                                            ▼
     │             │                                   Acquire Mutex Lock
  COMPLETED     IN_FLIGHT                                       │
     │             │                                            ▼
     ▼             ▼                                    Execute Mutation
Return Cached   Wait or Reject                         (Database Transaction)
    Result      (ConcurrentExecutionError)                      │
                                                                ▼
                                                        Store Result & Release
                                                        (5-min Cached Window)
```

### A. SHA-256 Capture Fingerprinting
For checkout captures without an explicit client idempotency header, Cashly computes an authoritative cryptographic hash:
```typescript
const hash = createHash('sha256')
    .update(JSON.stringify({
        userId,
        amountInCents: Money.fromDecimal(amount).cents,
        date: date.slice(0, 10),
        merchant: merchantName.toLowerCase().trim(),
        description: description.toLowerCase().trim(),
        source,
    }))
    .digest('hex')
    .slice(0, 32);
```

### B. In-Flight Mutex Locking
Parallel requests for the same idempotency key block for up to `waitIfInFlightMs` (default 2000ms). If the first request completes, subsequent requests return the cached result with `{ fromCache: true }` without touching the database a second time.

### C. Automatic Failure Unlock
If the underlying operation fails (e.g. database timeout), the lock is immediately purged from the coordinator so client retries are not falsely blocked by a stale lock.
