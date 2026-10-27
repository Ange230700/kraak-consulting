-- Fusionner les droits équivalents sans multiplier les policies permissives.
-- Les lectures privées restent réservées aux utilisateurs authentifiés.
DROP POLICY support_request_employe_select ON public.support_request;
DROP POLICY support_request_employe_update ON public.support_request;
ALTER POLICY support_request_select_access ON public.support_request
  TO authenticated
  USING ((SELECT private.is_employe()) OR user_id=(SELECT auth.uid()));
ALTER POLICY support_request_update_access ON public.support_request
  TO authenticated
  USING ((SELECT private.is_employe()) OR user_id=(SELECT auth.uid()))
  WITH CHECK ((SELECT private.is_employe()) OR user_id=(SELECT auth.uid()));

DROP POLICY cohort_select_trainer ON public.cohort;
ALTER POLICY cohort_select_access ON public.cohort TO authenticated
  USING (
    (SELECT private.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.enrollment e
      JOIN public.participant p ON p.id=e.participant_id
      WHERE e.cohort_id=cohort.id AND p.user_id=(SELECT auth.uid())
        AND e.status IN ('pending','active','completed')
    )
    OR EXISTS (
      SELECT 1 FROM public.session s
      WHERE s.cohort_id=cohort.id AND s.trainer_user_id=(SELECT auth.uid())
    )
  );

DROP POLICY resource_select_trainer ON public.resource;
ALTER POLICY resource_select_access ON public.resource TO authenticated
  USING (
    (SELECT private.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.enrollment e
      JOIN public.participant p ON p.id=e.participant_id
      WHERE p.user_id=(SELECT auth.uid())
        AND e.status IN ('pending','active','completed')
        AND (e.program_id=resource.program_id OR e.cohort_id=resource.cohort_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.session s
      WHERE s.cohort_id=resource.cohort_id
        AND s.trainer_user_id=(SELECT auth.uid())
    )
  );

DO $$
DECLARE entity text;
BEGIN
  FOREACH entity IN ARRAY ARRAY['service','service_detail','program_feature'] LOOP
    EXECUTE format('DROP POLICY %I ON public.%I',entity||'_admin_all',entity);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_admin()))',
      entity||'_insert_admin',entity);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()))',
      entity||'_update_admin',entity);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING ((SELECT private.is_admin()))',
      entity||'_delete_admin',entity);
  END LOOP;
END;
$$;

ALTER POLICY program_feature_select_public ON public.program_feature
  USING (
    (SELECT private.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.program p
      WHERE p.id=program_feature.program_id
        AND p.status='published' AND p.visibility='public'
    )
  );
