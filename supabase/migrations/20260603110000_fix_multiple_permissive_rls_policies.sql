-- ============================================================
-- Migration : correction des warnings RLS multiple permissive policies
-- Objectif  : conserver les droits admin / proprietaire tout en gardant
--             une seule policy permissive par action sur les tables visees
-- ============================================================
-- ------------------------------------------------------------
-- participant
-- ------------------------------------------------------------
DROP POLICY IF EXISTS participant_admin_all ON participant;

DROP POLICY IF EXISTS participant_select_own ON participant;

DROP POLICY IF EXISTS participant_update_own ON participant;

CREATE POLICY participant_select_access ON participant FOR
SELECT
    USING (
        is_admin ()
        OR user_id = auth.uid ()
    );

CREATE POLICY participant_update_access ON participant FOR
UPDATE USING (
    is_admin ()
    OR user_id = auth.uid ()
)
WITH
    CHECK (
        is_admin ()
        OR user_id = auth.uid ()
    );

CREATE POLICY participant_insert_admin ON participant FOR INSERT
WITH
    CHECK (is_admin ());

CREATE POLICY participant_delete_admin ON participant FOR DELETE USING (is_admin ());

-- ------------------------------------------------------------
-- support_request
-- ------------------------------------------------------------
DROP POLICY IF EXISTS support_request_admin_all ON support_request;

DROP POLICY IF EXISTS support_request_select_own ON support_request;

DROP POLICY IF EXISTS support_request_insert_own ON support_request;

DROP POLICY IF EXISTS support_request_update_own ON support_request;

CREATE POLICY support_request_select_access ON support_request FOR
SELECT
    USING (
        is_admin ()
        OR user_id = auth.uid ()
    );

CREATE POLICY support_request_insert_access ON support_request FOR INSERT
WITH
    CHECK (
        is_admin ()
        OR user_id = auth.uid ()
    );

CREATE POLICY support_request_update_access ON support_request FOR
UPDATE USING (
    is_admin ()
    OR user_id = auth.uid ()
)
WITH
    CHECK (
        is_admin ()
        OR user_id = auth.uid ()
    );

CREATE POLICY support_request_delete_admin ON support_request FOR DELETE USING (is_admin ());
