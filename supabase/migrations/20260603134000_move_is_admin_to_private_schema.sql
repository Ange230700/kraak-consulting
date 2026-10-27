-- ============================================================
-- Migration : deplacement de is_admin hors du schema public
-- Objectif  : eviter l'exposition RPC de la fonction SECURITY DEFINER
-- ============================================================
CREATE SCHEMA IF NOT EXISTS private;

ALTER FUNCTION public.is_admin ()
SET SCHEMA private;

GRANT EXECUTE ON FUNCTION private.is_admin () TO anon;

GRANT EXECUTE ON FUNCTION private.is_admin () TO authenticated;

GRANT EXECUTE ON FUNCTION private.is_admin () TO service_role;
