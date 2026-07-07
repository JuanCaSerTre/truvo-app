create or replace function public.enforce_profile_update_security()
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

  if current_user_id is null or old.id <> current_user_id then
    raise exception 'Authentication is required.';
  end if;

  if new.id is distinct from old.id
    or new.email is distinct from old.email
    or new.subscription_status is distinct from old.subscription_status
    or new.created_at is distinct from old.created_at then
    raise exception 'Protected profile fields cannot be changed by this client.';
  end if;

  if length(trim(coalesce(new.name, ''))) < 2 then
    raise exception 'Profile name is required.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_profile_update_security on public.profiles;
create trigger enforce_profile_update_security
before update on public.profiles
for each row execute function public.enforce_profile_update_security();

create or replace function public.enforce_agreement_insert_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  lender_subscription public.subscription_status;
  lender_email text;
  open_agreement_count integer;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select subscription_status, email
  into lender_subscription, lender_email
  from public.profiles
  where id = current_user_id;

  if new.lender_id <> current_user_id then
    raise exception 'Only the authenticated lender can create this agreement.';
  end if;

  if new.status <> 'pending' then
    raise exception 'Client-created agreements must start as pending.';
  end if;

  if new.borrower_id is not null then
    raise exception 'Borrower account linking must be performed by a trusted service.';
  end if;

  if new.accepted_at is not null or new.completed_at is not null then
    raise exception 'Lifecycle timestamps cannot be set on agreement creation.';
  end if;

  if new.borrower_email is null or new.borrower_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' then
    raise exception 'A valid borrower email is required.';
  end if;

  new.borrower_email := lower(trim(new.borrower_email));
  if lower(coalesce(lender_email, '')) = new.borrower_email then
    raise exception 'A lender cannot create an agreement with themselves.';
  end if;

  if lender_subscription = 'free' then
    select count(*)
    into open_agreement_count
    from public.agreements
    where lender_id = current_user_id
      and status in ('pending', 'active');

    if open_agreement_count >= 3 then
      raise exception 'Free plans support up to 3 open agreements.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_agreement_insert_security on public.agreements;
create trigger enforce_agreement_insert_security
before insert on public.agreements
for each row execute function public.enforce_agreement_insert_security();
