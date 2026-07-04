create extension if not exists "pgcrypto";

create type subscription_status as enum ('free', 'premium_monthly', 'premium_yearly');
create type agreement_status as enum ('pending', 'active', 'completed', 'rejected', 'cancelled');
create type payment_frequency as enum ('once', 'weekly', 'biweekly', 'monthly');
create type scheduled_payment_status as enum ('scheduled', 'pending_confirmation', 'confirmed', 'missed');
create type payment_status as enum ('pending_confirmation', 'confirmed', 'rejected');
create type payment_method as enum ('cash', 'bank_transfer', 'other');
create type notification_type as enum (
  'new_agreement_request',
  'agreement_accepted',
  'agreement_rejected',
  'payment_registered',
  'payment_confirmed',
  'payment_rejected',
  'payment_reminder'
);
create type timeline_event_type as enum (
  'agreement_created',
  'agreement_accepted',
  'agreement_rejected',
  'agreement_cancelled',
  'payment_registered',
  'payment_confirmed',
  'payment_rejected',
  'agreement_completed'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'TRUVO user',
  phone text unique,
  email text unique,
  avatar_url text,
  subscription_status subscription_status not null default 'free',
  created_at timestamptz not null default now()
);

create table public.agreements (
  id uuid primary key default gen_random_uuid(),
  lender_id uuid not null references public.profiles(id) on delete cascade,
  borrower_id uuid references public.profiles(id) on delete set null,
  borrower_phone text,
  borrower_email text,
  borrower_name text,
  principal_amount numeric(12, 2) not null check (principal_amount > 0),
  interest_rate numeric(7, 4),
  interest_amount numeric(12, 2) not null default 0,
  total_repayment_amount numeric(12, 2) not null check (total_repayment_amount >= principal_amount),
  number_of_payments integer not null check (number_of_payments > 0),
  payment_frequency payment_frequency not null,
  start_date date not null,
  due_date date not null,
  notes text,
  status agreement_status not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  next_payment_date date
);

create table public.scheduled_payments (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.agreements(id) on delete cascade,
  payment_number integer not null check (payment_number > 0),
  due_date date not null,
  amount numeric(12, 2) not null check (amount > 0),
  status scheduled_payment_status not null default 'scheduled',
  unique (agreement_id, payment_number)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.agreements(id) on delete cascade,
  payer_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  payment_date date not null,
  method payment_method not null,
  notes text,
  status payment_status not null default 'pending_confirmation',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  rejected_at timestamptz
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  related_agreement_id uuid references public.agreements(id) on delete cascade,
  related_payment_id uuid references public.payments(id) on delete cascade
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  contact_email text not null,
  contact_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (owner_id, contact_email)
);

create table public.agreement_timeline_events (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.agreements(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type timeline_event_type not null,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.agreements enable row level security;
alter table public.scheduled_payments enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.agreement_timeline_events enable row level security;
alter table public.contacts enable row level security;

create policy "Profiles are readable by agreement participants"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.agreements a
    where a.lender_id = auth.uid()
      and (a.borrower_id = profiles.id or a.lender_id = profiles.id)
  )
  or exists (
    select 1 from public.agreements a
    where a.borrower_id = auth.uid()
      and (a.borrower_id = profiles.id or a.lender_id = profiles.id)
  )
);

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Agreement participants can read agreements"
on public.agreements for select
to authenticated
using (
  lender_id = auth.uid()
  or borrower_id = auth.uid()
  or borrower_phone = (select phone from public.profiles where id = auth.uid())
  or borrower_email = (select email from public.profiles where id = auth.uid())
);

create policy "Lenders can create agreements"
on public.agreements for insert
to authenticated
with check (lender_id = auth.uid());

create policy "Participants can update agreements"
on public.agreements for update
to authenticated
using (
  lender_id = auth.uid()
  or borrower_id = auth.uid()
  or borrower_phone = (select phone from public.profiles where id = auth.uid())
  or borrower_email = (select email from public.profiles where id = auth.uid())
)
with check (
  lender_id = auth.uid()
  or borrower_id = auth.uid()
  or borrower_phone = (select phone from public.profiles where id = auth.uid())
  or borrower_email = (select email from public.profiles where id = auth.uid())
);

create policy "Participants can read schedules"
on public.scheduled_payments for select
to authenticated
using (
  exists (
    select 1 from public.agreements a
    where a.id = scheduled_payments.agreement_id
      and (
        a.lender_id = auth.uid()
        or a.borrower_id = auth.uid()
        or a.borrower_phone = (select phone from public.profiles where id = auth.uid())
        or a.borrower_email = (select email from public.profiles where id = auth.uid())
      )
  )
);

create policy "Lenders can create schedules"
on public.scheduled_payments for insert
to authenticated
with check (
  exists (
    select 1 from public.agreements a
    where a.id = scheduled_payments.agreement_id
      and a.lender_id = auth.uid()
  )
);

create policy "Participants can read payments"
on public.payments for select
to authenticated
using (
  payer_id = auth.uid()
  or receiver_id = auth.uid()
  or exists (
    select 1 from public.agreements a
    where a.id = payments.agreement_id
      and (a.lender_id = auth.uid() or a.borrower_id = auth.uid())
  )
);

create policy "Participants can create payments"
on public.payments for insert
to authenticated
with check (payer_id = auth.uid() or receiver_id = auth.uid());

create policy "Participants can update payments"
on public.payments for update
to authenticated
using (payer_id = auth.uid() or receiver_id = auth.uid())
with check (payer_id = auth.uid() or receiver_id = auth.uid());

create policy "Users can read own notifications"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

create policy "Users can update own notifications"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can create own notifications"
on public.notifications for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can read own contacts"
on public.contacts for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can create own contacts"
on public.contacts for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update own contacts"
on public.contacts for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete own contacts"
on public.contacts for delete
to authenticated
using (owner_id = auth.uid());

create policy "Participants can read timeline"
on public.agreement_timeline_events for select
to authenticated
using (
  exists (
    select 1 from public.agreements a
    where a.id = agreement_timeline_events.agreement_id
      and (
        a.lender_id = auth.uid()
        or a.borrower_id = auth.uid()
        or a.borrower_phone = (select phone from public.profiles where id = auth.uid())
        or a.borrower_email = (select email from public.profiles where id = auth.uid())
      )
  )
);

create policy "Participants can create timeline"
on public.agreement_timeline_events for insert
to authenticated
with check (
  exists (
    select 1 from public.agreements a
    where a.id = agreement_timeline_events.agreement_id
      and (a.lender_id = auth.uid() or a.borrower_id = auth.uid())
  )
);
