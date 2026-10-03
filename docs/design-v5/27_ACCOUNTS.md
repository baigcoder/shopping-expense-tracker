# CASHLY — BANK ACCOUNTS & NET WORTH (V5)

**Classification:** Feature Specification (Authority #27)  
**Primary Route:** `/cards?tab=accounts` (or `/accounts`)  
**Core Purpose:** Manage connected bank feeds, manual checking/savings accounts, and total Net Worth.  

---

## 1. Net Worth Header Telemetry

$$\text{Net Worth} = \sum \text{Assets (Checking, Savings, Investments)} - \sum \text{Liabilities (Credit Cards, Loans)}$$

- Total Assets tally with monthly growth delta.
- Total Liabilities tally with utilization breakdown.
- Net Worth bold figure in `tabular-nums`.

---

## 2. Account Grouping & Feed Management

Accounts are organized into clean collapsible panels:
- **Checking & Cash:** Liquid operating accounts feeding Safe Headroom.
- **Savings & Emergency Reserves:** High-yield savings accounts tied to Goals.
- **Credit Facilities:** Linked cards with outstanding balances.
- **Action Controls:** `[+ Link Bank via Plaid]`, `[+ Add Manual Account]`, `[Sync Balances]`.
