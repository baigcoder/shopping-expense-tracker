# CASHLY — API & DATA INTEGRITY IMPACT (V5)

**Classification:** Backend & Data Surface Compatibility Specification (Authority #38)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Zero Backend Regression Guarantee

In strict adherence to Rule 1 of the Transformation Charter, **no database tables, Supabase RLS policies, or REST API endpoints are deleted, renamed, or modified destructively**:

1. **Supabase Postgres Tables Intact:**
   - `public.transactions`
   - `public.transaction_candidates`
   - `public.merchant_rules`
   - `public.budgets`
   - `public.subscriptions`
   - `public.goals`
   - `public.cards`
   - `public.bank_accounts`
2. **REST API Endpoints Preserved:**
   - `/api/transaction-inbox/*` (List, approve, reject, merge, create rule)
   - `/api/settings/*` (Preferences, currency, audio toggles)
   - `/api/extension-health/*` (Telemetry, sync events, permissions)
   - `/api/ai/*` (Grounded insights, weekly coach actions)
3. **Real-Time WebSockets Preserved:**
   - `useRealtimeSync.ts` channel subscriptions to `postgres_changes` remain untouched.
   - Global event bus `FINANCIAL_DATA_EVENTS` dispatches on all ledger updates.
