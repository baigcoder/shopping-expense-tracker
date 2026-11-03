-- create_ai_insight is SECURITY DEFINER and takes any p_user_id, so anyone with the public anon key
-- could plant insights in another user's account. Nothing in the app calls it; keep it for the service role only.
REVOKE EXECUTE ON FUNCTION public.create_ai_insight(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_ai_insight(uuid, text, text, text, text) TO service_role;

-- Pin search_path so a caller-controlled schema can't shadow the tables these functions use (Supabase lint 0011).
ALTER FUNCTION public.create_ai_insight(uuid, text, text, text, text) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.check_expiring_trials() SET search_path = public;
ALTER FUNCTION public.expire_old_trials() SET search_path = public;
ALTER FUNCTION public.update_bills_updated_at() SET search_path = public;
ALTER FUNCTION public.notify_budget_exceeded() SET search_path = public;
