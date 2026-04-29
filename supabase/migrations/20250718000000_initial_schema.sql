-- ============================================================
-- Migration : schéma initial MVP KRAAK
-- Entités  : User, Participant, Program, Cohort, Session,
--             Resource, Announcement, Enrollment, Notification,
--             SupportRequest
-- Réf.     : docs/specs/product_model.md
-- ============================================================

-- 0. Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. Types ENUM
-- ============================================================

CREATE TYPE user_role AS ENUM ('participant', 'admin', 'trainer');

CREATE TYPE lifecycle_status AS ENUM (
  'invited', 'registered', 'active', 'completed', 'inactive'
);

-- Partagé par program, resource et announcement
CREATE TYPE publication_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE program_visibility AS ENUM ('private', 'participants', 'public');

CREATE TYPE cohort_status AS ENUM (
  'draft', 'open', 'active', 'completed', 'archived'
);

CREATE TYPE session_status AS ENUM (
  'scheduled', 'live', 'completed', 'cancelled'
);

CREATE TYPE location_type AS ENUM ('online', 'onsite', 'hybrid');

CREATE TYPE resource_type AS ENUM ('link', 'file', 'video', 'document');

CREATE TYPE audience_type AS ENUM (
  'all_participants', 'program', 'cohort', 'custom'
);

CREATE TYPE enrollment_status AS ENUM (
  'pending', 'active', 'completed', 'cancelled'
);

CREATE TYPE notification_type AS ENUM (
  'announcement', 'session_reminder', 'system', 'support_update'
);

CREATE TYPE notification_channel AS ENUM ('in_app', 'push');

CREATE TYPE support_request_status AS ENUM (
  'open', 'in_progress', 'resolved', 'closed'
);

CREATE TYPE support_category AS ENUM (
  'technical', 'program', 'session', 'billing', 'other'
);

-- ============================================================
-- 2. Fonction utilitaire updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. Tables (ordre de dépendance)
-- ============================================================

