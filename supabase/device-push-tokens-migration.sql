create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.device_push_tokens enable row level security;

drop policy if exists "Users can read own push tokens" on public.device_push_tokens;
create policy "Users can read own push tokens"
on public.device_push_tokens for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own push tokens" on public.device_push_tokens;
create policy "Users can insert own push tokens"
on public.device_push_tokens for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own push tokens" on public.device_push_tokens;
create policy "Users can update own push tokens"
on public.device_push_tokens for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own push tokens" on public.device_push_tokens;
create policy "Users can delete own push tokens"
on public.device_push_tokens for delete
to authenticated
using (user_id = auth.uid());
