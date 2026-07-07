do $$
begin
  if not exists (select 1 from pg_type where typname = 'owner_account_status') then
    create type public.owner_account_status as enum (
      'active',
      'suspended',
      'disabled',
      'deletion_requested'
    );
  end if;
end $$;

alter table public.owners
add column if not exists account_status public.owner_account_status not null default 'active',
add column if not exists is_demo boolean not null default false;

create table if not exists public.platform_admins (
  user_id uuid primary key references public.owners(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid not null references public.owners(id) on delete restrict,
  target_owner_id uuid references public.owners(id) on delete restrict,
  target_property_id uuid references public.properties(id) on delete restrict,
  action text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
alter table public.platform_admin_audit_logs enable row level security;

drop policy if exists "Platform admins can read own admin grant" on public.platform_admins;
create policy "Platform admins can read own admin grant"
on public.platform_admins for select
using (user_id = auth.uid());

create index if not exists owners_account_status_idx
on public.owners(account_status);

create index if not exists owners_is_demo_idx
on public.owners(is_demo);

create index if not exists platform_admin_audit_logs_actor_idx
on public.platform_admin_audit_logs(actor_admin_id, created_at desc);

create index if not exists platform_admin_audit_logs_target_owner_idx
on public.platform_admin_audit_logs(target_owner_id, created_at desc);

create index if not exists platform_admin_audit_logs_target_property_idx
on public.platform_admin_audit_logs(target_property_id, created_at desc);
