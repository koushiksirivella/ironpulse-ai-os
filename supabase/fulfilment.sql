-- ===========================================================================
-- ELITE GYM — fulfilment pipeline
--
-- Adds the chain the storefront was missing: an order stops being a single
-- "new/delivered" flag and becomes a route with three people on it.
--
--   customer places   ->  new
--   operator approves ->  approved          (admin panel)
--   staff starts      ->  preparing         (staff page)
--   staff finishes    ->  ready             (staff page)   << OTP is minted here
--   rider accepts     ->  out_for_delivery  (rider page)
--   rider enters OTP  ->  delivered         (rider page)
--
--   any of the above ->  cancelled          (operator only)
--
-- Non-destructive and re-runnable. It never drops a column and never
-- rewrites an existing row's status.
--
-- Run:  npm run db:fulfilment
-- ===========================================================================

begin;

-- ------------------------------------------------------------------ states
-- The old constraint allowed four values. Widen it rather than replace the
-- data: 'confirmed' stays legal forever because rows already carry it, and
-- an order that was confirmed under the old flow is treated as approved.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in (
    'new',
    'confirmed',          -- legacy, equivalent to approved. never written again.
    'approved',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ));

-- ------------------------------------------------------- who did what, when
-- Timestamps, not booleans. "Is it prepared" is answerable from a timestamp;
-- "when was it prepared" is not answerable from a boolean, and the second
-- question is the one that gets asked when a customer rings up angry.
alter table public.orders add column if not exists approved_at   timestamptz;
alter table public.orders add column if not exists approved_by   uuid references auth.users(id);
alter table public.orders add column if not exists prepared_at   timestamptz;
alter table public.orders add column if not exists prepared_by   uuid references auth.users(id);
alter table public.orders add column if not exists ready_at      timestamptz;
alter table public.orders add column if not exists accepted_at   timestamptz;
alter table public.orders add column if not exists rider_id      uuid references auth.users(id);
alter table public.orders add column if not exists delivered_at  timestamptz;
alter table public.orders add column if not exists otp_attempts  int not null default 0;

create index if not exists orders_rider_idx
  on public.orders (tenant_id, rider_id, status);

-- --------------------------------------------------------------- the roles
-- One person can hold several roles, so this is a set, not a column. A gym
-- owner is legitimately operator + staff + rider on a slow Tuesday.
alter table public.operators add column if not exists roles text[]
  not null default array['operator']::text[];

alter table public.operators drop constraint if exists operators_roles_check;
alter table public.operators add constraint operators_roles_check
  check (roles <@ array['operator','staff','rider']::text[] and array_length(roles,1) >= 1);

-- Anyone already in the table predates roles and is an operator.
update public.operators set roles = array['operator']::text[]
  where roles is null or array_length(roles,1) is null;

create or replace function public.has_role(want text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.operators
    where user_id = auth.uid() and want = any(roles)
  );
$$;

-- ----------------------------------------------------------------- the OTP
-- WHY THIS IS A SEPARATE TABLE.
--
-- The rider has to be able to SELECT the order in order to deliver it. RLS
-- is row-level, not column-level — so an `otp_code` column on `orders` would
-- be readable by exactly the person the OTP exists to check. The rider would
-- simply read the code off their own screen and type it back in, and the
-- verification would be theatre.
--
-- So the code lives in a table with NO select policy for anybody. The only
-- way to test a code is verify_delivery_otp() below, which is SECURITY
-- DEFINER, compares server-side, and returns a boolean. Nothing that reaches
-- a browser ever contains the code except the customer's own notification.
create table if not exists public.order_otps (
  order_id    uuid primary key references public.orders(id) on delete cascade,
  code        text not null check (code ~ '^[0-9]{6}$'),
  issued_at   timestamptz not null default now(),
  consumed_at timestamptz
);

alter table public.order_otps enable row level security;
-- Deliberately zero policies. With RLS on and no policy, every role except
-- service_role is denied everything. The SECURITY DEFINER functions below are
-- the only doorway, and that is the entire point of the table.

