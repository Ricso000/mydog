-- ============================================================
-- SAVED SEARCH MATCH NOTIFICATIONS
-- ============================================================

-- Returns true if a dog row matches a saved search's filters jsonb.
-- filters shape: { q, country, city, size, gender, age, transportable }
-- (same vocabulary as the /kutyak page's query params)
create or replace function dog_matches_saved_search(p_dog dogs, p_filters jsonb)
returns boolean language plpgsql as $$
declare
  v_age_bucket text;
begin
  if p_filters ? 'q' and p_filters->>'q' <> '' then
    if not (p_dog.name ilike '%' || (p_filters->>'q') || '%' or p_dog.breed ilike '%' || (p_filters->>'q') || '%') then
      return false;
    end if;
  end if;
  if p_filters ? 'country' and p_filters->>'country' <> '' and p_dog.country is distinct from p_filters->>'country' then
    return false;
  end if;
  if p_filters ? 'city' and p_filters->>'city' <> '' and p_dog.city is distinct from p_filters->>'city' then
    return false;
  end if;
  if p_filters ? 'size' and p_filters->>'size' <> '' and p_dog.size::text is distinct from p_filters->>'size' then
    return false;
  end if;
  if p_filters ? 'gender' and p_filters->>'gender' <> '' and p_dog.gender::text is distinct from p_filters->>'gender' then
    return false;
  end if;
  if p_filters ? 'transportable' and (p_filters->>'transportable')::boolean is true and coalesce(p_dog.is_transportable, false) = false then
    return false;
  end if;
  if p_filters ? 'age' and p_filters->>'age' <> '' then
    v_age_bucket := case
      when coalesce(p_dog.age_years, 0) = 0 then 'puppy'
      when p_dog.age_years between 1 and 2 then 'young'
      when p_dog.age_years between 3 and 6 then 'adult'
      when p_dog.age_years >= 7 then 'senior'
      else null
    end;
    if v_age_bucket is distinct from p_filters->>'age' then
      return false;
    end if;
  end if;
  return true;
end;
$$;

-- Notifies every saved search whose filters match the given (now-visible) dog.
create or replace function notify_matching_saved_searches(p_dog_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_dog dogs%rowtype;
  v_search record;
begin
  select * into v_dog from dogs where id = p_dog_id;
  if not found or v_dog.status <> 'available' then
    return;
  end if;
  if not exists (select 1 from partners where id = v_dog.partner_id and status = 'approved') then
    return;
  end if;

  for v_search in select * from saved_searches loop
    if dog_matches_saved_search(v_dog, v_search.filters) then
      insert into notifications (user_id, type, title, body, data)
      values (
        v_search.profile_id,
        'system',
        'Új kutya a mentett keresésedhez',
        v_dog.name || ' megjelent az oldalon, és illik az egyik mentett keresésedhez.',
        jsonb_build_object('dog_id', v_dog.id, 'saved_search_id', v_search.id)
      );
    end if;
  end loop;
end;
$$;

-- Trigger point 1: a dog is created or its status changes to 'available'
create or replace function trg_dogs_notify_saved_searches()
returns trigger language plpgsql as $$
begin
  if new.status = 'available' and (tg_op = 'INSERT' or old.status is distinct from 'available') then
    perform notify_matching_saved_searches(new.id);
  end if;
  return new;
end;
$$;

create trigger on_dog_available_notify_saved_searches
  after insert or update of status on dogs
  for each row execute procedure trg_dogs_notify_saved_searches();

-- Trigger point 2: a partner is approved — re-check its already-available dogs
create or replace function trg_partner_approved_notify_saved_searches()
returns trigger language plpgsql as $$
declare
  v_dog_id uuid;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    for v_dog_id in select id from dogs where partner_id = new.id and status = 'available' loop
      perform notify_matching_saved_searches(v_dog_id);
    end loop;
  end if;
  return new;
end;
$$;

create trigger on_partner_approved_notify_saved_searches
  after update of status on partners
  for each row execute procedure trg_partner_approved_notify_saved_searches();
