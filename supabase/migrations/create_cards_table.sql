-- ===============================================
-- CARDS TABLE MIGRATION
-- Run this in Supabase SQL Editor
-- ===============================================

-- Create cards table if it doesn't exist
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

-- Create index for faster user-based queries
CREATE INDEX IF NOT EXISTS cards_user_id_idx ON public.cards(user_id);

-- Enable Row Level Security
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to see only their own cards
CREATE POLICY "Users can view own cards" ON public.cards
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to create their own cards
CREATE POLICY "Users can create own cards" ON public.cards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own cards
CREATE POLICY "Users can update own cards" ON public.cards
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow users to delete their own cards
CREATE POLICY "Users can delete own cards" ON public.cards
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.cards TO authenticated;
GRANT ALL ON public.cards TO service_role;

-- ===============================================
-- VERIFICATION QUERY
-- Run this after migration to verify
-- ===============================================
-- SELECT * FROM public.cards LIMIT 5;
