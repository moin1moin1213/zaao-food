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
-- ====================================================================
-- Minimal System Foundation (Category Tags & Config for Admin Panel)
-- NOTE: Zero mock foods, zero mock restaurants. The Admin adds those.
-- ====================================================================
INSERT INTO public.categories (id, slug, name_en, name_bn, description_en, description_bn, image_url, display_order, is_cake_category)
VALUES
  ('cat_biryani', 'biryani', 'Biryani & Polao', 'বিরিয়ানি ও পোলাও', 'Biryani & Traditional Meals', 'ঐতিহ্যবাহী বিরিয়ানি ও পোলাও', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', 1, false),
  ('cat_rice', 'rice-meals', 'Rice & Curries', 'ভাত ও তরকারি', 'Daily traditional meals', 'প্রতিদিনের ভাত ও তরকারি', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 2, false),
  ('cat_fastfood', 'fast-food', 'Burgers & Fast Food', 'বার্গার ও ফাস্টফুড', 'Burgers, chicken and snacks', 'বার্গার ও ফাস্টফুড', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', 3, false),
  ('cat_snacks', 'snacks', 'Evening Snacks', 'সান্ধ্যকালীন নাশতা', 'Tea snacks and evening items', 'সান্ধ্যকালীন নাশতা', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', 4, false),
  ('cat_cakes', 'cakes', 'Homemade Cakes', 'হোমমেড কেক', 'Custom cakes and bakery', 'হোমমেড কেক ও বেকারি', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80', 5, true)
ON CONFLICT (id) DO NOTHING;

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
