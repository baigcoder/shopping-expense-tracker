# CASHLY — DESIGN VISION & EXPERIENCE CHARTER (V5)

**Classification:** Master Experience Charter (Authority #3)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. The Core Product Narrative

Cashly is structured around a continuous, self-reinforcing financial operating lifecycle:

```
[ CAPTURE ] ──> Silent, zero-friction background detection from browser & imports
     │
[ REVIEW ]  ──> Human-in-the-loop triage inbox; nothing posts without your consent
     │
[ UNDERSTAND ] > Canonical ledger & question-oriented analytics (Where did it go?)
     │
[ PLAN ]    ──> Forward commitments, spending limits & velocity pacing
     │
[ PREDICT ] ──> Money Twin simulation (Where will my month end if pace continues?)
     │
[ ACT ]     ──> Embedded AI Co-Pilot executing structured financial workflows
```

---

## 2. The Three Universal Questions

Every single screen across Cashly must answer three fundamental human questions within 5 seconds of viewing:

1. **WHAT IS HAPPENING?**
   - Clear, authoritative numbers: Net Headroom, unencumbered balance, current monthly burn rate, pending unreviewed purchases.
2. **WHAT DOES IT MEAN?**
   - Contextual meaning: How this spending compares to last month, whether daily velocity will cause a budget breach before month-end, which subscriptions are due this week.
3. **WHAT SHOULD I DO?**
   - Concrete, high-leverage actions: `[Review 3 Purchases]`, `[Protect Bill Headroom]`, `[Adjust Dining Limit]`, `[Deposit to Emergency Goal]`.

---

## 3. Data & Interaction Continuity (One System Rule)

Cashly is not a disconnected suite of separate micro-tools. It operates as a singular reactive state machine:

- **Cross-Pillar Reactive Synchrony:**
  - When a transaction candidate is approved in **Activity** (`/transactions?tab=inbox`):
    1. It immediately updates the posted ledger in **Activity** (`/transactions?tab=ledger`).
    2. It immediately adjusts the Available Cash, Monthly Spend, and Net Headroom in **Home** (`/dashboard`).
    3. It updates the category burn velocity and headroom bars in **Plan** (`/budgets`).
    4. It updates the spending patterns and merchant distribution in **Analyze** (`/analytics`).
    5. It recalibrates the Money Twin end-of-month projection in **Analyze** (`/money-twin`).
    6. It updates the contextual telemetry in **Assist** (`/insights`).
- **Universal Inspection Pattern:**
  - Whether a transaction is clicked from the Dashboard, the Ledger, the Analytics breakdown, or an AI recommendation card, it opens the exact same **Contextual Side-Sheet** (`TransactionSideSheet.tsx`) with identical actions and metadata.
