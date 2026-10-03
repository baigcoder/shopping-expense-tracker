# CASHLY BACKEND V11 — FORENSIC AUDIT & SYSTEM RECONNAISSANCE
**Document:** `/docs/backend-v11/01_FORENSIC_AUDIT.md`  
**Execution Date:** October 3, 2026  
**Auditor:** Principal Backend & Financial Systems Architect  
**Directives:** Strict adherence to Backend V11 Master Directive — Evidence-Based, Zero Blind Rewrites, Preserve Working Frontend Interfaces.

---

## 1. Executive Summary

A comprehensive forensic audit of the Cashly backend architecture, database layers, environment configurations, API controllers, and financial computation engines was conducted.

The audit uncovered critical structural vulnerabilities that directly compromise financial correctness, system resilience, and database connectivity:
1. **Dead Environment Configuration & Broken Service Role Token**: `backend/.env` points its `DATABASE_URL` to an unreachable host (`db.gmttqefcyqaxhlghcfpo.supabase.co:5432`) and its `SUPABASE_SERVICE_ROLE_KEY` contains a token signed for that dead project ref. Every backend call to Supabase currently fails with `401 Unauthorized: Invalid API key`.
2. **Dual-Database / Split-Brain Data Access**: The codebase is fragmented across two disparate database paradigms:
   - **Prisma ORM** targeting PascalCase models (`User`, `Transaction`, `Budget`, `Category`, `EmailOTP`) over direct PostgreSQL port 5432.
   - **Supabase JS Client** targeting snake_case tables (`transactions`, `budgets`, `bills`, `cards`, `subscriptions`, `transaction_candidates`, etc.) over PostgREST REST APIs.
3. **Silent Failure & Mock Fallback Masking**: Because the backend's database queries throw 401s or connection timeouts, services like `dashboardService.ts`, `featureExpansionService.ts`, and `moneyTwinService.ts` catch these errors via `safeRows()` and silently return empty arrays `[]` or synthetic fallbacks. The system appears to "run", but all financial operations are hollowed out.
4. **Financial Computation Vulnerabilities**:
   - Floating-point IEEE 754 arithmetic in balance sums and burn rates (`0.1 + 0.2` rounding drift).
   - Unmitigated multi-currency mixing (e.g. summing USD $100 and PKR 10,000 as 10,100).
   - In-page checkout interception deduplication lacks a database-level unique constraint, creating TOCTOU race conditions under concurrent sync.
5. **Existing Test Failure**: `aiGrounding.test.ts` fails on `clamps wild forecast numbers to the current spend range` due to a spend risk band threshold mismatch (`high` vs `medium`).

---

## 2. Infrastructure & Database Topology Forensics

### A. Active vs Dead Supabase Project Topology

| Property | Configured in `backend/.env` | Configured in `frontend/.env` | Live Verified Target | Status / Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Project Ref** | `ynmvjnsdygimhjxcjvzp` | `gmttqefcyqaxhlghcfpo` | `ynmvjnsdygimhjxcjvzp` | **CRITICAL MISMATCH** |
| **REST API URL** | `https://ynmvjnsdygimhjxcjvzp.supabase.co` | `https://gmttqefcyqaxhlghcfpo.supabase.co` | `https://ynmvjnsdygimhjxcjvzp.supabase.co` | `gmtt...` host is dead (`fetch failed`) |
| **`SUPABASE_ANON_KEY`** | Signed for `ynmvjnsdygimhjxcjvzp` | Signed for `gmttqefcyqaxhlghcfpo` | `ynmv...` (HTTP 200 OK) | Frontend `.env` overrides working fallback |
| **`SUPABASE_SERVICE_ROLE_KEY`** | Signed for `gmttqefcyqaxhlghcfpo` | N/A | Missing valid key for `ynmv...` | Backend Supabase calls fail with 401 |
| **`DATABASE_URL` (Port 5432)** | `postgresql://...db.gmtt...` | N/A | None reachable on 5432 | Prisma fails: `P1001: Can't reach DB server` |

