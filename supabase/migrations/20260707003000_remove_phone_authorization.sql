drop policy if exists "Agreement participants can read agreements" on public.agreements;
create policy "Agreement participants can read agreements"
on public.agreements for select
to authenticated
using (
  lender_id = auth.uid()
  or borrower_id = auth.uid()
  or borrower_email = (select email from public.profiles where id = auth.uid())
);

drop policy if exists "Participants can update agreements" on public.agreements;
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

drop policy if exists "Participants can read schedules" on public.scheduled_payments;
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

do $$
begin
  if to_regclass('public.agreement_timeline_events') is not null then
    drop policy if exists "Participants can read timeline" on public.agreement_timeline_events;
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
  end if;
end $$;
