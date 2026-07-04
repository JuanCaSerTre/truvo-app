alter table public.profiles
  add column if not exists country text,
  add column if not exists currency text default 'USD',
  add column if not exists timezone text,
  add column if not exists contact_preference text not null default 'email',
  add column if not exists user_role text not null default 'both';

alter table public.profiles
  drop constraint if exists profiles_currency_code,
  add constraint profiles_currency_code check (currency is null or currency ~ '^[A-Z]{3}$');

alter table public.profiles
  drop constraint if exists profiles_contact_preference,
  add constraint profiles_contact_preference check (contact_preference in ('email', 'phone', 'whatsapp'));

alter table public.profiles
  drop constraint if exists profiles_user_role,
  add constraint profiles_user_role check (user_role in ('lender', 'borrower', 'both'));

update public.profiles
set
  currency = coalesce(currency, 'USD'),
  contact_preference = coalesce(contact_preference, 'email'),
  user_role = coalesce(user_role, 'both');
