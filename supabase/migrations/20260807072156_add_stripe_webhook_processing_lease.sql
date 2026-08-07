alter table public.stripe_webhook_events
  add column if not exists processing_started_at timestamptz;

update public.stripe_webhook_events
set processing_started_at = created_at
where status = 'processing'
  and processing_started_at is null;

create index if not exists stripe_webhook_events_processing_started_idx
  on public.stripe_webhook_events(status, processing_started_at);
