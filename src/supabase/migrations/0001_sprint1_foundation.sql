create extension if not exists "pgcrypto";

create table public.owners (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  name text not null,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'active', 'inactive')),
  contact_phone text not null,
  contact_email text not null,
  check_in_time time not null default '15:00',
  check_out_time time not null default '11:00',
  rules text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties
add constraint properties_id_owner_unique unique (id, owner_id);

create table public.property_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  property_id uuid not null unique references public.properties(id) on delete cascade,
  ai_enabled boolean not null default false,
  public_booking_enabled boolean not null default false,
  allow_auto_confirmation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sprint1_settings_safe check (
    ai_enabled = false
    and public_booking_enabled = false
    and allow_auto_confirmation = false
  ),
  constraint property_settings_property_owner_fk foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete cascade
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  max_guests integer not null check (max_guests > 0),
  base_price_per_night integer not null check (base_price_per_night > 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_property_owner_fk foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete cascade
);

create table public.property_public_pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  property_id uuid not null unique references public.properties(id) on delete cascade,
  is_public boolean not null default false,
  chat_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sprint1_public_pages_disabled check (
    is_public = false and chat_enabled = false
  ),
  constraint property_public_pages_property_owner_fk foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete cascade
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger owners_set_updated_at
before update on public.owners
for each row execute function public.set_updated_at();

create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create trigger property_settings_set_updated_at
before update on public.property_settings
for each row execute function public.set_updated_at();

create trigger rooms_set_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

create trigger property_public_pages_set_updated_at
before update on public.property_public_pages
for each row execute function public.set_updated_at();

create or replace function public.enforce_property_limit()
returns trigger
language plpgsql
as $$
declare
  property_count integer;
begin
  select count(*) into property_count
  from public.properties
  where owner_id = new.owner_id;

  if property_count >= 3 then
    raise exception 'owners can manage up to 3 properties';
  end if;

  return new;
end;
$$;

create trigger properties_enforce_limit
before insert on public.properties
for each row execute function public.enforce_property_limit();

create or replace function public.prevent_owner_id_change()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id <> old.owner_id then
    raise exception 'owner_id cannot be changed';
  end if;
  return new;
end;
$$;

create trigger properties_prevent_owner_change
before update on public.properties
for each row execute function public.prevent_owner_id_change();

create trigger property_settings_prevent_owner_change
before update on public.property_settings
for each row execute function public.prevent_owner_id_change();

create trigger rooms_prevent_owner_change
before update on public.rooms
for each row execute function public.prevent_owner_id_change();

create trigger property_public_pages_prevent_owner_change
before update on public.property_public_pages
for each row execute function public.prevent_owner_id_change();

alter table public.owners enable row level security;
alter table public.properties enable row level security;
alter table public.property_settings enable row level security;
alter table public.rooms enable row level security;
alter table public.property_public_pages enable row level security;

create policy "Owners can read own profile"
on public.owners for select
using (id = auth.uid());

create policy "Owners can insert own profile"
on public.owners for insert
with check (id = auth.uid());

create policy "Owners can update own profile"
on public.owners for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Owners can manage own properties"
on public.properties for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Owners can manage own property settings"
on public.property_settings for all
using (owner_id = auth.uid())
with check (
  owner_id = auth.uid()
  and ai_enabled = false
  and public_booking_enabled = false
  and allow_auto_confirmation = false
);

create policy "Owners can manage own rooms"
on public.rooms for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Owners can manage own public page placeholders"
on public.property_public_pages for all
using (owner_id = auth.uid())
with check (
  owner_id = auth.uid()
  and is_public = false
  and chat_enabled = false
);

create index properties_owner_id_idx on public.properties(owner_id);
create index property_settings_owner_id_idx on public.property_settings(owner_id);
create index rooms_owner_property_idx on public.rooms(owner_id, property_id);
create index property_public_pages_owner_id_idx on public.property_public_pages(owner_id);
