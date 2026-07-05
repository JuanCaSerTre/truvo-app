alter type notification_type add value if not exists 'agreement_cancelled';
alter type notification_type add value if not exists 'agreement_completed';
alter type notification_type add value if not exists 'payment_waiting_confirmation';
alter type notification_type add value if not exists 'upcoming_payment_reminder';
alter type notification_type add value if not exists 'overdue_payment_reminder';
alter type notification_type add value if not exists 'premium_subscription';
alter type notification_type add value if not exists 'system_update';

alter table public.notifications
add column if not exists archived_at timestamptz;

create table if not exists public.notification_settings (
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

alter table public.notification_settings enable row level security;

drop policy if exists "Participants can update schedules" on public.scheduled_payments;
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

drop policy if exists "Participants can create payments" on public.payments;
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

drop policy if exists "Participants can update payments" on public.payments;
create policy "Participants can update payments"
on public.payments for update
to authenticated
using (receiver_id = auth.uid())
with check (receiver_id = auth.uid());

drop policy if exists "Agreement participants can notify each other" on public.notifications;
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

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
on public.notifications for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read own notification settings" on public.notification_settings;
create policy "Users can read own notification settings"
on public.notification_settings for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can upsert own notification settings" on public.notification_settings;
create policy "Users can upsert own notification settings"
on public.notification_settings for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own notification settings" on public.notification_settings;
create policy "Users can update own notification settings"
on public.notification_settings for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
