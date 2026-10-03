# CASHLY V8 — DESIGN VISION & EXPERIENCE ARCHITECTURE

## 1. Product Statement

Cashly is not a passive receipt scanner or a generic expense dashboard. 

**Cashly is an intelligent financial operating system for the individual and modern household.**

It seamlessly closes the loop between **Capture**, **Review**, **Understanding**, **Planning**, **Prediction**, and **Autonomous Execution**:

```
CAPTURE ──► REVIEW ──► UNDERSTAND ──► PLAN ──► PREDICT ──► ACT
(Extension   (Needs      (Activity     (Budgets  (Money     (AI &
  & OCR)      Inbox)      & Analytics)  & Goals)   Twin)     Voice)
```

---

## 2. The Five Canonical Pillars

The core application shell is strictly anchored by five canonical pillars:

### 1. HOME (`/dashboard`)
- **Intent:** Immediate orientation and daily operational clearance.
- **Hero Anchor:** **Safe Headroom** (`SAFE_TO_SPEND`) — a forward-calculated liquid reserve indicating exactly what can be spent before month-end without endangering commitments or savings goals.
- **Supporting Telemetry:** Month-to-date burn velocity, 7-day upcoming commitments, recent anomalous charges, and high-confidence AI actions.

### 2. ACTIVITY (`/transactions`, `/transaction-inbox`, `/imports`)
- **Intent:** High-throughput financial ledger and review operations.
- **Sub-Tabs:** 
  - `Ledger`: dense, filterable financial transaction register with tabular numerals and instant side-sheet inspection.
  - `Needs Review`: focused inbox for unmatched or low-confidence captures with single-tap approval or batch dismissal.
  - `Imports`: multi-format statement parser (PDF/CSV/OCR) with visual matching progression.

### 3. PLAN (`/budgets`, `/subscriptions`, `/goals`, `/cashflow-calendar`)
- **Intent:** Proactive capital allocation and forward commitments.
- **Sub-Tabs:**
  - `Budgets & Limits`: category velocity guardrails with burn pacing indicators.
  - `Commitments & Bills`: recurring subscriptions, fixed obligations, trial cancellations, and annual contract tracking.
  - `Savings Goals`: milestone-driven savings targets with dynamic monthly contribution schedules.
  - `Cashflow Timeline`: calendar-based liquidity projection forecasting paychecks and recurring obligations.

### 4. ANALYZE (`/analytics`, `/money-twin`, `/reports`)
- **Intent:** Structural financial intelligence and predictive modeling.
- **Sub-Tabs:**
  - `Spending Patterns`: categorical distributions, merchant rankings, and month-over-month variances.
  - `Money Twin`: flagship deterministic trajectory simulation modeling month-end outcomes and What-If scenarios.
  - `Reports & Exports`: formal accounting statements and tax-ready CSV/JSON exports.

### 5. ASSIST (`/insights`)
- **Intent:** Contextual co-pilot and automated financial intelligence.
- **Features:**
  - Observational feed explaining anomalies with direct product deep links.
  - Weekly habit coach generating actionable behavioral nudges.
  - Full-duplex conversational voice interface for hands-free financial queries.
