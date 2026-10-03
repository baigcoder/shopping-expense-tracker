# Cashly Backend V11 — Failure Modes & Recovery Matrix

## 1. System Failure Matrix

| Component | Failure Mode | Impact | V11 Recovery Behavior |
| :--- | :--- | :--- | :--- |
| **Supabase Postgres Database** | Connection timeout / pool exhaustion | Write failures | HTTP 503 `DATABASE_ERROR` returned. In-flight mutex locks immediately released so client can safely retry with backoff. `/api/ready` reports `degraded`. |
| **Redis Cache** | Out of memory / process crash | Cache miss | Domain services automatically degrade to direct database queries without throwing 500 errors. |
| **OpenRouter / Groq AI** | 429 Rate Limit / Provider 502 | AI Assistant unavailable | AI features return structured fallback error; core ledger, budgets, and transactions remain 100% operational. |
| **Plaid Bank API** | Webhook storm / Gateway timeout | Delayed bank sync | Webhooks enqueued with deduplication. Transient network failures retried with exponential backoff. |
| **Browser Extension** | Rapid repeated clicks / double capture | Duplicate requests | SHA-256 fingerprint deduplication returns existing candidate with `duplicate: true`. |
| **JWT Expiration** | Token expired mid-session | 401 Unauthorized | Backend returns structured `UNAUTHORIZED` code. Frontend automatically initiates silent refresh or redirects to login. |

---

## 2. Invariant Recovery Guarantees
- **No Orphan Ledger Entries:** Candidate approval is atomic. If the ledger insertion fails, the candidate remains `pending`.
- **No Floating-Point Accumulation:** In financial aggregation crashes, rounding errors cannot accumulate across service restarts.
