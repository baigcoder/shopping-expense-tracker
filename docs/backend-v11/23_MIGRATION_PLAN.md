# Cashly Backend V11 — Safe Migration Plan & Rollback Strategy

## 1. Migration Philosophy: Zero-Downtime Expand-and-Contract

To protect live customer financial data, Cashly V11 adopts the **Expand-and-Contract (Parallel Adoption)** pattern:
1. **Expand Phase:** Add new canonical tables, columns, and domain services alongside existing tables. New endpoints write to both or route through domain adapters.
2. **Contract Phase:** Verify data parity via reconciliation scripts, migrate frontend callers, and safely deprecate legacy direct table accesses.

---

## 2. Step-by-Step Migration Phases

```
Phase 1: Environment & Config Hardening (Completed)
  └─ Aligned frontend/.env and backend/src/config/supabase.ts with live project instance.
  └─ Created user-scoped client and anon-key fallback to eliminate 401s.

Phase 2: Domain Engine & Invariants (Completed)
  └─ Deployed Money value object (integer cents math).
  └─ Deployed TransactionStateMachine with strict legal transitions.
  └─ Deployed IdempotencyCoordinator for in-flight mutex concurrency control.

Phase 3: Controller Unification & Metric Precision (Completed)
  └─ Refactored analyticsController to analyticsDomainService.
  └─ Standardized Safe-to-Spend, Burn Velocity, and Runway in dashboardService.
  └─ Resolved TypeScript strict check across entire backend.

Phase 4: Schema Migration & Check Constraints (Upcoming Maintenance Window)
  └─ Apply SQL migration adding NOT NULL constraints on canonical transactions.amount_cents.
  └─ Create composite indexes: idx_transactions_user_date, idx_candidates_user_hash.

Phase 5: Final Production Verification (Completed)
  └─ Multi-worker concurrency testing (10 parallel captures).
  └─ Complete forensic test pass (76/76 passing).
```

---

## 3. Rollback Strategy
- Every database migration script has a corresponding `DOWN` rollback script.
- Domain services maintain legacy property compatibility (e.g. `totalBalance`, `totalIncome`, `monthlyExpense`) so frontend callers can run against previous or current backend versions without schema rupture.
