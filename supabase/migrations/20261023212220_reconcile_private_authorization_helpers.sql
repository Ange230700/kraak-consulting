-- Conserver les helpers d’autorisation dans le schéma privé non exposé.
-- Accepter les helpers historiques publics ou leurs copies déjà déplacées.
-- Conserver leur propriétaire : aucun rôle propriétaire élevé n’est requis.

CREATE SCHEMA IF NOT EXISTS private;

DO $$
DECLARE helper text;
BEGIN
  FOREACH helper IN ARRAY ARRAY['is_employe','is_trainer'] LOOP
    IF to_regprocedure(format('public.%I()',helper)) IS NOT NULL THEN
      IF to_regprocedure(format('private.%I()',helper)) IS NOT NULL THEN
        RAISE EXCEPTION 'Copies publiques et privées concurrentes : %', helper;
      END IF;
      EXECUTE format('ALTER FUNCTION public.%I() SET SCHEMA private',helper);
    END IF;
    IF to_regprocedure(format('private.%I()',helper)) IS NULL THEN
      RAISE EXCEPTION 'Helper privé manquant : %', helper;
    END IF;
  END LOOP;
  IF to_regprocedure('public.is_admin()') IS NOT NULL
    OR to_regprocedure('private.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'Réconcilier is_admin avant de poursuivre';
  END IF;
END;
$$;

ALTER FUNCTION private.is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION private.is_employe() SET search_path = public, pg_temp;
ALTER FUNCTION private.is_trainer() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;

GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin()
  TO postgres, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION private.is_employe() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.is_trainer() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_employe()
  TO postgres, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_trainer()
  TO postgres, authenticated, service_role;

ALTER POLICY support_request_employe_select
  ON public.support_request TO authenticated;
ALTER POLICY support_request_employe_update
  ON public.support_request TO authenticated;
ALTER POLICY cohort_select_trainer ON public.cohort TO authenticated;
ALTER POLICY resource_select_trainer ON public.resource TO authenticated;
