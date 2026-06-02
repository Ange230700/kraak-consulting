-- ============================================================
-- Migration : RLS sur les autres entites CMS publiques
-- Objectif  : lecture publique des contenus publies, ecriture admin uniquement
-- ============================================================
ALTER TABLE public.author ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.article_category ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.category ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.article_tag ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tag ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.statistic ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.partner ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.testimonial ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.team_member ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS author_admin_all ON public.author;

CREATE POLICY author_admin_all ON public.author FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

DROP POLICY IF EXISTS author_select_public ON public.author;

CREATE POLICY author_select_public ON public.author FOR
SELECT
    TO anon,
    authenticated USING (true);

DROP POLICY IF EXISTS article_category_admin_all ON public.article_category;

CREATE POLICY article_category_admin_all ON public.article_category FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

DROP POLICY IF EXISTS article_category_select_public ON public.article_category;

CREATE POLICY article_category_select_public ON public.article_category FOR
SELECT
    TO anon,
    authenticated USING (
        EXISTS (
            SELECT
                1
            FROM
                public.article a
            WHERE
                a.id = public.article_category.article_id
                AND a.status = 'published'
        )
    );

DROP POLICY IF EXISTS category_admin_all ON public.category;

CREATE POLICY category_admin_all ON public.category FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

DROP POLICY IF EXISTS category_select_public ON public.category;

CREATE POLICY category_select_public ON public.category FOR
SELECT
    TO anon,
    authenticated USING (status = 'published');

DROP POLICY IF EXISTS article_tag_admin_all ON public.article_tag;

CREATE POLICY article_tag_admin_all ON public.article_tag FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

DROP POLICY IF EXISTS article_tag_select_public ON public.article_tag;

CREATE POLICY article_tag_select_public ON public.article_tag FOR
SELECT
    TO anon,
    authenticated USING (
        EXISTS (
            SELECT
                1
            FROM
                public.article a
            WHERE
                a.id = public.article_tag.article_id
                AND a.status = 'published'
        )
    );

DROP POLICY IF EXISTS tag_admin_all ON public.tag;

CREATE POLICY tag_admin_all ON public.tag FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

DROP POLICY IF EXISTS tag_select_public ON public.tag;

CREATE POLICY tag_select_public ON public.tag FOR
SELECT
    TO anon,
    authenticated USING (status = 'published');

DROP POLICY IF EXISTS statistic_admin_all ON public.statistic;

CREATE POLICY statistic_admin_all ON public.statistic FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

DROP POLICY IF EXISTS statistic_select_public ON public.statistic;

CREATE POLICY statistic_select_public ON public.statistic FOR
SELECT
    TO anon,
    authenticated USING (status = 'published');

DROP POLICY IF EXISTS partner_admin_all ON public.partner;

CREATE POLICY partner_admin_all ON public.partner FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

DROP POLICY IF EXISTS partner_select_public ON public.partner;

CREATE POLICY partner_select_public ON public.partner FOR
SELECT
    TO anon,
    authenticated USING (status = 'published');

DROP POLICY IF EXISTS testimonial_admin_all ON public.testimonial;

CREATE POLICY testimonial_admin_all ON public.testimonial FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

DROP POLICY IF EXISTS testimonial_select_public ON public.testimonial;

CREATE POLICY testimonial_select_public ON public.testimonial FOR
SELECT
    TO anon,
    authenticated USING (status = 'published');

DROP POLICY IF EXISTS team_member_admin_all ON public.team_member;

CREATE POLICY team_member_admin_all ON public.team_member FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

DROP POLICY IF EXISTS team_member_select_public ON public.team_member;

CREATE POLICY team_member_select_public ON public.team_member FOR
SELECT
    TO anon,
    authenticated USING (status = 'published');
