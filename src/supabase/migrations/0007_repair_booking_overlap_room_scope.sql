create extension if not exists "btree_gist";

alter table public.bookings
drop constraint if exists no_overlapping_confirmed_bookings;

alter table public.bookings
add constraint no_overlapping_confirmed_bookings
exclude using gist (
  room_id with =,
  daterange(start_date, end_date, '[)') with &&
)
where (status = 'confirmed' and deleted_at is null);
