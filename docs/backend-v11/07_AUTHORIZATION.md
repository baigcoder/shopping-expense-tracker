# Cashly Backend V11 — Multi-Tenant Authorization & Security Model

## 1. Executive Summary
In financial systems, multi-tenancy and data isolation are non-negotiable. Authorization cannot rely on client-supplied identifiers (`userId`, `workspaceId`, `accountId`) or solely on database Row Level Security (RLS) policies. 

In Cashly V11, authorization follows a **Defense-in-Depth Model**:
1. **Network & Edge:** Bearer token extraction and JWT cryptographic signature verification.
2. **Application Boundary (Middleware):** Session validation and canonical principal resolution (`req.user.supabaseId || req.user.id`).
3. **Domain Layer:** Invariant enforcement (`INV-01: Multi-Tenant Zero-Trust Isolation`). Client parameters claiming a different `userId` are strictly ignored or rejected.
4. **Database Layer (RLS & Scoped Client):** Supabase `createUserScopedSupabase(token)` binds the caller's JWT so PostgreSQL evaluates `auth.uid() = user_id`.

---

## 2. Canonical Identity Resolution

Client requests carry an `Authorization: Bearer <token>` header or `sb-access-token` cookie.

```typescript
// backend/src/controllers/transactionController.ts & analyticsController.ts
const getCanonicalUserId = (req: Request): string => {
    // Never trust req.body.userId or req.params.userId for authorization!
    const userId = req.user?.supabaseId || req.user?.id;
    if (!userId) {
        throw createError('Unauthorized: Missing authenticated principal', 401, 'UNAUTHORIZED');
    }
    return userId;
};
```

---

## 3. Defense-in-Depth Layering

| Layer | Responsibility | Threat Mitigated |
| :--- | :--- | :--- |
| **1. Auth Middleware** | Validates Supabase JWT signature, expiration, and issuer. | Unauthenticated requests, forged tokens. |
| **2. Controller Mapping** | Extracts authenticated `userId`. Drops any client-submitted `user_id` in `req.body`. | IDOR (Insecure Direct Object Reference). |
| **3. Domain Service** | Filters all DB queries with `.eq('user_id', canonicalUserId)`. | Cross-tenant data leakage. |
| **4. Database RLS** | Supabase PostgreSQL policy `USING (auth.uid() = user_id)`. | Rogue SQL, internal service leaks. |

---

## 4. Resource-Level Ownership Rules

### Transactions & Candidates
- Any `GET /api/transactions/:id` or `DELETE /api/transactions/:id` queries strictly include `.eq('user_id', canonicalUserId)`.
- If a record with `:id` exists in the database belonging to another user, the query returns `404 Not Found` (never `403 Forbidden` to prevent resource enumeration attacks).

### Staged Review Inbox
- `approveCandidate(userId, candidateId)` asserts both `id === candidateId` and `user_id === userId`.
- If mismatched, no state mutation occurs, and `Candidate not found` (404) is thrown.

### AI Context & Actions
- AI endpoints (`/api/ai/chat`, `/api/ai/actions`) build grounded context strictly from `financialContextService.getBoundedFinancialSummary(userId)`.
- Model has zero access to raw multi-tenant tables.
- Action execution schemas (`CreateGoal`, `UpdateBudget`) pass through Zod validators and domain services bound to `canonicalUserId`.

---

## 5. Security Invariants
- `INV-01`: A transaction, budget, goal, or account cannot belong to another user's workspace.
- `INV-09`: AI must never become the source of truth for authorization or direct SQL execution.
