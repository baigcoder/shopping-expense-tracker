-- ===============================================
-- CONSOLIDATED SCHEMA — Shopping Expense Tracker
-- Combines all migration files + missing tables
-- ===============================================

-- ===== 1. CORE TABLES (no FK to other public tables) =====

-- Cards (complete_schema.sql + create_cards_table.sql)
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    holder TEXT NOT NULL,
    expiry TEXT NOT NULL,
    cvv TEXT NOT NULL,
    pin TEXT NOT NULL,
    card_type TEXT NOT NULL DEFAULT 'unknown',
    theme TEXT NOT NULL DEFAULT 'cyber-gold',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS cards_user_id_idx ON public.cards(user_id);
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own cards" ON public.cards;
DROP POLICY IF EXISTS "Users can create own cards" ON public.cards;
DROP POLICY IF EXISTS "Users can update own cards" ON public.cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON public.cards;
CREATE POLICY "Users can view own cards" ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own cards" ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON public.cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards" ON public.cards FOR DELETE USING (auth.uid() = user_id);

-- Transactions (complete_schema.sql + supabase_setup.sql)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL DEFAULT 'Other',
    source TEXT,
    confidence DECIMAL(3,2),
    statement_id TEXT,
    plaid_transaction_id TEXT,
    store TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON public.transactions(date);
