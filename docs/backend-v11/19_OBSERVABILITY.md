# Cashly Backend V11 — Observability, Logging & Health Architecture

## 1. Request Correlation ID Propagation

Every HTTP request entering the Cashly backend is assigned a unique correlation ID via the `x-request-id` header (generated using `crypto.randomUUID()` if not supplied by the edge proxy or client).

```typescript
// backend/src/app.ts
app.use((req, res, next) => {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    next();
});
```

All log messages, error responses, audit trails, and downstream dependency calls link to this `requestId`.

---

## 2. Health & Readiness Probes

### 1. `/health` (Liveness Probe)
- Verifies that the Node.js event loop is operational.
- Returns: `{ status: 'ok', timestamp: '...' }` (HTTP 200).

### 2. `/api/ready` (Readiness Probe)
- Verifies active database connectivity by running a test ping query against Supabase.
- Returns:
  ```json
  {
    "status": "ready",
    "timestamp": "2026-10-04T00:10:00.000Z",
    "checks": {
      "database": {
        "status": "healthy",
        "latencyMs": 42
      }
    }
  }
  ```
- If the database is unreachable or timing out, returns HTTP 503 `status: 'degraded'`.

---

## 3. Structured Error Response Contract

In production, errors never leak internal stack traces, SQL queries, or file paths. They strictly adhere to:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [
    { "field": "amount", "message": "Amount must be a positive number" }
  ],
  "requestId": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
}
```
