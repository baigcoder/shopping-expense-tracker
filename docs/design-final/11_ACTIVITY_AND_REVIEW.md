# 11 — ACTIVITY & SOVEREIGN REVIEW TERMINAL
**Canonical Path:** `/docs/design-final/11_ACTIVITY_AND_REVIEW.md`  
**Status:** CANONICAL MASTER  
**Routes:** `/transaction-inbox` (Review Terminal), `/transactions` (Canonical Ledger), `/shopping-activity` (Import Provenance)  
**Components:** `TransactionInboxPage.tsx`, `TransactionsPage.tsx`, `ShoppingActivityPage.tsx`

---

## 1. The Sovereign Review Terminal (`/transaction-inbox`)

Traditional personal finance apps dump pending transactions into a generic table where items sit unreviewed forever. Cashly treats review as an **operational triage queue**—a sovereign inbox that operators clear to zero.

### Terminal UI Architecture:
- **Header**: `SOVEREIGN REVIEW TERMINAL` in Syne display sans with Cadmium Orange count tag (`3 PENDING REVIEW`).
- **Operational Filter Pills**: Rounded-full segment buttons (`All Needs Review`, `High Confidence`, `Uncategorized`, `Flagged Anomalies`).
- **Transaction Decision Cards**:
  - Raw bank string preserved for provenance (`AMZN MKTP US*2B71 09/28`).
  - Suggested merchant and tax-deductible category badge.
  - One-tap keyboard-accessible triage actions:
    - **Approve (Pill Button)**: Confirms category, moves transaction into canonical ledger.
    - **Split / Edit**: Opens multi-category split dialog.
    - **Dismiss / Exclude**: Flags non-reconciled items.
- **Zero Inbox State**: When queue reaches 0, a celebratory high-contrast graphic displays: *"All Transactions Verified. Books Are Sovereign."*

---

## 2. The General Ledger (`/transactions`)

- **High-Density Data Grid**: Clean rows separated by hairline dividers with monospaced tabular figures.
- **Search & Filter Rail**: Real-time debounce search, multi-account pill filters, date-range picker, and export dropdown.
- **Batch Processing**: Multi-row selection with floating batch actions (Re-categorize, Export CSV, Bulk Delete).
- **Provenance Logs**: In `/shopping-activity`, view raw CSV imports, receipt OCR artifacts, and browser extension captures with complete audit trails.
