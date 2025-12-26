-- ============================================
-- CASHLY SUPABASE REALTIME ENHANCEMENT TABLES
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. AI INSIGHTS TABLE
-- Stores AI-generated financial insights
-- ============================================
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL DEFAULT 'general', -- 'spending', 'saving', 'budget', 'subscription', 'general'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
    related_category TEXT,
    related_amount DECIMAL(12, 2),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own insights
CREATE POLICY "Users can view own insights" ON ai_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights" ON ai_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON ai_insights
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights" ON ai_insights
    FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE ai_insights;


-- ============================================
-- 2. PAYMENT REMINDERS TABLE
-- Tracks upcoming subscription payments
-- ============================================
CREATE TABLE IF NOT EXISTS payment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    subscription_name TEXT NOT NULL,
    amount DECIMAL(12, 2),
    due_date DATE NOT NULL,
    days_before_reminder INTEGER DEFAULT 3, -- Days before due date to send reminder
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_reminders_user_id ON payment_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_due_date ON payment_reminders(due_date);

-- Enable Row Level Security
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own reminders" ON payment_reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON payment_reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON payment_reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON payment_reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE payment_reminders;


-- ============================================
-- 3. NOTIFICATIONS TABLE (Optional)
-- Centralized notification storage
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'transaction', 'budget', 'subscription', 'ai_insight', 'payment', 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    icon TEXT DEFAULT '🔔',
    action_url TEXT, -- Optional link to relevant page
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes (IF NOT EXISTS prevents errors)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- RLS Policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime (ignore error if already added)
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;


-- ============================================
-- 4. ENSURE REALTIME ON EXISTING TABLES
-- Add existing tables to realtime if not already
-- ============================================
-- Uncomment these if not already enabled:
-- ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE goals;
-- ALTER PUBLICATION supabase_realtime ADD TABLE budgets;


-- ============================================
-- 5. HELPER FUNCTION: Create AI Insight
-- ============================================
CREATE OR REPLACE FUNCTION create_ai_insight(
    p_user_id UUID,
    p_insight_type TEXT,
    p_title TEXT,
    p_content TEXT,
    p_severity TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
    v_insight_id UUID;
BEGIN
    INSERT INTO ai_insights (user_id, insight_type, title, content, severity)
    VALUES (p_user_id, p_insight_type, p_title, p_content, p_severity)
    RETURNING id INTO v_insight_id;
    
    RETURN v_insight_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 6. TRIGGER: Auto-create budget alert notification
-- ============================================
CREATE OR REPLACE FUNCTION notify_budget_exceeded()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if spent exceeds limit
    IF NEW.spent >= NEW.limit AND (OLD.spent IS NULL OR OLD.spent < OLD.limit) THEN
        INSERT INTO notifications (user_id, type, title, message, icon)
        VALUES (
            NEW.user_id,
            'budget',
            'Budget Exceeded!',
            format('Your %s budget has been exceeded. Spent: %s / %s', NEW.category, NEW.spent, NEW.limit),
            '🚨'
        );
    -- Check if approaching limit (80%)
    ELSIF NEW.spent >= (NEW.limit * 0.8) AND (OLD.spent IS NULL OR OLD.spent < (OLD.limit * 0.8)) THEN
        INSERT INTO notifications (user_id, type, title, message, icon)
        VALUES (
            NEW.user_id,
            'budget',
            'Budget Warning',
            format('Your %s budget is at 80%% capacity!', NEW.category),
            '⚠️'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to budgets table (run only if budgets table exists)
-- DROP TRIGGER IF EXISTS budget_exceeded_trigger ON budgets;
-- CREATE TRIGGER budget_exceeded_trigger
--     AFTER UPDATE ON budgets
--     FOR EACH ROW
--     EXECUTE FUNCTION notify_budget_exceeded();
