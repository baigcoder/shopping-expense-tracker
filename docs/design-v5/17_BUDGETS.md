# CASHLY — BUDGETS & VELOCITY PACING (V5)

**Classification:** Feature Specification (Authority #17)  
**Primary Route:** `/budgets`  
**Core Purpose:** Prevent budget overruns before they happen through calendar velocity comparisons.  

---

## 1. The Velocity Pace Engine

Traditional budgeting apps wait until the user exceeds 100% of their limit to issue an alert. Cashly introduces the **Velocity Pace Engine**:

$$\text{Pace Ratio} = \frac{\% \text{ Budget Spent}}{\% \text{ Days of Month Elapsed}}$$

- **Pace Ratio $\le 1.0$ (Normal / Healthy):** Spending is keeping pace with or below the calendar rate. Displayed in Emerald.
- **Pace Ratio between $1.0$ and $1.2$ (Watch):** Spending is accelerating faster than calendar days. Displayed in Amber (`[Pacing Fast]`).
- **Pace Ratio $> 1.2$ (Warning):** High risk of month-end budget exhaustion. Displayed with an explicit overrun forecast (`"Projected to exceed limit by Rs 4,200 at this rate"`).
- **Actual Spend $\ge$ Limit (Exceeded):** Crimson Red state with immediate suggestion to reallocate headroom.
