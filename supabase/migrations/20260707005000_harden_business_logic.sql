drop policy if exists "Agreement participants can notify each other" on public.notifications;

do $$
begin
  if to_regclass('public.agreement_timeline_events') is not null then
    drop policy if exists "Participants can create timeline" on public.agreement_timeline_events;
  end if;
end $$;

create or replace function public.agreement_schedule_is_valid(target_agreement_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  agreement_row public.agreements%rowtype;
  schedule_count integer;
  schedule_total numeric(12, 2);
begin
  select * into agreement_row
  from public.agreements
  where id = target_agreement_id;

  if not found then
    return false;
  end if;

  select count(*), coalesce(sum(amount), 0)
  into schedule_count, schedule_total
  from public.scheduled_payments
  where agreement_id = target_agreement_id;

  return schedule_count = agreement_row.number_of_payments
    and abs(schedule_total - agreement_row.total_repayment_amount) < 0.01;
end;
$$;

create or replace function public.enforce_scheduled_payment_insert_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  agreement_row public.agreements%rowtype;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select * into agreement_row
  from public.agreements
  where id = new.agreement_id;

  if not found or agreement_row.lender_id <> current_user_id then
    raise exception 'Only the lender can create this schedule.';
  end if;

  if agreement_row.status <> 'pending' then
    raise exception 'Schedules can only be created for pending agreements.';
  end if;

  if new.status <> 'scheduled' then
    raise exception 'New schedule rows must start as scheduled.';
  end if;

  if new.payment_number > agreement_row.number_of_payments then
    raise exception 'Schedule has too many payments.';
  end if;

  if new.due_date < agreement_row.start_date or new.due_date > agreement_row.due_date then
    raise exception 'Scheduled payment date is outside the agreement term.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_scheduled_payment_insert_security on public.scheduled_payments;
create trigger enforce_scheduled_payment_insert_security
before insert on public.scheduled_payments
for each row execute function public.enforce_scheduled_payment_insert_security();

create or replace function public.validate_scheduled_payment_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_agreement_id uuid := coalesce(new.agreement_id, old.agreement_id);
begin
  if auth.role() = 'service_role' then
    return null;
  end if;

  if not public.agreement_schedule_is_valid(target_agreement_id) then
    raise exception 'Payment schedule does not match agreement terms.';
  end if;

  return null;
end;
$$;

drop trigger if exists validate_scheduled_payment_integrity on public.scheduled_payments;
create constraint trigger validate_scheduled_payment_integrity
after insert or update or delete on public.scheduled_payments
deferrable initially deferred
for each row execute function public.validate_scheduled_payment_integrity();

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
      new.accepted_at := null;
      new.completed_at := null;
      return new;
    end if;
    if is_borrower and new.status = 'rejected' then
      new.accepted_at := null;
      new.completed_at := null;
      return new;
    end if;
    if is_borrower and new.status = 'active' then
      if not public.agreement_schedule_is_valid(old.id) then
        raise exception 'Agreement cannot be accepted until its payment schedule is complete.';
      end if;
      new.accepted_at := now();
      new.completed_at := null;
      return new;
    end if;
  elsif old.status = 'active' then
    if (is_lender or is_borrower) and new.status = 'completed' then
      new.accepted_at := old.accepted_at;
      new.completed_at := now();
      return new;
    end if;
    if new.status = old.status then
      if new.accepted_at is distinct from old.accepted_at or new.completed_at is distinct from old.completed_at then
        raise exception 'Agreement lifecycle timestamps cannot be changed directly.';
      end if;
      return new;
    end if;
  else
    if new.status = old.status then
      if new.accepted_at is distinct from old.accepted_at or new.completed_at is distinct from old.completed_at then
        raise exception 'Agreement lifecycle timestamps cannot be changed directly.';
      end if;
      return new;
    end if;
  end if;

  raise exception 'Invalid agreement status transition.';
end;
$$;

create or replace function public.enforce_payment_insert_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  agreement_row public.agreements%rowtype;
  reserved_total numeric(12, 2);
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select email into current_email from public.profiles where id = current_user_id;
  select * into agreement_row from public.agreements where id = new.agreement_id;

  if not found then
    raise exception 'Agreement not found.';
  end if;

  if new.payer_id <> current_user_id then
    raise exception 'Only the authenticated borrower can register this payment.';
  end if;

  if agreement_row.status <> 'active' then
    raise exception 'Only active agreements can receive payments.';
  end if;

  if agreement_row.lender_id <> new.receiver_id then
    raise exception 'Payment receiver must be the agreement lender.';
  end if;

  if not (agreement_row.borrower_id = current_user_id or lower(coalesce(agreement_row.borrower_email, '')) = lower(coalesce(current_email, ''))) then
    raise exception 'Only the borrower can register this payment.';
  end if;

  if new.status <> 'pending_confirmation' then
    raise exception 'New payments must start pending confirmation.';
  end if;

  new.confirmed_at := null;
  new.rejected_at := null;
  new.created_at := now();

  select coalesce(sum(amount), 0)
  into reserved_total
  from public.payments
  where agreement_id = new.agreement_id
    and status in ('pending_confirmation', 'confirmed');

  if reserved_total + new.amount > agreement_row.total_repayment_amount then
    raise exception 'Payment amount exceeds the remaining balance.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_payment_insert_security on public.payments;
create trigger enforce_payment_insert_security
before insert on public.payments
for each row execute function public.enforce_payment_insert_security();

create or replace function public.enforce_payment_update_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  agreement_total numeric(12, 2);
  confirmed_total numeric(12, 2);
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

  if new.status = old.status then
    if new.confirmed_at is distinct from old.confirmed_at or new.rejected_at is distinct from old.rejected_at then
      raise exception 'Payment lifecycle timestamps cannot be changed directly.';
    end if;
    return new;
  end if;

  if new.status = 'confirmed' then
    select total_repayment_amount into agreement_total
    from public.agreements
    where id = old.agreement_id;

    select coalesce(sum(amount), 0)
    into confirmed_total
    from public.payments
    where agreement_id = old.agreement_id
      and status = 'confirmed'
      and id <> old.id;

    if confirmed_total + old.amount > agreement_total then
      raise exception 'Confirmed payments cannot exceed the agreement total.';
    end if;

    new.confirmed_at := now();
    new.rejected_at := null;
    return new;
  end if;

  if new.status = 'rejected' then
    new.confirmed_at := null;
    new.rejected_at := now();
    return new;
  end if;

  raise exception 'Invalid payment status transition.';
end;
$$;
