-- Les annonces ne sont jamais publiques : seules les identités authentifiées
-- peuvent lire les annonces publiées, dans la limite de leur audience.
ALTER POLICY announcement_select_access ON public.announcement
  TO authenticated
  USING (
    (SELECT private.is_admin())
    OR (
      status = 'published'
      AND (
        audience_type = 'all_participants'
        OR EXISTS (
          SELECT 1
          FROM public.enrollment e
          JOIN public.participant p ON p.id = e.participant_id
          WHERE p.user_id = (SELECT auth.uid())
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
