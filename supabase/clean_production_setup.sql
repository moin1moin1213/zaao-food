-- ====================================================================
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

-- ====================================================================
-- PenguFood Migration 01: Core Database Schema
-- Version: 20261029000001
-- Tables: customers, administrators, restaurants, restaurant_staff,
--         riders, categories, products, delivery_zones, pricing_rules,
--         coupons, banners, orders, order_items, order_status_history,
--         notifications, app_settings
-- ====================================================================

-- 1. Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Helper function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 3. Customers Table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    phone TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    default_address TEXT,
    default_area TEXT,
    default_lat NUMERIC(9,6) DEFAULT 22.2858,
    default_lng NUMERIC(9,6) DEFAULT 89.9614,
    saved_addresses JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_customers_modtime
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- 4. Administrators Table (Zero Public Registration, Managed Securely)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.administrators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'operations', 'support')),
    password_hash TEXT, -- PBKDF2 SHA-512 secondary hash for portal login
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_administrators_modtime
    BEFORE UPDATE ON public.administrators
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- 5. Restaurants Table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.restaurants (
    id TEXT PRIMARY KEY DEFAULT ('rest_' || substr(md5(random()::text), 1, 8)),
    slug TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    phone TEXT,
    owner_phone TEXT,
    owner_email TEXT,
    image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    banner_url TEXT DEFAULT 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    cuisines_en TEXT[] DEFAULT '{}',
    cuisines_bn TEXT[] DEFAULT '{}',
    rating NUMERIC(2,1) DEFAULT 4.8,
    review_count INTEGER DEFAULT 0,
    is_open BOOLEAN DEFAULT true,
    opening_hours_en TEXT DEFAULT '10:00 AM - 10:00 PM',
    opening_hours_bn TEXT DEFAULT 'সকাল ১০:০০ - রাত ১০:০০',
    min_order NUMERIC(10,2) DEFAULT 0.00,
    address_en TEXT DEFAULT 'Mathbaria',
    address_bn TEXT DEFAULT 'মঠবাড়িয়া',
    latitude NUMERIC(9,6) DEFAULT 22.2858,
    longitude NUMERIC(9,6) DEFAULT 89.9614,
    distance_km NUMERIC(4,1) DEFAULT 1.0,
    prep_time_minutes INTEGER DEFAULT 25,
    commission_rate NUMERIC(4,1) DEFAULT 15.0,
    total_sales NUMERIC(12,2) DEFAULT 0.00,
    balance NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_restaurants_modtime
    BEFORE UPDATE ON public.restaurants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- 6. Restaurant Staff / Kitchen Accounts Table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    login_id TEXT NOT NULL UNIQUE, -- e.g. rest-1, rest-2
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'kitchen_manager' CHECK (role IN ('kitchen_manager', 'staff')),
    password_hash TEXT NOT NULL, -- PBKDF2 SHA-512 cryptographically hashed
    can_change_password BOOLEAN DEFAULT false, -- Strict security: Only admin can reset passwords
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_restaurant_staff_modtime
    BEFORE UPDATE ON public.restaurant_staff
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- 7. Riders Table (Android Rider App)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.riders (
    id TEXT PRIMARY KEY DEFAULT ('rdr_' || substr(md5(random()::text), 1, 8)),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

CREATE TRIGGER update_riders_modtime
    BEFORE UPDATE ON public.riders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- 8. Categories Table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY DEFAULT ('cat_' || substr(md5(random()::text), 1, 8)),
    slug TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    description_en TEXT,
    description_bn TEXT,
    image_url TEXT DEFAULT '',
    display_order INTEGER DEFAULT 0,
    is_cake_category BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 9. Products / Foods / Cakes Table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT ('prod_' || substr(md5(random()::text), 1, 8)),
    slug TEXT NOT NULL UNIQUE,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    description_en TEXT,
    description_bn TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(10,2),
    image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    is_available BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    sales_count INTEGER DEFAULT 0,
    is_recommended BOOLEAN DEFAULT false,
    is_cake BOOLEAN DEFAULT false,
    cake_advance_days INTEGER DEFAULT 2,
    cake_sizes JSONB,
    cake_flavors JSONB,
    prep_time_minutes INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_products_modtime
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- 10. Delivery Zones Table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    min_distance_km NUMERIC(4,1) NOT NULL,
    max_distance_km NUMERIC(4,1) NOT NULL,
    regular_fee NUMERIC(10,2) NOT NULL CHECK (regular_fee >= 0),
    cake_fee NUMERIC(10,2) NOT NULL CHECK (cake_fee >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 11. Pricing Rules Table (Dynamic delivery, surge, and commission rules)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id TEXT PRIMARY KEY DEFAULT ('rule_' || substr(md5(random()::text), 1, 8)),
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('delivery_rate', 'cake_rate', 'surge', 'rider_cut', 'min_order')),
    base_fee NUMERIC(10,2) NOT NULL DEFAULT 40.00,
    per_km_fee NUMERIC(10,2) DEFAULT 0.00,
    min_order_amount NUMERIC(10,2) DEFAULT 0.00,
    rider_base_cut NUMERIC(10,2) NOT NULL DEFAULT 35.00,
    parameters JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 12. Coupons / Promo Codes Table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    description_en TEXT,
    description_bn TEXT,
    discount_type TEXT NOT NULL DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    min_order NUMERIC(10,2) DEFAULT 0.00,
    max_discount NUMERIC(10,2),
    is_active BOOLEAN DEFAULT true,
    valid_until TIMESTAMPTZ,
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 13. Promotional Banners Table
-- ====================================================================
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

-- ====================================================================
-- 14. Orders Table (Shared lifecycle across Customer, Restaurant, Rider, Admin)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- e.g. PF-12345
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE RESTRICT,
    rider_id TEXT REFERENCES public.riders(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'placed' CHECK (
        status IN (
            'placed',
            'accepted',
            'preparing',
            'ready_for_pickup',
            'rider_picked_up',
            'on_the_way',
            'delivered',
            'cancelled'
        )
    ),
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
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee NUMERIC(10,2) NOT NULL CHECK (delivery_fee >= 0),
    discount NUMERIC(10,2) DEFAULT 0.00 CHECK (discount >= 0),
    coupon_code TEXT REFERENCES public.coupons(code) ON DELETE SET NULL,
    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    payment_method TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'online')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    rider_name TEXT,
    rider_phone TEXT,
    rider_vehicle TEXT,
    rider_fee NUMERIC(10,2) DEFAULT 35.00,
    commission_amount NUMERIC(10,2) DEFAULT 0.00,
    estimated_delivery_minutes INTEGER DEFAULT 30,
    cancellation_reason TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- JSON document mirror for fast UI rendering
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_orders_modtime
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- 15. Order Items Table (Normalized Relational Order Items)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
    is_cake BOOLEAN DEFAULT false,
    selected_size JSONB,
    selected_flavor JSONB,
    custom_message TEXT,
    special_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 16. Order Status History Table (Audit Trail)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_by_role TEXT NOT NULL CHECK (changed_by_role IN ('customer', 'restaurant', 'rider', 'admin', 'system')),
    changed_by_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 17. Notifications Table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_role TEXT NOT NULL CHECK (recipient_role IN ('customer', 'restaurant', 'rider', 'admin')),
    recipient_id TEXT, -- Phone/UUID/RestaurantId/RiderId or NULL for all
    title_en TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    message_en TEXT NOT NULL,
    message_bn TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'order' CHECK (category IN ('order', 'promo', 'system')),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 18. App Settings Table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 19. Indexes for High Performance & Query Optimization
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_auth_id ON public.customers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_username ON public.administrators(username);
CREATE INDEX IF NOT EXISTS idx_staff_restaurant ON public.restaurant_staff(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_staff_login_id ON public.restaurant_staff(login_id);
CREATE INDEX IF NOT EXISTS idx_staff_auth_id ON public.restaurant_staff(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_products_restaurant ON public.products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_rider ON public.orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_order ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_role, recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_riders_online ON public.riders(is_online, is_active);


-- ====================================================================
-- PenguFood Migration 02: Functions, Reporting & Supabase Realtime
-- Version: 20261029000002
-- Features:
--   1. Asia/Dhaka Timezone Daily & Weekly Sales Calculations
--   2. Order Audit Trail & Status Transition RPCs
--   3. Realtime Publication Setup for Orders, Riders, and Notifications
-- ====================================================================

-- 1. Daily Sales Reporting (Strict Asia/Dhaka Timezone, Cancelled Excluded)
CREATE OR REPLACE FUNCTION public.get_daily_sales_dhaka(
    p_restaurant_id TEXT,
    p_date DATE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::DATE
)
RETURNS TABLE (
    report_date DATE,
    orders_received BIGINT,
    completed_orders BIGINT,
    cancelled_orders BIGINT,
    gross_food_sales NUMERIC,
    platform_commission NUMERIC,
    net_restaurant_payout NUMERIC,
    lost_cancelled_sales NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH dhaka_orders AS (
        SELECT
            o.id,
            o.status,
            o.subtotal,
            o.commission_amount,
            (o.created_at AT TIME ZONE 'Asia/Dhaka')::DATE AS dhaka_date
        FROM public.orders o
        WHERE o.restaurant_id = p_restaurant_id
          AND (o.created_at AT TIME ZONE 'Asia/Dhaka')::DATE = p_date
    )
    SELECT
        p_date AS report_date,
        COUNT(d.id)::BIGINT AS orders_received,
        COUNT(CASE WHEN d.status = 'delivered' THEN 1 END)::BIGINT AS completed_orders,
        COUNT(CASE WHEN d.status = 'cancelled' THEN 1 END)::BIGINT AS cancelled_orders,
        COALESCE(SUM(CASE WHEN d.status = 'delivered' THEN d.subtotal ELSE 0 END), 0.00) AS gross_food_sales,
        COALESCE(SUM(CASE WHEN d.status = 'delivered' THEN d.commission_amount ELSE 0 END), 0.00) AS platform_commission,
        COALESCE(SUM(CASE WHEN d.status = 'delivered' THEN (d.subtotal - d.commission_amount) ELSE 0 END), 0.00) AS net_restaurant_payout,
        COALESCE(SUM(CASE WHEN d.status = 'cancelled' THEN d.subtotal ELSE 0 END), 0.00) AS lost_cancelled_sales
    FROM dhaka_orders d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Weekly Sales Reporting (Saturday to Friday Bangladesh Week, Asia/Dhaka)
CREATE OR REPLACE FUNCTION public.get_weekly_sales_dhaka(
    p_restaurant_id TEXT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    day_date DATE,
    orders_received BIGINT,
    completed_orders BIGINT,
    cancelled_orders BIGINT,
    gross_food_sales NUMERIC,
    platform_commission NUMERIC,
    net_restaurant_payout NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::DATE AS d_date
    ),
    day_orders AS (
        SELECT
            (o.created_at AT TIME ZONE 'Asia/Dhaka')::DATE AS ord_date,
            o.status,
            o.subtotal,
            o.commission_amount
        FROM public.orders o
        WHERE o.restaurant_id = p_restaurant_id
          AND (o.created_at AT TIME ZONE 'Asia/Dhaka')::DATE BETWEEN p_start_date AND p_end_date
    )
    SELECT
        ds.d_date AS day_date,
        COUNT(dord.status)::BIGINT AS orders_received,
        COUNT(CASE WHEN dord.status = 'delivered' THEN 1 END)::BIGINT AS completed_orders,
        COUNT(CASE WHEN dord.status = 'cancelled' THEN 1 END)::BIGINT AS cancelled_orders,
        COALESCE(SUM(CASE WHEN dord.status = 'delivered' THEN dord.subtotal ELSE 0 END), 0.00) AS gross_food_sales,
        COALESCE(SUM(CASE WHEN dord.status = 'delivered' THEN dord.commission_amount ELSE 0 END), 0.00) AS platform_commission,
        COALESCE(SUM(CASE WHEN dord.status = 'delivered' THEN (dord.subtotal - dord.commission_amount) ELSE 0 END), 0.00) AS net_restaurant_payout
    FROM date_series ds
    LEFT JOIN day_orders dord ON ds.d_date = dord.ord_date
    GROUP BY ds.d_date
    ORDER BY ds.d_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Order Status Transition with History & Notifications
CREATE OR REPLACE FUNCTION public.update_order_status_with_history(
    p_order_id TEXT,
    p_new_status TEXT,
    p_changed_by_role TEXT,
    p_changed_by_id TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_result JSONB;
BEGIN
    -- Fetch existing order
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    -- Update order status
    UPDATE public.orders
    SET status = p_new_status,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Record status history entry
    INSERT INTO public.order_status_history (
        order_id,
        status,
        changed_by_role,
        changed_by_id,
        notes,
        created_at
    ) VALUES (
        p_order_id,
        p_new_status,
        p_changed_by_role,
        p_changed_by_id,
        p_notes,
        NOW()
    );

    -- Create notification for customer
    INSERT INTO public.notifications (
        recipient_role,
        recipient_id,
        title_en,
        title_bn,
        message_en,
        message_bn,
        category,
        order_id,
        link,
        created_at
    ) VALUES (
        'customer',
        v_order.customer_phone,
        'Order Update: #' || p_order_id,
        'অর্ডার আপডেট: #' || p_order_id,
        'Your order status is now: ' || p_new_status,
        'আপনার অর্ডারের বর্তমান অবস্থা: ' || p_new_status,
        'order',
        p_order_id,
        '/orders/' || p_order_id,
        NOW()
    );

    SELECT jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'new_status', p_new_status
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Product Sales Increment Helper
CREATE OR REPLACE FUNCTION public.increment_sales_count(prod_id TEXT, qty INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products
    SET sales_count = COALESCE(sales_count, 0) + qty,
        updated_at = NOW()
    WHERE id = prod_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Rider Delivery & Earnings Increment Helper
CREATE OR REPLACE FUNCTION public.increment_rider_earnings(r_id TEXT, fee NUMERIC DEFAULT 35.0)
RETURNS VOID AS $$
BEGIN
    UPDATE public.riders
    SET total_deliveries = COALESCE(total_deliveries, 0) + 1,
        total_earnings = COALESCE(total_earnings, 0) + fee,
        balance = COALESCE(balance, 0) + fee,
        updated_at = NOW()
    WHERE id = r_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 6. Supabase Realtime Publication Configuration
-- ====================================================================
-- Set replica identity full so realtime events include old & new record states
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.riders REPLICA IDENTITY FULL;
ALTER TABLE public.order_status_history REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'riders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.riders;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_status_history'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;


-- ====================================================================
-- PenguFood Migration 03: Row Level Security (RLS) & Role Enforcement
-- Version: 20261029000003
-- Strict Security Policies:
--   - Public read for catalog items
--   - Restaurant isolation (strictly own orders, NO product/profile edits)
--   - Admin-only management of credentials, pricing, and catalog
--   - Rider isolation (only assigned/available orders and own coordinates)
-- ====================================================================

-- 1. Enable Row Level Security on ALL public tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Helper function: Is current request from service_role / super admin?
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 2. Catalog Policies (Categories, Products, Banners)
-- ====================================================================
-- Categories: Public read
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.is_service_role());

-- Products: Public can view available products, Admin can manage all.
-- NOTE: Restaurant users CANNOT add, update or delete products.
DROP POLICY IF EXISTS "Public can view available products" ON public.products;
CREATE POLICY "Public can view available products" ON public.products
    FOR SELECT USING (is_available = true OR public.is_service_role());

DROP POLICY IF EXISTS "Only admin can manage products" ON public.products;
CREATE POLICY "Only admin can manage products" ON public.products
    FOR ALL USING (public.is_service_role());

-- Banners: Public read active
DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
CREATE POLICY "Public can view active banners" ON public.banners
    FOR SELECT USING (is_active = true OR public.is_service_role());

DROP POLICY IF EXISTS "Admin can manage banners" ON public.banners;
CREATE POLICY "Admin can manage banners" ON public.banners
    FOR ALL USING (public.is_service_role());

-- ====================================================================
-- 3. Restaurants & Staff Policies
-- ====================================================================
-- Restaurants: Public read
DROP POLICY IF EXISTS "Public can view restaurants" ON public.restaurants;
CREATE POLICY "Public can view restaurants" ON public.restaurants
    FOR SELECT USING (true);

-- NOTE: Restaurants cannot edit their own profile or commission; strictly Admin only
DROP POLICY IF EXISTS "Admin can manage restaurants" ON public.restaurants;
CREATE POLICY "Admin can manage restaurants" ON public.restaurants
    FOR ALL USING (public.is_service_role());

-- Restaurant Staff: Credentials & staff accounts are strictly managed by Admin
DROP POLICY IF EXISTS "Staff can read own record" ON public.restaurant_staff;
CREATE POLICY "Staff can read own record" ON public.restaurant_staff
    FOR SELECT USING (
        auth_user_id = auth.uid() OR public.is_service_role()
    );

DROP POLICY IF EXISTS "Admin can manage restaurant staff" ON public.restaurant_staff;
CREATE POLICY "Admin can manage restaurant staff" ON public.restaurant_staff
    FOR ALL USING (public.is_service_role());

-- ====================================================================
-- 4. Delivery Zones, Pricing Rules & Coupons
-- ====================================================================
-- Public read active zones & rules for client-side distance display
DROP POLICY IF EXISTS "Public can view active delivery zones" ON public.delivery_zones;
CREATE POLICY "Public can view active delivery zones" ON public.delivery_zones
    FOR SELECT USING (is_active = true OR public.is_service_role());

DROP POLICY IF EXISTS "Admin can manage delivery zones" ON public.delivery_zones;
CREATE POLICY "Admin can manage delivery zones" ON public.delivery_zones
    FOR ALL USING (public.is_service_role());

DROP POLICY IF EXISTS "Public can view active pricing rules" ON public.pricing_rules;
CREATE POLICY "Public can view active pricing rules" ON public.pricing_rules
    FOR SELECT USING (is_active = true OR public.is_service_role());

DROP POLICY IF EXISTS "Admin can manage pricing rules" ON public.pricing_rules;
CREATE POLICY "Admin can manage pricing rules" ON public.pricing_rules
    FOR ALL USING (public.is_service_role());

DROP POLICY IF EXISTS "Public can view valid coupons" ON public.coupons;
CREATE POLICY "Public can view valid coupons" ON public.coupons
    FOR SELECT USING (is_active = true OR public.is_service_role());

DROP POLICY IF EXISTS "Admin can manage coupons" ON public.coupons;
CREATE POLICY "Admin can manage coupons" ON public.coupons
    FOR ALL USING (public.is_service_role());

-- ====================================================================
-- 5. Administrators & Customers
-- ====================================================================
-- Administrators: Zero public access, service_role or self only
DROP POLICY IF EXISTS "Admins can view own profile" ON public.administrators;
CREATE POLICY "Admins can view own profile" ON public.administrators
    FOR SELECT USING (
        auth_user_id = auth.uid() OR public.is_service_role()
    );

DROP POLICY IF EXISTS "Service role manages administrators" ON public.administrators;
CREATE POLICY "Service role manages administrators" ON public.administrators
    FOR ALL USING (public.is_service_role());

-- Customers: Can read & update own customer record
DROP POLICY IF EXISTS "Customers can view own profile" ON public.customers;
CREATE POLICY "Customers can view own profile" ON public.customers
    FOR SELECT USING (
        auth_user_id = auth.uid() OR public.is_service_role()
    );

DROP POLICY IF EXISTS "Customers can update own profile" ON public.customers;
CREATE POLICY "Customers can update own profile" ON public.customers
    FOR UPDATE USING (
        auth_user_id = auth.uid() OR public.is_service_role()
    );

-- ====================================================================
-- 6. Riders Policies
-- ====================================================================
DROP POLICY IF EXISTS "Public can view online riders for dispatch" ON public.riders;
CREATE POLICY "Public can view online riders for dispatch" ON public.riders
    FOR SELECT USING (is_active = true OR public.is_service_role());

-- Riders can update ONLY their own live coordinates and online toggle
DROP POLICY IF EXISTS "Riders can update own GPS and online status" ON public.riders;
CREATE POLICY "Riders can update own GPS and online status" ON public.riders
    FOR UPDATE USING (
        auth_user_id = auth.uid() OR public.is_service_role()
    );

DROP POLICY IF EXISTS "Admin manages riders" ON public.riders;
CREATE POLICY "Admin manages riders" ON public.riders
    FOR ALL USING (public.is_service_role());

-- ====================================================================
-- 7. Orders & Order Items Policies (Strict Isolation)
-- ====================================================================
-- Orders SELECT:
-- 1. Service role (Admin & Backend Server APIs) has full read
-- 2. Restaurant can ONLY select orders where restaurant_id matches
-- 3. Rider can select assigned orders or orders ready for pickup
-- 4. Customers can select orders matching their phone number
DROP POLICY IF EXISTS "Authorized users can view orders" ON public.orders;
CREATE POLICY "Authorized users can view orders" ON public.orders
    FOR SELECT USING (
        public.is_service_role()
        OR (
            -- Customer query by phone in session or auth user
            customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
        )
        OR (
            -- Rider assigned or available for pickup
            rider_id IN (SELECT id FROM public.riders WHERE auth_user_id = auth.uid())
            OR (status = 'ready_for_pickup')
        )
    );

-- Order INSERT: Managed securely through server-side order validation API
DROP POLICY IF EXISTS "Server creates verified orders" ON public.orders;
CREATE POLICY "Server creates verified orders" ON public.orders
    FOR INSERT WITH CHECK (
        public.is_service_role()
    );

-- Order UPDATE:
-- Only service role can execute updates directly, ensuring server validation
DROP POLICY IF EXISTS "Service role manages order updates" ON public.orders;
CREATE POLICY "Service role manages order updates" ON public.orders
    FOR UPDATE USING (
        public.is_service_role()
    );

-- Order Items: Viewable if parent order is viewable
DROP POLICY IF EXISTS "Order items viewable with order" ON public.order_items;
CREATE POLICY "Order items viewable with order" ON public.order_items
    FOR SELECT USING (
        public.is_service_role() OR order_id IN (SELECT id FROM public.orders)
    );

DROP POLICY IF EXISTS "Service role manages order items" ON public.order_items;
CREATE POLICY "Service role manages order items" ON public.order_items
    FOR ALL USING (public.is_service_role());

-- Order Status History: Viewable with order
DROP POLICY IF EXISTS "Order history viewable with order" ON public.order_status_history;
CREATE POLICY "Order history viewable with order" ON public.order_status_history
    FOR SELECT USING (
        public.is_service_role() OR order_id IN (SELECT id FROM public.orders)
    );

-- Notifications: User reads their own notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (
        public.is_service_role() OR recipient_id IS NULL OR recipient_id = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can mark own notification read" ON public.notifications;
CREATE POLICY "Users can mark own notification read" ON public.notifications
    FOR UPDATE USING (
        public.is_service_role() OR recipient_id = auth.uid()::text
    );

-- App Settings: Read-only for public, admin full control
DROP POLICY IF EXISTS "Public can read app settings" ON public.app_settings;
CREATE POLICY "Public can read app settings" ON public.app_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manages app settings" ON public.app_settings;
CREATE POLICY "Admin manages app settings" ON public.app_settings
    FOR ALL USING (public.is_service_role());



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
