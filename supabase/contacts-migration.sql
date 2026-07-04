create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  contact_email text not null,
  contact_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (owner_id, contact_email)
);

alter table public.contacts enable row level security;

drop policy if exists "Users can read own contacts" on public.contacts;
create policy "Users can read own contacts"
on public.contacts for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can create own contacts" on public.contacts;
create policy "Users can create own contacts"
on public.contacts for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Users can update own contacts" on public.contacts;
create policy "Users can update own contacts"
on public.contacts for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Users can delete own contacts" on public.contacts;
create policy "Users can delete own contacts"
on public.contacts for delete
to authenticated
using (owner_id = auth.uid());
