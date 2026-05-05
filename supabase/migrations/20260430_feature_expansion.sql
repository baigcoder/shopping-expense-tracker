-- Cashly feature expansion: inbox, rules, imports, extension health, reports, coach

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

CREATE INDEX IF NOT EXISTS coach_plans_user_week_idx ON public.coach_plans(user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS coach_actions_plan_idx ON public.coach_actions(plan_id);
ALTER TABLE public.coach_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own coach plans" ON public.coach_plans;
DROP POLICY IF EXISTS "Users can manage own coach actions" ON public.coach_actions;
CREATE POLICY "Users can manage own coach plans" ON public.coach_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own coach actions" ON public.coach_actions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.transaction_candidates TO authenticated, service_role;
GRANT ALL ON public.merchant_rules TO authenticated, service_role;
GRANT ALL ON public.import_sessions TO authenticated, service_role;
GRANT ALL ON public.import_rows TO authenticated, service_role;
GRANT ALL ON public.extension_health_events TO authenticated, service_role;
GRANT ALL ON public.extension_site_stats TO authenticated, service_role;
GRANT ALL ON public.report_exports TO authenticated, service_role;
GRANT ALL ON public.coach_plans TO authenticated, service_role;
GRANT ALL ON public.coach_actions TO authenticated, service_role;
