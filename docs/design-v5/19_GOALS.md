# CASHLY — SAVINGS GOALS & MILESTONES (V5)

**Classification:** Feature Specification (Authority #19)  
**Primary Route:** `/goals`  
**Core Purpose:** Track long-term financial ambitions with automated required monthly contribution calculations.  

---

## 1. Goal Telemetry & Calculations

For each target goal (e.g., Emergency Fund, House Down Payment, Travel), Cashly computes:
- **Funding Percentage:** Current saved amount divided by target amount.
- **Monthly Savings Requirement:**
  $$\text{Required Monthly Contribution} = \frac{\text{Target Amount} - \text{Current Saved}}{\text{Months Remaining to Deadline}}$$
- **Trajectory Forecast:** Identifies if current monthly deposit velocity will reach the goal on or before the target deadline.

---

## 2. Card Anatomy & Deposit Trigger

- Visual milestone meter with quarter checkpoints (25%, 50%, 75%, 100%).
- `[+ Quick Deposit]` button opening a fast-contribution modal directly crediting the goal.
- Filter pills: `[All Goals]`, `[Active]`, `[Completed]`.
