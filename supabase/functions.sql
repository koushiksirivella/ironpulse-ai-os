-- J7 Commerce Engine — server-side order placement.
--
-- WHY THIS EXISTS, and why the engine does not insert into `orders` directly:
--
--   1. The browser cannot be trusted with prices. A direct insert lets anyone
--      with devtools post an order for a 1-year membership at ₹1. This function
--      IGNORES any price the browser sends and reads the real price out of
--      `products`. The accepted risk noted at the bottom of policies.sql is
--      closed by this file.
--
--   2. The browser cannot read `orders` back (RLS, by design), so an INSERT
--      with `Prefer: return=representation` is refused — proven by
--      scripts/rls.test.mjs. Without an RPC there is no way to show the
--      customer their order number. SECURITY DEFINER returns just that one
--      field and nothing else.
--
-- The public INSERT policy on `orders` stays in place as a second path, but
-- nothing in the engine uses it.

create or replace function public.place_order(
  p_tenant_slug   text,
  p_customer_name text,
  p_phone         text,
  p_fulfilment    text,
  p_items         jsonb,
  p_address       text default null,
  p_note          text default null
)
returns table (order_no text, total numeric, currency text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant   public.tenants%rowtype;
  v_items    jsonb := '[]'::jsonb;
  v_subtotal numeric(10,2) := 0;
  v_line     jsonb;
  v_product  public.products%rowtype;
  v_qty      int;
  v_id       uuid;
begin
  select * into v_tenant from public.tenants where slug = p_tenant_slug and active;
  if not found then
    raise exception 'unknown or inactive gym: %', p_tenant_slug using errcode = 'P0002';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'cart is empty' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'too many lines in one order' using errcode = 'P0001';
  end if;

  -- Rebuild every line from the database. Name, price and kind come from
  -- `products`, never from the request body.
  for v_line in select * from jsonb_array_elements(p_items)
  loop
    begin
      v_id := (v_line ->> 'product_id')::uuid;
    exception when others then
      raise exception 'bad product id' using errcode = 'P0001';
    end;

    select * into v_product
      from public.products
     where id = v_id and tenant_id = v_tenant.id and active;
    if not found then
      raise exception 'item no longer available' using errcode = 'P0002';
    end if;

    v_qty := coalesce((v_line ->> 'qty')::int, 1);
    if v_product.kind in ('membership', 'pt_package', 'class') then
      v_qty := 1;                      -- spec §13, enforced server-side too
    end if;
    if v_qty < 1 or v_qty > 99 then
      raise exception 'bad quantity' using errcode = 'P0001';
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_qty);

    -- The frozen snapshot (spec §7). Written once, never updated.
    v_items := v_items || jsonb_build_object(
      'product_id', v_product.id,
      'name',       v_product.name,
      'kind',       v_product.kind,
      'price',      v_product.price,
      'qty',        v_qty,
      'line_total', v_product.price * v_qty,
      'options',    coalesce(v_line -> 'options', '{}'::jsonb)
    );
  end loop;

  insert into public.orders (
    tenant_id, customer_name, phone, fulfilment, address, note,
    items, subtotal, total
  ) values (
    v_tenant.id,
    trim(p_customer_name),
    trim(p_phone),
    p_fulfilment,
    nullif(trim(coalesce(p_address, '')), ''),
    nullif(trim(coalesce(p_note, '')), ''),
    v_items,
    v_subtotal,
    v_subtotal                          -- delivery/tax/discount are Phase 2
  )
  returning orders.order_no, orders.total, v_tenant.currency
       into order_no, total, currency;

  return next;
end;
$$;

revoke all on function public.place_order(text, text, text, text, jsonb, text, text) from public;
grant execute on function public.place_order(text, text, text, text, jsonb, text, text)
  to anon, authenticated;