CREATE INDEX IF NOT EXISTS transactions_category_idx ON public.transactions(category);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Budgets (complete_schema.sql + supabase_setup.sql)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS budgets_category_idx ON public.budgets(category);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can create own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Goals (complete_schema.sql + supabase_setup.sql)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🎯',
    target DECIMAL(12, 2) NOT NULL,
    saved DECIMAL(12, 2) NOT NULL DEFAULT 0,
    deadline TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS goals_user_id_idx ON public.goals(user_id);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can create own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions (complete_schema.sql with trial tracking)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo TEXT DEFAULT '📦',
    category TEXT NOT NULL DEFAULT 'Other',
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (cycle IN ('weekly', 'monthly', 'yearly')),
    renew_date TEXT,
    color TEXT DEFAULT '#6366F1',
    is_active BOOLEAN DEFAULT true,
    is_trial BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
    trial_start_date DATE,
    trial_end_date DATE,
    trial_days INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    last_payment_date DATE,
    next_payment_date DATE,
    source_url TEXT,
    detected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON public.subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_trial ON public.subscriptions(is_trial);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end_date ON public.subscriptions(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can create own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'monthly',
    start_date DATE,
    end_date DATE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON public.reports(user_id);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON public.reports;
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.reports FOR DELETE USING (auth.uid() = user_id);

-- Recurring Transactions
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    category TEXT NOT NULL DEFAULT 'Bills',
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    next_due_date DATE NOT NULL,
    last_processed_date DATE,
    is_active BOOLEAN DEFAULT true,
    auto_add BOOLEAN DEFAULT false,
    reminder_days INTEGER DEFAULT 3,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS recurring_transactions_user_id_idx ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS recurring_transactions_next_due_idx ON public.recurring_transactions(next_due_date);
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own recurring" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Users can create own recurring" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Users can update own recurring" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Users can delete own recurring" ON public.recurring_transactions;
CREATE POLICY "Users can view own recurring" ON public.recurring_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own recurring" ON public.recurring_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring" ON public.recurring_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring" ON public.recurring_transactions FOR DELETE USING (auth.uid() = user_id);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success', 'trial_reminder', 'budget_alert')),
    is_read BOOLEAN DEFAULT false,
    related_id UUID,
    related_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Bank Accounts (complete_schema.sql)
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings', 'credit', 'investment', 'cash')),
    balance DECIMAL(14, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT '🏦',
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS bank_accounts_user_id_idx ON public.bank_accounts(user_id);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bank accounts" ON public.bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bank accounts" ON public.bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bank accounts" ON public.bank_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bank accounts" ON public.bank_accounts FOR DELETE USING (auth.uid() = user_id);

-- User Settings (20260430_settings_upgrade.sql)
CREATE TABLE IF NOT EXISTS public.user_settings (
    id uuid primary key default gen_random_uuid(),
    user_id text not null unique,
    email_notifications boolean not null default true,
    push_notifications boolean not null default true,
    weekly_report boolean not null default true,
    monthly_report boolean not null default true,
    sound_enabled boolean not null default true,
    sound_volume integer not null default 70 check (sound_volume >= 0 and sound_volume <= 100),
    theme text not null default 'light' check (theme in ('light', 'dark')),
    reduced_motion boolean not null default false,
    currency text not null default 'USD',
    ai_live_enabled boolean not null default true,
    ai_memory_enabled boolean not null default true,
    ai_auto_refresh boolean not null default true,
    ai_include_pending_candidates boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
CREATE POLICY "Users can read own settings" ON public.user_settings FOR SELECT USING (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Bills (create_bills_table.sql)
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date TEXT NOT NULL,
    category TEXT NOT NULL,
    is_recurring BOOLEAN DEFAULT true,
    frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly', 'one-time')),
    reminder_days INTEGER DEFAULT 3,
    is_paid BOOLEAN DEFAULT false,
    last_paid_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bills_user_id_idx ON public.bills(user_id);
CREATE INDEX IF NOT EXISTS bills_due_date_idx ON public.bills(due_date);
CREATE INDEX IF NOT EXISTS bills_is_paid_idx ON public.bills(is_paid);
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own bills" ON public.bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bills" ON public.bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bills" ON public.bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bills" ON public.bills FOR DELETE USING (auth.uid() = user_id);

-- Merchant Mappings (create_merchant_mappings_table.sql)
CREATE TABLE IF NOT EXISTS public.merchant_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_name TEXT NOT NULL,
    category TEXT NOT NULL,
    confidence DECIMAL(3, 2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, merchant_name)
);
CREATE INDEX IF NOT EXISTS merchant_mappings_user_id_idx ON public.merchant_mappings(user_id);
CREATE INDEX IF NOT EXISTS merchant_mappings_merchant_name_idx ON public.merchant_mappings(merchant_name);
ALTER TABLE public.merchant_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own merchant mappings" ON public.merchant_mappings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own merchant mappings" ON public.merchant_mappings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own merchant mappings" ON public.merchant_mappings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own merchant mappings" ON public.merchant_mappings FOR DELETE USING (auth.uid() = user_id);

-- Linked Accounts (referenced by plaidService.ts)
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
CREATE POLICY "Users can view own linked accounts" ON public.linked_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own linked accounts" ON public.linked_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own linked accounts" ON public.linked_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own linked accounts" ON public.linked_accounts FOR DELETE USING (auth.uid() = user_id);

-- Site Visits (referenced by ShoppingActivityPage.tsx)
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
CREATE POLICY "Users can view own site visits" ON public.site_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own site visits" ON public.site_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own site visits" ON public.site_visits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own site visits" ON public.site_visits FOR DELETE USING (auth.uid() = user_id);

-- Bank Statements (referenced by pdfAnalyzerService.ts)
CREATE TABLE IF NOT EXISTS public.bank_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    statement_period TEXT,
    transaction_count INTEGER DEFAULT 0,
    total_income DECIMAL(14, 2) DEFAULT 0,
    total_expenses DECIMAL(14, 2) DEFAULT 0,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS bank_statements_user_id_idx ON public.bank_statements(user_id);
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bank statements" ON public.bank_statements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bank statements" ON public.bank_statements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bank statements" ON public.bank_statements FOR DELETE USING (auth.uid() = user_id);

-- Onboarding Status (referenced by onboardingService.ts)
CREATE TABLE IF NOT EXISTS public.onboarding_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    completed_step_ids JSONB DEFAULT '[]'::jsonb,
    dismissed_extension_prompt BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS onboarding_status_user_id_idx ON public.onboarding_status(user_id);
ALTER TABLE public.onboarding_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own onboarding status" ON public.onboarding_status FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own onboarding status" ON public.onboarding_status FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own onboarding status" ON public.onboarding_status FOR UPDATE USING (auth.uid()::text = user_id);

-- Extension Health Events (20260430_feature_expansion.sql)
CREATE TABLE IF NOT EXISTS public.extension_health_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    status TEXT DEFAULT 'info',
    site_hostname TEXT,
    queued_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    permission_status TEXT,
    message TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS extension_health_events_user_idx ON public.extension_health_events(user_id, created_at DESC);
ALTER TABLE public.extension_health_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own extension health events" ON public.extension_health_events;
CREATE POLICY "Users can manage own extension health events" ON public.extension_health_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Extension Site Stats (20260430_feature_expansion.sql)
CREATE TABLE IF NOT EXISTS public.extension_site_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hostname TEXT NOT NULL,
    site_name TEXT,
    visit_count INTEGER NOT NULL DEFAULT 1,
    detection_count INTEGER NOT NULL DEFAULT 0,
    last_visited TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_detection_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, hostname)
);
ALTER TABLE public.extension_site_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own extension site stats" ON public.extension_site_stats;
CREATE POLICY "Users can manage own extension site stats" ON public.extension_site_stats FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Report Exports (20260430_feature_expansion.sql)
CREATE TABLE IF NOT EXISTS public.report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    format TEXT DEFAULT 'preview',
    summary JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_exports_user_idx ON public.report_exports(user_id, created_at DESC);
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own report exports" ON public.report_exports;
CREATE POLICY "Users can manage own report exports" ON public.report_exports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== 2. TABLES WITH FK TO OTHER PUBLIC TABLES =====

-- Merchant Rules (20260430_feature_expansion.sql) - referenced by transaction_candidates FK
CREATE TABLE IF NOT EXISTS public.merchant_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_pattern TEXT NOT NULL,
    match_type TEXT NOT NULL DEFAULT 'contains' CHECK (match_type IN ('exact', 'contains', 'starts_with', 'regex')),
    category TEXT NOT NULL,
    transaction_type TEXT DEFAULT 'expense' CHECK (transaction_type IN ('income', 'expense')),
    amount_min DECIMAL(12,2),
    amount_max DECIMAL(12,2),
    priority INTEGER NOT NULL DEFAULT 100,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS merchant_rules_user_enabled_idx ON public.merchant_rules(user_id, enabled, priority);
ALTER TABLE public.merchant_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own merchant rules" ON public.merchant_rules;
DROP POLICY IF EXISTS "Users can create own merchant rules" ON public.merchant_rules;
DROP POLICY IF EXISTS "Users can update own merchant rules" ON public.merchant_rules;
DROP POLICY IF EXISTS "Users can delete own merchant rules" ON public.merchant_rules;
CREATE POLICY "Users can view own merchant rules" ON public.merchant_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own merchant rules" ON public.merchant_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own merchant rules" ON public.merchant_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own merchant rules" ON public.merchant_rules FOR DELETE USING (auth.uid() = user_id);

-- Import Sessions (20260430_feature_expansion.sql)
CREATE TABLE IF NOT EXISTS public.import_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'csv', 'excel', 'image', 'docx', 'unknown')),
    status TEXT NOT NULL DEFAULT 'review' CHECK (status IN ('review', 'committed', 'cancelled', 'failed')),
    total_rows INTEGER NOT NULL DEFAULT 0,
    valid_rows INTEGER NOT NULL DEFAULT 0,
    duplicate_rows INTEGER NOT NULL DEFAULT 0,
    error_rows INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS import_sessions_user_idx ON public.import_sessions(user_id, created_at DESC);
