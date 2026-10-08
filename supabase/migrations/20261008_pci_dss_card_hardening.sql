-- ===============================================
-- PCI-DSS CARD STORAGE HARDENING MIGRATION
-- Run this in Supabase SQL Editor
-- ===============================================

-- 1. Ensure last4 column exists
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS last4 TEXT;

-- 2. Backfill last4 from existing card number column if present
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'cards'
          AND column_name = 'number'
    ) THEN
        UPDATE public.cards
        SET last4 = RIGHT(REGEXP_REPLACE(number, '\D', '', 'g'), 4)
        WHERE last4 IS NULL AND number IS NOT NULL;
    END IF;
END $$;

-- 3. Set default for any empty last4 entries
UPDATE public.cards SET last4 = '0000' WHERE last4 IS NULL;
ALTER TABLE public.cards ALTER COLUMN last4 SET NOT NULL;

-- 4. Drop prohibited Sensitive Authentication Data (SAD) columns
ALTER TABLE public.cards DROP COLUMN IF EXISTS cvv;
ALTER TABLE public.cards DROP COLUMN IF EXISTS pin;
ALTER TABLE public.cards DROP COLUMN IF EXISTS number;

-- 5. Confirm RLS is enabled and policies are intact
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cards" ON public.cards;
CREATE POLICY "Users can view own cards" ON public.cards
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own cards" ON public.cards;
CREATE POLICY "Users can create own cards" ON public.cards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cards" ON public.cards;
CREATE POLICY "Users can update own cards" ON public.cards
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cards" ON public.cards;
CREATE POLICY "Users can delete own cards" ON public.cards
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grants
GRANT ALL ON public.cards TO authenticated;
GRANT ALL ON public.cards TO service_role;
