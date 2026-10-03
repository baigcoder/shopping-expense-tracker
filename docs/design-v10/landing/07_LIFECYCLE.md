# 07 — Cashly Lifecycle Engine (V10)

## 1. Overview
The Cashly financial lifecycle represents the foundational difference between conventional personal finance tools and sovereign cashflow intelligence. Rather than relying on retroactive 3-day delayed bank scrapers, Cashly introduces a continuous, 6-stage lifecycle:
1. **01 CAPTURE**:
   - Silent browser companion intercepts checkout totals at the point of confirmation.
   - Zero bank credentials required; zero third-party data broker delays.
2. **02 REVIEW**:
   - Purchases arrive in an isolated staging queue (`TransactionInboxPage`).
   - Nothing touches the user's permanent ledger without explicit consent.
3. **03 UNDERSTAND**:
   - Approved transactions are instantly tagged and mapped to dynamic spending velocity curves.
4. **04 PLAN**:
   - Discretionary budgets and locked commitments (rent, subscriptions) update in real-time.
5. **05 PREDICT**:
   - Money Twin deterministic cashflow forecast recalculates month-end balances based on actual velocity.
6. **06 ACT**:
   - Contextual co-pilot surfaces concrete, executable action chips (capping categories, offsetting overages).

## 2. Component Implementation (`LifecycleStory.tsx`)
- **Pill Navigation**: Interactive 6-button pill dock with active indicator and stage numbering.
- **Asymmetric Canvas**:
  - Left panel: High-scale numeric watermark (`01`–`06`), uppercase title, and descriptive narrative.
  - Right panel: Dynamic interactive UI simulation that morphs based on the selected stage (Browser checkout HUD, Review Inbox swipe card, Velocity line chart, Envelope budget progress, Dark Money Twin forecast, AI Action chip interface).
