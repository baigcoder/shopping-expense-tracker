# CASHLY V8 — PILLAR 1: HOME WORKSPACE

## 1. Intent & Information Hierarchy

The Home screen (`DashboardPage.tsx`) answers one fundamental executive question within 2 seconds of page load:
**"What is my safe spending limit today, and are any commitments at risk?"**

We eliminate equal-sized KPI grids in favor of an **Asymmetric Dominant Hero Hierarchy**:

```
┌─────────────────────────────────────────────────────────┬───────────────────────────┐
│ DOMINANT PRIMARY FINANCIAL HERO (65% width)             │ SECONDARY VELOCITY (35%)  │
│                                                         ├───────────────────────────┤
│ SAFE HEADROOM: Rs 42,870                                │ LIQUID CASH & CASH AT HAND│
│ "Safe to spend through month-end"                       │ Rs 124,500                │
│ Formula breakdown: Liquid Cash - Committed - Savings    ├───────────────────────────┤
│ Progress Bar: 42% of monthly headroom preserved        │ 30-DAY VELOCITY BURN      │
│                                                         │ Rs 2,450 / day            │
└─────────────────────────────────────────────────────────┴───────────────────────────┘
```

---

## 2. Supporting Telemetry Sections

1. **Needs Review Warning Ribbon:** If pending unposted purchases exist in the Extension Queue, an amber-accented banner renders with a single-click action to the review inbox.
2. **Upcoming Commitments & Fixed Bills:** 7-day chronological runway detailing imminent recurring obligations.
3. **Recent Activity Feed:** Dense ledger rows with tabular currency alignment and inline category pills.
4. **Contextual AI Tip:** Explains unusual spending anomalies and suggests a specific, actionable one-tap budget adjustment.
