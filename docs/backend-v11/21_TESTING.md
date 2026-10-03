# Cashly Backend V11 — Testing Strategy & Verification Architecture

## 1. Testing Pyramid

```
                ┌────────────────┐
                │   E2E Tests    │
                ├────────────────┤
                │  Integration   │
                │  & API Tests   │
                ├────────────────┤
                │  Domain Logic  │
                │   Unit Tests   │
                └────────────────┘
```

1. **Domain Logic Unit Tests:**
   - `money.test.ts`: Floating-point tripwires, integer cents math, banker's rounding, currency safety.
   - `transactionStateMachine.test.ts`: Exhaustive matrix of legal vs illegal state transitions (`CAPTURED` -> `PENDING_REVIEW` -> `APPROVED`).
   - `dashboardMetrics.test.ts`: Mathematical validation of Safe-to-Spend, daily burn velocity, and runway days.
   - `analyticsDomainService.test.ts`: Spending summaries, monthly time buckets, category shares summing to 100%.

2. **Integration & Concurrency Tests:**
   - `concurrency.test.ts`: 10 parallel asynchronous promises fired simultaneously against a shared idempotency key. Asserts single mutation execution and 9 cache resolutions.
   - `idempotencyGuard.test.ts`: Cache expiry, key isolation, in-flight deduplication.
   - `candidateDedupe.test.ts`: SHA-256 fingerprint collision prevention and detection.
   - `supabase.test.ts`: Project ref parsing and fallback client creation.

3. **API Controller Tests:**
   - `transactionController.test.ts`: Authorization checks, list pagination, delete/update validations.
   - `authController.test.ts`: JWT issuance, invalid credentials rejection, password hashing.
   - `otpController.test.ts`: Rate limiting and token lifecycle.

---

## 2. Test Execution & Coverage Baseline

```bash
cd backend
npm run test:run
```

**Results:**
- **15 / 15 test files passing**
- **76 / 76 tests passing**
- **Zero test failures**
- **Full TypeScript strict typechecking pass (`npx tsc --noEmit`)**
