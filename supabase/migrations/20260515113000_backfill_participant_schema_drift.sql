-- ============================================================
-- Migration : rattrapage du schéma participant MVP
-- Contexte  : environnements en retard sur announcement.priority
--             et enrollment.progress_* provoquant des 500 API
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'announcement_priority'
  ) THEN
    CREATE TYPE announcement_priority AS ENUM (
      'low', 'normal', 'high', 'critical'
    );
  END IF;
END $$;

ALTER TABLE announcement
  ADD COLUMN IF NOT EXISTS priority announcement_priority NOT NULL DEFAULT 'normal';

ALTER TABLE enrollment
  ADD COLUMN IF NOT EXISTS progress_completed_session_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS progress_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_enrollment_progress_completed_session_ids
  ON enrollment USING gin (progress_completed_session_ids);
