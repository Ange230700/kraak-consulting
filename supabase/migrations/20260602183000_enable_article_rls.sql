-- ============================================================
-- Migration : RLS sur public.article
-- Objectif  : lecture publique des articles publies, ecriture admin uniquement
-- ============================================================
ALTER TABLE public.article ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS article_select_published ON public.article;

CREATE POLICY article_select_published ON public.article FOR
SELECT
    TO anon,
    authenticated USING (status = 'published');

DROP POLICY IF EXISTS article_admin_all ON public.article;

CREATE POLICY article_admin_all ON public.article FOR ALL TO authenticated USING (is_admin ())
WITH
    CHECK (is_admin ());
