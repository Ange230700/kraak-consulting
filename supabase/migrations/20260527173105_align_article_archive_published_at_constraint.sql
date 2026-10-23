alter table public.article
drop constraint if exists article_published_at_consistency;

alter table public.article
add constraint article_published_at_consistency
check (
  (
    status = 'published'
    and published_at is not null
  )
  or (
    status in ('draft', 'archived')
    and published_at is null
  )
);