ALTER TABLE public.import_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own import sessions" ON public.import_sessions;
DROP POLICY IF EXISTS "Users can create own import sessions" ON public.import_sessions;
DROP POLICY IF EXISTS "Users can update own import sessions" ON public.import_sessions;
DROP POLICY IF EXISTS "Users can delete own import sessions" ON public.import_sessions;
CREATE POLICY "Users can view own import sessions" ON public.import_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own import sessions" ON public.import_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own import sessions" ON public.import_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own import sessions" ON public.import_sessions FOR DELETE USING (auth.uid() = user_id);

-- Transaction Candidates (20260430_feature_expansion.sql) - FK to merchant_rules, import_sessions
CREATE TABLE IF NOT EXISTS public.transaction_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL DEFAULT 'manual_review' CHECK (source IN ('extension', 'pdf', 'csv', 'excel', 'plaid', 'ai', 'manual_review')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL DEFAULT 'Other',
    merchant_name TEXT,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (confidence >= 0 AND confidence <= 1),
    transaction_hash TEXT,
    duplicate_transaction_id UUID,
    matched_rule_id UUID REFERENCES public.merchant_rules(id) ON DELETE SET NULL,
    import_session_id UUID REFERENCES public.import_sessions(id) ON DELETE SET NULL,
    approved_transaction_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transaction_candidates_user_status_idx ON public.transaction_candidates(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS transaction_candidates_hash_idx ON public.transaction_candidates(user_id, transaction_hash);
CREATE INDEX IF NOT EXISTS transaction_candidates_import_idx ON public.transaction_candidates(import_session_id);
ALTER TABLE public.transaction_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transaction candidates" ON public.transaction_candidates;
DROP POLICY IF EXISTS "Users can create own transaction candidates" ON public.transaction_candidates;
DROP POLICY IF EXISTS "Users can update own transaction candidates" ON public.transaction_candidates;
DROP POLICY IF EXISTS "Users can delete own transaction candidates" ON public.transaction_candidates;
CREATE POLICY "Users can view own transaction candidates" ON public.transaction_candidates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transaction candidates" ON public.transaction_candidates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transaction candidates" ON public.transaction_candidates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transaction candidates" ON public.transaction_candidates FOR DELETE USING (auth.uid() = user_id);

-- Import Rows (20260430_feature_expansion.sql) - FK to import_sessions, transaction_candidates
CREATE TABLE IF NOT EXISTS public.import_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.import_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    row_index INTEGER NOT NULL,
    description TEXT,
    amount DECIMAL(12,2),
    date DATE,
    type TEXT DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    category TEXT DEFAULT 'Other',
    merchant_name TEXT,
    confidence DECIMAL(3,2) DEFAULT 0.50,
    duplicate_warning BOOLEAN NOT NULL DEFAULT false,
    validation_errors JSONB DEFAULT '[]'::jsonb,
    selected BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'review' CHECK (status IN ('review', 'candidate_created', 'skipped', 'error')),
    candidate_id UUID REFERENCES public.transaction_candidates(id) ON DELETE SET NULL,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS import_rows_session_idx ON public.import_rows(session_id, row_index);
CREATE INDEX IF NOT EXISTS import_rows_user_idx ON public.import_rows(user_id);
ALTER TABLE public.import_rows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own import rows" ON public.import_rows;
DROP POLICY IF EXISTS "Users can create own import rows" ON public.import_rows;
DROP POLICY IF EXISTS "Users can update own import rows" ON public.import_rows;
DROP POLICY IF EXISTS "Users can delete own import rows" ON public.import_rows;
CREATE POLICY "Users can view own import rows" ON public.import_rows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own import rows" ON public.import_rows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own import rows" ON public.import_rows FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own import rows" ON public.import_rows FOR DELETE USING (auth.uid() = user_id);

-- Coach Plans (20260430_feature_expansion.sql)
CREATE TABLE IF NOT EXISTS public.coach_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    summary TEXT,
    streak INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, week_start)
);
CREATE INDEX IF NOT EXISTS coach_plans_user_week_idx ON public.coach_plans(user_id, week_start DESC);
ALTER TABLE public.coach_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own coach plans" ON public.coach_plans;
CREATE POLICY "Users can manage own coach plans" ON public.coach_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Coach Actions (20260430_feature_expansion.sql) - FK to coach_plans
CREATE TABLE IF NOT EXISTS public.coach_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.coach_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('spending', 'savings', 'subscription')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped')),
    target_amount DECIMAL(12,2),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coach_actions_plan_idx ON public.coach_actions(plan_id);
