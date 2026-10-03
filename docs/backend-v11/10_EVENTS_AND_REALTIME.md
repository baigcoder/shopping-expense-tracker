# Cashly Backend V11 — Events & Realtime Architecture

## 1. Core Principles

1. **Commit First, Broadcast Second:** A realtime event or notification must **never** be published before the database transaction has successfully committed. Emitting events optimistically leads to phantom updates where the client shows a transaction that failed to save.
2. **Payload Purity & Safety:** Event payloads must contain minimal, non-sensitive identifiers and summaries. Never broadcast API keys, auth tokens, or private banking credentials.
3. **Decoupled Subscribers:** Domain services emit events to notify interested subsystems (realtime websockets, audit logger, cache invalidation, push notifications) without tight coupling.

---

## 2. Event Catalog

| Event Name | Trigger | Payload | Consumers |
| :--- | :--- | :--- | :--- |
| `transaction.captured` | Extension or API receipt detection | `{ userId, candidateId, merchant, amount, currency }` | Transaction Inbox, Badge counter |
| `transaction.approved` | User or rule approves candidate | `{ userId, transactionId, candidateId, amount, category }` | Ledger sync, Dashboard metrics, AI cache invalidation |
| `transaction.rejected` | User rejects candidate | `{ userId, candidateId, reason }` | Inbox UI, Rule learner |
| `budget.threshold_reached` | Spend reaches 80% or 100% of budget | `{ userId, budgetId, category, spent, limit }` | Realtime Alert, Weekly Coach |
| `import.completed` | CSV / OCR statement parsed & imported | `{ userId, sessionId, importedCount, duplicateCount }` | Import history, Dashboard |
| `cache.invalidated` | Mutation altering financial baseline | `{ userId, scopes: ['dashboard', 'ai_summary'] }` | Redis / Memory cache |

---

## 3. Realtime Channel Architecture (Supabase Realtime)

Cashly leverages Supabase Realtime (PostgreSQL CDC via `pg_logical` replication) mapped to user-isolated channels:

```typescript
// Channel pattern:
const userChannel = `user_financial_events:${userId}`;
```

Only authenticated clients whose JWT `sub === userId` can subscribe to their respective channel.

### Event Invariants
- `INV-12`: Realtime notifications must always represent committed database state. If a rollback occurs, no event is emitted.
