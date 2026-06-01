create extension if not exists "btree_gist";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'booking_source') then
    create type public.booking_source as enum ('ai_chat', 'manual_owner');
  end if;

  if not exists (select 1 from pg_type where typname = 'audit_actor_type') then
    create type public.audit_actor_type as enum ('owner', 'ai', 'system', 'guest');
  end if;

  if not exists (select 1 from pg_type where typname = 'calendar_sync_status') then
    create type public.calendar_sync_status as enum ('not_required', 'pending', 'synced', 'failed', 'needs_reconnect');
  end if;
end $$;

alter table public.rooms
add constraint rooms_id_owner_property_unique unique (id, owner_id, property_id);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  guest_name text not null,
  guest_phone text,
  guest_email text,
  guest_notes text,
  start_date date not null,
  end_date date not null,
  guests_count integer not null check (guests_count > 0),
  price_per_night numeric,
  nights_count integer not null check (nights_count > 0),
  total_estimated_price numeric,
  currency text not null default 'RON',
  status public.booking_status not null default 'pending',
  source public.booking_source not null,
  calendar_sync_status public.calendar_sync_status not null default 'not_required',
  google_calendar_event_id text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  rejected_at timestamptz,
  created_by_actor_type public.audit_actor_type not null,
  created_by_owner_id uuid references public.owners(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint bookings_date_order check (end_date > start_date),
  constraint bookings_property_owner_fk foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete cascade,
  constraint bookings_room_owner_property_fk foreign key (room_id, owner_id, property_id)
    references public.rooms(id, owner_id, property_id) on delete cascade
);

create table public.booking_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  event_type text not null,
  actor_type public.audit_actor_type not null,
  actor_owner_id uuid references public.owners(id) on delete set null,
  previous_status public.booking_status,
  new_status public.booking_status,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint booking_events_property_owner_fk foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete cascade
);

create table public.room_blocks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_by_owner_id uuid references public.owners(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint room_blocks_date_order check (end_date > start_date),
  constraint room_blocks_property_owner_fk foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete cascade,
  constraint room_blocks_room_owner_property_fk foreign key (room_id, owner_id, property_id)
    references public.rooms(id, owner_id, property_id) on delete cascade
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  actor_type public.audit_actor_type not null,
  actor_owner_id uuid references public.owners(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.bookings
add constraint no_overlapping_confirmed_bookings
exclude using gist (
  room_id with =,
  daterange(start_date, end_date, '[)') with &&
)
where (status = 'confirmed' and deleted_at is null);

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create trigger room_blocks_set_updated_at
before update on public.room_blocks
for each row execute function public.set_updated_at();

create trigger bookings_prevent_owner_change
before update on public.bookings
for each row execute function public.prevent_owner_id_change();

create trigger room_blocks_prevent_owner_change
before update on public.room_blocks
for each row execute function public.prevent_owner_id_change();

alter table public.bookings enable row level security;
alter table public.booking_events enable row level security;
alter table public.room_blocks enable row level security;
alter table public.audit_logs enable row level security;

create policy "Owners can manage own bookings"
on public.bookings for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Owners can manage own booking events"
on public.booking_events for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Owners can manage own room blocks"
on public.room_blocks for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Owners can manage own audit logs"
on public.audit_logs for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create index bookings_room_status_dates_idx on public.bookings(room_id, status, start_date, end_date);
create index bookings_owner_property_idx on public.bookings(owner_id, property_id);
create index booking_events_booking_idx on public.booking_events(booking_id, created_at);
create index room_blocks_room_dates_idx on public.room_blocks(room_id, start_date, end_date);
create index room_blocks_owner_property_idx on public.room_blocks(owner_id, property_id);
create index rooms_property_status_guests_idx on public.rooms(property_id, status, max_guests);
