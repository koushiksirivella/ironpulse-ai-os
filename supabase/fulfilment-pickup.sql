-- ===========================================================================
-- ELITE GYM — the pickup completion step.
--
-- Addendum to fulfilment.sql. A delivery order ends with a rider entering the
-- customer's code at the door; a PICKUP order has no rider at all, so without
-- this it would sit at 'ready' forever.
--
-- Same mechanic, same code, different doorway: the customer reads their six
-- digits out at the counter and staff types them in. One OTP concept across
-- both routes, rather than a second "collected" button that proves nothing.
-- ===========================================================================

begin;

create or replace function public.verify_pickup_otp(p_order uuid, p_code text)
returns public.orders language plpgsql security definer set search_path = public as $$
declare row public.orders; want text; tries int; kind text;
begin
  if not (public.has_role('staff') or public.has_role('operator')) then
    raise exception 'not gym staff' using errcode = '42501';
  end if;

  select fulfilment, otp_attempts into kind, tries from public.orders where id = p_order;
  if kind is distinct from 'pickup_at_gym' then
    raise exception 'this is a delivery order — a rider closes it' using errcode = 'P0001';
  end if;
  if tries >= 6 then
    raise exception 'too many wrong codes — check the order by hand' using errcode = 'P0001';
  end if;

  select code into want from public.order_otps
   where order_id = p_order and consumed_at is null;

  update public.orders set otp_attempts = otp_attempts + 1 where id = p_order;

  if want is null or want <> p_code then
    raise exception 'wrong code' using errcode = 'P0001';
  end if;

  update public.orders
     set status = 'delivered', delivered_at = now()
   where id = p_order and status = 'ready'
   returning * into row;
  if row.id is null then
    raise exception 'this order is not ready for collection' using errcode = 'P0001';
  end if;

  update public.order_otps set consumed_at = now() where order_id = p_order;
  return row;
end;
$$;

grant execute on function public.verify_pickup_otp(uuid, text) to authenticated;

commit;
