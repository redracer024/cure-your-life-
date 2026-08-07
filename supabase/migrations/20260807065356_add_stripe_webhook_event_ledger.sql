create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  status text not null check (status in ('processing', 'processed', 'failed')),
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  retry_count integer not null default 0,
  stripe_created_at timestamptz
);

create index if not exists stripe_webhook_events_status_idx
  on public.stripe_webhook_events(status);

alter table public.stripe_webhook_events enable row level security;

revoke all on table public.stripe_webhook_events from anon;
revoke all on table public.stripe_webhook_events from authenticated;

drop policy if exists stripe_webhook_events_service_role_all on public.stripe_webhook_events;
create policy stripe_webhook_events_service_role_all
  on public.stripe_webhook_events
  for all
  to service_role
  using (true)
  with check (true);
