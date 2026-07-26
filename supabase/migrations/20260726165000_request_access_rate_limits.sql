create table if not exists public.access_request_rate_limits (
  fingerprint text not null,
  window_started_at timestamptz not null,
  attempts integer not null default 1 check (attempts between 1 and 1000),
  updated_at timestamptz not null default now(),
  primary key (fingerprint, window_started_at)
);
alter table public.access_request_rate_limits enable row level security;
revoke all on public.access_request_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.access_request_rate_limits to service_role;
create index if not exists access_request_rate_limits_cleanup_idx on public.access_request_rate_limits (updated_at);
