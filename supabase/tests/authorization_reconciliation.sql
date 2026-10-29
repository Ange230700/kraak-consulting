-- Given un clone vide du schéma, When la réconciliation est appliquée,
-- Then les objets manquants existent et les autorisations restent isolées.
-- À exécuter uniquement sur la base locale de répétition avec ON_ERROR_STOP.
BEGIN;
SET LOCAL row_security = on;

DO $$
DECLARE missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM unnest(ARRAY['service','service_detail','program_feature','course',
    'learning_module','chapter','lesson','program_course','course_module',
    'chapter_lesson']) t(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname=t.name AND c.relrowsecurity
  );
  IF missing <> 0 THEN RAISE EXCEPTION 'Tables manquantes ou RLS désactivée : %', missing; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='support_request'
      AND column_name='is_read' AND data_type='boolean'
      AND is_nullable='NO' AND column_default='false') THEN
    RAISE EXCEPTION 'Définition is_read incorrecte';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('is_admin','is_employe','is_trainer')) THEN
    RAISE EXCEPTION 'Helper d’autorisation exposé dans public';
  END IF;
  IF has_function_privilege('anon','private.is_employe()','EXECUTE')
    OR has_function_privilege('anon','private.is_trainer()','EXECUTE') THEN
    RAISE EXCEPTION 'Helper employé/formateur exécutable par anon';
  END IF;
  IF EXISTS (
    SELECT p.tablename,r.role_name,a.action
    FROM pg_policies p
    CROSS JOIN unnest(ARRAY['anon','authenticated']) r(role_name)
    CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE']) a(action)
    WHERE p.schemaname='public' AND p.permissive='PERMISSIVE'
      AND p.tablename IN ('support_request','cohort','resource','service',
        'service_detail','program_feature')
      AND (r.role_name::name=ANY(p.roles) OR 'public'::name=ANY(p.roles))
      AND (p.cmd=a.action OR p.cmd='ALL')
    GROUP BY p.tablename,r.role_name,a.action HAVING count(*)>1
  ) THEN RAISE EXCEPTION 'Policies permissives redondantes'; END IF;
END;
$$;

-- Given un article, When son état change, Then la date respecte la contrainte.
INSERT INTO public.author(email,display_name)
VALUES ('rehearsal-author@example.invalid','Test');
DO $$
DECLARE author_uuid uuid;
BEGIN
 SELECT id INTO STRICT author_uuid FROM public.author
 WHERE email='rehearsal-author@example.invalid';
 INSERT INTO public.article(author_id,slug,title,excerpt,content,status,published_at)
 VALUES (author_uuid,'rehearsal-archived','Test','Test','Test','archived',NULL);
 INSERT INTO public.article(author_id,slug,title,excerpt,content,status,published_at)
 VALUES (author_uuid,'rehearsal-published','Test','Test','Test','published',now());
 BEGIN
   UPDATE public.article SET published_at=NULL WHERE slug='rehearsal-published';
   RAISE EXCEPTION 'Article publié accepté sans date';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 BEGIN
   UPDATE public.article SET published_at=now() WHERE slug='rehearsal-archived';
   RAISE EXCEPTION 'Article archivé accepté avec date';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
END;
$$;

INSERT INTO auth.users(id)
SELECT ('00000000-0000-4000-8000-00000000000'||n)::uuid
FROM generate_series(1,6) n;
INSERT INTO public.app_user(id,email,role,first_name,last_name)
SELECT ('00000000-0000-4000-8000-00000000000'||n)::uuid,
 'rehearsal'||n||'@example.invalid',
 (CASE WHEN n=3 THEN 'employe' WHEN n>=4 THEN 'trainer' ELSE 'participant' END)::public.user_role,
 'Test','Test' FROM generate_series(1,6) n;
INSERT INTO public.support_request(user_id,subject,message,category)
SELECT ('00000000-0000-4000-8000-00000000000'||n)::uuid,
 'Test','Test','training' FROM generate_series(1,2) n;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
