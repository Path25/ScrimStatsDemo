-- Store the approved initiating app host for each provider OAuth callback.
-- The state table is service-role-only, so this value cannot be supplied by an
-- untrusted callback request.
alter table public.discord_oauth_states
  add column if not exists return_url text not null default 'https://scrimstats.gg';

alter table public.discord_oauth_states
  drop constraint if exists discord_oauth_states_return_url_check;

alter table public.discord_oauth_states
  add constraint discord_oauth_states_return_url_check
  check (return_url in (
    'https://scrimstats.gg',
    'https://www.scrimstats.gg',
    'https://staging.scrimstats.gg',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ));
