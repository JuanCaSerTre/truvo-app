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
  'agreement_cancelled',
  'agreement_completed',
  'payment_registered',
  'payment_waiting_confirmation',
  'payment_confirmed',
  'payment_rejected',
  'upcoming_payment_reminder',
  'overdue_payment_reminder',
  'premium_subscription',
  'system_update',
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
  country text,
  currency text default 'USD' check (currency is null or currency ~ '^[A-Z]{3}$'),
  timezone text,
  contact_preference text not null default 'email' check (contact_preference in ('email', 'phone', 'whatsapp')),
  user_role text not null default 'both' check (user_role in ('lender', 'borrower', 'both')),
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
  archived_at timestamptz,
  related_agreement_id uuid references public.agreements(id) on delete cascade,
  related_payment_id uuid references public.payments(id) on delete cascade
);

create table public.notification_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  agreement_requests boolean not null default true,
  payment_confirmations boolean not null default true,
  payment_reminders boolean not null default true,
  overdue_payments boolean not null default true,
  marketing_messages boolean not null default false,
  product_updates boolean not null default true,
  push_notifications boolean not null default true,
  email_notifications boolean not null default false,
  updated_at timestamptz
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
alter table public.notification_settings enable row level security;
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
  or borrower_email = (select email from public.profiles where id = auth.uid())
)
with check (
  lender_id = auth.uid()
  or borrower_id = auth.uid()
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

create policy "Participants can update schedules"
on public.scheduled_payments for update
to authenticated
using (
  exists (
    select 1 from public.agreements a
    where a.id = scheduled_payments.agreement_id
      and (
        a.lender_id = auth.uid()
        or a.borrower_id = auth.uid()
        or a.borrower_email = (select email from public.profiles where id = auth.uid())
      )
  )
)
with check (
  exists (
    select 1 from public.agreements a
    where a.id = scheduled_payments.agreement_id
      and (
        a.lender_id = auth.uid()
        or a.borrower_id = auth.uid()
        or a.borrower_email = (select email from public.profiles where id = auth.uid())
      )
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
with check (
  payer_id = auth.uid()
  and exists (
    select 1 from public.agreements a
    where a.id = payments.agreement_id
      and a.status = 'active'
      and a.lender_id = payments.receiver_id
      and (
        a.borrower_id = auth.uid()
        or a.borrower_email = (select email from public.profiles where id = auth.uid())
      )
  )
);

create policy "Participants can update payments"
on public.payments for update
to authenticated
using (receiver_id = auth.uid())
with check (receiver_id = auth.uid());

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

create policy "Agreement participants can notify each other"
on public.notifications for insert
to authenticated
with check (
  exists (
    select 1 from public.agreements a
    where a.id = notifications.related_agreement_id
      and (
        a.lender_id = auth.uid()
        or a.borrower_id = auth.uid()
        or a.borrower_email = (select email from public.profiles where id = auth.uid())
      )
      and (
        notifications.user_id = a.lender_id
        or notifications.user_id = a.borrower_id
      )
  )
);

create policy "Users can delete own notifications"
on public.notifications for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can read own notification settings"
on public.notification_settings for select
to authenticated
using (user_id = auth.uid());

create policy "Users can upsert own notification settings"
on public.notification_settings for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own notification settings"
on public.notification_settings for update
to authenticated
using (user_id = auth.uid())
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

create or replace function public.enforce_agreement_update_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  is_lender boolean;
  is_borrower boolean;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select email into current_email from public.profiles where id = current_user_id;
  is_lender := old.lender_id = current_user_id;
  is_borrower := old.borrower_id = current_user_id or lower(coalesce(old.borrower_email, '')) = lower(coalesce(current_email, ''));

  if not is_lender and not is_borrower then
    raise exception 'Only agreement participants can update this agreement.';
  end if;

  if new.id is distinct from old.id
    or new.lender_id is distinct from old.lender_id
    or new.borrower_email is distinct from old.borrower_email
    or new.borrower_phone is distinct from old.borrower_phone
    or new.borrower_name is distinct from old.borrower_name
    or new.principal_amount is distinct from old.principal_amount
    or new.interest_rate is distinct from old.interest_rate
    or new.interest_amount is distinct from old.interest_amount
    or new.total_repayment_amount is distinct from old.total_repayment_amount
    or new.number_of_payments is distinct from old.number_of_payments
    or new.payment_frequency is distinct from old.payment_frequency
    or new.start_date is distinct from old.start_date
    or new.due_date is distinct from old.due_date
    or new.notes is distinct from old.notes
    or new.created_at is distinct from old.created_at then
    raise exception 'Agreement terms cannot be changed after creation.';
  end if;

  if new.borrower_id is distinct from old.borrower_id then
    if not (old.borrower_id is null and is_borrower and new.borrower_id = current_user_id and old.status = 'pending' and new.status = 'active') then
      raise exception 'Borrower assignment cannot be changed by this operation.';
    end if;
  end if;

  if old.status = 'pending' then
    if is_lender and new.status = 'cancelled' then
      return new;
    end if;
    if is_borrower and new.status in ('active', 'rejected') then
      return new;
    end if;
  elsif old.status = 'active' then
    if (is_lender or is_borrower) and new.status = 'completed' then
      return new;
    end if;
    if new.status = old.status then
      return new;
    end if;
  else
    if new.status = old.status then
      return new;
    end if;
  end if;

  raise exception 'Invalid agreement status transition.';
end;
$$;

create trigger enforce_agreement_update_security
before update on public.agreements
for each row execute function public.enforce_agreement_update_security();

create or replace function public.enforce_scheduled_payment_update_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select email into current_email from public.profiles where id = current_user_id;

  if not exists (
    select 1 from public.agreements a
    where a.id = old.agreement_id
      and (
        a.lender_id = current_user_id
        or a.borrower_id = current_user_id
        or lower(coalesce(a.borrower_email, '')) = lower(coalesce(current_email, ''))
      )
  ) then
    raise exception 'Only agreement participants can update scheduled payments.';
  end if;

  if new.id is distinct from old.id
    or new.agreement_id is distinct from old.agreement_id
    or new.payment_number is distinct from old.payment_number
    or new.due_date is distinct from old.due_date
    or new.amount is distinct from old.amount then
    raise exception 'Scheduled payment terms cannot be changed after creation.';
  end if;

  return new;
end;
$$;

create trigger enforce_scheduled_payment_update_security
before update on public.scheduled_payments
for each row execute function public.enforce_scheduled_payment_update_security();

create or replace function public.enforce_payment_update_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if old.receiver_id <> current_user_id then
    raise exception 'Only the payment receiver can update payment confirmation.';
  end if;

  if new.id is distinct from old.id
    or new.agreement_id is distinct from old.agreement_id
    or new.payer_id is distinct from old.payer_id
    or new.receiver_id is distinct from old.receiver_id
    or new.amount is distinct from old.amount
    or new.payment_date is distinct from old.payment_date
    or new.method is distinct from old.method
    or new.notes is distinct from old.notes
    or new.created_at is distinct from old.created_at then
    raise exception 'Payment details cannot be changed after submission.';
  end if;

  if old.status <> 'pending_confirmation' and new.status is distinct from old.status then
    raise exception 'Only pending payments can be confirmed or rejected.';
  end if;

  if new.status = 'confirmed' then
    new.rejected_at := null;
    return new;
  end if;

  if new.status = 'rejected' then
    new.confirmed_at := null;
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  raise exception 'Invalid payment status transition.';
end;
$$;

create trigger enforce_payment_update_security
before update on public.payments
for each row execute function public.enforce_payment_update_security();
