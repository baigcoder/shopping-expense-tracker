# CASHLY BACKEND V11 — TRANSACTION LIFECYCLE & STATE MACHINE
**Document:** `/docs/backend-v11/05_TRANSACTION_STATE_MACHINE.md`  
**Execution Date:** October 4, 2026  
**Implementation:** `backend/src/domain/transactionStateMachine.ts`  
**Tests:** `backend/src/domain/__tests__/transactionStateMachine.test.ts` (100% Passing)

---

## 1. Lifecycle State Machine Graph

```
                                  TRANSACTION LIFECYCLE
                                  
                                    [ CAPTURED ]
                                         │
                        ┌────────────────┴────────────────┐
                        ▼                                 ▼
               [ PENDING_REVIEW ]                 [ RULE_APPLIED ]
                        │                                 │
         ┌──────────────┼──────────────┬───────────┐      │
         ▼              ▼              ▼           ▼      ▼
    [ APPROVED ]   [ REJECTED ]   [ MERGED ]   [ SPLIT ] ───▶ [ APPROVED ]
         │              │              │           │
         ▼              ▼              ▼           ▼
      TERMINAL       TERMINAL       TERMINAL    TERMINAL
      (Posted to     (Archived)    (Linked to   (Spawned
       Ledger)                      Existing)    Children)
```

---

## 2. Transition Rules & Pre-conditions

| State | Allowed Transitions | Invariants Checked | Post-transition Actions |
| :--- | :--- | :--- | :--- |
| **`CAPTURED`** | `PENDING_REVIEW`, `RULE_APPLIED`, `REJECTED` | SHA-256 deduplication check; User ownership verification | Staged in `transaction_candidates` |
| **`PENDING_REVIEW`** | `APPROVED`, `REJECTED`, `MERGED`, `SPLIT`, `RULE_APPLIED` | Status is strictly `pending`; User authentication | Dispatches review action |
| **`RULE_APPLIED`** | `APPROVED`, `PENDING_REVIEW`, `REJECTED` | Rule ownership; Category validity | Auto-approve or user review |
| **`APPROVED`** | *None (Terminal)* | Must not already be approved; Ledger row created atomically | Posts to `public.transactions`; Emits `broadcastPaymentCapture` |
| **`REJECTED`** | *None (Terminal)* | Status is `pending`; User ownership | Updates status to `rejected`; Cache invalidated |
| **`MERGED`** | *None (Terminal)* | Target transaction exists and belongs to user | Links candidate to target transaction |
| **`SPLIT`** | *None (Terminal)* | Sum of split items equals candidate amount | Creates child candidate records |

---

## 3. Illegal Transition Handling

Any attempt to execute an invalid transition (e.g., `APPROVED` → `PENDING_REVIEW`, or `REJECTED` → `APPROVED`) immediately throws an `IllegalStateTransitionError`:

```typescript
if (!this.canTransitionTo(targetState)) {
    throw new IllegalStateTransitionError(
        this.state,
        targetState,
        `Allowed next states are: ${Array.from(LEGAL_TRANSITIONS[this.state]).join(', ')}`
    );
}
```

The error is caught by `errorHandler.ts`, mapped to `HTTP 409 Conflict` or `HTTP 400 Bad Request`, and logged with correlation ID.
