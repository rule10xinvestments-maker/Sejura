do $$
begin
  if not exists (select 1 from pg_type where typname = 'conversation_channel') then
    create type public.conversation_channel as enum ('web_chat');
  end if;

  if not exists (select 1 from pg_type where typname = 'conversation_status') then
    create type public.conversation_status as enum (
      'open',
      'waiting_for_guest',
      'waiting_for_owner',
      'booking_created',
      'closed',
      'escalated'
    );
  end if;
end $$;

alter table public.properties
add column if not exists city text,
add column if not exists public_description text,
add column if not exists public_contact_phone text,
add column if not exists public_contact_email text;

alter table public.property_settings
drop constraint if exists sprint1_settings_safe;

alter table public.property_public_pages
drop constraint if exists sprint1_public_pages_disabled;

drop policy if exists "Owners can manage own property settings" on public.property_settings;
create policy "Owners can manage own property settings"
on public.property_settings for all
using (owner_id = auth.uid())
with check (
  owner_id = auth.uid()
  and allow_auto_confirmation = false
);

drop policy if exists "Owners can manage own public page placeholders" on public.property_public_pages;
create policy "Owners can manage own public pages"
on public.property_public_pages for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  public_session_id text not null,
  guest_name text,
  guest_phone text,
  guest_email text,
  guest_language text,
  channel public.conversation_channel not null default 'web_chat',
  status public.conversation_status not null default 'open',
  related_booking_id uuid references public.bookings(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  deleted_at timestamptz,
  constraint conversations_property_owner_fk foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete cascade,
  constraint conversations_session_unique unique (property_id, public_session_id)
);

create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('guest', 'ai', 'owner', 'system', 'tool')),
  content text not null,
  language text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint conversation_messages_property_owner_fk foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete cascade
);

create table public.ai_tool_calls (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  tool_name text not null,
  input jsonb not null default '{}',
  output jsonb,
  status text not null check (status in ('success', 'failed', 'blocked')),
  error_code text,
  created_at timestamptz not null default now(),
  constraint ai_tool_calls_property_owner_fk foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete cascade
);

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create trigger conversations_prevent_owner_change
before update on public.conversations
for each row execute function public.prevent_owner_id_change();

create trigger conversation_messages_prevent_owner_change
before update on public.conversation_messages
for each row execute function public.prevent_owner_id_change();

create trigger ai_tool_calls_prevent_owner_change
before update on public.ai_tool_calls
for each row execute function public.prevent_owner_id_change();

alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.ai_tool_calls enable row level security;

create policy "Owners can read own conversations"
on public.conversations for select
using (owner_id = auth.uid());

create policy "Owners can update own conversations"
on public.conversations for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Owners can read own conversation messages"
on public.conversation_messages for select
using (owner_id = auth.uid());

create policy "Owners can read own AI tool calls"
on public.ai_tool_calls for select
using (owner_id = auth.uid());

create index conversations_property_session_idx on public.conversations(property_id, public_session_id);
create index conversations_owner_property_idx on public.conversations(owner_id, property_id);
create index conversation_messages_conversation_created_idx on public.conversation_messages(conversation_id, created_at);
create index ai_tool_calls_conversation_created_idx on public.ai_tool_calls(conversation_id, created_at);
