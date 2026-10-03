# CASHLY BACKEND V11 — API CONTRACTS & ERROR MODEL
**Document:** `/docs/backend-v11/06_API_CONTRACTS.md`  
**Execution Date:** October 4, 2026  
**Implementation:** `backend/src/middleware/errorHandler.ts`, `backend/src/validators/schemas.ts`

---

## 1. Unified Response Structure

All Cashly V11 endpoints return standardized JSON payloads:

### Success Response (`HTTP 200 / 201`)
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  },
  "message": "Operation completed successfully"
}
```

### Error Response (`HTTP 4xx / 5xx`)
```json
{
  "success": false,
  "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | RATE_LIMITED | DATABASE_ERROR | INTERNAL_ERROR",
  "message": "Human-readable explanation of error",
  "errors": [
    { "field": "amount", "message": "Amount must be a positive number" }
  ],
  "requestId": "req_m8k2f1_9a8b1c"
}
```

---

## 2. Standardized Error Taxonomy

| Error Code | HTTP Status | Typical Triggers |
| :--- | :---: | :--- |
| `VALIDATION_ERROR` | 400 | Zod schema validation failed on body/params/query |
| `UNAUTHORIZED` | 401 | Missing, malformed, or expired Supabase JWT token |
| `FORBIDDEN` | 403 | Attempt to access resource owned by another user |
| `NOT_FOUND` | 404 | Resource with specified ID does not exist |
| `CONFLICT` | 409 | Duplicate idempotency key, unique constraint violation, illegal transition |
| `RATE_LIMITED` | 429 | Rate limit exceeded for sensitive or expensive endpoint |
| `DEPENDENCY_FAILURE`| 502 | Upstream dependency (Plaid, OpenRouter, Redis) timed out or failed |
| `DATABASE_ERROR` | 500 | Database constraint error or connection interruption |
| `INTERNAL_ERROR` | 500 | Unhandled exception (sanitized in production) |

---

## 3. Core API Endpoint Matrix

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | No | Liveness probe (process responsive) |
| `GET` | `/api/ready` | No | Readiness probe (database connection active) |
| `GET` | `/api/transactions` | Bearer JWT | List canonical ledger transactions with pagination & filters |
| `POST` | `/api/transactions` | Bearer JWT | Manually post transaction to canonical ledger |
| `GET` | `/api/transactions/:id` | Bearer JWT | Fetch single transaction with user ownership verification |
| `PATCH`| `/api/transactions/:id` | Bearer JWT | Update transaction with user ownership verification |
| `DELETE`| `/api/transactions/:id`| Bearer JWT | Soft-delete or remove transaction with audit event |
| `GET` | `/api/transaction-inbox` | Bearer JWT | List staged candidates awaiting review |
| `POST` | `/api/transaction-inbox/:id/approve` | Bearer JWT | Idempotent transactional approval to ledger |
| `POST` | `/api/transaction-inbox/:id/reject` | Bearer JWT | Staged candidate rejection |
| `POST` | `/api/transaction-inbox/:id/merge` | Bearer JWT | Merge candidate into existing ledger transaction |
| `GET` | `/api/dashboard/summary` | Bearer JWT | Home dashboard statistics, runway, and charts |
| `GET` | `/api/money-twin` | Bearer JWT | Forward runway simulation with parameter inputs |
| `POST` | `/api/ai/chat` | Bearer JWT | Grounded financial assistant conversation |