-- ------------------------------------------------------------- transitions
-- Every status change goes through one of these. None of them is an UPDATE
-- policy on `orders`, because an UPDATE policy that can set status can set it
-- to anything — a rider could mark an order delivered without ever leaving
-- the gym. A function per transition is what makes the ORDER of the states
-- enforceable rather than advisory.

create or replace function public.approve_order(p_order uuid)
returns public.orders language plpgsql security definer set search_path = public as $$
declare row public.orders;
begin
  if not public.has_role('operator') then
    raise exception 'not an operator' using errcode = '42501';
  end if;
  update public.orders
     set status = 'approved', approved_at = now(), approved_by = auth.uid()
   where id = p_order and status in ('new','confirmed')
   returning * into row;
  if row.id is null then
    raise exception 'order is not awaiting approval' using errcode = 'P0001';
  end if;
  return row;
end;
$$;

create or replace function public.start_preparing(p_order uuid)
returns public.orders language plpgsql security definer set search_path = public as $$
declare row public.orders;
begin
  if not (public.has_role('staff') or public.has_role('operator')) then
    raise exception 'not kitchen staff' using errcode = '42501';
  end if;
  update public.orders
     set status = 'preparing', prepared_by = auth.uid()
   where id = p_order and status = 'approved'
   returning * into row;
  if row.id is null then
    raise exception 'order has not been approved yet' using errcode = 'P0001';
  end if;
  return row;
end;
$$;

-- Finishing prep is where the OTP is minted. It is minted here rather than at
-- checkout so that a code cannot be sitting in a customer's inbox for three
-- days before the order is real.
-- search_path includes `extensions` because pgcrypto lives there on Supabase,
-- not in public. Without it gen_random_bytes() is not found and the whole
-- transition fails at the one line that matters.
create or replace function public.mark_ready(p_order uuid)
returns public.orders language plpgsql security definer set search_path = public, extensions as $$
declare row public.orders; new_code text;
begin
  if not (public.has_role('staff') or public.has_role('operator')) then
    raise exception 'not kitchen staff' using errcode = '42501';
  end if;
  update public.orders
     set status = 'ready', prepared_at = now(), ready_at = now()
   where id = p_order and status in ('preparing','approved')
   returning * into row;
  if row.id is null then
    raise exception 'order is not in preparation' using errcode = 'P0001';
  end if;

  -- Six digits from a cryptographic source. random() is seeded per session
  -- and is guessable; gen_random_bytes is not.
  new_code := lpad((('x' || encode(gen_random_bytes(4),'hex'))::bit(32)::bigint % 1000000)::text, 6, '0');

  insert into public.order_otps (order_id, code)
  values (row.id, new_code)
  on conflict (order_id) do update
    set code = excluded.code, issued_at = now(), consumed_at = null;

  return row;
end;
$$;

create or replace function public.accept_delivery(p_order uuid)
returns public.orders language plpgsql security definer set search_path = public as $$
declare row public.orders;
begin
  if not public.has_role('rider') then
    raise exception 'not a rider' using errcode = '42501';
  end if;
  -- `rider_id is null` in the WHERE is the lock. Two riders tapping Accept at
  -- the same moment: the first UPDATE wins the row, the second matches zero
  -- rows and is told the job is gone. No advisory lock needed.
  update public.orders
     set status = 'out_for_delivery', accepted_at = now(), rider_id = auth.uid()
   where id = p_order and status = 'ready' and rider_id is null
   returning * into row;
  if row.id is null then
    -- Two causes, one UPDATE. Tell them apart: 'already taken' on an order
    -- that was never ready sends a rider hunting for a teammate who does not
    -- exist.
    if exists (select 1 from public.orders where id = p_order and status <> 'ready') then
      raise exception 'that order is not ready yet' using errcode = 'P0001';
    end if;
    raise exception 'that job has already been taken' using errcode = 'P0001';
  end if;
  return row;
end;
$$;

