# Cashly Backend V11 — Caching Strategy & Explicit Invalidation

## 1. Golden Rule of Financial Caching

**Correctness always supersedes cache speed in financial mutations.**
Never cache authoritative ledger state without an explicit, deterministic invalidation pipeline. Arbitrary Time-To-Live (TTL) alone is dangerous because a user who posts a $1,000 transaction would see a stale balance for the remainder of the TTL window.

---

## 2. Cache Tiering & Policy Matrix

| Scope | Key Pattern | TTL | Strategy | Invalidation Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **User Settings** | `settings:user:${userId}` | 10 mins | Read-Through | User updates preferences or currency |
| **Category Metadata** | `categories:user:${userId}` | 30 mins | Read-Through | Category added / edited / deleted |
| **AI Insights / Coach** | `ai:insights:user:${userId}` | 60 mins | Read-Through | Any approved transaction or budget update |
| **Dashboard Metrics** | `dashboard:user:${userId}` | 30 secs | Short Read-Through | Any ledger transaction write / approval |
| **Transaction List** | *Uncached* | 0s | Direct Read | Always served directly from database |
| **Authoritative Ledger**| *Uncached* | 0s | Direct Read | Never cached |

---

## 3. Explicit Invalidation Pipeline

When a financial mutation occurs (e.g. `approveCandidate`, `createMoneyTransaction`, `updateBudget`), the domain service triggers immediate invalidation:

```typescript
// backend/src/services/transactionDomainService.ts
async function invalidateUserDerivedData(userId: string) {
    await Promise.allSettled([
        invalidateUserAICacheIfEnabled(userId),
        redisClient?.del(`dashboard:user:${userId}`),
        redisClient?.del(`ai:insights:user:${userId}`),
    ]);
}
```

---

## 4. Multi-Tenant Key Isolation
Every cache key **MUST** incorporate the user ID:
- ✅ Correct: `cache:summary:usr_123:2026-10`
- ❌ Insecure: `cache:summary:2026-10` (cross-user data bleed)
