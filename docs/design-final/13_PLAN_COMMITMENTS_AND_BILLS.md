# 13 — PLAN: COMMITMENTS, BILLS & LIABILITIES
**Canonical Path:** `/docs/design-final/13_PLAN_COMMITMENTS_AND_BILLS.md`  
**Status:** CANONICAL MASTER  
**Route:** `/subscriptions`  
**Components:** `SubscriptionsPage.tsx`, `PlanNavigationTabs.tsx`

---

## 1. Locked Capital Governance

Recurring subscriptions, utilities, and debt obligations represent locked capital—funds that cannot be spent under any circumstances. Cashly classifies them under the Deep Burgundy token (`#80383D`) to communicate contractual permanence.

---

## 2. Layout & Key Metrics

### A. Metric Hero Cards
- **Annual Run-Rate Monolith (Deep Burgundy `#80383D`)**:
  - Heading: `LOCKED CAPITAL TIMELINE`.
  - Metric: `$14,820.00 / year` in recurring obligations.
  - Monthly Drain: `$1,235.00 / mo`.
- **Optimization Score Card (Deep Ink `#111111`)**:
  - Identified Zombie Subscriptions: 2 unused subscriptions ($48/mo total potential recovery).
  - One-tap cancellation assist chip.

### B. Recurring Calendar & Cadence Grid
- Chronological timeline of upcoming renewals over the next 30 days.
- Renewal cards featuring billing cycle tags (`Monthly`, `Annual`, `Quarterly`), linked payment instrument, and auto-renew alert toggle.
