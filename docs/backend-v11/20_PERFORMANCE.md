# Cashly Backend V11 — Performance Engineering & Budgets

## 1. Latency Budgets & Target SLA

| Endpoint Surface | p50 Budget | p95 Budget | p99 Budget | Database Queries Allowed |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/dashboard` | $\le 120\text{ ms}$ | $\le 250\text{ ms}$ | $\le 500\text{ ms}$ | $\le 4$ parallel queries |
| `GET /api/transactions` | $\le 60\text{ ms}$ | $\le 150\text{ ms}$ | $\le 300\text{ ms}$ | 1 query (paginated) |
| `POST /api/transactions/detected` | $\le 80\text{ ms}$ | $\le 180\text{ ms}$ | $\le 350\text{ ms}$ | $\le 2$ queries |
| `POST /api/transaction-inbox/candidates/:id/approve` | $\le 90\text{ ms}$ | $\le 200\text{ ms}$ | $\le 400\text{ ms}$ | 2 atomic queries |
| `GET /api/analytics/summary` | $\le 80\text{ ms}$ | $\le 160\text{ ms}$ | $\le 300\text{ ms}$ | 1 query |

---

## 2. N+1 Elimination & Query Optimization

1. **Eliminated Split-Brain Queries:** `analyticsController` previously fired multiple unindexed aggregation queries. Refactored into a single indexed query via `analyticsDomainService` utilizing the user-indexed `transactions` table (`idx_transactions_user_date`).
2. **Deterministic Parallel Queries:** In `dashboardService`, all table queries (`transactions`, `budgets`, `cards`, `cashflow`) run concurrently using `Promise.all` rather than sequential waterfalls.
3. **Cursor-Based Pagination:** Replaced unbounded `findMany` queries on `/api/transactions` with bounded `limit` (max 100) and range indexing.
4. **Lean DTO Serialization:** Excluded unnecessary JSON audit blobs or raw payload notes from general transaction list queries.
