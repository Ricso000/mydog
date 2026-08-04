-- Auto-notify applicants when their adoption application status changes
create or replace function notify_application_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  dog_name text;
  status_label text;
begin
  if new.applicant_id is not null and new.status is distinct from old.status then
    select name into dog_name from dogs where id = new.dog_id;

    status_label := case new.status::text
      when 'submitted' then 'Beküldve'
      when 'reviewing' then 'Folyamatban'
      when 'approved' then 'Jóváhagyva'
      when 'rejected' then 'Elutasítva'
      when 'withdrawn' then 'Visszavonva'
      else new.status::text
    end;

    insert into notifications (user_id, type, title, body, data)
    values (
      new.applicant_id,
      'adoption_update',
      'Jelentkezésed státusza módosult',
      coalesce(dog_name, 'A kutya') || ' jelentkezésedhez tartozó státusz: ' || status_label || '.',
      jsonb_build_object('application_id', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger on_application_status_change
  after update on adoption_applications
  for each row execute procedure notify_application_status_change();
