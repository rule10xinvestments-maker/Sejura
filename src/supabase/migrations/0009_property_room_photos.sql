insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sejura-photos',
  'sejura-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.property_photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  constraint property_photos_property_owner_fk foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete cascade
);

create table public.room_photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  constraint room_photos_property_owner_fk foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete cascade,
  constraint room_photos_room_scope_fk foreign key (room_id, owner_id, property_id)
    references public.rooms(id, owner_id, property_id) on delete cascade
);

create unique index property_photos_one_cover_idx
on public.property_photos(property_id)
where is_cover;

create unique index room_photos_one_cover_idx
on public.room_photos(room_id)
where is_cover;

create index property_photos_property_sort_idx
on public.property_photos(property_id, is_cover desc, sort_order, created_at);

create index room_photos_room_sort_idx
on public.room_photos(room_id, is_cover desc, sort_order, created_at);

create index room_photos_property_idx
on public.room_photos(property_id);

alter table public.property_photos enable row level security;
alter table public.room_photos enable row level security;

create policy "Owners can manage own property photos"
on public.property_photos for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Owners can manage own room photos"
on public.room_photos for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Public can read property photo rows for public properties"
on public.property_photos for select
using (
  exists (
    select 1
    from public.properties p
    join public.property_public_pages page on page.property_id = p.id
    where p.id = property_photos.property_id
      and p.status <> 'disabled'
      and page.is_public = true
  )
);

create policy "Public can read room photo rows for public properties"
on public.room_photos for select
using (
  exists (
    select 1
    from public.properties p
    join public.property_public_pages page on page.property_id = p.id
    join public.rooms r on r.id = room_photos.room_id
    where p.id = room_photos.property_id
      and r.property_id = room_photos.property_id
      and r.status = 'active'
      and p.status <> 'disabled'
      and page.is_public = true
  )
);

create policy "Owners can upload own sejura photos"
on storage.objects for insert
with check (
  bucket_id = 'sejura-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Owners can update own sejura photos"
on storage.objects for update
using (
  bucket_id = 'sejura-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'sejura-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Owners can delete own sejura photos"
on storage.objects for delete
using (
  bucket_id = 'sejura-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
