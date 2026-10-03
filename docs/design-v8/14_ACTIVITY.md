# CASHLY V8 — PILLAR 2: MONEY ACTIVITY & LEDGER

## 1. Intent: High-Throughput Ledger Operations

The Activity workspace (`TransactionsPage.tsx`, `TransactionInboxPage.tsx`) provides high-density financial recording and reconciliation.

It is split into three unified sub-views:
1. **Ledger:** The canonical verified record of all income and expenses.
2. **Needs Review:** Staged purchases captured by the browser extension or OCR that await manual confirmation.
3. **Imports:** Multi-bank statement upload (PDF/CSV) with automatic column mapping and duplicate prevention.

---

## 2. Ledger Architecture

- **High-Density Summary Ribbon:** Top banner displays filtered count and total outflow sum with zero layout shift during real-time filtering.
- **Search & Filter Matrix:** Full-text search by merchant or description, multi-category selector, sorting dropdown, and statement export button.
- **Table Data Columns:**
  - Date (tabular, sorted descending)
  - Merchant name & verified avatar
  - Category pill badge
  - Tabular outflow / inflow amount (right-aligned)
  - Interactive action trigger (opens `TransactionSideSheet`)
