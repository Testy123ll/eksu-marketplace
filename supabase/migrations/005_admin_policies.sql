-- ============================================================
--  BataMarket — Admin RLS Policies Override Migration
-- ============================================================

-- 1. Profiles Table overrides
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE
  USING ((SELECT COALESCE(is_admin, FALSE) FROM public.profiles WHERE user_id = auth.uid()));

-- 2. Listings Table overrides
DROP POLICY IF EXISTS "Admins can update any listing" ON public.listings;
CREATE POLICY "Admins can update any listing" ON public.listings
  FOR UPDATE
  USING ((SELECT COALESCE(is_admin, FALSE) FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete any listing" ON public.listings;
CREATE POLICY "Admins can delete any listing" ON public.listings
  FOR DELETE
  USING ((SELECT COALESCE(is_admin, FALSE) FROM public.profiles WHERE user_id = auth.uid()));
