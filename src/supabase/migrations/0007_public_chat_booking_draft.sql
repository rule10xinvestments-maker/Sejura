alter table public.conversations
add column if not exists metadata jsonb not null default '{}';

alter table public.bookings
add column if not exists conversation_id uuid references public.conversations(id) on delete set null;

create index if not exists bookings_conversation_idx on public.bookings(conversation_id);
