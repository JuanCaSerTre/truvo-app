drop policy if exists "Users can create own notifications" on public.notifications;

create policy "Users can create own notifications"
on public.notifications for insert
to authenticated
with check (user_id = auth.uid());

create policy "Agreement participants can notify each other"
on public.notifications for insert
to authenticated
with check (
  related_agreement_id is not null
  and exists (
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
