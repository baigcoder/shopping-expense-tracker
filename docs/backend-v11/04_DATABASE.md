# CASHLY BACKEND V11 — DATABASE ARCHITECTURE & SCHEMA SPECIFICATION
**Document:** `/docs/backend-v11/04_DATABASE.md`  
**Execution Date:** October 4, 2026  
**Architect:** Principal PostgreSQL & Data Integrity Architect  
**Status:** CANONICAL SCHEMA SPECIFICATION

---

## 1. Single Source of Truth & Database Unification

Cashly V11 terminates the split-brain condition between Prisma PascalCase models and Supabase snake_case tables. The authoritative schema is the unified PostgreSQL schema hosted in Supabase (`public` schema), with compatibility views ensuring backward-compatibility.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CANONICAL SCHEMA (PostgreSQL)                   │
├────────────────────────────────┬───────────────────────────────────────┤
│ Table                          │ Primary Purpose                       │
├────────────────────────────────┼───────────────────────────────────────┤
│ `public.transactions`          │ The single authoritative ledger       │
│ `public.transaction_candidates`│ Staged review inbox before ledger     │
│ `public.merchant_rules`        │ Auto-categorization & triage rules    │
│ `public.budgets`               │ Envelope limits per category & period │
│ `public.subscriptions`         │ Recurring commitments & trials        │
│ `public.bills`                 │ Scheduled fixed payments              │
│ `public.cards`                 │ Tokenized payment instruments         │
│ `public.goals`                 │ Capital accumulation milestones       │
│ `public.audit_events`          │ Immutable financial action log        │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 2. Core Table Definitions & Indexes

### A. Authoritative Ledger (`public.transactions`)
```sql
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL DEFAULT 'Other',
    source TEXT DEFAULT 'manual',
    confidence DECIMAL(3, 2) DEFAULT 1.0,
    store_name TEXT,
    product_name TEXT,
    store_url TEXT,
    notes TEXT,
    transaction_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, transaction_hash)
);

-- Access Pattern Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_hash ON public.transactions(user_id, transaction_hash) WHERE transaction_hash IS NOT NULL;
```

### B. Staged Review Candidates (`public.transaction_candidates`)
```sql
CREATE TABLE IF NOT EXISTS public.transaction_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('extension', 'pdf', 'csv', 'excel', 'plaid', 'ai', 'manual_review')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged', 'split')),
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL DEFAULT 'Other',
    merchant_name TEXT,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    confidence DECIMAL(3, 2) DEFAULT 0.5,
    transaction_hash VARCHAR(64),
    approved_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, transaction_hash)
);

CREATE INDEX IF NOT EXISTS idx_candidates_user_status ON public.transaction_candidates(user_id, status);
CREATE INDEX IF NOT EXISTS idx_candidates_user_hash ON public.transaction_candidates(user_id, transaction_hash);
```

### C. Financial Audit Log (`public.audit_events`)
```sql
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    actor_id TEXT NOT NULL,
    request_id TEXT,
    client_ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_action ON public.audit_events(user_id, action, created_at DESC);
```

---

## 3. Database Views for Prisma Legacy Compatibility

To preserve zero-downtime compatibility with any legacy Prisma callers expecting PascalCase models:

```sql
CREATE OR REPLACE VIEW public."Transaction" AS 
SELECT 
    id,
    user_id AS "userId",
    amount,
    'USD' AS currency,
    COALESCE(store_name, description) AS "storeName",
    store_url AS "storeUrl",
    product_name AS "productName",
    NULL AS "categoryId",
    date::timestamp AS "purchaseDate",
    created_at AS "createdAt",
    updated_at AS "updatedAt",
    notes
FROM public.transactions;
```
