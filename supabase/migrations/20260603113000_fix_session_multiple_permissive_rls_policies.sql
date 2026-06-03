-- ============================================================
-- Migration : correction RLS session multiple permissive policies
-- Objectif  : supprimer le chevauchement sur SELECT en gardant
--             les droits admin, formateur et participant inscrit
-- ============================================================
DROP POLICY IF EXISTS session_admin_all ON session;

DROP POLICY IF EXISTS session_select_trainer ON session;

DROP POLICY IF EXISTS session_select_enrolled ON session;

CREATE POLICY session_select_access ON session FOR
SELECT
    USING (
        is_admin ()
        OR trainer_user_id = auth.uid ()
        OR EXISTS (
            SELECT
                1
            FROM
                enrollment e
                JOIN participant p ON p.id = e.participant_id
            WHERE
                e.cohort_id = session.cohort_id
                AND p.user_id = auth.uid ()
                AND e.status IN ('pending', 'active', 'completed')
        )
    );

CREATE POLICY session_insert_admin ON session FOR INSERT
WITH
    CHECK (is_admin ());

CREATE POLICY session_update_admin ON session FOR
UPDATE USING (is_admin ())
WITH
    CHECK (is_admin ());

CREATE POLICY session_delete_admin ON session FOR DELETE USING (is_admin ());