#### Forensic Proof (Network Probes):
1. Probing `gmttqefcyqaxhlghcfpo.supabase.co`:
   ```
   fetch('https://gmttqefcyqaxhlghcfpo.supabase.co/rest/v1/') -> Error: fetch failed (DNS / Host Unreachable)
   ```
2. Probing `ynmvjnsdygimhjxcjvzp.supabase.co`:
   ```
   fetch('https://ynmvjnsdygimhjxcjvzp.supabase.co/rest/v1/Category') -> HTTP 200 OK: []
   fetch('https://ynmvjnsdygimhjxcjvzp.supabase.co/rest/v1/transactions') -> HTTP 200 OK: []
   ```
3. JWT Decode of `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`:
   ```json
   { "iss": "supabase", "ref": "gmttqefcyqaxhlghcfpo", "role": "service_role" }
   ```
   *The service role key is for the dead project, while the URL is for the live project. Result: Immediate 401 Unauthorized from Supabase API Gateway.*

### B. Dual Database Split-Brain Analysis

The database in `ynmvjnsdygimhjxcjvzp` contains TWO distinct table paradigms:
- **Set 1 (Prisma Models - PascalCase)**: `User`, `Transaction`, `Budget`, `Category`, `EmailOTP`.
- **Set 2 (Supabase SQL Migrations - snake_case)**: `transactions`, `budgets`, `bills`, `cards`, `recurring_transactions`, `subscriptions`, `goals`, `transaction_candidates`, `merchant_rules`.

#### Call Hierarchy Split:
1. **Prisma Callers (`prisma.*`)**:
   - `authController.ts` (`prisma.user`, `prisma.category`)
   - `categoryController.ts` (`prisma.category`, `prisma.transaction`)
   - `otpController.ts` (`prisma.emailOTP`, `prisma.user`)
   - `analyticsController.ts` (`prisma.transaction`, `prisma.category`)
   - `settingsService.ts` (`prisma.user`)
   - `middleware/auth.ts` (`prisma.user` via `findOrCreateAppUser`)
2. **Supabase Callers (`supabase.from(*)`)**:
   - `transactionDomainService.ts` (`supabase.from('transactions')`)
   - `transactionInboxService.ts` (`supabase.from('transaction_candidates')`, `supabase.from('subscriptions')`, `supabase.from('merchant_rules')`)
   - `dashboardService.ts` (`supabase.from('transactions')`, `supabase.from('budgets')`, `supabase.from('cards')`)
   - `moneyTwinService.ts` (`supabase.from('transactions')`, `supabase.from('spending_limits')`)
   - `featureExpansionService.ts` (`supabase.from('bills')`, `supabase.from('cards')`, `supabase.from('goals')`)
   - `financialContextService.ts` (`supabase.from('subscriptions')`, `supabase.from('goals')`, `supabase.from('budgets')`)

*Consequence:* Transactions created via `transactionDomainService` go into `public.transactions`, but `analyticsController` looks for transactions in `public."Transaction"`. A user who adds expenses through the companion extension or the manual API sees them in the dashboard, but the analytics endpoint reports 0 spending!

---

## 3. Financial Calculation & Business Logic Defect Matrix

