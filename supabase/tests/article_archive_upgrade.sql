-- Given des articles conformes à l'ancien schéma, When la contrainte évolue,
-- Then les articles archivés sont normalisés sans modifier les autres états.
BEGIN;

ALTER TABLE public.article
DROP CONSTRAINT article_published_at_consistency;
ALTER TABLE public.article
ADD CONSTRAINT article_published_at_consistency CHECK (
  (status = 'draft' AND published_at IS NULL)
  OR (status IN ('published', 'archived') AND published_at IS NOT NULL)
);

INSERT INTO public.author (id, email, display_name)
VALUES ('30000000-0000-4000-8000-000000000001', 'upgrade@example.invalid', 'Test');
INSERT INTO public.article (author_id, slug, title, excerpt, content, status, published_at)
VALUES
  ('30000000-0000-4000-8000-000000000001', 'upgrade-archived', 'Test', 'Test', 'Test', 'archived', '2026-01-01T00:00:00Z'),
  ('30000000-0000-4000-8000-000000000001', 'upgrade-published', 'Test', 'Test', 'Test', 'published', '2026-01-01T00:00:00Z'),
  ('30000000-0000-4000-8000-000000000001', 'upgrade-draft', 'Test', 'Test', 'Test', 'draft', NULL);

\ir ../migrations/20260527173105_align_article_archive_published_at_constraint.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.article
    WHERE slug = 'upgrade-archived' AND status = 'archived' AND published_at IS NULL
  ) THEN RAISE EXCEPTION 'Article archivé non normalisé'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.article
    WHERE slug = 'upgrade-published' AND status = 'published'
      AND published_at = '2026-01-01T00:00:00Z'::timestamptz
  ) THEN RAISE EXCEPTION 'Date de publication modifiée'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.article
    WHERE slug = 'upgrade-draft' AND status = 'draft' AND published_at IS NULL
  ) THEN RAISE EXCEPTION 'Brouillon modifié'; END IF;
END;
$$;

ROLLBACK;
