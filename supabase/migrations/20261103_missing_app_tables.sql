-- Tables and columns the app reads/writes that production never received.
-- linked_accounts, site_visits, onboarding_status come from 00_consolidated_migration.sql (policies made re-runnable).

CREATE TABLE IF NOT EXISTS public.linked_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plaid_account_id TEXT,
    plaid_item_id TEXT,
    name TEXT NOT NULL,
    type TEXT,
    subtype TEXT,
    mask TEXT,
    current_balance DECIMAL(14, 2),
    available_balance DECIMAL(14, 2),
    iso_currency_code TEXT DEFAULT 'USD',
    last_synced TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS linked_accounts_user_id_idx ON public.linked_accounts(user_id);
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own linked accounts" ON public.linked_accounts;
DROP POLICY IF EXISTS "Users can insert own linked accounts" ON public.linked_accounts;
DROP POLICY IF EXISTS "Users can update own linked accounts" ON public.linked_accounts;
DROP POLICY IF EXISTS "Users can delete own linked accounts" ON public.linked_accounts;
CREATE POLICY "Users can view own linked accounts" ON public.linked_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own linked accounts" ON public.linked_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own linked accounts" ON public.linked_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own linked accounts" ON public.linked_accounts FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hostname TEXT,
    site_name TEXT,
    logo TEXT,
    category TEXT DEFAULT 'Other',
    visit_count INTEGER DEFAULT 1,
    first_visited TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    last_visited TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS site_visits_user_id_idx ON public.site_visits(user_id);
CREATE INDEX IF NOT EXISTS site_visits_last_visited_idx ON public.site_visits(last_visited);
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Users can insert own site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Users can update own site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Users can delete own site visits" ON public.site_visits;
CREATE POLICY "Users can view own site visits" ON public.site_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own site visits" ON public.site_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own site visits" ON public.site_visits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own site visits" ON public.site_visits FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.onboarding_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    completed_step_ids JSONB DEFAULT '[]'::jsonb,
    dismissed_extension_prompt BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.onboarding_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own onboarding status" ON public.onboarding_status;
DROP POLICY IF EXISTS "Users can insert own onboarding status" ON public.onboarding_status;
DROP POLICY IF EXISTS "Users can update own onboarding status" ON public.onboarding_status;
CREATE POLICY "Users can view own onboarding status" ON public.onboarding_status FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own onboarding status" ON public.onboarding_status FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own onboarding status" ON public.onboarding_status FOR UPDATE USING (auth.uid()::text = user_id);

-- Read/upserted by frontend/src/services/emailNotificationService.ts (upsert has no onConflict, so user_id is the key).
CREATE TABLE IF NOT EXISTS public.email_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_alerts BOOLEAN NOT NULL DEFAULT true,
    transaction_threshold DECIMAL(12, 2) NOT NULL DEFAULT 100,
    bill_reminders BOOLEAN NOT NULL DEFAULT true,
    bill_reminder_days INTEGER NOT NULL DEFAULT 3,
    budget_alerts BOOLEAN NOT NULL DEFAULT true,
    budget_threshold INTEGER NOT NULL DEFAULT 80,
    goal_milestones BOOLEAN NOT NULL DEFAULT true,
    goal_achieved BOOLEAN NOT NULL DEFAULT true,
    subscription_renewal BOOLEAN NOT NULL DEFAULT true,
    subscription_renewal_days INTEGER NOT NULL DEFAULT 3,
    trial_expiring BOOLEAN NOT NULL DEFAULT true,
    trial_expiring_days INTEGER NOT NULL DEFAULT 3,
    weekly_digest BOOLEAN NOT NULL DEFAULT true,
    monthly_report BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own email preferences" ON public.email_notification_preferences;
CREATE POLICY "Users can manage own email preferences" ON public.email_notification_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE ON public.email_notification_preferences TO authenticated;

-- Columns written by createMoneyTransaction (backend/src/services/transactionDomainService.ts) and inbox approval.
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS store_name TEXT,
    ADD COLUMN IF NOT EXISTS product_name TEXT,
    ADD COLUMN IF NOT EXISTS store_url TEXT,
    ADD COLUMN IF NOT EXISTS hostname TEXT,
    ADD COLUMN IF NOT EXISTS extension_type TEXT,
    ADD COLUMN IF NOT EXISTS billing_cycle TEXT,
    ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS trial_days INTEGER,
    ADD COLUMN IF NOT EXISTS behavior_flow JSONB,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
