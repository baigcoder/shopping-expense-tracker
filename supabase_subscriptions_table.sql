-- Subscriptions Table with Trial Tracking
-- Run this in Supabase SQL Editor

-- Create subscriptions table if not exists
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    logo VARCHAR(50) DEFAULT '📦',
    category VARCHAR(100) DEFAULT 'Other',
    price DECIMAL(10, 2) DEFAULT 0,
    cycle VARCHAR(20) DEFAULT 'monthly', -- weekly, monthly, yearly
    renew_date VARCHAR(50),
    color VARCHAR(20) DEFAULT '#6366F1',
    is_active BOOLEAN DEFAULT true,
    
    -- Trial tracking fields
    is_trial BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active', -- trial, active, expired, cancelled
    trial_start_date DATE,
    trial_end_date DATE,
    trial_days INTEGER DEFAULT 0,
    
    -- Payment tracking
    start_date DATE,
    end_date DATE,
    last_payment_date DATE,
    next_payment_date DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON public.subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_trial ON public.subscriptions(is_trial);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end_date ON public.subscriptions(trial_end_date);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.subscriptions;

-- Create RLS policies
CREATE POLICY "Users can view their own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
    ON public.subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
    ON public.subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
    ON public.subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- If you already have the table, run these ALTER statements to add missing columns:
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS trial_start_date DATE;
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS trial_end_date DATE;
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS start_date DATE;
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS end_date DATE;
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_payment_date DATE;
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS next_payment_date DATE;
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Grant permissions
GRANT ALL ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
