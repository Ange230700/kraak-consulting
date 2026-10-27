-- ============================================================
-- Migration : correction des warnings RLS restants
-- Objectif  : conserver les droits admin / utilisateur / public tout en
--             gardant une seule policy permissive par action
-- ============================================================
-- ------------------------------------------------------------
-- app_user
-- ------------------------------------------------------------
DROP POLICY IF EXISTS app_user_admin_all ON app_user;

DROP POLICY IF EXISTS app_user_select_own ON app_user;

DROP POLICY IF EXISTS app_user_update_own ON app_user;

DROP POLICY IF EXISTS app_user_insert_own ON app_user;

CREATE POLICY app_user_select_access ON app_user FOR
SELECT
    USING (
        is_admin ()
        OR id = auth.uid ()
    );

CREATE POLICY app_user_insert_access ON app_user FOR INSERT
WITH
    CHECK (
        is_admin ()
        OR id = auth.uid ()
    );

CREATE POLICY app_user_update_access ON app_user FOR
UPDATE USING (
    is_admin ()
    OR id = auth.uid ()
)
WITH
    CHECK (
        is_admin ()
        OR id = auth.uid ()
    );

CREATE POLICY app_user_delete_admin ON app_user FOR DELETE USING (is_admin ());

-- ------------------------------------------------------------
-- announcement
-- ------------------------------------------------------------
DROP POLICY IF EXISTS announcement_admin_all ON announcement;

DROP POLICY IF EXISTS announcement_select_published ON announcement;

CREATE POLICY announcement_select_access ON announcement FOR
SELECT
    USING (
        is_admin ()
        OR (
            status = 'published'
            AND (
                audience_type = 'all_participants'
                OR EXISTS (
                    SELECT
                        1
                    FROM
                        enrollment e
                        JOIN participant p ON p.id = e.participant_id
                    WHERE
                        p.user_id = auth.uid ()
                        AND e.status IN ('pending', 'active', 'completed')
                        AND (
                            (
                                announcement.audience_type = 'program'
                                AND e.program_id = announcement.program_id
                            )
                            OR (
                                announcement.audience_type = 'cohort'
                                AND e.cohort_id = announcement.cohort_id
                            )
                        )
                )
            )
        )
    );

CREATE POLICY announcement_insert_admin ON announcement FOR INSERT
WITH
    CHECK (is_admin ());

CREATE POLICY announcement_update_admin ON announcement FOR
UPDATE USING (is_admin ())
WITH
    CHECK (is_admin ());

CREATE POLICY announcement_delete_admin ON announcement FOR DELETE USING (is_admin ());

-- ------------------------------------------------------------
-- cohort
-- ------------------------------------------------------------
DROP POLICY IF EXISTS cohort_admin_all ON cohort;

DROP POLICY IF EXISTS cohort_select_enrolled ON cohort;

CREATE POLICY cohort_select_access ON cohort FOR
SELECT
    USING (
        is_admin ()
        OR EXISTS (
            SELECT
                1
            FROM
                enrollment e
                JOIN participant p ON p.id = e.participant_id
            WHERE
                e.cohort_id = cohort.id
                AND p.user_id = auth.uid ()
                AND e.status IN ('pending', 'active', 'completed')
        )
    );

CREATE POLICY cohort_insert_admin ON cohort FOR INSERT
WITH
    CHECK (is_admin ());

CREATE POLICY cohort_update_admin ON cohort FOR
UPDATE USING (is_admin ())
WITH
    CHECK (is_admin ());

CREATE POLICY cohort_delete_admin ON cohort FOR DELETE USING (is_admin ());

-- ------------------------------------------------------------
-- enrollment
-- ------------------------------------------------------------
DROP POLICY IF EXISTS enrollment_admin_all ON enrollment;

DROP POLICY IF EXISTS enrollment_select_own ON enrollment;

CREATE POLICY enrollment_select_access ON enrollment FOR
SELECT
    USING (
        is_admin ()
        OR EXISTS (
            SELECT
                1
            FROM
                participant p
            WHERE
                p.id = enrollment.participant_id
                AND p.user_id = auth.uid ()
        )
    );

CREATE POLICY enrollment_insert_admin ON enrollment FOR INSERT
WITH
    CHECK (is_admin ());

CREATE POLICY enrollment_update_admin ON enrollment FOR
UPDATE USING (is_admin ())
WITH
    CHECK (is_admin ());

CREATE POLICY enrollment_delete_admin ON enrollment FOR DELETE USING (is_admin ());

-- ------------------------------------------------------------
-- notification
-- ------------------------------------------------------------
DROP POLICY IF EXISTS notification_admin_all ON notification;

DROP POLICY IF EXISTS notification_select_own ON notification;

DROP POLICY IF EXISTS notification_update_own ON notification;

CREATE POLICY notification_select_access ON notification FOR
SELECT
    USING (
        is_admin ()
        OR user_id = auth.uid ()
    );

CREATE POLICY notification_insert_admin ON notification FOR INSERT
WITH
    CHECK (is_admin ());

CREATE POLICY notification_update_access ON notification FOR
UPDATE USING (
    is_admin ()
    OR user_id = auth.uid ()
)
WITH
    CHECK (
        is_admin ()
        OR user_id = auth.uid ()
    );

CREATE POLICY notification_delete_admin ON notification FOR DELETE USING (is_admin ());

-- ------------------------------------------------------------
-- program
-- ------------------------------------------------------------
DROP POLICY IF EXISTS program_admin_all ON program;

DROP POLICY IF EXISTS program_select_published ON program;

CREATE POLICY program_select_access ON program FOR
SELECT
    USING (
        is_admin ()
        OR (
            status = 'published'
            AND visibility = 'public'
        )
    );

CREATE POLICY program_insert_admin ON program FOR INSERT
WITH
    CHECK (is_admin ());

CREATE POLICY program_update_admin ON program FOR
UPDATE USING (is_admin ())
WITH
    CHECK (is_admin ());

CREATE POLICY program_delete_admin ON program FOR DELETE USING (is_admin ());

-- ------------------------------------------------------------
-- resource
-- ------------------------------------------------------------
DROP POLICY IF EXISTS resource_admin_all ON resource;

DROP POLICY IF EXISTS resource_select_enrolled ON resource;

CREATE POLICY resource_select_access ON resource FOR
SELECT
    USING (
        is_admin ()
        OR EXISTS (
            SELECT
                1
            FROM
                enrollment e
                JOIN participant p ON p.id = e.participant_id
            WHERE
                p.user_id = auth.uid ()
                AND e.status IN ('pending', 'active', 'completed')
                AND (
                    e.program_id = resource.program_id
                    OR e.cohort_id = resource.cohort_id
                )
        )
    );

CREATE POLICY resource_insert_admin ON resource FOR INSERT
WITH
    CHECK (is_admin ());

CREATE POLICY resource_update_admin ON resource FOR
UPDATE USING (is_admin ())
WITH
    CHECK (is_admin ());

CREATE POLICY resource_delete_admin ON resource FOR DELETE USING (is_admin ());
