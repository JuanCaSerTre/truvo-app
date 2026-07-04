alter table public.profiles
  alter column phone drop not null;

alter table public.profiles
  add column if not exists email text unique;
