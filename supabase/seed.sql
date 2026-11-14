-- J7 Commerce Engine — seed: tenant #1
-- Re-runnable. Deletes and recreates the j7 tenant and everything under it.
--
-- Memberships and personal training carry J7's REAL published prices, taken
-- from index.html. Supplements, merch and classes are realistic placeholders
-- priced at Indian retail and are meant to be edited from the admin panel.

begin;

delete from public.tenants where slug = 'j7';

insert into public.tenants (slug, name, whatsapp_number, enquiry_email, address, hours, brand, sections)
values (
  'j7',
  'J7 Fitness Studio',
  null,   -- TODO: the gym's real WhatsApp number in E.164, e.g. +919876543210
  null,   -- TODO: the gym's own enquiry email (AUDIT-J7 #1: never the builder's)
  'J7 FITNESS STUDIO, Nalini Complex, 6-86, near LP Theatre, Raithupeta, Nandigama, Andhra Pradesh 521185',
  'Mon-Sat: 5:00 AM - 10:00 AM & 5:00 PM - 9:00 PM. Sunday evening holiday.',
  -- Every token in engine/theme.js TOKENS, with no gaps. A missing token still
  -- works (the skin file covers it), but it shows as an empty box in the admin
  -- panel, which reads as broken rather than as inherited.
  jsonb_build_object(
    'bg',          '#0A0D0E',
    'surface',     '#1B1B19',
    'surface-2',   '#1A2123',
    'border',      '#2C2F31',
    'brand',       '#FF2738',
    'brand-hover', '#B21212',
    'brand-glow',  '#FF4D4D',
    'brand-text',  '#FFFFFF',   -- text sitting ON the brand colour
    'text',        '#FFFFFF',
    'text-muted',  '#B8B8B8',
    'danger',      '#FF6B6B',
    'radius',      '4px',
    'font-display','Playfair Display, serif',
    'font-body',   'Inter, system-ui, sans-serif'
  ),
  jsonb_build_object(
    'hero', true, 'about', true, 'programs', true, 'trainers', true,
    'results', true, 'pricing', true, 'shop', true,
    'testimonials', false,   -- AUDIT-J7 #3: fabricated, off until real quotes exist
    'stats', false,          -- AUDIT-J7 #4: unverified numbers, off until confirmed
    'faq', true, 'contact', true
  )
);

with t as (select id from public.tenants where slug = 'j7')
insert into public.categories (tenant_id, name, slug, sort)
select t.id, c.name, c.slug, c.sort from t, (values
  ('Memberships',       'memberships', 1),
  ('Personal Training', 'pt',          2),
  ('Supplements',       'supplements', 3),
  ('Gear & Merch',      'merch',       4),
  ('Classes',           'classes',     5)
) as c(name, slug, sort);

-- ---------------------------------------------------- memberships (REAL prices)
with t as (select id from public.tenants where slug = 'j7'),
     c as (select id from public.categories where slug = 'memberships'
             and tenant_id = (select id from t))
insert into public.products (tenant_id, category_id, kind, name, description, price, meta, sort)
select (select id from t), (select id from c), 'membership', p.name, p.descr, p.price, p.meta, p.sort
from (values
  ('1 Month - Strength Training',  'Full gym access, structured strength programming.', 1000.00, '{"duration_months":1}'::jsonb,  1),
  ('3 Months - Strength Training', 'Full gym access. Works out cheaper than monthly.',  2500.00, '{"duration_months":3}'::jsonb,  2),
  ('6 Months - Strength Training', 'Full gym access for half a year.',                  5000.00, '{"duration_months":6}'::jsonb,  3),
  ('1 Year - Strength Training',   'Full gym access for twelve months. Best value.',    9000.00, '{"duration_months":12}'::jsonb, 4)
) as p(name, descr, price, meta, sort);

-- ------------------------------------------------ personal training (REAL prices)
with t as (select id from public.tenants where slug = 'j7'),
     c as (select id from public.categories where slug = 'pt'
             and tenant_id = (select id from t))
insert into public.products (tenant_id, category_id, kind, name, description, price, meta, sort)
select (select id from t), (select id from c), 'pt_package', p.name, p.descr, p.price, p.meta, p.sort
from (values
  ('1 Month - Personal Training',  'One-to-one coaching, plan built around your schedule.', 3000.00, '{"duration_months":1}'::jsonb, 1),
  ('3 Months - Personal Training', 'One-to-one coaching across a full training block.',     8000.00, '{"duration_months":3}'::jsonb, 2)
) as p(name, descr, price, meta, sort);

-- ------------------------------------------------- supplements (placeholder prices)
with t as (select id from public.tenants where slug = 'j7'),
     c as (select id from public.categories where slug = 'supplements'
             and tenant_id = (select id from t))
insert into public.products (tenant_id, category_id, kind, name, description, price, sort)
select (select id from t), (select id from c), 'product', p.name, p.descr, p.price, p.sort
from (values
  ('Whey Protein - 1 kg',          'Around 24 g protein per scoop. Chocolate or unflavoured.', 2499.00, 1),
  ('Creatine Monohydrate - 250 g', 'Micronised. 5 g a day, no loading needed.',                 899.00, 2),
  ('Rolled Oats - 1 kg',           'Plain rolled oats. The cheapest clean carb in the shop.',   249.00, 3),
  ('Peanut Butter - 1 kg',         'Unsweetened. Fat and protein for people who are bulking.',  399.00, 4),
  ('Multivitamin - 60 tablets',    'One a day. Two months per bottle.',                         549.00, 5),
  ('Shaker Bottle - 700 ml',       'Leak-proof, with a mixing ball.',                           299.00, 6)
) as p(name, descr, price, sort);

-- ------------------------------------------------------- merch (placeholder prices)
with t as (select id from public.tenants where slug = 'j7'),
     c as (select id from public.categories where slug = 'merch'
             and tenant_id = (select id from t))
insert into public.products (tenant_id, category_id, kind, name, description, price, sort)
select (select id from t), (select id from c), 'product', p.name, p.descr, p.price, p.sort
from (values
  ('J7 Training Tee',   'Cotton blend. Sizes S to XXL, tell us which in the note.', 599.00, 1),
  ('J7 Gym Bag',        'Holds shoes, belt, bottle and a change of clothes.',       899.00, 2),
  ('Lifting Straps',    'Cotton straps for pulls when your grip gives out first.',  449.00, 3)
) as p(name, descr, price, sort);

-- ----------------------------------------------------- classes (placeholder prices)
with t as (select id from public.tenants where slug = 'j7'),
     c as (select id from public.categories where slug = 'classes'
             and tenant_id = (select id from t))
insert into public.products (tenant_id, category_id, kind, name, description, price, meta, sort)
select (select id from t), (select id from c), 'class', p.name, p.descr, p.price, p.meta, p.sort
from (values
  ('Trial Day Pass',              'One session, full access. Come see the place first.', 200.00, '{"slots":["5:00 AM - 10:00 AM","5:00 PM - 9:00 PM"]}'::jsonb, 1),
  ('Weekend Strength Workshop',   'Two hours on squat, bench and deadlift technique.',   500.00, '{"slots":["Saturday 6:00 AM","Sunday 6:00 AM"]}'::jsonb,      2)
) as p(name, descr, price, meta, sort);

commit;
