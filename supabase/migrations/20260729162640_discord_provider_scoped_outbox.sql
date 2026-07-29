-- Keep Discord delivery isolated from the shared integration outbox.
-- Existing events predate provider routing and are the original Discord-only
-- schedule events, so they retain the default provider.

alter table public.integration_events
  add column if not exists provider text not null default 'discord';

create index if not exists integration_events_provider_ready_idx
  on public.integration_events(provider, status, available_at)
  where status in ('pending', 'failed');

create or replace function public.claim_integration_events_for_provider(
  p_provider text,
  p_limit integer default 25
)
returns setof public.integration_events
language sql
security definer
set search_path = ''
as $$
  with candidates as (
    select event.id
    from public.integration_events event
    where event.provider = p_provider
      and (
        (
          event.status in ('pending', 'failed')
          and event.available_at <= now()
          and event.attempt_count < 5
        ) or (
          event.status = 'processing'
          and event.claimed_at < now() - interval '15 minutes'
        )
      )
    order by event.created_at
    for update skip locked
    limit least(greatest(p_limit, 1), 100)
  ),
  claimed as (
    update public.integration_events event
    set status = 'processing',
        claimed_at = now()
    from candidates
    where event.id = candidates.id
    returning event.*
  )
  select * from claimed;
$$;

revoke all on function public.claim_integration_events_for_provider(text, integer)
  from public, anon, authenticated;
grant execute on function public.claim_integration_events_for_provider(text, integer)
  to service_role;
