-- ============================================================
-- Migration : correction RLS CMS public + search_path fonctions
-- Objectif  : rendre le linter Supabase vert sur les tables publiques
--             et figer le search_path des fonctions helper
-- ============================================================

ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;

-- ------------------------------------------------------------
-- article
-- ------------------------------------------------------------
ALTER TABLE public.article ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS article_admin_all ON public.article;
DROP POLICY IF EXISTS article_select_published ON public.article;

CREATE POLICY article_select_access ON public.article
  FOR SELECT
  USING (is_admin() OR status = 'published');

CREATE POLICY article_insert_admin ON public.article
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY article_update_admin ON public.article
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY article_delete_admin ON public.article
  FOR DELETE
  USING (is_admin());

-- ------------------------------------------------------------
-- author
-- ------------------------------------------------------------
ALTER TABLE public.author ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS author_admin_all ON public.author;
DROP POLICY IF EXISTS author_select_public ON public.author;

CREATE POLICY author_select_access ON public.author
  FOR SELECT
  USING (true);

CREATE POLICY author_insert_admin ON public.author
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY author_update_admin ON public.author
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY author_delete_admin ON public.author
  FOR DELETE
  USING (is_admin());

-- ------------------------------------------------------------
-- article_category
-- ------------------------------------------------------------
ALTER TABLE public.article_category ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS article_category_admin_all ON public.article_category;
DROP POLICY IF EXISTS article_category_select_public ON public.article_category;

CREATE POLICY article_category_select_access ON public.article_category
  FOR SELECT
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.article a
      WHERE a.id = public.article_category.article_id
        AND a.status = 'published'
    )
  );

CREATE POLICY article_category_insert_admin ON public.article_category
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY article_category_update_admin ON public.article_category
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY article_category_delete_admin ON public.article_category
  FOR DELETE
  USING (is_admin());

-- ------------------------------------------------------------
-- category
-- ------------------------------------------------------------
ALTER TABLE public.category ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS category_admin_all ON public.category;
DROP POLICY IF EXISTS category_select_public ON public.category;

CREATE POLICY category_select_access ON public.category
  FOR SELECT
  USING (is_admin() OR status = 'published');

CREATE POLICY category_insert_admin ON public.category
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY category_update_admin ON public.category
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY category_delete_admin ON public.category
  FOR DELETE
  USING (is_admin());

-- ------------------------------------------------------------
-- article_tag
-- ------------------------------------------------------------
ALTER TABLE public.article_tag ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS article_tag_admin_all ON public.article_tag;
DROP POLICY IF EXISTS article_tag_select_public ON public.article_tag;

CREATE POLICY article_tag_select_access ON public.article_tag
  FOR SELECT
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.article a
      WHERE a.id = public.article_tag.article_id
        AND a.status = 'published'
    )
  );

CREATE POLICY article_tag_insert_admin ON public.article_tag
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY article_tag_update_admin ON public.article_tag
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY article_tag_delete_admin ON public.article_tag
  FOR DELETE
  USING (is_admin());

-- ------------------------------------------------------------
-- tag
-- ------------------------------------------------------------
ALTER TABLE public.tag ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tag_admin_all ON public.tag;
DROP POLICY IF EXISTS tag_select_public ON public.tag;

CREATE POLICY tag_select_access ON public.tag
  FOR SELECT
  USING (is_admin() OR status = 'published');

CREATE POLICY tag_insert_admin ON public.tag
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY tag_update_admin ON public.tag
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY tag_delete_admin ON public.tag
  FOR DELETE
  USING (is_admin());

-- ------------------------------------------------------------
-- statistic
-- ------------------------------------------------------------
ALTER TABLE public.statistic ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS statistic_admin_all ON public.statistic;
DROP POLICY IF EXISTS statistic_select_public ON public.statistic;

CREATE POLICY statistic_select_access ON public.statistic
  FOR SELECT
  USING (is_admin() OR status = 'published');

CREATE POLICY statistic_insert_admin ON public.statistic
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY statistic_update_admin ON public.statistic
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY statistic_delete_admin ON public.statistic
  FOR DELETE
  USING (is_admin());

-- ------------------------------------------------------------
-- partner
-- ------------------------------------------------------------
ALTER TABLE public.partner ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS partner_admin_all ON public.partner;
DROP POLICY IF EXISTS partner_select_public ON public.partner;

CREATE POLICY partner_select_access ON public.partner
  FOR SELECT
  USING (is_admin() OR status = 'published');

CREATE POLICY partner_insert_admin ON public.partner
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY partner_update_admin ON public.partner
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY partner_delete_admin ON public.partner
  FOR DELETE
  USING (is_admin());

-- ------------------------------------------------------------
-- testimonial
-- ------------------------------------------------------------
ALTER TABLE public.testimonial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS testimonial_admin_all ON public.testimonial;
DROP POLICY IF EXISTS testimonial_select_public ON public.testimonial;

CREATE POLICY testimonial_select_access ON public.testimonial
  FOR SELECT
  USING (is_admin() OR status = 'published');

CREATE POLICY testimonial_insert_admin ON public.testimonial
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY testimonial_update_admin ON public.testimonial
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY testimonial_delete_admin ON public.testimonial
  FOR DELETE
  USING (is_admin());

-- ------------------------------------------------------------
-- team_member
-- ------------------------------------------------------------
ALTER TABLE public.team_member ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS team_member_admin_all ON public.team_member;
DROP POLICY IF EXISTS team_member_select_public ON public.team_member;

CREATE POLICY team_member_select_access ON public.team_member
  FOR SELECT
  USING (is_admin() OR status = 'published');

CREATE POLICY team_member_insert_admin ON public.team_member
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY team_member_update_admin ON public.team_member
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY team_member_delete_admin ON public.team_member
  FOR DELETE
  USING (is_admin());