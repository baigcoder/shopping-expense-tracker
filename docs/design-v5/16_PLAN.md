# CASHLY — PILLAR 3: PLAN (COMMITMENTS, LIMITS & CASHFLOW) (V5)

**Classification:** Pillar Architecture & Screen Specifications (Authority #16)  
**Primary Route:** `/plan` (defaults to `/budgets`)  
**Core Purpose:** Answer *"What is already spoken for, and how am I pacing against my limits?"*  

---

## 1. Unified Pillar Structure

Plan answers forward-looking financial questions across four synchronized sub-views:
1. **Budgets (`/budgets`):** Category spending caps with daily velocity pace calculations and overrun warnings.
2. **Commitments (`/subscriptions`):** Unified manager consolidating SaaS subscriptions, utility bills, rent, and free trials.
3. **Savings Goals (`/goals`):** Milestone targets with automated pace calculations and deposit tracking.
4. **Cashflow Calendar (`/cashflow-calendar`):** Monthly timeline displaying payday inflows, bill obligations, and spending intensity.

Shared sub-navigation is anchored via `PlanNavigationTabs.tsx` across all four screens.
