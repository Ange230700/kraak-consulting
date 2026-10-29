CREATE TYPE public.resource_theme AS ENUM (
  'training',
  'project_management',
  'immigration',
  'career'
);

CREATE TYPE public.resource_audience AS ENUM (
  'all',
  'young_professionals_students',
  'organizations',
  'international_candidates'
);

ALTER TABLE public.resource
  ADD COLUMN resource_theme public.resource_theme NOT NULL DEFAULT 'training',
  ADD COLUMN resource_audience public.resource_audience NOT NULL
    DEFAULT 'young_professionals_students',
  ADD COLUMN consultation_count integer NOT NULL DEFAULT 0,
  ADD COLUMN last_consulted_at timestamptz;

ALTER TABLE public.resource
  ALTER COLUMN resource_theme DROP DEFAULT,
  ALTER COLUMN resource_audience DROP DEFAULT;

CREATE INDEX idx_resource_last_consulted_at
  ON public.resource (last_consulted_at DESC);

ALTER TABLE public.resource
  DROP CONSTRAINT resource_parent_required,
  ADD CONSTRAINT resource_parent_required CHECK (
    program_id IS NOT NULL
    OR cohort_id IS NOT NULL
    OR resource_audience = 'all'
  );
