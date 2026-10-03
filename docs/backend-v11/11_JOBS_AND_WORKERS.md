# Cashly Backend V11 — Background Jobs & Worker Architecture

## 1. Design Rationale

Long-running operations must never block the synchronous HTTP request/response cycle:
- Statement OCR parsing (can take 3-10 seconds per page)
- AI summary synthesis & Coach plan generation
- Bulk CSV statement deduplication (10,000+ rows)
- Plaid bank transaction synchronization
- Weekly / monthly report exports (PDF / XLSX generation)

---

## 2. Job Lifecycle & Queue States

```
[QUEUED] ───> [PROCESSING] ───> [COMPLETED]
                   │
                   └─── (Failure / Retry) ───> [RETRYING] (Exponential backoff)
                                                     │
                                                     └─── (Max Retries Exceeded) ───> [DEAD_LETTER]
```

### State Transitions:
1. `QUEUED`: Enqueued by API controller with idempotency key and payload.
2. `PROCESSING`: Picked up by worker. In-flight lock applied.
3. `COMPLETED`: Result persisted, events emitted, temporary files cleaned.
4. `DEAD_LETTER`: Permanently failed jobs quarantined for engineer inspection with full error stack and correlation ID.

---

## 3. Worker Invariants
1. **Idempotent Execution:** Every worker job must be idempotent. If a worker crashes midway and the queue retries the job, it must not create duplicate financial records or double-charge balances.
2. **Deterministic Backoff:** Failed jobs use exponential backoff ($2^n \times 1000\text{ ms}$) up to 5 attempts before quarantine.
3. **Graceful Shutdown:** On `SIGTERM` or `SIGINT`, workers finish in-flight jobs within a 15-second grace period before process termination.
