const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');
const m1 = fs.readFileSync(path.join(migrationsDir, '20261029000001_core_schema.sql'), 'utf8');
const m2 = fs.readFileSync(path.join(migrationsDir, '20261029000002_functions_and_realtime.sql'), 'utf8');
const m3 = fs.readFileSync(path.join(migrationsDir, '20261029000003_row_level_security.sql'), 'utf8');

// Build clean setup SQL
let sql = `-- ====================================================================
-- PENGUFOOD: CLEAN PRODUCTION DATABASE SETUP (NO MOCK FOOD/DATA)
-- Completely resolves ERROR 42703 (rider_id does not exist) by resetting
-- any legacy test tables and rebuilding the clean schema, functions & RLS.
-- Restaurants, food items, images, and prices are managed from the Admin Panel.
-- Timezone: Asia/Dhaka (UTC+6)
-- ====================================================================

-- 0. Clean up legacy or broken test tables to guarantee a 100% fresh, error-free schema
DROP TABLE IF EXISTS public.order_status_history CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.delivery_zones CASCADE;
DROP TABLE IF EXISTS public.pricing_rules CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.banners CASCADE;
DROP TABLE IF EXISTS public.restaurant_staff CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;
DROP TABLE IF EXISTS public.riders CASCADE;
DROP TABLE IF EXISTS public.administrators CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;

` + m1 + '\n\n' + m2 + '\n\n' + m3 + `\n\n
-- Initial default delivery zones (Admin can change fees anytime in Admin Panel -> Pricing)
INSERT INTO public.delivery_zones (id, name_en, name_bn, min_distance_km, max_distance_km, regular_fee, cake_fee, is_active)
VALUES
  ('zone_0_2', 'Town Core (0-2 km)', 'মঠবাড়িয়া শহর (০-২ কিমি)', 0.00, 2.00, 40.00, 80.00, true),
  ('zone_2_3', 'Extended Town (2-3 km)', 'পৌর এলাকা (২-৩ কিমি)', 2.00, 3.00, 50.00, 100.00, true),
  ('zone_3_8', 'Outer Unions (3-8 km)', 'ইউনিয়ন এলাকা (৩-৮ কিমি)', 3.00, 8.00, 80.00, 150.00, true)
ON CONFLICT (id) DO NOTHING;

-- Initial app configuration
INSERT INTO public.app_settings (key, value, description)
VALUES
  ('delivery_rates', '{"regular_0_2": 40, "regular_2_3": 50, "cake_3_8": 150}'::jsonb, 'Delivery fees editable via Admin Panel'),
  ('restaurant_passwords', '{}'::jsonb, 'PBKDF2 SHA-512 securely hashed restaurant credentials set by Admin')
ON CONFLICT (key) DO NOTHING;
`;

const combinedPath = path.join(__dirname, 'combined_complete_setup.sql');
const cleanPath = path.join(__dirname, 'clean_production_setup.sql');

fs.writeFileSync(combinedPath, sql, 'utf8');
fs.writeFileSync(cleanPath, sql, 'utf8');

console.log('Successfully written clean setup to:', combinedPath);
