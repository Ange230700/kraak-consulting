drop extension if exists "pg_net";

alter table "public"."announcement"
drop constraint "announcement_mvp_audience_scope";

alter table "public"."announcement"
drop constraint "announcement_published_at_consistency";

drop trigger if exists "on_auth_user_created" on "auth"."users";

drop function if exists "public"."handle_auth_user_created" ();

drop index if exists "public"."idx_enrollment_progress_completed_session_ids";

drop index if exists "public"."idx_resource_last_consulted_at";

alter table "public"."announcement"
drop column "priority";

alter table "public"."enrollment"
drop column "progress_completed_session_ids";

alter table "public"."enrollment"
drop column "progress_updated_at";

alter table "public"."resource"
drop column "consultation_count";

alter table "public"."resource"
drop column "last_consulted_at";

alter table "public"."resource"
drop column "resource_audience";

alter table "public"."resource"
drop column "resource_theme";

drop type public.announcement_priority;

drop type public.resource_audience;

drop type public.resource_theme;
