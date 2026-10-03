# 14 — PLAN: GOALS & CAPITAL ACCUMULATION
**Canonical Path:** `/docs/design-final/14_PLAN_GOALS_AND_ACCUMULATION.md`  
**Status:** CANONICAL MASTER  
**Route:** `/goals`  
**Components:** `GoalsPage.tsx`, `PlanNavigationTabs.tsx`

---

## 1. Capital Accumulation Philosophy

Goals are not passive wishlists. In Cashly, they represent deliberate capital ringfencing. Every goal is mathematically tied to the user's forward liquidity curve to ensure targets are hit without risking overdraft or default on committed bills.

---

## 2. Layout & Milestone Architecture

### A. Sovereign Roadmapping Header
- **Title**: `CAPITAL ACCUMULATION ROADMAP` in Syne display sans.
- **Badge**: `3 ACTIVE TARGETS` in Muted Sage (`#BBC7B1`).
- **Primary CTA**: `+ Establish Target` pill button.

### B. Aggregate Performance Bento
- **Total Capital Ringfenced**: `$18,500.00` across all vaults.
- **Estimated Completion**: Projected date based on current monthly contribution velocity.
- **Monthly Pacing Bar**: Live allocation meter comparing target contribution rate against actual net surplus.

### C. Goal Milestone Cards
- High-contrast cards with 24px corner geometry:
  - Goal Name & Category Badge (e.g. `Emergency Reserve Vault`, `Angel Investment Capital`, `Real Estate Equity`).
  - Target vs. Accumulated tabular figures (`$12,500 / $25,000`).
  - Mathematical progress bar with percentage indicator.
  - Interactive Deposit / Withdraw trigger pills.
