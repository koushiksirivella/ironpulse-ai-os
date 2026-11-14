-- ===========================================================================
-- ELITE GYM — the customer's own view of their order.
--
-- WHY THIS EXISTS.
--
-- The six-digit code is minted when the kitchen marks an order ready, not at
-- checkout — a code sitting in someone's inbox for three days before the order
-- is real is a code that gets lost. So the confirmation screen cannot show it,
-- and the customer needs a door to come back to.
--
-- This is that door, and it is the ONLY thing `anon` can read about an order.
-- `orders` itself stays INSERT-only for the public: a readable orders table
-- would expose every customer name and phone on the platform to anyone who
-- opens devtools.
--
-- The key is order number PLUS phone. An order number alone is guessable —
-- they are sequential per gym — and forwarding a link must not hand over
-- somebody else's delivery code.
-- ===========================================================================

begin;

create or replace function public.order_status(p_order_no text, p_phone text)
returns table (
  order_no    text,
  status      text,
  fulfilment  text,
  items       jsonb,
  total       numeric,
  currency    text,
  placed_at   timestamptz,
  ready_at    timestamptz,
  delivered_at timestamptz,
  gym_name    text,
  code        text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    o.order_no,
    o.status,
    o.fulfilment,
    o.items,
    o.total,
    t.currency,
    o.created_at,
    o.ready_at,
    o.delivered_at,
    t.name,
    -- The code appears only in the window where it is useful: once the order
    -- is ready, and until it has been handed over. Before that there is
    -- nothing to show; after that it is spent and showing it would only
    -- confuse someone reading an old tab.
    case
      when o.status in ('ready','out_for_delivery')
      then (select x.code from public.order_otps x
             where x.order_id = o.id and x.consumed_at is null)
      else null
    end
  from public.orders o
  join public.tenants t on t.id = o.tenant_id
  where upper(trim(o.order_no)) = upper(trim(p_order_no))
    and regexp_replace(o.phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g');
end;
$$;

grant execute on function public.order_status(text, text) to anon, authenticated;

commit;
