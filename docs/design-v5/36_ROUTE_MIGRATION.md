# CASHLY — ROUTE MIGRATION & IA CONSOLIDATION (V5)

**Classification:** Information Architecture & Routing Specification (Authority #36)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Route Consolidation Mapping

To achieve a clean 5-pillar structure while preventing dead bookmarks, legacy paths are cleanly redirected:

| Legacy Route | Target Canonical Route | Purpose & Behavioral Result |
| :--- | :--- | :--- |
| `/expenses` | `/transactions` | Consolidates duplicate expense table into the canonical ledger. |
| `/bills` | `/subscriptions?tab=bills` | Merges standalone utility bills into Unified Commitments. |
| `/reminders` | `/subscriptions?tab=trials` | Directs liability reminders to the free-trial countdown tab. |
| `/recurring` | `/subscriptions` | Retires placeholder recurring screen. |
| `/accounts` | `/cards?tab=accounts` | Merges disconnected bank accounts into Payment Instruments. |
| `/setting` | `/settings` | Resolves singular typo path to canonical plural `/settings`. |
| `/plan` | `/budgets` | Pillar 3 root path defaults to Budgets & Limits. |
| `/analyze` | `/analytics` | Pillar 4 root path defaults to Spending Patterns. |
| `/assist` | `/insights` | Pillar 5 root path defaults to AI Co-Pilot Hub. |

---

## 2. Unmounted Import Cleanup

The following unmounted imports in `App.tsx` are decommissioned to reduce bundle overhead:
- `ExpenseDetailsPage` (Replaced by `TransactionSideSheet.tsx`).
- `BillsPage`, `BillRemindersPage`, `RecurringPage` (Replaced by `SubscriptionsPage.tsx`).
- `AccountsPage` (Replaced by `CardsPage.tsx`).
- `AITestPage` (Development-only test route).
- `ExtensionGate` (Retired blocking wrapper).
