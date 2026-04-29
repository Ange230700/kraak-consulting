-- ============================================================
-- Migration : marquage de progression minimale par session
-- Réf.      : PRG-04
-- ============================================================

ALTER TABLE enrollment
  ADD COLUMN IF NOT EXISTS progress_completed_session_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS progress_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_enrollment_progress_completed_session_ids
  ON enrollment USING gin (progress_completed_session_ids);
