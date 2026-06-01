create table if not exists public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  google_account_email text,
  calendar_id text default 'primary',
  calendar_name text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[],
  status text not null default 'disconnected',
  last_sync_at timestamptz,
  last_error_code text,
  last_error_message text,
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint google_calendar_connections_status_check
    check (status in ('connected', 'needs_reconnect', 'disconnected', 'error')),
  constraint google_calendar_connections_property_owner_fk foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete cascade,
  constraint google_calendar_connections_property_unique unique (property_id)
);

alter table public.bookings
add column if not exists calendar_sync_error_code text,
add column if not exists calendar_sync_error_message text,
add column if not exists calendar_synced_at timestamptz;

alter table public.property_settings
add column if not exists calendar_required_for_confirmation boolean not null default true;

create trigger google_calendar_connections_set_updated_at
before update on public.google_calendar_connections
for each row execute function public.set_updated_at();

create trigger google_calendar_connections_prevent_owner_change
before update on public.google_calendar_connections
for each row execute function public.prevent_owner_id_change();

alter table public.google_calendar_connections enable row level security;

create policy "Owners can manage own Google Calendar connections"
on public.google_calendar_connections for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create index google_calendar_connections_owner_property_idx
on public.google_calendar_connections(owner_id, property_id);

create index google_calendar_connections_status_idx
on public.google_calendar_connections(status);
