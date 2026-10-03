# CASHLY — PILLAR 2: ACTIVITY (THE MONEY STREAM) (V5)

**Classification:** Screen Blueprint & Architectural Specification (Authority #14)  
**Primary Route:** `/transactions` (Sub-tabs: `ledger`, `inbox`, `imports`)  
**Core Purpose:** Fast, low-friction transaction triage, auditing, search, and document ingestion.  

---

## 1. Compositional Structure

Activity consolidates three previously fractured workflows into a single high-velocity surface:
1. **Sub-Tab 1: Canonical Ledger (`?tab=ledger`):** High-density searchable ledger with instant category pills and date filtering.
2. **Sub-Tab 2: Needs Review (`?tab=inbox`):** Staged queue holding unposted captures until human approval.
3. **Sub-Tab 3: Statement Imports (`?tab=imports`):** Drag-and-drop CSV column mapping and PDF statement OCR extraction.

---

## 2. Ledger Architecture & High-Density Table

- **Row Structure:**
  - Date (`MM/DD/YYYY` in micro typography).
  - Merchant logo/avatar + clean merchant name + original raw string (subdued).
  - Channel badge (`[Online Checkout]` or `[Physical POS]`).
  - Category pill with semantic indicator.
  - Payment instrument (e.g., `Amex Gold ••4012`).
  - Right-aligned amount in bold `tabular-nums` (green `+` for income, dark ink for expense).
- **Inspection Interaction:**
  - Clicking any row triggers `TransactionSideSheet.tsx` sliding smoothly from the right margin.
  - Keyboard navigation: Arrow Up/Down to navigate rows, `Enter` to open side-sheet, `Esc` to close.
