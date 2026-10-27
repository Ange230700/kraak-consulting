-- ============================================================
-- Migration : optimisation auth.uid() dans les policies RLS
-- Objectif  : eviter la reevaluation par ligne signalee par le linter
-- ============================================================
-- ------------------------------------------------------------
-- app_user
-- ------------------------------------------------------------
DROP POLICY IF EXISTS app_user_select_access ON app_user;

DROP POLICY IF EXISTS app_user_insert_access ON app_user;

DROP POLICY IF EXISTS app_user_update_access ON app_user;

CREATE POLICY app_user_select_access ON app_user FOR
SELECT
    USING (
        is_admin ()
        OR id = (
            select
                auth.uid ()
        )
    );

CREATE POLICY app_user_insert_access ON app_user FOR INSERT
WITH
    CHECK (
        is_admin ()
        OR id = (
            select
                auth.uid ()
        )
    );

CREATE POLICY app_user_update_access ON app_user FOR
UPDATE USING (
    is_admin ()
    OR id = (
        select
            auth.uid ()
    )
)
WITH
    CHECK (
        is_admin ()
        OR id = (
            select
                auth.uid ()
        )
    );

-- ------------------------------------------------------------
-- participant
-- ------------------------------------------------------------
DROP POLICY IF EXISTS participant_select_access ON participant;

DROP POLICY IF EXISTS participant_update_access ON participant;

CREATE POLICY participant_select_access ON participant FOR
SELECT
    USING (
        is_admin ()
        OR user_id = (
            select
                auth.uid ()
        )
    );

CREATE POLICY participant_update_access ON participant FOR
UPDATE USING (
    is_admin ()
    OR user_id = (
        select
            auth.uid ()
    )
)
WITH
    CHECK (
        is_admin ()
        OR user_id = (
            select
                auth.uid ()
        )
    );

-- ------------------------------------------------------------
-- session
-- ------------------------------------------------------------
DROP POLICY IF EXISTS session_select_access ON session;

CREATE POLICY session_select_access ON session FOR
SELECT
    USING (
        is_admin ()
        OR trainer_user_id = (
            select
                auth.uid ()
        )
        OR EXISTS (
            SELECT
                1
            FROM
                enrollment e
                JOIN participant p ON p.id = e.participant_id
            WHERE
                e.cohort_id = session.cohort_id
                AND p.user_id = (
                    select
                        auth.uid ()
                )
                AND e.status IN ('pending', 'active', 'completed')
        )
    );

-- ------------------------------------------------------------
-- support_request
-- ------------------------------------------------------------
DROP POLICY IF EXISTS support_request_select_access ON support_request;

DROP POLICY IF EXISTS support_request_insert_access ON support_request;

DROP POLICY IF EXISTS support_request_update_access ON support_request;

CREATE POLICY support_request_select_access ON support_request FOR
SELECT
    USING (
        is_admin ()
        OR user_id = (
            select
                auth.uid ()
        )
    );

CREATE POLICY support_request_insert_access ON support_request FOR INSERT
WITH
    CHECK (
        is_admin ()
        OR user_id = (
            select
                auth.uid ()
        )
    );

CREATE POLICY support_request_update_access ON support_request FOR
UPDATE USING (
    is_admin ()
    OR user_id = (
        select
            auth.uid ()
    )
)
WITH
    CHECK (
        is_admin ()
        OR user_id = (
            select
                auth.uid ()
        )
    );

-- ------------------------------------------------------------
-- announcement
-- ------------------------------------------------------------
DROP POLICY IF EXISTS announcement_select_access ON announcement;

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
                        p.user_id = (
                            select
                                auth.uid ()
                        )
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

-- ------------------------------------------------------------
-- cohort
-- ------------------------------------------------------------
DROP POLICY IF EXISTS cohort_select_access ON cohort;

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
                AND p.user_id = (
                    select
                        auth.uid ()
                )
                AND e.status IN ('pending', 'active', 'completed')
        )
    );

-- ------------------------------------------------------------
-- enrollment
-- ------------------------------------------------------------
DROP POLICY IF EXISTS enrollment_select_access ON enrollment;

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
                AND p.user_id = (
                    select
                        auth.uid ()
                )
        )
    );

-- ------------------------------------------------------------
-- notification
-- ------------------------------------------------------------
DROP POLICY IF EXISTS notification_select_access ON notification;

DROP POLICY IF EXISTS notification_update_access ON notification;

CREATE POLICY notification_select_access ON notification FOR
SELECT
    USING (
        is_admin ()
        OR user_id = (
            select
                auth.uid ()
        )
    );

CREATE POLICY notification_update_access ON notification FOR
UPDATE USING (
    is_admin ()
    OR user_id = (
        select
            auth.uid ()
    )
)
WITH
    CHECK (
        is_admin ()
        OR user_id = (
            select
                auth.uid ()
        )
    );

-- ------------------------------------------------------------
-- resource
-- ------------------------------------------------------------
DROP POLICY IF EXISTS resource_select_access ON resource;

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
                p.user_id = (
                    select
                        auth.uid ()
                )
                AND e.status IN ('pending', 'active', 'completed')
                AND (
                    e.program_id = resource.program_id
                    OR e.cohort_id = resource.cohort_id
                )
        )
    );