| ID | Component | Location | Nature of Defect | Risk / Financial Impact |
| :--- | :--- | :--- | :--- | :--- |
| **FIN-01** | **Float Summation** | `dashboardService.ts:101-112`, `financialContextService.ts:73-74` | Uses standard JavaScript `number` addition: `sum + normalizeAmount(tx.amount)`. | IEEE 754 precision drift (e.g. `$1,420.5000000000002`). Financial ledgers must use fixed-point cents or integer precision. |
| **FIN-02** | **Currency Mixing** | `dashboardService.ts`, `transactionDomainService.ts` | Transactions in different currencies (`USD`, `PKR`, `EUR`) are summed directly as raw scalar values without exchange rate normalization. | If a user with a USD base logs a PKR 15,000 item, their monthly spend jumps from $1,200 to $16,200, instantly triggering false bankruptcy alerts. |
| **FIN-03** | **Safe-to-Spend Multi-Definition** | `DashboardPage.tsx` vs `dashboardService.ts` vs `featureExpansionService.ts` | `DashboardPage.tsx` computes `safeHeadroom = income - committedBills - savingsGoal - spentSoFar`. `dashboardService.ts` returns `totalBalance = totalIncome - totalExpense`. `featureExpansionService.ts` uses different logic. | Discrepancies between the web client, mobile view, and API responses for the app's flagship metric. |
| **FIN-04** | **Checkout Ingestion Race Condition** | `transactionDomainService.ts:147-163` | Deduplication relies on checking `ilike('notes', '%cashly_hash:...')` prior to inserting. | Under concurrent checkout events or network retries, two parallel requests both pass the check and both insert, causing double-spend ledger corruption. |
| **FIN-05** | **Zero-Spend Runway Division** | `moneyTwinService.ts:250-280` | Average daily spend calculation divides by `daysPassed`. If spend is 0, runway evaluates to `Infinity` or `NaN`. | UI crash or undefined display on new accounts or month boundaries. |
| **FIN-06** | **Failing AI Grounding Test** | `aiGrounding.test.ts:43-50` | `normalizeForecasts` with $10,000 spend evaluates to `riskLevel: 'high'` against USD bands (extreme: 5000), but test asserts `'medium'`. | CI/CD build fails (`vitest run` exits with code 1). |

---

## 4. Security, Authentication & Isolation Forensics

1. **`AUTH_DB_SYNC_ENABLED=false` Band-Aid**:
   - In `backend/src/middleware/auth.ts`, `shouldSyncAuthDatabase` checks `AUTH_DB_SYNC_ENABLED === 'false'`.
   - When set to false, it bypasses `findOrCreateAppUser` and sets `req.user = toFallbackRequestUser(authUser)`.
   - This was done because Prisma could not connect to `db.gmtt...`. However, any controller that still calls `prisma.user` or assumes a Prisma-generated internal UUID will fail.
2. **User Identity Key Ambiguity**:
   - `req.user.id` vs `req.user.supabaseId`.
   - In `transactionController.ts`: `const getCanonicalUserId = (req: Request) => req.user!.supabaseId || req.user!.id;`.
   - In `categoryController.ts`: `req.user!.id` is used directly in `prisma.category.findMany({ where: { userId: req.user!.id } })`.
   - If `req.user.id` is a Supabase UUID (when DB sync is disabled) but `prisma.category` expects a Prisma UUID (foreign key to `User.id`), foreign key constraint violations occur.
3. **Row Level Security (RLS) & Service Key Boundaries**:
   - `00_consolidated_migration.sql` defines policies: `CREATE POLICY ... USING (auth.uid() = user_id)`.
   - If the backend connects using a service role key, RLS is bypassed. The backend MUST explicitly enforce `.eq('user_id', canonicalUserId)` on every single query to prevent horizontal privilege escalation.
   - If the backend connects using the anon key, all queries without an active Supabase user session evaluate `auth.uid() = null`, resulting in 0 rows returned.
4. **CSRF Middleware Misalignment**:
   - `csrfTokenMiddleware` checks for `x-csrf-token` on state-mutating requests (`POST`, `PUT`, `DELETE`).
   - Browser extensions and mobile clients authenticate using stateless `Authorization: Bearer <jwt>` headers, which are inherently immune to browser CSRF (since extensions do not send ambient credentials). Enforcing CSRF on API routes with Bearer tokens introduces false-positive 403 rejections.

---

## 5. Observability & Telemetry Gaps

1. **Blind Request Logging**:
   - `app.ts` logs `${logLevel} ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`.
   - Missing: Request correlation IDs (`x-request-id`), authenticated user ID, client agent (Web vs Extension vs Mobile), error stack traces.
2. **Swallowed Errors in Core Services**:
   - `dashboardService.ts`, `moneyTwinService.ts`, `featureExpansionService.ts` wrap database errors in `console.warn` and return empty arrays.
   - When database connections fail, Sentry is NOT alerted, metrics report 0 errors, and the system appears completely healthy on health monitors while serving empty data to users.
