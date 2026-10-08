-- ============================================================
-- PERFORMANCE OPTIMIZATION: COMPOSITE INDEXES & QUERY GUARDS
-- Date: 2026-10-08
-- ============================================================

-- 1. High-frequency sorted transaction lookups by user (Dashboard, Ledger, Analytics)
-- Eliminates in-memory Sort operations on date DESC
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_desc 
ON public.transactions (user_id, date DESC);

-- 2. Category filtering by user (Transactions Page & Analytics breakdown)
CREATE INDEX IF NOT EXISTS idx_transactions_user_category 
ON public.transactions (user_id, category);

-- 3. Composite user-created index for recent transactions / audit
CREATE INDEX IF NOT EXISTS idx_transactions_user_created_desc 
ON public.transactions (user_id, created_at DESC);

-- 4. Bounded pending inbox candidates (fast retrieval of pending items)
CREATE INDEX IF NOT EXISTS idx_transaction_inbox_user_status 
ON public.transaction_inbox (user_id, status)
WHERE status = 'pending';

-- 5. Subscriptions lookup by user with active status
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
ON public.subscriptions (user_id, status);

-- 6. Budgets by user and period
CREATE INDEX IF NOT EXISTS idx_budgets_user_period 
ON public.budgets (user_id, period);