-- The only way an order becomes delivered.
create or replace function public.verify_delivery_otp(p_order uuid, p_code text)
returns public.orders language plpgsql security definer set search_path = public as $$
declare row public.orders; want text; tries int;
begin
  if not public.has_role('rider') then
    raise exception 'not a rider' using errcode = '42501';
  end if;

  select otp_attempts into tries from public.orders where id = p_order;
  if tries >= 6 then
    raise exception 'too many wrong codes — call the gym' using errcode = 'P0001';
  end if;

  select code into want from public.order_otps
   where order_id = p_order and consumed_at is null;

  -- Count the attempt BEFORE deciding, so a wrong guess is charged even if
  -- the caller drops the connection the instant it fails.
  update public.orders set otp_attempts = otp_attempts + 1 where id = p_order;

  if want is null or want <> p_code then
    raise exception 'wrong code' using errcode = 'P0001';
  end if;

  update public.orders
     set status = 'delivered', delivered_at = now()
   where id = p_order and status = 'out_for_delivery' and rider_id = auth.uid()
   returning * into row;
  if row.id is null then
    raise exception 'this order is not out for delivery with you' using errcode = 'P0001';
  end if;

  update public.order_otps set consumed_at = now() where order_id = p_order;
  return row;
end;
$$;

create or replace function public.cancel_order(p_order uuid, p_reason text default null)
returns public.orders language plpgsql security definer set search_path = public as $$
declare row public.orders;
begin
  if not public.has_role('operator') then
    raise exception 'not an operator' using errcode = '42501';
  end if;
  update public.orders
     set status = 'cancelled',
         note = coalesce(note,'') || case when p_reason is null then '' else E'\ncancelled: ' || p_reason end
   where id = p_order and status <> 'delivered'
   returning * into row;
  if row.id is null then
    raise exception 'a delivered order cannot be cancelled' using errcode = 'P0001';
  end if;
  return row;
end;
$$;

-- The customer's copy of the code. Called with the order id AND the phone
-- number on it, so possession of an order id alone is not enough — an id in a
-- URL someone forwarded does not hand over the code.
create or replace function public.customer_otp(p_order uuid, p_phone text)
returns text language plpgsql security definer set search_path = public as $$
declare want text;
begin
  select o.code into want
    from public.order_otps o
    join public.orders ord on ord.id = o.order_id
   where o.order_id = p_order
     and o.consumed_at is null
     and regexp_replace(ord.phone,'\D','','g') = regexp_replace(p_phone,'\D','','g');
  return want;
end;
$$;

-- --------------------------------------------------------------- who may see
-- Staff and riders need to read orders, and the existing policy only lets
-- operators. Both new policies are SELECT-only: neither role can write a row
-- by any route except the transition functions above.
drop policy if exists "staff read active orders" on public.orders;
create policy "staff read active orders" on public.orders
  for select to authenticated
  using (
    public.has_role('staff')
    and status in ('approved','preparing','ready')
  );

drop policy if exists "riders read deliverable orders" on public.orders;
create policy "riders read deliverable orders" on public.orders
  for select to authenticated
  using (
    public.has_role('rider')
    and fulfilment = 'delivery'
    and (
      (status = 'ready' and rider_id is null)   -- the open job board
      or rider_id = auth.uid()                  -- their own runs, incl. history
    )
  );

grant execute on function public.approve_order(uuid)              to authenticated;
grant execute on function public.start_preparing(uuid)            to authenticated;
grant execute on function public.mark_ready(uuid)                 to authenticated;
grant execute on function public.accept_delivery(uuid)            to authenticated;
grant execute on function public.verify_delivery_otp(uuid, text)  to authenticated;
grant execute on function public.cancel_order(uuid, text)         to authenticated;
grant execute on function public.has_role(text)                   to authenticated;
grant execute on function public.customer_otp(uuid, text)         to anon, authenticated;

-- Nobody reaches the code table directly. Belt as well as braces: RLS above
-- already denies it, and revoking the grant means a future policy added by
-- accident still cannot open it.
revoke all on public.order_otps from anon, authenticated;

commit;