ALTER TABLE public.coach_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own coach actions" ON public.coach_actions;
CREATE POLICY "Users can manage own coach actions" ON public.coach_actions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== 3. HELPER FUNCTIONS (from complete_schema.sql) =====

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===== 4. GRANT PERMISSIONS =====

GRANT ALL ON public.cards TO authenticated, service_role;
GRANT ALL ON public.transactions TO authenticated, service_role;
GRANT ALL ON public.budgets TO authenticated, service_role;
GRANT ALL ON public.goals TO authenticated, service_role;
GRANT ALL ON public.subscriptions TO authenticated, service_role;
GRANT ALL ON public.reports TO authenticated, service_role;
GRANT ALL ON public.recurring_transactions TO authenticated, service_role;
GRANT ALL ON public.notifications TO authenticated, service_role;
GRANT ALL ON public.bank_accounts TO authenticated, service_role;
GRANT ALL ON public.user_settings TO authenticated, service_role;
GRANT ALL ON public.bills TO authenticated, service_role;
GRANT ALL ON public.merchant_mappings TO authenticated, service_role;
GRANT ALL ON public.linked_accounts TO authenticated, service_role;
GRANT ALL ON public.site_visits TO authenticated, service_role;
GRANT ALL ON public.bank_statements TO authenticated, service_role;
GRANT ALL ON public.onboarding_status TO authenticated, service_role;
GRANT ALL ON public.extension_health_events TO authenticated, service_role;
GRANT ALL ON public.extension_site_stats TO authenticated, service_role;
GRANT ALL ON public.report_exports TO authenticated, service_role;
GRANT ALL ON public.merchant_rules TO authenticated, service_role;
GRANT ALL ON public.import_sessions TO authenticated, service_role;
GRANT ALL ON public.transaction_candidates TO authenticated, service_role;
GRANT ALL ON public.import_rows TO authenticated, service_role;
GRANT ALL ON public.coach_plans TO authenticated, service_role;
GRANT ALL ON public.coach_actions TO authenticated, service_role;
