-- ============================================================================
-- GYM REVENUE RECOVERY OS + LIVE GATE STREAM + LEAD PIPELINE (Offer 01 Schema)
-- Multi-tenant extension to public.tenants with Row-Level Security (RLS).
-- Spec: offer_01_gym_revenue_recovery_os.md §16
-- ============================================================================

-- 1. Membership Plans
create table if not exists public.membership_plans (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  name           text not null,
  duration_days  int  not null check (duration_days > 0),
  price          numeric(10,2) not null check (price >= 0),
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- 2. Members
create table if not exists public.members (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  member_code    text not null,
  full_name      text not null check (length(trim(full_name)) > 0),
  phone          text not null check (length(regexp_replace(phone,'\D','','g')) >= 10),
  whatsapp_optin boolean not null default true,
  status         text not null default 'active'
                 check (status in ('active','expiring','overdue','expired','inactive')),
  notes          text,
  created_at     timestamptz not null default now(),
  unique (tenant_id, member_code)
);

-- 3. Memberships (Active / Historical Cycles)
create table if not exists public.memberships (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references public.tenants(id) on delete cascade,
  member_id            uuid not null references public.members(id) on delete cascade,
  plan_id              uuid references public.membership_plans(id) on delete set null,
  plan_name            text not null,
  amount_due           numeric(10,2) not null check (amount_due >= 0),
  start_date           date not null,
  expiry_date          date not null,
  payment_status       text not null default 'pending'
                       check (payment_status in ('paid','pending','overdue','disputed')),
  reminders_suppressed boolean not null default false,
  created_at           timestamptz not null default now()
);

-- 4. Verified Payments & Exception Queue
create table if not exists public.payments (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  membership_id     uuid references public.memberships(id) on delete set null,
  member_id         uuid references public.members(id) on delete set null,
  payer_name        text,
  payer_phone       text,
  amount            numeric(10,2) not null check (amount > 0),
  method            text not null check (method in ('upi_webhook','gateway_webhook','manual_upi','manual_cash','bank_transfer')),
  reference_utr     text not null,
  verification_mode text not null check (verification_mode in ('signed_webhook','staff_authorized','unmatched_review')),
  status            text not null default 'verified'
                    check (status in ('verified','unmatched','duplicate','failed')),
  confirmed_by      text,
  confirmed_at      timestamptz not null default now(),
  unique (tenant_id, reference_utr)
);

-- 5. Scheduled WhatsApp Reminder Jobs (-7d, -3d, -1d, 0d, +1d, +3d, +5d)
create table if not exists public.reminder_jobs (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  membership_id  uuid not null references public.memberships(id) on delete cascade,
  member_id      uuid not null references public.members(id) on delete cascade,
  trigger_stage  text not null check (trigger_stage in ('minus_7d','minus_3d','minus_1d','expiry_day','plus_1d','plus_3d','plus_5d')),
  scheduled_for  timestamptz not null,
  status         text not null default 'scheduled'
                 check (status in ('scheduled','sent','delivered','failed','suppressed')),
  suppressed_by  text,
  provider_msgid text,
  updated_at     timestamptz not null default now(),
  unique (membership_id, trigger_stage)
);

-- 6. Live Gate Occupancy Stream ("Coming & Going" Check-in / Check-out)
create table if not exists public.gate_events (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  member_id         uuid references public.members(id) on delete set null,
  member_name       text not null,
  member_code       text,
  direction         text not null check (direction in ('in','out')),
  method            text not null default 'qr_scan' check (method in ('qr_scan','staff_counter','turnstile')),
  membership_state  text not null default 'active' check (membership_state in ('active','expiring','expired_flagged')),
  flagged_for_staff boolean not null default false,
  flag_resolved     boolean not null default false,
  occurred_at       timestamptz not null default now()
);

-- 7. Lead Follow-up & Trial Pipeline
create table if not exists public.gym_leads (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  full_name      text not null,
  phone          text not null,
  source         text not null default 'website',
  interest       text not null default '3 Months Strength + Cardio',
  stage          text not null default 'new'
                 check (stage in ('new','contacted','trial_booked','joined','lost')),
  last_action    text,
  created_at     timestamptz not null default now()
);

-- 8. Immutable Audit & Automation Logs
create table if not exists public.recovery_audit_logs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  actor       text not null,
  event_type  text not null,
  detail      text not null,
  created_at  timestamptz not null default now()
);

-- Enable RLS on all Offer 01 tables
alter table public.membership_plans    enable row level security;
alter table public.members             enable row level security;
alter table public.memberships         enable row level security;
alter table public.payments            enable row level security;
alter table public.reminder_jobs       enable row level security;
alter table public.gate_events         enable row level security;
alter table public.gym_leads           enable row level security;
alter table public.recovery_audit_logs enable row level security;

-- Operator-only policies
create policy operator_all_plans       on public.membership_plans    for all to authenticated using (public.is_operator()) with check (public.is_operator());
create policy operator_all_members     on public.members             for all to authenticated using (public.is_operator()) with check (public.is_operator());
create policy operator_all_memberships on public.memberships         for all to authenticated using (public.is_operator()) with check (public.is_operator());
create policy operator_all_payments    on public.payments            for all to authenticated using (public.is_operator()) with check (public.is_operator());
create policy operator_all_reminders   on public.reminder_jobs       for all to authenticated using (public.is_operator()) with check (public.is_operator());
create policy operator_all_gate        on public.gate_events         for all to authenticated using (public.is_operator()) with check (public.is_operator());
create policy operator_all_leads       on public.gym_leads           for all to authenticated using (public.is_operator()) with check (public.is_operator());
create policy operator_all_audit       on public.recovery_audit_logs for all to authenticated using (public.is_operator()) with check (public.is_operator());
