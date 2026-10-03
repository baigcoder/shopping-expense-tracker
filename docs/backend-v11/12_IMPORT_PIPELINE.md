# Cashly Backend V11 — Statement Import & OCR Pipeline

## 1. Multi-Stage Pipeline Architecture

```
1. UPLOAD
   └─ File MIME validation, SHA-256 fingerprinting, secure disk/bucket storage
2. PARSE
   ├─ CSV: RFC 4180 parsing, delimiter auto-detection (, ; \t)
   └─ OCR / PDF: Structured text extraction, tabular bounding boxes
3. NORMALIZE
   ├─ Date normalization (ISO 8601 YYYY-MM-DD)
   ├─ Currency identification & decimal to integer cents mapping (via Money)
   └─ Merchant cleaning & category inference
4. DEDUPLICATE
   ├─ Check against existing canonical ledger
   └─ Mark candidate rows as: NEW, POTENTIAL_DUPLICATE, or SKIPPED
5. STAGE & PREVIEW
   └─ Import session created in `import_sessions` and `import_rows`
6. USER CONFIRMATION / COMMIT
   └─ Atomic transaction posts approved rows into canonical `transactions`
```

---

## 2. File & Statement Fingerprinting

To prevent a user from accidentally uploading the same credit card statement twice and creating duplicate records, Cashly computes a **Statement Fingerprint**:

$$\text{FileHash} = \text{SHA256}(\text{RawFileBuffer})$$
$$\text{BatchFingerprint} = \text{SHA256}(\text{userId} + \text{accountId} + \text{FirstTxDate} + \text{LastTxDate} + \text{TotalRowCount})$$

If an active import session exists with the identical `FileHash` or `BatchFingerprint`, the system returns the existing session preview rather than re-inserting duplicate staging rows.

---

## 3. Row Deduplication Rules

For every extracted row, deduplication evaluates:
1. **Exact Match:** Same `user_id`, same `date` (within $\pm 1$ day), same `amount` (exact cents), and normalized merchant matches. Marked as `POTENTIAL_DUPLICATE` with link to existing `transaction_id`.
2. **Safe Import Invariant (`INV-04`):** A duplicate import must never blindly create duplicate canonical ledger entries.
