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

drop trigger if exists enforce_agreement_update_security on public.agreements;
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

drop trigger if exists enforce_scheduled_payment_update_security on public.scheduled_payments;
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

drop trigger if exists enforce_payment_update_security on public.payments;
create trigger enforce_payment_update_security
before update on public.payments
for each row execute function public.enforce_payment_update_security();