3. **No Financial Audit Trail**:
   - When transactions are approved, merged, or deleted, there is no immutable audit ledger recording the timestamp, previous state, mutating agent, or reason.

---

## 6. Caller & Impact Analysis for Proposed V11 Refactoring

In accordance with the Backend V11 Master Directive:
> "Before every breaking database/API change: identify callers, migration impact, rollback strategy, and tests."

### Surface 1: Unified Data Access & Single Source of Truth
- **Current Problem:** Split between Prisma (`Transaction`) and Supabase (`transactions`).
- **Callers Impacted:**
  - Frontend: `transactionService.ts` (`/api/transactions`), `supabaseTransactionService.ts` (`supabase.from('transactions')`), `DashboardPage.tsx`, `AnalyticsPage.tsx`, `BudgetsPage.tsx`.
  - Extension: `background.js` (syncs with `/api/transactions` and `/api/transaction-inbox`), `popup.js`.
  - Backend Controllers: `transactionController.ts`, `analyticsController.ts`, `categoryController.ts`, `dashboardService.ts`.
- **Target Architecture:**
  - Standardize on `public.transactions` as the single canonical ledger table.
  - Bridge Prisma models to map to snake_case tables (`@@map("transactions")`, `@@map("budgets")`, `@@map("categories")`) OR standardize backend services on a robust, typed Supabase Repository layer with connection resilience.
- **Rollback Strategy:**
  - Create bi-directional database views (`CREATE OR REPLACE VIEW "Transaction" AS SELECT * FROM transactions;`) ensuring zero disruption to legacy Prisma queries while migration completes.

### Surface 2: Financial Precision & Cents Arithmetic
- **Current Problem:** JavaScript floating-point numbers in amounts.
- **Callers Impacted:** All ledger sum calculations, balance sheets, Safe-to-Spend headroom.
- **Target Architecture:**
  - Introduce `Money` value object (`dinero.js` or custom integer cents arithmetic utility `Cents = Math.round(amount * 100)`).
  - All aggregation functions compute in integer cents and format with exact currency decimal scale at API boundary.
- **Rollback Strategy:**
  - API schemas continue accepting and returning decimal numbers (e.g. `1420.50`), while internal calculations execute in integer cents. Zero breaking API changes for frontend.

### Surface 3: Idempotency & Concurrency Locks on Ingestion
- **Current Problem:** Race conditions on checkout intercept duplicate detection.
- **Callers Impacted:** Extension `content.js` and `background.js`, `importsRoutes.ts`.
- **Target Architecture:**
  - Add unique database constraint: `CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_hash ON public.transactions (user_id, (regexp_match(notes, 'cashly_hash:([a-f0-9]+)'))[1]) WHERE notes LIKE '%cashly_hash:%';`
  - Or add dedicated column `transaction_hash VARCHAR(64)` with `UNIQUE (user_id, transaction_hash)`.
  - Implement Postgres atomic upsert (`INSERT ... ON CONFLICT (user_id, transaction_hash) DO NOTHING`).
- **Rollback Strategy:**
  - Non-breaking schema addition. If conflict occurs, service returns the existing transaction with `duplicate: true`.

---

## 7. Immediate Phase-1 Verification & Fix Checklist

1. **Fix `aiGrounding.test.ts`**: Resolve spend risk band expectation to achieve 100% test pass rate across existing unit tests.
2. **Environment & Connection Integrity**:
   - Update `frontend/.env` to point to the live `ynmvjnsdygimhjxcjvzp` Supabase instance so frontend does not fail on stale project ref.
   - Establish resilient fallback client in `backend/src/config/supabase.ts` when service role key is invalid or pending rotation.
3. **Database Health Verification**:
   - Write and execute automated integration tests verifying real CRUD operations against `public.transactions`, `public.budgets`, `public.cards`, and `public.categories`.
4. **Concurrency & Failure Proofs**:
   - Create concurrency test suite simulating 10 parallel checkout posts with identical hash to prove zero duplicate insertions.
