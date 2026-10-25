-- ====================================================================
-- PenguFood (Mathbaria) — Complete Supabase PostgreSQL Schema
-- ====================================================================
-- Copy and paste this entire script into your Supabase SQL Editor
-- (Dashboard > SQL Editor > New query) and click "Run".

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean Drop of Previous / Conflicting Tables
-- (Resolves error 42703 if a default starter template table already existed)
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;
DROP TABLE IF EXISTS public.banners CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;
DROP TABLE IF EXISTS public.riders CASCADE;

-- 3. Restaurants Table
CREATE TABLE public.restaurants (
    id TEXT PRIMARY KEY DEFAULT ('rest_' || substr(md5(random()::text), 1, 8)),
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    phone TEXT,
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
    distance_km NUMERIC(3,1) DEFAULT 1.0,
    prep_time_minutes INTEGER DEFAULT 25,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Categories Table
CREATE TABLE public.categories (
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
CREATE TABLE public.products (
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
    is_recommended BOOLEAN DEFAULT false,
    is_cake BOOLEAN DEFAULT false,
    cake_advance_days INTEGER DEFAULT 2,
    cake_sizes JSONB,
    cake_flavors JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Orders Table
CREATE TABLE public.orders (
    id TEXT PRIMARY KEY, -- e.g. 'PF-84920'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'placed', 
    -- Status progression: placed, accepted, preparing, ready_for_pickup, rider_picked_up, on_the_way, delivered, cancelled
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id),
    restaurant_name_en TEXT NOT NULL,
    restaurant_name_bn TEXT NOT NULL,
    restaurant_phone TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    customer_area TEXT NOT NULL,
    customer_instructions TEXT,
    customer_lat NUMERIC(9,6),
    customer_lng NUMERIC(9,6),
    items JSONB NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    delivery_fee NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cod', -- 'cod' | 'online'
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid'
    rider_name TEXT,
    rider_phone TEXT,
    rider_vehicle TEXT,
    estimated_delivery_minutes INTEGER DEFAULT 30,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Riders Table
CREATE TABLE public.riders (
    id TEXT PRIMARY KEY DEFAULT ('rdr_' || substr(md5(random()::text), 1, 8)),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    vehicle TEXT DEFAULT 'Motorbike',
    is_active BOOLEAN DEFAULT true,
    current_lat NUMERIC(9,6),
    current_lng NUMERIC(9,6),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Promotional Banners Table (Manageable from Admin Panel)
CREATE TABLE public.banners (
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

-- 9. App Settings & Delivery Config Table (Manageable from Admin Panel)
CREATE TABLE public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial seed for delivery fees and platform status
INSERT INTO public.app_settings (key, value, description)
VALUES 
  ('delivery_rates', '{"regular_0_2": 40, "regular_2_3": 60, "cake_0_3": 100, "cake_3_8": 150}'::jsonb, 'Delivery fees by zone in BDT'),
  ('platform_status', '{"is_accepting_orders": true, "notice_en": "", "notice_bn": ""}'::jsonb, 'Global store status and maintenance notice')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 10. Realtime Subscription for Live Order Tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- 11. Row Level Security (RLS) Configuration
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Public can read catalog, banners, settings
CREATE POLICY "Public can read restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public can read banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read settings" ON public.app_settings FOR SELECT USING (true);

-- Customers can insert orders & view orders
CREATE POLICY "Public can place orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers can view their orders" ON public.orders FOR SELECT USING (true);

-- 12. Indexes for High-Performance Queries
CREATE INDEX idx_products_restaurant ON public.products(restaurant_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- ====================================================================
-- Initial Seed Catalog (Mathbaria Initial Restaurants & Categories)
-- ====================================================================

-- Seed Categories
INSERT INTO public.categories (id, slug, name_en, name_bn, image_url, display_order)
VALUES
  ('cat_biryani', 'biryani', 'Biryani & Polao', 'বিরিয়ানি ও পোলাও', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', 1),
  ('cat_rice', 'rice-meals', 'Rice & Curries', 'ভাত ও তরকারি', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 2),
  ('cat_fastfood', 'fast-food', 'Burgers & Fast Food', 'বার্গার ও ফাস্টফুড', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', 3),
  ('cat_snacks', 'snacks', 'Evening Snacks', 'সান্ধ্যকালীন নাশতা', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', 4),
  ('cat_cakes', 'cakes', 'Homemade Cakes', 'হোমমেড কেক', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80', 5)
ON CONFLICT (slug) DO NOTHING;

-- Seed Restaurants
INSERT INTO public.restaurants (id, slug, name_en, name_bn, phone, image_url, banner_url, cuisines_en, cuisines_bn, rating, review_count, is_open, address_en, address_bn, distance_km, prep_time_minutes)
VALUES
  ('rest_1', 'kacchi-mahal', 'Kacchi Mahal & Biryani House', 'কাচ্চি মহল ও বিরিয়ানি হাউজ', '+880 1711-223344', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80', ARRAY['Kacchi', 'Tehari', 'Borhani'], ARRAY['কাচ্চি', 'তেহারি', 'বোরহানি'], 4.8, 128, true, 'Main Road, Mathbaria Bazar', 'মেইন রোড, মঠবাড়িয়া বাজার', 0.6, 25),
  ('rest_2', 'sultana-home-bake', 'Sultana''s Home Bake (Cake Specialist)', 'সুলতানাস হোম বেক (কেক স্পেশালিস্ট)', '+880 1722-334455', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=1200&q=80', ARRAY['Birthday Cakes', 'Pastry', 'Custom Fondant'], ARRAY['জন্মদিনের কেক', 'পেস্ট্রি', 'কাস্টম ফনডেন্ট'], 4.9, 94, true, 'Holding 14, Hospital Road, Mathbaria', 'হোল্ডিং ১৪, হাসপাতাল রোড, মঠবাড়িয়া', 1.4, 45)
ON CONFLICT (slug) DO NOTHING;

-- Seed Products
INSERT INTO public.products (id, slug, restaurant_id, category_id, name_en, name_bn, description_en, description_bn, price, original_price, image_url, is_available, is_popular, is_recommended, is_cake, cake_advance_days)
VALUES
  ('prod_1', 'shahi-mutton-kacchi', 'rest_1', 'cat_biryani', 'Special Shahi Mutton Kacchi Biryani', 'স্পেশাল শাহী খাসির কাচ্চি বিরিয়ানি', 'Aromatic basmati rice cooked with tender mutton chunks and rich spices.', 'সুগন্ধি বাসমতী চালে রান্না করা শাহী খাসির কাচ্চি বিরিয়ানি ও আলু বোখারা।', 320.00, 350.00, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', true, true, true, false, 0),
  ('prod_2', 'chocolate-truffle-cake', 'rest_2', 'cat_cakes', 'Rich Belgian Chocolate Truffle Cake', 'রিচ বেলজিয়ান চকলেট ট্রাফেল কেক', 'Layers of moist chocolate sponge with rich dark chocolate ganache.', 'প্রিমিয়াম ডার্ক চকলেটের সমৃদ্ধ হোমমেড কেক। জন্মদিন ও উৎসবের সেরা পছন্দ।', 650.00, 720.00, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80', true, true, true, true, 2)
ON CONFLICT (slug) DO NOTHING;
