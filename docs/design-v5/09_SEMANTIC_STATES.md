# CASHLY — MASTER SEMANTIC STATES SPECIFICATION (V5)

**Classification:** State & Feedback Specification (Authority #9)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. The Multi-Sensory State Rule

Never communicate financial state using color alone. Every financial state must be expressed through a cohesive triad:
`HUE + SEMANTIC ICON + EXPLICIT LABEL`

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CASHLY SEMANTIC STATE ENGINE                         │
├──────────────┬─────────────┬──────────────┬────────────────────────────┤
│ State        │ Color Token │ Icon         │ Concrete Example           │
├──────────────┼─────────────┼──────────────┼────────────────────────────┤
│ 1. Normal    │ Neutral Ink │ CheckCircle2 │ Budget at 42% pace         │
│ 2. Healthy   │ Emerald     │ TrendingUp   │ Net Headroom +Rs 14,200    │
│ 3. Watch     │ Amber       │ Clock        │ Bill due in 36 hours       │
│ 4. Warning   │ Amber/Rose  │ AlertTriangle│ Spending velocity at 88%   │
│ 5. Exceeded  │ Crimson Red │ ShieldAlert  │ Budget overrun by Rs 2,400 │
│ 6. AI Agent  │ Purple      │ Sparkles     │ Pattern anomaly detected   │
└──────────────┴─────────────┴──────────────┴────────────────────────────┘
```

---

## 2. Threshold Engine & Transition Triggers

1. **Category Budgets:**
   - `< 70% of velocity pace`: State is **Normal / Healthy**.
   - `70% - 90% of velocity pace`: State shifts to **Watch** (Amber badge `[Pacing Fast]`).
   - `> 90% of velocity pace`: State shifts to **Warning** (Amber fill, alert banner).
   - `≥ 100% of cap limit`: State shifts to **Exceeded / Danger** (Crimson Red `[Exceeded Limit]`).
2. **Upcoming Obligations (Commitments):**
   - `> 7 days away`: Subtle neutral date marker.
   - `2 - 7 days away`: Watch state (Amber calendar pill).
   - `< 48 hours away`: High-priority Attention Rail alert (`[Due Tomorrow: Pay Now]`).
   - `Past due date`: Crimson Red Danger alert with immediate action CTA.
3. **Empty States:**
   - Every empty state must provide:
     1. Visual illustration / icon.
     2. Plain-language explanation (*"No unreviewed purchases"*).
     3. Immediate forward action button (*"Import Bank Statement"* or *"Add Transaction"*).
