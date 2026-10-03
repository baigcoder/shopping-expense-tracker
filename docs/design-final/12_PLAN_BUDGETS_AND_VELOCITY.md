# 12 — PLAN: BUDGETS & BURN VELOCITY
**Canonical Path:** `/docs/design-final/12_PLAN_BUDGETS_AND_VELOCITY.md`  
**Status:** CANONICAL MASTER  
**Route:** `/budgets`  
**Components:** `BudgetsPage.tsx`, `PlanNavigationTabs.tsx`

---

## 1. Velocity Architecture & Philosophy

Budgeting in Cashly is not a guilt-inducing spreadsheet; it is an active **burn pace regulator**. Instead of static monthly caps, it continuously computes daily velocity and projected month-end overruns.

---

## 2. Visual & Structural Elements

### A. Sub-Navigation Architecture
- Integrated with `PlanNavigationTabs.tsx`: A rounded-full floating pill bar linking `/budgets`, `/subscriptions`, `/goals`, and `/cashflow-calendar`.
- Active state renders in Deep Ink (`#111111`) with crisp white text.

### B. Dominant Headroom Centerpiece (Cadmium Orange `#EE5024`)
- **Heading**: `BUDGETS & VELOCITY` in Syne 800 display.
- **Hero Card**: Solid Cadmium Orange block displaying total discretionary headroom:
  - Metric: `$3,420.00 Remaining` across all allocated envelopes.
  - Pace Indicator: `Burning at $114/day (On Track for $380 Surplus)`.
  - Proportional Allocation Progress Bar: Multi-colored progress segment mirroring the forensic benchmark (Pink spent, Burgundy committed, Orange safe).

### C. Category Envelopes Matrix
- Individual category cards featuring:
  - Category Glyph (Food & Dining, Technology & Tools, Travel & Transit, Health & Wellness).
  - Spend vs. Cap tabular figures (`$550.00 / $800.00`).
  - Days Remaining pacing benchmark bar.
  - Micro-action: One-tap limit adjustment.
