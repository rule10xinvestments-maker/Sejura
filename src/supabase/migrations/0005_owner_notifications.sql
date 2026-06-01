do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum (
      'booking_pending_created',
      'booking_confirmed',
      'booking_cancelled',
      'booking_rejected',
      'calendar_sync_failed',
      'google_token_expired',
      'google_reconnect_required',
      'ai_escalation_required',
      'setup_incomplete',
      'public_page_enabled',
      'ai_enabled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_status') then
    create type public.notification_status as enum ('queued', 'sent', 'failed', 'read');
  end if;
end $$;

create table if not exists public.owner_notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  type public.notification_type not null,
  priority text not null check (priority in ('critical', 'important', 'info')),
  status public.notification_status not null default 'queued',
  title text not null,
  body text not null,
  channel text not null default 'dashboard' check (channel in ('dashboard', 'email', 'dashboard_email')),
  action_url text,
  action_label text,
  dedupe_key text,
  metadata jsonb not null default '{}',
  sent_at timestamptz,
  read_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_notifications_property_owner_fk foreign key (property_id, owner_id)
    references public.properties(id, owner_id) on delete cascade
);

create trigger owner_notifications_set_updated_at
before update on public.owner_notifications
for each row execute function public.set_updated_at();

create trigger owner_notifications_prevent_owner_change
before update on public.owner_notifications
for each row execute function public.prevent_owner_id_change();

alter table public.owner_notifications enable row level security;

create policy "Owners can read own notifications"
on public.owner_notifications for select
using (owner_id = auth.uid());

create policy "Owners can update own notifications"
on public.owner_notifications for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create index owner_notifications_owner_property_idx on public.owner_notifications(owner_id, property_id);
create index owner_notifications_owner_status_idx on public.owner_notifications(owner_id, status);
create index owner_notifications_owner_priority_idx on public.owner_notifications(owner_id, priority);
create index owner_notifications_booking_idx on public.owner_notifications(booking_id);
create index owner_notifications_conversation_idx on public.owner_notifications(conversation_id);

create unique index owner_notifications_active_dedupe_idx
on public.owner_notifications(owner_id, dedupe_key)
where dedupe_key is not null and resolved_at is null;
