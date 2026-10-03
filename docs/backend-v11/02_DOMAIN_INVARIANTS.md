# CASHLY BACKEND V11 — DOMAIN & FINANCIAL INVARIANTS
**Document:** `/docs/backend-v11/02_DOMAIN_INVARIANTS.md`  
**Execution Date:** October 3, 2026  
**Auditor & Architect:** Principal Financial Systems & Data Integrity Engineer  
**Status:** CANONICAL LAW FOR ALL CASHLY V11 SERVICES

---

## 1. Core Principle of Invariants

In Cashly V11, financial data integrity is not a suggestion or a client-side responsibility. It is an **enforced server-side contract**. If an operation violates an invariant, the transaction MUST abort immediately, roll back all state mutations, log an actionable security/data integrity alert, and return a structured error.

---

## 2. Master Invariant Registry

```
                                  INVARIANT MATRIX
┌───────────────────────────────┬─────────────────────────────────────────────────────────────────┐
│ Invariant ID                  │ Description & Enforcement Mechanism                             │
├───────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ INV-01: Multi-Tenant Boundary │ All records must be strictly isolated by authenticated user ID  │
│ INV-02: Canonical Ledger      │ Approved spend exists ONLY in the canonical transactions table  │
│ INV-03: Staged Isolation      │ Pending/rejected captures NEVER count toward settled spend      │
│ INV-04: Idempotent Ingestion  │ Duplicate captures/imports NEVER produce duplicate ledger rows  │
│ INV-05: Integer Cents Math    │ Money arithmetic executes in integer cents (no IEEE 754 drift)  │
│ INV-06: Currency Purity       │ Multiple currencies NEVER sum directly without FX conversion    │
│ INV-07: Budget Determinism    │ Budgets evaluate strictly from approved ledger transactions     │
│ INV-08: Goal Ledger Provenance│ Goal saved balance derives strictly from validated events       │
│ INV-09: Cashflow Tiering      │ Projections strictly partition actual, planned, & committed     │
│ INV-10: State Machine Validity│ Transitions follow legal graph (e.g. APPROVED cannot -> PENDING)│
│ INV-11: AI Grounding Boundary │ AI can NEVER authoritatively mutate ledger without user action  │
│ INV-12: Immutable Audit Log   │ Every mutation produces an immutable audit trail entry          │
└───────────────────────────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Invariant Specifications

### INV-01: Multi-Tenant Boundary & Ownership Isolation
- **Rule:** A user can NEVER read, create, update, or delete a financial record belonging to another user.
- **Enforcement:**
  - Client-supplied `userId`, `user_id`, or `accountId` parameters in request bodies/queries MUST be discarded.
  - The authoritative `canonicalUserId` is extracted directly from the verified cryptographic JWT (`req.user.supabaseId || req.user.id`).
  - Every SQL query and Supabase PostgREST operation MUST explicitly bind `.eq('user_id', canonicalUserId)`.
  - Database Row Level Security (RLS) is maintained as a defense-in-depth second layer.

### INV-02: Canonical Ledger Integrity
- **Rule:** The single source of truth for settled financial transactions is the `public.transactions` table.
- **Enforcement:**
  - No shadow transaction tables or un-synchronized duplicate stores.
  - Legacy Prisma queries map to `public.transactions`.
  - An approved transaction is an immutable record of historical truth; reversals and corrections are recorded as compensating entries rather than destructive deletes whenever auditing is required.

### INV-03: Staged Capture & Pending Review Isolation
- **Rule:** A staged checkout interception (`transaction_candidates`) or a rejected review item MUST NEVER appear as approved ledger spend.
- **Enforcement:**
  - Safe-to-Spend, Discretionary Headroom, monthly spend burn, and category analytics MUST filter strictly on `status = 'approved'` (or rows originating from `public.transactions`).
  - Candidate status transitions are one-way for final states (`approved`, `rejected`, `merged`).
  - Staged captures reside in `transaction_candidates` and only enter `transactions` upon explicit transactional approval.

### INV-04: Idempotent Ingestion & Duplicate Protection
- **Rule:** Re-transmitting a checkout capture, retrying a webhook, or re-uploading a bank statement MUST NOT duplicate financial records.
- **Enforcement:**
  - Every capture event computes a deterministic cryptographic SHA-256 fingerprint:
    `hash = SHA256(userId + amountInCents + normalizedDate + normalizedMerchant + type)`.
  - Database-level unique constraint on `(user_id, transaction_hash)`.
  - Ingestion queries use atomic `INSERT ... ON CONFLICT (user_id, transaction_hash) DO NOTHING`.
  - The API responds with HTTP 200/201 and `{ duplicate: true, transactionId }` without creating a duplicate row.

### INV-05: Exact Monetary Precision (Integer Cents Arithmetic)
- **Rule:** Floating-point numbers (`0.10 + 0.20 = 0.30000000000000004`) are prohibited in authoritative ledger arithmetic.
- **Enforcement:**
  - Internal calculations use fixed-point integer cents: `amount_in_cents = Math.round(decimal_amount * 100)`.
  - Database persistence uses PostgreSQL `DECIMAL(12, 2)` or `BIGINT` cents.
  - Division operations (e.g. burn velocity, daily average) apply deterministic rounding (`Math.round` / banker's rounding) at the final step only.

### INV-06: Currency Purity & Isolation
- **Rule:** Transactions denominated in different currencies MUST NEVER be summed directly as raw numbers.
- **Enforcement:**
  - Ledger aggregations group by `currency`.
  - If a single total is requested, amounts are converted to the user's base currency using a documented exchange rate with a recorded timestamp.
  - If an exchange rate is missing, the API reports totals partitioned by currency rather than producing a false unified number.

### INV-07: Budget Determinism & Ledger Derivation
- **Rule:** Budget utilization is a deterministic derivative of approved ledger items within the calendar period and category.
- **Enforcement:**
  - Budget `spent` is never an arbitrary stored counter that drifts out of sync with transactions.
  - Budget calculations query approved ledger transactions for `(category, date >= periodStart, date <= periodEnd)`.
  - Refunds and negative expense entries credit the budget category accurately.

### INV-08: Goal Ledger Provenance
- **Rule:** A goal's `saved` amount must be substantiated by real contribution events or ledger allocations.
- **Enforcement:**
  - Client cannot mutate `progress_percentage` directly.
  - Goal contributions create a ledger or transfer allocation record.
  - `remaining = max(0, target - saved)`.

### INV-09: Cashflow Horizon Partitioning
- **Rule:** Cashflow timeline engines must strictly partition figures into distinct tiers:
  1. `ACTUAL`: Settled ledger transactions up to today.
  2. `COMMITTED`: Known recurring subscriptions, bills, and debt obligations due on upcoming dates.
  3. `PLANNED`: Budgeted discretionary envelopes.
  4. `PROJECTED`: Forward runway forecasts based on historical burn rate.
- **Enforcement:** These 4 tiers MUST NOT be collapsed into an ambiguous single sum.

### INV-10: Transaction State Machine Legal Transitions
- **Rule:** Transaction candidate lifecycle must follow the formal state transition graph:
  - `CAPTURED` → `PENDING_REVIEW`
  - `PENDING_REVIEW` → `APPROVED` (creates canonical transaction)
  - `PENDING_REVIEW` → `REJECTED` (permanently archived)
  - `PENDING_REVIEW` → `MERGED` (linked to existing canonical transaction)
  - `PENDING_REVIEW` → `SPLIT` (creates child candidates)
- **Enforcement:** Invalid transitions (e.g. `APPROVED` → `PENDING_REVIEW`, `REJECTED` → `APPROVED`) throw `ILLEGAL_STATE_TRANSITION` errors.

### INV-11: AI Grounding & Mutation Boundaries
- **Rule:** AI services (OpenRouter, Groq, local fallbacks) are read-only advisory engines. They CANNOT directly execute database writes.
- **Enforcement:**
  - AI tools emit structured action proposals (e.g. `{ action: 'CREATE_GOAL', params: { ... } }`).
  - Action proposals pass through Zod validation, user authentication, and domain authorization before execution.
  - AI context pipelines only ingest verified ledger facts; they never present hallucinations as observed facts.

### INV-12: Immutable Audit Log
- **Rule:** Every state-altering financial action must produce an immutable audit event.
- **Enforcement:**
  - Events logged: `TransactionCaptured`, `TransactionApproved`, `TransactionRejected`, `BudgetModified`, `GoalModified`, `SettingsSecurityChanged`.
  - Log records: `(id, user_id, action, resource_id, previous_state, new_state, actor_ip, timestamp)`.
