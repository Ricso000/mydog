-- Auto-add creator as 'owner' when a partner is created
create or replace function handle_new_partner()
returns trigger language plpgsql security definer as $$
begin
  insert into partner_members (partner_id, profile_id, role)
  values (new.id, auth.uid(), 'owner');
  return new;
end;
$$;

create trigger on_partner_created
  after insert on partners
  for each row execute function handle_new_partner();
