-- Card settings the Cards screen lets people change: a nickname, a monthly limit, freeze, and the primary card.
-- Additive and nullable; no existing row changes. Row level security on public.cards already limits each user to their own cards.
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS spending_limit NUMERIC(12, 2) CHECK (spending_limit IS NULL OR spending_limit >= 0);
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

-- At most one primary card per user.
CREATE UNIQUE INDEX IF NOT EXISTS cards_one_default_per_user ON public.cards(user_id) WHERE is_default;
