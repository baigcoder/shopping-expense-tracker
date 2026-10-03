# Cashly Backend V11 — Bank Integration & Plaid Synchronization

## 1. Resilience Against Unreliable External Dependencies

External banking providers (Plaid, Yodlee, Open Banking) are intrinsically unreliable:
- Rate limits and transient 500/504 gateway timeouts.
- Out-of-order webhook delivery.
- Duplicate webhook delivery for identical events.
- Retroactive transaction adjustments (pending authorizations converting to settled transactions with modified amounts or merchant names).

---

## 2. Plaid Webhook Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Plaid as Plaid Provider
    participant Hook as /api/plaid/webhook
    participant Guard as WebhookDedupeGuard
    participant Sync as PlaidSyncService
    participant DB as Postgres Ledger

    Plaid->>Hook: POST /webhook (JWT / Plaid-Verification header)
    Hook->>Hook: Verify signature using Plaid public key
    Hook->>Guard: Check webhook_code + item_id + event_id
    alt Already Processed
        Guard-->>Hook: Duplicate event detected
        Hook-->>Plaid: HTTP 200 OK (Acknowledge, skip processing)
    else New Event
        Guard->>DB: Store webhook receipt (state=PENDING)
        Hook-->>Plaid: HTTP 200 OK (Fast ACK)
        Hook->>Sync: Enqueue syncJob(itemId, cursor)
        Sync->>Plaid: /transactions/sync (cursor)
        Plaid-->>Sync: { added, modified, removed, next_cursor }
        Sync->>DB: Atomic batch upsert with Money cents mapping
        Sync->>DB: Update account cursor
    end
```

---

## 3. Transaction Reconciliation Rules

1. **Pending to Settled Mapping:** If Plaid sends a settled transaction with `pending_transaction_id`, Cashly updates the existing pending record rather than inserting a second transaction.
2. **Reversals & Refunds:** Matched against original transaction via `reference_number` or `provider_transaction_id`.
3. **Plaid Sync Invariant (`INV-10`):** External webhooks must be verified, deduplicated, and processed idempotently.
