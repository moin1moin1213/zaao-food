-- ====================================================================
-- PenguFood (Mathbaria) — Production Supabase PostgreSQL Schema
-- Customer Web, Restaurant Dashboard, Android Rider App & Admin Panel
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop conflicting tables if re-initializing cleanly
-- DROP TABLE IF EXISTS public.rider_payouts CASCADE;
-- DROP TABLE IF EXISTS public.restaurant_payouts CASCADE;
-- DROP TABLE IF EXISTS public.coupons CASCADE;
-- DROP TABLE IF EXISTS public.delivery_zones CASCADE;
-- DROP TABLE IF EXISTS public.orders CASCADE;
-- DROP TABLE IF EXISTS public.riders CASCADE;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.categories CASCADE;
-- DROP TABLE IF EXISTS public.restaurants CASCADE;
-- DROP TABLE IF EXISTS public.banners CASCADE;
-- DROP TABLE IF EXISTS public.app_settings CASCADE;

-- 3. Restaurants Table
CREATE TABLE IF NOT EXISTS public.restaurants (
    id TEXT PRIMARY KEY DEFAULT ('rest_' || substr(md5(random()::text), 1, 8)),
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    phone TEXT,
    owner_phone TEXT,
    owner_email TEXT,
    image_url TEXT NOT NULL,
    banner_url TEXT NOT NULL,
    cuisines_en TEXT[] DEFAULT '{}',
    cuisines_bn TEXT[] DEFAULT '{}',
    rating NUMERIC(2,1) DEFAULT 4.8,
    review_count INTEGER DEFAULT 0,
    is_open BOOLEAN DEFAULT true,
    opening_hours_en TEXT DEFAULT '10:00 AM - 10:00 PM',
    opening_hours_bn TEXT DEFAULT 'সকাল ১০:০০ - রাত ১০:০০',
    min_order NUMERIC(10,2) DEFAULT 0.00,
    address_en TEXT NOT NULL,
    address_bn TEXT NOT NULL,
    latitude NUMERIC(9,6) DEFAULT 22.2858,
    longitude NUMERIC(9,6) DEFAULT 89.9614,
    distance_km NUMERIC(3,1) DEFAULT 1.0,
    prep_time_minutes INTEGER DEFAULT 25,
    commission_rate NUMERIC(4,1) DEFAULT 15.0, -- Platform commission percentage (e.g. 15%)
    total_sales NUMERIC(12,2) DEFAULT 0.00,
    balance NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY DEFAULT ('cat_' || substr(md5(random()::text), 1, 8)),
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    description_en TEXT,
    description_bn TEXT,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Products / Foods / Cakes Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT ('prod_' || substr(md5(random()::text), 1, 8)),
    slug TEXT UNIQUE NOT NULL,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    description_en TEXT,
    description_bn TEXT,
    price NUMERIC(10,2) NOT NULL,
    original_price NUMERIC(10,2),
    image_url TEXT NOT NULL,
    is_available BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    sales_count INTEGER DEFAULT 0,
    is_recommended BOOLEAN DEFAULT false,
    is_cake BOOLEAN DEFAULT false,
    cake_advance_days INTEGER DEFAULT 2,
    cake_sizes JSONB,
    cake_flavors JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Riders Table (Android Rider App)
CREATE TABLE IF NOT EXISTS public.riders (
    id TEXT PRIMARY KEY DEFAULT ('rdr_' || substr(md5(random()::text), 1, 8)),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    vehicle TEXT DEFAULT 'Motorbike',
    license_plate TEXT,
    is_active BOOLEAN DEFAULT true,
    is_online BOOLEAN DEFAULT false,
    current_lat NUMERIC(9,6) DEFAULT 22.2858,
    current_lng NUMERIC(9,6) DEFAULT 89.9614,
    total_deliveries INTEGER DEFAULT 0,
    total_earnings NUMERIC(10,2) DEFAULT 0.00,
    balance NUMERIC(10,2) DEFAULT 0.00,
    rating NUMERIC(2,1) DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Orders Table (Shared lifecycle across Customer, Restaurant, Rider, Admin)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- e.g. 'PF-84920'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'placed', 
    -- Progression: 'placed' -> 'accepted' -> 'preparing' -> 'ready_for_pickup' -> 'rider_picked_up' -> 'on_the_way' -> 'delivered' | 'cancelled'
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id),
    restaurant_name_en TEXT NOT NULL,
    restaurant_name_bn TEXT NOT NULL,
    restaurant_phone TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    customer_area TEXT NOT NULL,
    customer_instructions TEXT,
    customer_lat NUMERIC(9,6) DEFAULT 22.2858,
    customer_lng NUMERIC(9,6) DEFAULT 89.9614,
    items JSONB NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    delivery_fee NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cod', -- 'cod' | 'online'
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid'
    rider_id TEXT REFERENCES public.riders(id),
    rider_name TEXT,
    rider_phone TEXT,
    rider_vehicle TEXT,
    rider_fee NUMERIC(10,2) DEFAULT 35.00,
    commission_amount NUMERIC(10,2) DEFAULT 0.00,
    estimated_delivery_minutes INTEGER DEFAULT 30,
    status_history JSONB DEFAULT '[]'::jsonb,
    cancellation_reason TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Delivery Zones Table (Configurable via Admin Dashboard without code edit)
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    min_distance_km NUMERIC(4,1) NOT NULL,
    max_distance_km NUMERIC(4,1) NOT NULL,
    regular_fee NUMERIC(10,2) NOT NULL,
    cake_fee NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Coupons / Promo Codes Table (Configurable via Admin Dashboard)
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    description_en TEXT,
    description_bn TEXT,
    discount_type TEXT NOT NULL DEFAULT 'fixed', -- 'fixed' or 'percentage'
    discount_value NUMERIC(10,2) NOT NULL,
    min_order NUMERIC(10,2) DEFAULT 0.00,
    max_discount NUMERIC(10,2),
    is_active BOOLEAN DEFAULT true,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Promotional Banners Table (Configurable via Admin Dashboard)
CREATE TABLE IF NOT EXISTS public.banners (
    id TEXT PRIMARY KEY DEFAULT ('bnr_' || substr(md5(random()::text), 1, 8)),
    badge_en TEXT DEFAULT 'Mathbaria Local Food Delivery',
    badge_bn TEXT DEFAULT 'মঠবাড়িয়া স্পেশাল ডেলিভারি',
    title_en TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    subtitle_en TEXT,
    subtitle_bn TEXT,
    link TEXT NOT NULL DEFAULT '/foods',
    button_text_en TEXT DEFAULT 'Browse Foods',
    button_text_bn TEXT DEFAULT 'খাবার দেখুন',
    secondary_link TEXT DEFAULT '/cakes',
    secondary_text_en TEXT DEFAULT 'Order Cake',
    secondary_text_bn TEXT DEFAULT 'কেক অর্ডার',
    image_url TEXT,
    bg_gradient TEXT DEFAULT 'from-[#FF6B1A] via-[#E85B0D] to-[#9E3905]',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default Delivery Zones for Mathbaria
INSERT INTO public.delivery_zones (id, name_en, name_bn, min_distance_km, max_distance_km, regular_fee, cake_fee, is_active)
VALUES
  ('zone_0_2', 'Mathbaria Town Core (0-2 km)', 'মঠবাড়িয়া পৌর এলাকা (০-২ কিমি)', 0.0, 2.0, 40.00, 100.00, true),
  ('zone_2_3', 'Extended Town (2-3 km)', 'পৌর সীমানা সংলগ্ন (২-৩ কিমি)', 2.0, 3.0, 60.00, 100.00, true),
  ('zone_3_8', 'Suburbs & Union Cakes (3-8 km)', 'উপশহর ও ইউনিয়ন কেক ডেলিভারি (৩-৮ কিমি)', 3.0, 8.0, 150.00, 150.00, true)
ON CONFLICT (id) DO UPDATE SET
  regular_fee = EXCLUDED.regular_fee,
  cake_fee = EXCLUDED.cake_fee;

-- Default App Settings
INSERT INTO public.app_settings (key, value, description)
VALUES 
  ('delivery_rates', '{"regular_0_2": 40, "regular_2_3": 60, "cake_0_3": 100, "cake_3_8": 150}'::jsonb, 'Delivery fees by zone in BDT'),
  ('platform_status', '{"is_accepting_orders": true, "notice_en": "", "notice_bn": ""}'::jsonb, 'Global store status and maintenance notice'),
  ('rider_commission', '{"base_delivery_fee_cut": 35, "surge_bonus": 0}'::jsonb, 'Rider payment rules per order')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Default Welcome Coupon
INSERT INTO public.coupons (code, description_en, description_bn, discount_type, discount_value, min_order, is_active)
VALUES
  ('PENGU50', 'Get 50 BDT off on your first order', 'প্রথম অর্ডারে ৫০ টাকা ছাড়', 'fixed', 50.00, 250.00, true),
  ('MATHBARIA', '10% discount on local orders', '১০% স্পেশাল ডিসকাউন্ট', 'percentage', 10.00, 200.00, true)
ON CONFLICT (code) DO NOTHING;

-- Seed Categories
INSERT INTO public.categories (id, slug, name_en, name_bn, image_url, display_order)
VALUES
  ('cat_biryani', 'biryani', 'Biryani & Polao', 'বিরিয়ানি ও পোলাও', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', 1),
  ('cat_rice', 'rice-meals', 'Rice & Curries', 'ভাত ও তরকারি', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 2),
  ('cat_fastfood', 'fast-food', 'Burgers & Fast Food', 'বার্গার ও ফাস্টফুড', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', 3),
  ('cat_snacks', 'snacks', 'Evening Snacks', 'সান্ধ্যকালীন নাশতা', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', 4),
  ('cat_cakes', 'cakes', 'Homemade Cakes', 'হোমমেড কেক', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80', 5)
ON CONFLICT (slug) DO NOTHING;

-- 12. Realtime Publication for Live Synchronization
DO $$
BEGIN
  -- orders realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  -- riders realtime (live location tracking)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'riders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.riders;
  END IF;

  -- products realtime (availability updates)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END $$;

-- 13. Row Level Security (RLS) Configuration
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Select policies
DROP POLICY IF EXISTS "Public can read restaurants" ON public.restaurants;
CREATE POLICY "Public can read restaurants" ON public.restaurants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read products" ON public.products;
CREATE POLICY "Public can read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read active delivery zones" ON public.delivery_zones;
CREATE POLICY "Public can read active delivery zones" ON public.delivery_zones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read active coupons" ON public.coupons;
CREATE POLICY "Public can read active coupons" ON public.coupons FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can read banners" ON public.banners;
CREATE POLICY "Public can read banners" ON public.banners FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can read settings" ON public.app_settings;
CREATE POLICY "Public can read settings" ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read active riders" ON public.riders;
CREATE POLICY "Public can read active riders" ON public.riders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read orders" ON public.orders;
CREATE POLICY "Public can read orders" ON public.orders FOR SELECT USING (true);

-- Order placement & updates
DROP POLICY IF EXISTS "Public can place orders" ON public.orders;
CREATE POLICY "Public can place orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Restaurants and riders can update orders" ON public.orders;
CREATE POLICY "Restaurants and riders can update orders" ON public.orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Riders can update their status" ON public.riders;
CREATE POLICY "Riders can update their status" ON public.riders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Restaurants can update products" ON public.products;
CREATE POLICY "Restaurants can update products" ON public.products FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full control on settings" ON public.app_settings;
CREATE POLICY "Admin full control on settings" ON public.app_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full control on delivery zones" ON public.delivery_zones;
CREATE POLICY "Admin full control on delivery zones" ON public.delivery_zones FOR ALL USING (true);

-- 14. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_restaurant ON public.products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_rider ON public.orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_riders_online ON public.riders(is_online, is_active);