-- 3.1 app_user  (entité User — « user » est un mot réservé PostgreSQL)
CREATE TABLE app_user (
  id                        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                     text NOT NULL UNIQUE,
  role                      user_role NOT NULL DEFAULT 'participant',
  first_name                text NOT NULL,
  last_name                 text NOT NULL,
  phone                     text,
  preferred_contact_channel text,
  is_active                 boolean NOT NULL DEFAULT true,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- 3.2 participant
CREATE TABLE participant (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid NOT NULL UNIQUE REFERENCES app_user(id) ON DELETE CASCADE,
  lifecycle_status lifecycle_status NOT NULL DEFAULT 'invited',
  reference_code   text,
  country          text,
  city             text,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 3.3 program
CREATE TABLE program (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  summary     text NOT NULL,
  description text NOT NULL,
  status      publication_status NOT NULL DEFAULT 'draft',
  visibility  program_visibility NOT NULL DEFAULT 'private',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 3.4 cohort
CREATE TABLE cohort (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id uuid NOT NULL REFERENCES program(id) ON DELETE CASCADE,
  name       text NOT NULL,
  code       text,
  status     cohort_status NOT NULL DEFAULT 'draft',
  start_date date NOT NULL,
  end_date   date,
  capacity   integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT cohort_capacity_positive CHECK (capacity IS NULL OR capacity > 0)
);

-- 3.5 session (séance de formation)
CREATE TABLE session (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id       uuid NOT NULL REFERENCES cohort(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  status          session_status NOT NULL DEFAULT 'scheduled',
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  location_type   location_type NOT NULL DEFAULT 'online',
  location_label  text,
  meeting_link    text,
  trainer_user_id uuid REFERENCES app_user(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT session_time_range CHECK (ends_at > starts_at)
);

-- 3.6 resource
CREATE TABLE resource (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id    uuid REFERENCES program(id) ON DELETE CASCADE,
  cohort_id     uuid REFERENCES cohort(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  resource_type resource_type NOT NULL,
  url           text,
  file_path     text,
  status        publication_status NOT NULL DEFAULT 'draft',
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT resource_parent_required CHECK (
    program_id IS NOT NULL OR cohort_id IS NOT NULL
  )
);

-- 3.7 announcement
CREATE TABLE announcement (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title              text NOT NULL,
  body               text NOT NULL,
  audience_type      audience_type NOT NULL,
  program_id         uuid REFERENCES program(id) ON DELETE CASCADE,
  cohort_id          uuid REFERENCES cohort(id) ON DELETE CASCADE,
  status             publication_status NOT NULL DEFAULT 'draft',
  published_at       timestamptz,
  created_by_user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- 3.8 enrollment
CREATE TABLE enrollment (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
  program_id     uuid NOT NULL REFERENCES program(id) ON DELETE CASCADE,
  cohort_id      uuid REFERENCES cohort(id) ON DELETE SET NULL,
  status         enrollment_status NOT NULL DEFAULT 'pending',
  enrolled_at    timestamptz NOT NULL DEFAULT now(),
  completed_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT enrollment_unique_participant_program
    UNIQUE (participant_id, program_id)
);

-- 3.9 notification
CREATE TABLE notification (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  title             text NOT NULL,
  body              text NOT NULL,
  notification_type notification_type NOT NULL,
  channel           notification_channel NOT NULL DEFAULT 'in_app',
  is_read           boolean NOT NULL DEFAULT false,
  read_at           timestamptz,
  source_type       text,
  source_id         uuid,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- 3.10 support_request
CREATE TABLE support_request (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  participant_id      uuid REFERENCES participant(id) ON DELETE SET NULL,
  subject             text NOT NULL,
  message             text NOT NULL,
  status              support_request_status NOT NULL DEFAULT 'open',
  category            support_category NOT NULL,
  assigned_to_user_id uuid REFERENCES app_user(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. Index (FK et colonnes de filtrage fréquentes)
--    Les colonnes UNIQUE / PK sont déjà indexées automatiquement.
-- ============================================================

CREATE INDEX idx_app_user_role               ON app_user (role);

CREATE INDEX idx_participant_lifecycle       ON participant (lifecycle_status);

CREATE INDEX idx_program_status              ON program (status);

CREATE INDEX idx_cohort_program_id           ON cohort (program_id);
CREATE INDEX idx_cohort_status               ON cohort (status);

CREATE INDEX idx_session_cohort_id           ON session (cohort_id);
CREATE INDEX idx_session_trainer_user_id     ON session (trainer_user_id);
CREATE INDEX idx_session_starts_at           ON session (starts_at);

CREATE INDEX idx_resource_program_id         ON resource (program_id);
CREATE INDEX idx_resource_cohort_id          ON resource (cohort_id);

CREATE INDEX idx_announcement_program_id     ON announcement (program_id);
CREATE INDEX idx_announcement_cohort_id      ON announcement (cohort_id);

CREATE INDEX idx_enrollment_participant_id   ON enrollment (participant_id);
CREATE INDEX idx_enrollment_program_id       ON enrollment (program_id);
CREATE INDEX idx_enrollment_cohort_id        ON enrollment (cohort_id);
CREATE INDEX idx_enrollment_status           ON enrollment (status);

CREATE INDEX idx_notification_user_id        ON notification (user_id);
CREATE INDEX idx_notification_user_unread    ON notification (user_id, is_read)
  WHERE is_read = false;

CREATE INDEX idx_support_request_user_id     ON support_request (user_id);
CREATE INDEX idx_support_request_status      ON support_request (status);
CREATE INDEX idx_support_request_assigned    ON support_request (assigned_to_user_id);

-- ============================================================
-- 5. Triggers updated_at
-- ============================================================

CREATE TRIGGER trg_app_user_updated_at
  BEFORE UPDATE ON app_user
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_participant_updated_at
  BEFORE UPDATE ON participant
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_program_updated_at
  BEFORE UPDATE ON program
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cohort_updated_at
  BEFORE UPDATE ON cohort
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_session_updated_at
  BEFORE UPDATE ON session
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_resource_updated_at
  BEFORE UPDATE ON resource
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_announcement_updated_at
  BEFORE UPDATE ON announcement
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_enrollment_updated_at
  BEFORE UPDATE ON enrollment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_support_request_updated_at
  BEFORE UPDATE ON support_request
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. Row Level Security (RLS)
-- ============================================================

ALTER TABLE app_user        ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant     ENABLE ROW LEVEL SECURITY;
ALTER TABLE program         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort          ENABLE ROW LEVEL SECURITY;
ALTER TABLE session         ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource        ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement    ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification    ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_request ENABLE ROW LEVEL SECURITY;

-- Fonction utilitaire : vérifier si l'utilisateur courant est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- -------------------------------------------------------
-- 6.1 app_user
-- -------------------------------------------------------
CREATE POLICY app_user_admin_all ON app_user
  FOR ALL USING (is_admin());

CREATE POLICY app_user_select_own ON app_user
  FOR SELECT USING (id = auth.uid());

CREATE POLICY app_user_update_own ON app_user
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY app_user_insert_own ON app_user
  FOR INSERT WITH CHECK (id = auth.uid());

-- -------------------------------------------------------
-- 6.2 participant
-- -------------------------------------------------------
CREATE POLICY participant_admin_all ON participant
  FOR ALL USING (is_admin());

CREATE POLICY participant_select_own ON participant
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY participant_update_own ON participant
  FOR UPDATE USING (user_id = auth.uid());

-- -------------------------------------------------------
-- 6.3 program — lecture publique pour le site vitrine
-- -------------------------------------------------------
CREATE POLICY program_admin_all ON program
  FOR ALL USING (is_admin());

CREATE POLICY program_select_published ON program
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND visibility = 'public');

-- -------------------------------------------------------
-- 6.4 cohort
-- -------------------------------------------------------
CREATE POLICY cohort_admin_all ON cohort
  FOR ALL USING (is_admin());

CREATE POLICY cohort_select_enrolled ON cohort
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollment e
        JOIN participant p ON p.id = e.participant_id
       WHERE e.cohort_id = cohort.id
         AND p.user_id   = auth.uid()
         AND e.status IN ('pending', 'active', 'completed')
    )
  );

-- -------------------------------------------------------
-- 6.5 session
-- -------------------------------------------------------
CREATE POLICY session_admin_all ON session
  FOR ALL USING (is_admin());

CREATE POLICY session_select_trainer ON session
  FOR SELECT USING (trainer_user_id = auth.uid());

CREATE POLICY session_select_enrolled ON session
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollment e
        JOIN participant p ON p.id = e.participant_id
       WHERE e.cohort_id = session.cohort_id
         AND p.user_id   = auth.uid()
         AND e.status IN ('pending', 'active', 'completed')
    )
  );

-- -------------------------------------------------------
-- 6.6 resource
-- -------------------------------------------------------
CREATE POLICY resource_admin_all ON resource
  FOR ALL USING (is_admin());

CREATE POLICY resource_select_enrolled ON resource
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollment e
        JOIN participant p ON p.id = e.participant_id
       WHERE p.user_id = auth.uid()
         AND e.status IN ('pending', 'active', 'completed')
         AND (
           e.program_id = resource.program_id
           OR e.cohort_id = resource.cohort_id
         )
    )
  );

-- -------------------------------------------------------
-- 6.7 announcement
-- -------------------------------------------------------
CREATE POLICY announcement_admin_all ON announcement
  FOR ALL USING (is_admin());

CREATE POLICY announcement_select_published ON announcement
  FOR SELECT USING (
    status = 'published'
    AND (
      audience_type = 'all_participants'
      OR EXISTS (
        SELECT 1 FROM enrollment e
          JOIN participant p ON p.id = e.participant_id
         WHERE p.user_id = auth.uid()
           AND e.status IN ('pending', 'active', 'completed')
           AND (
             (announcement.audience_type = 'program' AND e.program_id = announcement.program_id)
             OR (announcement.audience_type = 'cohort' AND e.cohort_id = announcement.cohort_id)
           )
      )
    )
  );

-- -------------------------------------------------------
-- 6.8 enrollment
-- -------------------------------------------------------
CREATE POLICY enrollment_admin_all ON enrollment
  FOR ALL USING (is_admin());

CREATE POLICY enrollment_select_own ON enrollment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM participant p
       WHERE p.id      = enrollment.participant_id
         AND p.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- 6.9 notification
-- -------------------------------------------------------
CREATE POLICY notification_admin_all ON notification
  FOR ALL USING (is_admin());

CREATE POLICY notification_select_own ON notification
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notification_update_own ON notification
  FOR UPDATE USING (user_id = auth.uid());

-- -------------------------------------------------------
-- 6.10 support_request
-- -------------------------------------------------------
CREATE POLICY support_request_admin_all ON support_request
  FOR ALL USING (is_admin());

CREATE POLICY support_request_select_own ON support_request
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY support_request_insert_own ON support_request
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY support_request_update_own ON support_request
  FOR UPDATE USING (user_id = auth.uid());
