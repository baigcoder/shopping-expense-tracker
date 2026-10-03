# 15 — PLAN: CASHFLOW TIMELINE & LIQUIDITY RUNWAY
**Canonical Path:** `/docs/design-final/15_PLAN_CASHFLOW_TIMELINE.md`  
**Status:** CANONICAL MASTER  
**Route:** `/cashflow-calendar`  
**Components:** `CashflowCalendarPage.tsx`, `PlanNavigationTabs.tsx`

---

## 1. Liquidity Runway Dynamics

The Cashflow Timeline projects daily cash balance over a 30 to 90-day forward horizon. By plotting scheduled payroll deposits against bill debits, it identifies danger zones weeks before they occur.

---

## 2. Calendar Grid & Timeline UI

### A. Period Runway Header
- **Title**: `LIQUIDITY RUNWAY & MOVEMENT` in Syne display bold.
- **Runway Card (Deep Ink `#111111`)**:
  - Displays Lowest Projected Balance: `$1,820.00 on Oct 24` (prior to client invoice settlement).
  - Cushion Margin: Safe above zero threshold.

### B. Interactive 30-Day Calendar Grid
- Each calendar day cell displays:
  - Projected closing liquidity balance in monospaced font.
  - Color-coded event markers:
    - Green dot: Inflow deposit (Payroll, Dividend, Transfer).
    - Red dot: Contractual bill debit (Rent, Insurance).
    - Orange dot: Discretionary spend benchmark.
  - Hover / Tap interaction reveals itemized cashflow breakdown for that date.
