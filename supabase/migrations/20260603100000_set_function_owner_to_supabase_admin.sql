-- Apply SQL security remediations in a single migration:
-- 1) fixed search_path on helper functions
-- 2) defensive EXECUTE grants/revokes on SECURITY DEFINER function
-- 3) conditional ownership alignment to supabase_admin

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_user
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$function$;

DO $$
BEGIN
  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE NOTICE 'Function public.is_admin() not found, skipping REVOKE/GRANT.';
    RETURN;
  END IF;

  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC';
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon';
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated';

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.is_admin() TO postgres';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role';
END;
$$;

DO $$
BEGIN
  -- public.is_admin()
  IF to_regprocedure('public.is_admin()') IS NOT NULL THEN
    BEGIN
      EXECUTE 'ALTER FUNCTION public.is_admin() OWNER TO supabase_admin';
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping owner change for public.is_admin(): insufficient privilege';
      WHEN undefined_object THEN
        RAISE NOTICE 'Skipping owner change for public.is_admin(): function disappeared';
    END;
  ELSE
    RAISE NOTICE 'Skipping owner change: public.is_admin() not found';
  END IF;

  -- public.update_updated_at()
  IF to_regprocedure('public.update_updated_at()') IS NOT NULL THEN
    BEGIN
      EXECUTE 'ALTER FUNCTION public.update_updated_at() OWNER TO supabase_admin';
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping owner change for public.update_updated_at(): insufficient privilege';
      WHEN undefined_object THEN
        RAISE NOTICE 'Skipping owner change for public.update_updated_at(): function disappeared';
    END;
  ELSE
    RAISE NOTICE 'Skipping owner change: public.update_updated_at() not found';
  END IF;
END;
$$;
