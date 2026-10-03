# Cashly Backend V11 — Browser Companion Extension Backend

## 1. Zero-Trust Ingestion Model

The browser extension operates in an untrusted client environment. Malicious actors or corrupted browser scripts could attempt:
- Injecting fake purchases with arbitrary user IDs.
- Flooding the backend with repeated captures.
- Spoofing prices, merchant names, or currency conversions.

### Zero-Trust Principles:
1. **Never Trust Browser Identity:** `userId` and `workspaceId` are extracted strictly from the authenticated Supabase Bearer token. Any client-sent `userId` in JSON bodies is discarded.
2. **Deterministic Capture Hashing:** Every captured purchase generates a SHA-256 payload fingerprint (`userId` + `amount` + `date` + `storeName` + `productName` + `sourceUrl`).
3. **Staging by Default:** Captured purchases land in `transaction_candidates` with `status: 'pending'`. Only pre-authorized, user-defined rules or deliberate manual approval can post them to the canonical ledger (`transactions`).

---

## 2. Ingestion Flow

```
Browser Extension DOM Observer
      │
      ▼  (POST /api/transactions/detected)
Auth & Validation Middleware
      │
      ▼
Candidate Deduplication Engine
      ├─ Check SHA-256 Hash against existing candidates & canonical ledger
      ├─ If exact duplicate: Return existing record with duplicate: true
      └─ If new: Insert into transaction_candidates
            │
            ▼
Merchant Rule Engine
      ├─ Check user rules (e.g. "Auto-approve Amazon under Rs 1,000")
      ├─ If matched: Post to canonical ledger immediately
      └─ If no rule: Retain in Review Inbox with confidence score
```

---

## 3. Extension Health & Observability

- Endpoints `/api/extension-health/heartbeat` and `/api/extension-health/event` record:
  - Supported site coverage (Amazon, Flipkart, Daraz, Apple, etc.)
  - Detection success vs failure ratios
  - Extension version and permission status
- Zero sensitive banking credentials or payment card numbers (PANs) are ever transmitted by the extension.
