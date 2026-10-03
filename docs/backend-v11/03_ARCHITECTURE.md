# CASHLY BACKEND V11 — DOMAIN-FIRST MODULAR MONOLITH ARCHITECTURE
**Document:** `/docs/backend-v11/03_ARCHITECTURE.md`  
**Execution Date:** October 4, 2026  
**Architect:** Principal Backend & Distributed Systems Engineer  
**Status:** CANONICAL BLUEPRINT FOR BACKEND V11

---

## 1. Architectural Blueprint: Modular Monolith

Cashly V11 explicitly rejects "architecture theater" (premature microservices, Kafka, distributed Kubernetes meshes). Instead, it adopts a high-velocity, high-integrity **Modular Monolith** organized strictly by business domains.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                HTTP / REST API                                  │
│             (Express, Rate Limiting, Helmet, CORS, Request ID Correlation)      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                               VALIDATION LAYER                                  │
│                 (Zod Schemas at System Boundaries — No Unchecked Body)          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                               SECURITY & AUTH                                   │
│              (Cryptographic JWT Verification, Tenant Scoping, Session)          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                DOMAIN SERVICES                                  │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┬─────────────────┐ │
│ │ Transactions │ Review Inbox │ Budgets      │ Money Twin   │ AI Grounding    │ │
│ ├──────────────┼──────────────┼──────────────┼──────────────┼─────────────────┤ │
│ │ Commitments  │ Goals        │ Cashflow     │ Analytics    │ Imports/OCR     │ │
│ └──────────────┴──────────────┴──────────────┴──────────────┴─────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│                           FINANCIAL INTEGRITY CORE                              │
│       • Money Value Object (Exact Integer Cents, Currency Mismatch Guards)      │
│       • Transaction State Machine (CAPTURED -> REVIEW -> APPROVED -> POSTED)    │
│       • Idempotency & Concurrency Coordinator (In-flight Mutex, Replay Cache)   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                          DATA PERSISTENCE & REALTIME                            │
│           • PostgREST User-Scoped Client (Dual Auth & RLS Enforcement)          │
│           • Canonical PostgreSQL Ledger (`public.transactions`)                │
│           • Committed-State Realtime Broadcasts                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Domain Boundaries & Responsibilities

| Business Domain | Primary Entities | Key Domain Rules | Outgoing Events |
| :--- | :--- | :--- | :--- |
| **Auth & Security** | `User`, `UserSession`, `EmailOTP` | Session derivation, token expiry, PKCE OAuth, security settings | `UserAuthenticated`, `SecurityModified` |
| **Ledger (Transactions)** | `MoneyTransaction`, `LedgerEntry` | Integer cents math, append-only history, reversal records | `TransactionPosted`, `TransactionReversed` |
| **Review Inbox** | `TransactionCandidate`, `MerchantRule` | Staged triage, SHA-256 deduplication, atomic approval | `TransactionCaptured`, `TransactionApproved`, `TransactionRejected` |
| **Budgets & Velocity** | `Budget`, `VelocityHeadroom` | Derived strictly from approved ledger spend within category & period | `BudgetThresholdExceeded`, `BudgetModified` |
| **Commitments & Bills** | `Subscription`, `Bill`, `Card` | Recurring cadence detection, trial end notification, spend lock | `TrialEndingSoon`, `SubscriptionRenewed` |
| **Goals & Vaults** | `Goal`, `Contribution` | Saved balances substantiated by ledger events, remaining calculations | `GoalMilestoneReached`, `GoalFunded` |
| **Cashflow & Runway** | `CashflowEvent`, `RunwayMetrics` | 4-tier projection (Actual, Committed, Planned, Projected) | `RunwayDeficitAlert` |
| **Money Twin Engine** | `SimulationScenario`, `WhatIfPlan` | Deterministic simulation baseline separated from Monte Carlo | `SimulationExecuted` |
| **AI & Assist Intelligence** | `AIContext`, `StructuredAction` | Read-only financial advisory; mutations require Zod validation | `AIActionAuthorized`, `AIInsightGenerated` |
| **Audit & Governance** | `AuditEvent`, `SystemDiagnostic` | Immutable append-only audit trail of all state-altering events | `AuditLogged` |

---

## 3. Thin Controller / Thick Domain Service Rule

Controllers in Cashly V11 follow a strict 5-step lifecycle:
1. **Extract & Correlate:** Retrieve request correlation ID (`x-request-id`) and authenticate caller.
2. **Validate Input:** Execute Zod validation against request body, params, and query.
3. **Derive Canonical Identity:** Bind `canonicalUserId = req.user.supabaseId || req.user.id`.
4. **Delegate to Domain Service:** Call domain business logic. Controllers contain zero raw database mutations or mathematical business logic.
5. **Serialize Output DTO:** Map internal entities to clean external DTOs, stripping sensitive internal metadata.
