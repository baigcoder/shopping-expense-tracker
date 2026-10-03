# CASHLY BACKEND V11 — AUTHORITATIVE FINANCIAL CALCULATIONS
**Document:** `/docs/backend-v11/15_FINANCIAL_CALCULATIONS.md`  
**Execution Date:** October 4, 2026  
**Implementation:** `backend/src/utils/money.ts`, `backend/src/services/dashboardService.ts`, `backend/src/services/moneyTwinService.ts`

---

## 1. Monetary Unit & Precision Standard

All internal calculations execute using the **`Money` value object** in integer cents:
- **Base Precision:** `Cents = Math.round(decimal_amount * 100)`.
- **Rounding Strategy:** Banker's rounding (`half-even`) or `half-up` applied strictly at the presentation boundary.
- **Cross-Currency Summation:** Prohibited without explicit exchange rate conversion (`CurrencyMismatchError`).

---

## 2. Core Financial Metrics & Authoritative Formulas

### A. Safe-to-Spend (Discretionary Headroom)
The flagship metric answering: *"How much can I safely spend right now without jeopardizing my bills, savings goals, or forward runway?"*

$$\text{Safe-to-Spend} = \max\Big(0, \text{Monthly Income} - \text{Committed Bills} - \text{Active Goal Targets} - \text{Approved MTD Expenses}\Big)$$

- **Inputs:**
  - $\text{Monthly Income}$: Sum of approved income transactions for current month ($M$).
  - $\text{Committed Bills}$: Sum of recurring active subscriptions and bills due in month ($M$).
  - $\text{Active Goal Targets}$: Monthly required capital allocations for incomplete goals.
  - $\text{Approved MTD Expenses}$: Sum of approved expense transactions from day 1 to today.
- **Edge Cases:**
  - If income is unknown or zero, Safe-to-Spend evaluates against the user's monthly budget limit:
    $$\text{Safe-to-Spend}_{\text{budget}} = \max\Big(0, \text{Monthly Budget} - \text{Committed Bills} - \text{Approved MTD Expenses}\Big)$$
  - Returns `0` if obligations exceed income (never negative).

### B. Daily Burn Velocity
Measures the average discretionary capital departing the account per day.

$$\text{Burn Velocity} = \frac{\text{Approved MTD Expenses}}{\max(1, \text{Days Elapsed in Month})}$$

- **Edge Cases:**
  - Day 1: Divisor is clamped to $\max(1, 1) = 1$, preventing division by zero.
  - Zero spend: Velocity evaluates to `0.00`.

### C. Cashflow Runway (Forward Days to Zero Liquidity)
Measures the forward horizon before current liquidity is exhausted under current burn velocity.

$$\text{Runway Days} = \begin{cases} \infty & \text{if Burn Velocity} \le 0 \\ \Big\lfloor \frac{\text{Current Liquid Balance}}{\text{Burn Velocity}} \Big\rfloor & \text{if Burn Velocity} > 0 \end{cases}$$

- **Edge Cases:**
  - If velocity is zero, runway evaluates to `365+ Days` (or safe baseline) rather than crashing with `Infinity` or `NaN`.
  - Negative liquid balance: Clamped to `0 Days Runway` with immediate liquidity deficit alert.

### D. Budget Pace & Headroom Utilization
$$\text{Budget Pace \%} = \frac{\text{Approved Category Spend}}{\max(1, \text{Category Budget Amount})} \times 100$$
$$\text{Expected Month Elapsed \%} = \frac{\text{Current Day of Month}}{\text{Total Days in Month}} \times 100$$
$$\text{Pace Velocity} = \text{Budget Pace \%} - \text{Expected Month Elapsed \%}$$

- **Interpretation:**
  - $\text{Pace Velocity} > 0$: Spending faster than time is passing (over-pace warning).
  - $\text{Pace Velocity} \le 0$: On track or under budget.

### E. Goal Accumulation Progress
$$\text{Goal Progress \%} = \min\left(100, \frac{\text{Substantiated Contributions}}{\text{Target Amount}} \times 100\right)$$
$$\text{Required Monthly Deposit} = \frac{\max(0, \text{Target} - \text{Saved})}{\max(1, \text{Months Until Deadline})}$$
