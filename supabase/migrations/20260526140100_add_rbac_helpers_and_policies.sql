-- Add helper functions for the new roles

CREATE OR REPLACE FUNCTION is_employe()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user
    WHERE id = auth.uid() AND role IN ('admin', 'employe')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_trainer()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user
    WHERE id = auth.uid() AND role IN ('admin', 'trainer')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Employe can read all support requests (for admin inbox)
CREATE POLICY support_request_employe_select ON support_request
  FOR SELECT USING (is_employe());

-- Employe can update support requests (status changes, triage)
CREATE POLICY support_request_employe_update ON support_request
  FOR UPDATE USING (is_employe());

-- Trainer can read cohorts for their sessions
CREATE POLICY cohort_select_trainer ON cohort
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session s
      WHERE s.cohort_id = cohort.id
        AND s.trainer_user_id = auth.uid()
    )
  );

-- Trainer can read resources linked to their cohorts
CREATE POLICY resource_select_trainer ON resource
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session s
      WHERE s.cohort_id = resource.cohort_id
        AND s.trainer_user_id = auth.uid()
    )
  );