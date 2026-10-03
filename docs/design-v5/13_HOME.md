# CASHLY — PILLAR 1: HOME (COMMAND CENTER) (V5)

**Classification:** Screen Blueprint & Architectural Specification (Authority #13)  
**Primary Route:** `/dashboard`  
**Core Purpose:** Answer *"What is happening right now, and what matters today?"* within 5 seconds.  

---

## 1. Compositional Blueprint

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. FINANCIAL PULSE HEADER (3-Tile Bento)                               │
│    [ Total Balance ]      [ Monthly Spend ]      [ Safe Headroom ]     │
│    Rs 124,500.00          Rs 32,100.00           Rs 42,870.00          │
│    +4.2% vs last month    72% of monthly cap     Discretionary buffer  │
├────────────────────────────────────────────────────────────────────────┤
│ 2. ATTENTION & ACTION RAIL (High-Priority Real-Time Alerts)             │
│    [!] 3 transactions waiting in Review Inbox   ──> [Review Now]       │
│    [*] Utility Bill (Rs 4,600) due in 2 days    ──> [Mark Paid]        │
│    [#] Dining budget at 88% velocity pace       ──> [View Spend]       │
├────────────────────────────────────────────────────────────────────────┤
│ 3. MAIN DASHBOARD REGION (60/40 Asymmetric Split)                      │
│    COLUMN A (60% width)               │ COLUMN B (40% width)           │
│    ┌────────────────────────────────┐ ┌──────────────────────────────┐ │
│    │ Spending Pulse (14-Day Curve)  │ │ Next 7 Days Commitments      │ │
│    │ Real cumulative daily spend    │ │ Scheduled bills, SaaS trials │ │
│    │ Projected month-end line       │ │ Due dates & amounts          │ │
│    └────────────────────────────────┘ └──────────────────────────────┘ │
│    ┌────────────────────────────────┐ ┌──────────────────────────────┐ │
│    │ Savings Goals Progress         │ │ Linked Cards & Limits        │ │
│    │ Milestone meters & target pace │ │ Balances, limits, freeze     │ │
│    └────────────────────────────────┘ └──────────────────────────────┘ │
│                                       ┌──────────────────────────────┐ │
│                                       │ Contextual AI Action Card    │ │
│                                       │ "Cut 2 subscriptions to save │ │
│                                       │ Rs 1,400/mo toward your Goal"│ │
│                                       └──────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Safe Headroom Formula

Safe Headroom is a first-class mathematical construct:
$$\text{Safe Headroom} = \text{Liquid Cash Balance} - \text{Committed Bills Due (Next 30 Days)} - \text{Planned Savings Contributions}$$

It directly protects users from overspending discretionary cash before impending fixed obligations clear.
