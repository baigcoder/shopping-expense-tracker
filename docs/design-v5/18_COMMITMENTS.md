# CASHLY — UNIFIED COMMITMENTS MANAGER (V5)

**Classification:** Feature Specification (Authority #18)  
**Primary Route:** `/subscriptions` (Sub-tabs: `all`, `subscriptions`, `bills`, `trials`)  
**Core Purpose:** Bring all recurring outflows—subscriptions, utility bills, rent, and free trials—into one authoritative schedule.  

---

## 1. Unified Commitment Architecture

Cashly eliminates the unnatural fragmentation of having bills on one screen, subscriptions on a second screen, and reminders on a third. The **Commitments Manager** unifies:
1. **SaaS & Entertainment Subscriptions:** Netflix, Spotify, AWS, GitHub.
2. **Fixed Living Costs:** Rent, mortgage, utility bills, electricity, water, internet.
3. **Expiring Free Trials:** 7-day and 14-day software trials with automated cancellation reminders before billing triggers.

---

## 2. Summary Telemetry Header

- **Total Committed Monthly Outflow:** Bold, right-aligned figure in `tabular-nums`.
- **Active Streams Count:** Total recurring obligations.
- **Impending Bills (< 7 Days):** Aggregated total due in the immediate cashflow window.
- **Trial Risk Watch:** Highlighted banner for free trials expiring in the next 14 days.
