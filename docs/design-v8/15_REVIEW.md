# CASHLY V8 — NEEDS REVIEW INBOX ARCHITECTURE

## 1. Intent: Operational Clearance

The Review Inbox (`TransactionInboxPage.tsx`) implements Cashly's core privacy guarantee:
**Nothing captured by the browser extension enters your canonical financial ledger without your explicit approval.**

---

## 2. Review Workflow & Interaction States

1. **Header Count Banner:** "You have X purchases to review."
2. **Review Row Structure:**
   - Captured domain / merchant name (e.g. `checkout.foodpanda.pk`).
   - Payment method recognized (e.g. `Debit Card ••4821`).
   - Predicted category with inline reclassification dropdown.
   - Price captured in tabular figures.
3. **Actions:**
   - **Approve ✓ (Pine Teal):** Commits the transaction to the canonical ledger and instantly updates Home Safe Headroom and category budgets.
   - **Edit / Split:** Opens `TransactionSideSheet` for custom split allocations.
   - **Dismiss:** Drops the transaction without ledger impact.
