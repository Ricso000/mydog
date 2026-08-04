-- ============================================================
-- PARTNER FOLLOW NOTIFICATIONS
-- ============================================================

-- Notifies every follower of a dog's partner when that dog becomes publicly visible.
create or replace function notify_partner_followers(p_dog_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_dog dogs%rowtype;
  v_follow record;
begin
  select * into v_dog from dogs where id = p_dog_id;
  if not found or v_dog.status <> 'available' then
    return;
  end if;
  if not exists (select 1 from partners where id = v_dog.partner_id and status = 'approved') then
    return;
  end if;

  for v_follow in select * from favorite_partners where partner_id = v_dog.partner_id loop
    insert into notifications (user_id, type, title, body, data)
    values (
      v_follow.profile_id,
      'partner_message',
      'Új kutya egy követett menhelytől',
      v_dog.name || ' megjelent az oldalon — egy általad követett menhely új kutyája.',
      jsonb_build_object('dog_id', v_dog.id, 'partner_id', v_dog.partner_id)
    );
  end loop;
end;
$$;

-- Trigger point 1: a dog is created or its status changes to 'available'
create or replace function trg_dogs_notify_partner_followers()
returns trigger language plpgsql as $$
begin
  if new.status = 'available' and (tg_op = 'INSERT' or old.status is distinct from 'available') then
    perform notify_partner_followers(new.id);
  end if;
  return new;
end;
$$;

create trigger on_dog_available_notify_partner_followers
  after insert or update of status on dogs
  for each row execute procedure trg_dogs_notify_partner_followers();

-- Trigger point 2: a partner is approved — re-check its already-available dogs
create or replace function trg_partner_approved_notify_partner_followers()
returns trigger language plpgsql as $$
declare
  v_dog_id uuid;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    for v_dog_id in select id from dogs where partner_id = new.id and status = 'available' loop
      perform notify_partner_followers(v_dog_id);
    end loop;
  end if;
  return new;
end;
$$;

create trigger on_partner_approved_notify_partner_followers
  after update of status on partners
  for each row execute procedure trg_partner_approved_notify_partner_followers();