DO $$
DECLARE affected integer;
BEGIN
 IF (SELECT count(*) FROM public.support_request)<>1 THEN RAISE EXCEPTION 'Isolation participant incorrecte'; END IF;
 UPDATE public.support_request SET is_read=true WHERE user_id='00000000-0000-4000-8000-000000000002';
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>0 THEN RAISE EXCEPTION 'Modification d’une demande tierce'; END IF;
END;
$$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
DO $$
DECLARE affected integer;
BEGIN
 IF (SELECT count(*) FROM public.support_request)<>2 THEN RAISE EXCEPTION 'Lecture employé incorrecte'; END IF;
 UPDATE public.support_request SET is_read=true;
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>2 THEN RAISE EXCEPTION 'Triage employé incorrect'; END IF;
END;
$$;
RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.support_request)<>0 THEN RAISE EXCEPTION 'Demandes visibles anonymement'; END IF;
END; $$;
RESET ROLE;

INSERT INTO public.program(id,slug,title,summary,description)
VALUES ('10000000-0000-4000-8000-000000000001','rehearsal','Test','Test','Test');
INSERT INTO public.cohort(id,program_id,name,start_date)
SELECT ('20000000-0000-4000-8000-00000000000'||n)::uuid,
 '10000000-0000-4000-8000-000000000001','Cohort '||n,current_date
FROM generate_series(1,2) n;
INSERT INTO public.session(cohort_id,title,starts_at,ends_at,trainer_user_id)
SELECT ('20000000-0000-4000-8000-00000000000'||n)::uuid,
 'Session '||n,now(),now()+interval '1 hour',
 ('00000000-0000-4000-8000-00000000000'||(n+3))::uuid
FROM generate_series(1,2) n;
INSERT INTO public.participant(id,user_id)
VALUES
 ('40000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001'),
 ('40000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002');
INSERT INTO public.enrollment(participant_id,program_id,cohort_id,status)
VALUES (
 '40000000-0000-4000-8000-000000000001',
 '10000000-0000-4000-8000-000000000001',
 '20000000-0000-4000-8000-000000000001',
 'active'
);
INSERT INTO public.announcement(
 id,title,body,audience_type,program_id,cohort_id,status,published_at,created_by_user_id
)
VALUES
 (
 '30000000-0000-4000-8000-000000000001','All participants','Body',
 'all_participants',NULL,NULL,'published',now(),
 '00000000-0000-4000-8000-000000000001'
 ),
 (
 '30000000-0000-4000-8000-000000000002','Program participants','Body',
 'program','10000000-0000-4000-8000-000000000001',NULL,'published',now(),
 '00000000-0000-4000-8000-000000000001'
 ),
 (
 '30000000-0000-4000-8000-000000000003','Cohort participants','Body',
 'cohort','10000000-0000-4000-8000-000000000001',
 '20000000-0000-4000-8000-000000000001','published',now(),
 '00000000-0000-4000-8000-000000000001'
 );
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.announcement)<>0 THEN
   RAISE EXCEPTION 'Annonces visibles anonymement';
 END IF;
END; $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.announcement)<>1
   OR EXISTS (SELECT 1 FROM public.announcement
     WHERE id='30000000-0000-4000-8000-000000000002') THEN
   RAISE EXCEPTION 'Annonce ciblée visible sans inscription';
 END IF;
END; $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.announcement)<>3 THEN
   RAISE EXCEPTION 'Annonces correspondant aux inscriptions masquées';
 END IF;
END; $$;
RESET ROLE;
INSERT INTO public.resource(cohort_id,title,resource_type)
SELECT ('20000000-0000-4000-8000-00000000000'||n)::uuid,
 'Resource '||n,'link' FROM generate_series(1,2) n;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',true);
DO $$
DECLARE affected integer;
BEGIN
 IF NOT private.is_trainer() OR (SELECT count(*) FROM public.cohort)<>1
 OR NOT EXISTS (SELECT 1 FROM public.cohort WHERE name='Cohort 1')
 OR (SELECT count(*) FROM public.resource)<>1
 OR NOT EXISTS (SELECT 1 FROM public.resource WHERE title='Resource 1') THEN
   RAISE EXCEPTION 'Isolation formateur incorrecte';
 END IF;
 UPDATE public.resource SET title='Interdit';
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>0 THEN RAISE EXCEPTION 'Écriture ressource par le formateur'; END IF;
 UPDATE public.cohort SET name='Interdit';
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>0 THEN RAISE EXCEPTION 'Écriture cohorte par le formateur'; END IF;
END;
$$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000006',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.cohort)<>0 OR (SELECT count(*) FROM public.resource)<>0 THEN
   RAISE EXCEPTION 'Accès du formateur non affecté';
 END IF;
END; $$;
RESET ROLE;
ROLLBACK;
