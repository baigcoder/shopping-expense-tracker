# CASHLY — REVIEW INBOX & CANDIDATE TRIAGE (V5)

**Classification:** Operational Workflow Specification (Authority #15)  
**Primary Route:** `/transaction-inbox` (or `/transactions?tab=inbox`)  
**Core Purpose:** Attention-first staging ground holding unposted transactions until human approval.  

---

## 1. The Review-First Philosophy

In Cashly, transactions intercepted by the browser extension or uploaded via statement OCR do **not** blindly dump into the balance. They wait in a quiet, zero-pressure triage queue.

- **Unposted State:** Unreviewed candidates do not impact ledger balances or budget limits until approved.
- **Batch Velocity:** Multi-select checkboxes allow power users to review 10 purchases with one click (`Approve All (10)`).
- **Rule Creation:** Approving or editing a merchant triggers an optional one-click rule creation prompt (*"Always categorize 'Daraz.pk' as Shopping?"*).

---

## 2. Row Anatomy & Decision Controls

Each candidate item presents immediate, high-contrast actions:
- `[Approve ✓]` (Primary Rose Button): Posts immediately to the canonical ledger and triggers real-time balance recalculation.
- `[Edit ✎]`: In-line draft editing of description, category, and amount.
- `[Merge ⇄]`: Detects potential duplicates from bank imports and merges candidates.
- `[Dismiss ✕]`: Rejects unneeded test purchases or canceled orders without polluting financial records.
