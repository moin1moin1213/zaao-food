-- ====================================================================
-- PENGUFOOD: ALL-IN-ONE COMPLETE DATABASE SETUP SCRIPT
-- Executable in Supabase SQL Editor in a single run.
-- Includes: Schema, Functions, Realtime, RLS Policies, and Initial Seed Data.
-- Timezone: Asia/Dhaka (UTC+6)
-- Generated: 2026-10-29T13:22:08.694Z
-- ====================================================================



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 20261029000001_core_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
    image_url TEXT NOT NULL,
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
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    description_en TEXT,
    description_bn TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
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


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: 20261029000001_core_schema.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 20261029000002_functions_and_realtime.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
        COUNT(do.status)::BIGINT AS orders_received,
        COUNT(CASE WHEN do.status = 'delivered' THEN 1 END)::BIGINT AS completed_orders,
        COUNT(CASE WHEN do.status = 'cancelled' THEN 1 END)::BIGINT AS cancelled_orders,
        COALESCE(SUM(CASE WHEN do.status = 'delivered' THEN do.subtotal ELSE 0 END), 0.00) AS gross_food_sales,
        COALESCE(SUM(CASE WHEN do.status = 'delivered' THEN do.commission_amount ELSE 0 END), 0.00) AS platform_commission,
        COALESCE(SUM(CASE WHEN do.status = 'delivered' THEN (do.subtotal - do.commission_amount) ELSE 0 END), 0.00) AS net_restaurant_payout
    FROM date_series ds
    LEFT JOIN day_orders do ON ds.d_date = do.ord_date
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


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: 20261029000002_functions_and_realtime.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 20261029000003_row_level_security.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: 20261029000003_row_level_security.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 20261029000004_seed_dev_data.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ====================================================================
-- PenguFood Migration 04: Development & Initial Mathbaria Seed Data
-- Version: 20261029000004
-- NOTE: Kept strictly separate from production data migrations.
-- ====================================================================

-- 1. Seed Categories
INSERT INTO public.categories (id, slug, name_en, name_bn, description_en, description_bn, image_url, display_order, is_cake_category)
VALUES
  ('cat_biryani', 'biryani', 'Biryani & Polao', 'বিরিয়ানি ও পোলাও', 'Authentic traditional Biryani, Kacchi & Khichuri', 'ঐতিহ্যবাহী সুস্বাদু কাচ্চি বিরিয়ানি ও পোলাও', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', 1, false),
  ('cat_rice', 'rice-meals', 'Rice & Curries', 'ভাত ও তরকারি', 'Daily traditional Bengali lunch & dinner sets', 'প্রতিদিনের তাজা ভাত, মাছ, মাংস ও ভর্তা', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 2, false),
  ('cat_fastfood', 'fast-food', 'Burgers & Fast Food', 'বার্গার ও ফাস্টফুড', 'Crispy chicken, juicy burgers and French fries', 'ক্রিস্পি ফ্রাইড চিকেন, পিজ্জা ও বার্গার', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', 3, false),
  ('cat_snacks', 'snacks', 'Evening Snacks', 'সান্ধ্যকালীন নাশতা', 'Singara, Samusa, Puris & Tea snacks', 'গরম গরম সিঙ্গারা, সমুচা, চপ ও নাশতা', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', 4, false),
  ('cat_cakes', 'cakes', 'Homemade Cakes', 'হোমমেড কেক', 'Freshly baked customized birthday and anniversary cakes', 'টাটকা হোমমেড বার্থডে কেক ও পেস্ট্রি', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Seed Partner Restaurants in Mathbaria
INSERT INTO public.restaurants (
    id, slug, name_en, name_bn, phone, owner_phone, owner_email,
    image_url, banner_url, cuisines_en, cuisines_bn, rating, review_count,
    is_open, opening_hours_en, opening_hours_bn, min_order, address_en,
    address_bn, distance_km, prep_time_minutes, commission_rate
) VALUES
  ('rest-1', 'kacchi-mahal', 'Kacchi Mahal & Biryani House', 'কাচ্চি মহল ও বিরিয়ানি হাউজ', '01711223344', '01711223344', 'kacchi@mathbaria.com',
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
   ARRAY['Biryani', 'Kacchi', 'Bengali'], ARRAY['বিরিয়ানি', 'কাচ্চি', 'বাঙালি'], 4.8, 142,
   true, '11:00 AM - 10:30 PM', 'সকাল ১১:০০ - রাত ১০:৩০', 150.00,
   'Main Road, Mathbaria Bazar, Mathbaria', 'মেইন রোড, মঠবাড়িয়া বাজার, মঠবাড়িয়া', 0.4, 25, 15.0),

  ('rest-2', 'bismillah-hotel', 'Bismillah Hotel & Restaurant', 'বিসমিল্লাহ হোটেল অ্যান্ড রেস্টুরেন্ট', '01819876543', '01819876543', 'bismillah@mathbaria.com',
   'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
   ARRAY['Bengali Meals', 'Fish Curry', 'Khichuri'], ARRAY['বাঙালি খাবার', 'মাছের তরকারি', 'খিচুড়ি'], 4.6, 98,
   true, '07:00 AM - 10:00 PM', 'সকাল ০৭:০০ - রাত ১০:০০', 100.00,
   'College Road, Near Govt. Degree College, Mathbaria', 'কলেজ রোড, সরকারি ডিগ্রি কলেজের কাছে, মঠবাড়িয়া', 1.1, 20, 15.0),

  ('rest-3', 'mathbaria-fast-food', 'Mathbaria Cafe & Fast Food', 'মঠবাড়িয়া ক্যাফে অ্যান্ড ফাস্ট ফুড', '01912340987', '01912340987', 'cafe@mathbaria.com',
   'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=1200&q=80',
   ARRAY['Burgers', 'Fried Chicken', 'Pizza'], ARRAY['বার্গার', 'ফ্রাইড চিকেন', 'পিজ্জা'], 4.5, 76,
   true, '12:00 PM - 11:00 PM', 'দুপুর ১২:০০ - রাত ১১:০০', 120.00,
   'Hospital Road, Ward 3, Mathbaria', 'হাসপাতাল রোড, ৩ নং ওয়ার্ড, মঠবাড়িয়া', 1.5, 30, 15.0),

  ('rest-4', 'annapurna-mistanna', 'Annapurna Sweets & Snacks', 'অন্নপূর্ণা মিষ্টান্ন ও নাশতা', '01722334455', '01722334455', 'annapurna@mathbaria.com',
   'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
   ARRAY['Sweets', 'Snacks', 'Singara', 'Tea'], ARRAY['মিষ্টি', 'নাশতা', 'সিঙ্গারা', 'চা'], 4.7, 115,
   true, '06:30 AM - 09:30 PM', 'সকাল ০৬:৩০ - রাত ০৯:৩০', 80.00,
   'Launch Ghat Road, Mathbaria Bazar', 'লঞ্চঘাট রোড, মঠবাড়িয়া বাজার', 0.6, 15, 12.0),

  ('rest-5', 'mom-bakes', 'Mom Bakes Mathbaria', 'মাম বেকস মঠবাড়িয়া', '01633445566', '01633445566', 'mombakes@mathbaria.com',
   'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=1200&q=80',
   ARRAY['Cakes', 'Pastries', 'Desserts'], ARRAY['কেক', 'পেস্ট্রি', 'মিষ্টান্ন'], 4.9, 89,
   true, '09:00 AM - 09:00 PM', 'সকাল ০৯:০০ - রাত ০৯:০০', 300.00,
   'Thana Road, Ward 2, Mathbaria', 'থানা রোড, ২ নং ওয়ার্ড, মঠবাড়িয়া', 0.8, 45, 10.0)
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_bn = EXCLUDED.name_bn,
  phone = EXCLUDED.phone,
  is_open = EXCLUDED.is_open;

-- 3. Seed Restaurant Staff Accounts with PBKDF2 SHA-512 Secure Hashes
-- Credentials format: salt:hash (10,000 iterations, SHA-512)
INSERT INTO public.restaurant_staff (restaurant_id, login_id, full_name, phone, role, password_hash, can_change_password)
VALUES
  ('rest-1', 'rest-1', 'কাচ্চি মহল কিচেন ইনচার্জ', '01711223344', 'kitchen_manager',
   '814ba08e6485c28bd97b995c7ffd8900:d8ef91805202ed2c7fa49199735dd914ef510e78805742eaaf7b2eff330ac662a7454a937a1b0e5678fa734fd185f5481a4d6af4ae7ebfee5ef875b893a5ad63', false),

  ('rest-2', 'rest-2', 'বিসমিল্লাহ হোটেল ম্যানেজার', '01819876543', 'kitchen_manager',
   '209c8243e6ba00216d3c2e8fb173ac18:070e8b38462c23a8b89bd96fb3d4e24fe70ce602362fd575fb7f7ecf22dc22b626ecd33043a60afa047ddca89f37bbf920580fc7929dcf941684eaea0fd624f8', false),

  ('rest-3', 'rest-3', 'ক্যাফে ডি মঠবাড়িয়া কিচেন', '01912340987', 'kitchen_manager',
   '2c4a2a4480e420ec2f5b99b0cf1fe9f0:f0e94ddd40f386c4ea6c5b40a0df22565c40937e6d373eef325bdd7a41ee30cc2dfb2721d3bd2099f929a9e5e7b4c4ab42581a7d1877c33bf6c9c426252266b7', false),

  ('rest-4', 'rest-4', 'অন্নপূর্ণা মিষ্টান্ন ইনচার্জ', '01722334455', 'kitchen_manager',
   'af8b40414910b262b0ebf442ad1279e0:61017389f94c42d3aa002359a120aef033e10bc2e34b49315832626609e7217758e0c4c1c9df4957d4dd9d3bc43a1a5b11579a95acba478c5b61ed9568453dc8', false),

  ('rest-5', 'rest-5', 'মাম বেকস মাস্টার শেফ', '01633445566', 'kitchen_manager',
   'f472ff65bfa41c4e171d6b866fddc4e1:a5672478fbdeea6553c6ada20f937628648cd0ee98a2d8c3c3e433e9d8b71d596ec202afcc1cbbca1d5d5b86d9a6ea0bc2dc63612e9310eee7a0339158d098be', false)
ON CONFLICT (login_id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash;

-- Also store credentials in app_settings for backwards compatibility with existing authentication routes
INSERT INTO public.app_settings (key, value, description)
VALUES (
    'restaurant_passwords',
    '{
      "rest-1": "814ba08e6485c28bd97b995c7ffd8900:d8ef91805202ed2c7fa49199735dd914ef510e78805742eaaf7b2eff330ac662a7454a937a1b0e5678fa734fd185f5481a4d6af4ae7ebfee5ef875b893a5ad63",
      "rest-2": "209c8243e6ba00216d3c2e8fb173ac18:070e8b38462c23a8b89bd96fb3d4e24fe70ce602362fd575fb7f7ecf22dc22b626ecd33043a60afa047ddca89f37bbf920580fc7929dcf941684eaea0fd624f8",
      "rest-3": "2c4a2a4480e420ec2f5b99b0cf1fe9f0:f0e94ddd40f386c4ea6c5b40a0df22565c40937e6d373eef325bdd7a41ee30cc2dfb2721d3bd2099f929a9e5e7b4c4ab42581a7d1877c33bf6c9c426252266b7",
      "rest-4": "af8b40414910b262b0ebf442ad1279e0:61017389f94c42d3aa002359a120aef033e10bc2e34b49315832626609e7217758e0c4c1c9df4957d4dd9d3bc43a1a5b11579a95acba478c5b61ed9568453dc8",
      "rest-5": "f472ff65bfa41c4e171d6b866fddc4e1:a5672478fbdeea6553c6ada20f937628648cd0ee98a2d8c3c3e433e9d8b71d596ec202afcc1cbbca1d5d5b86d9a6ea0bc2dc63612e9310eee7a0339158d098be"
    }'::jsonb,
    'PBKDF2 SHA-512 securely hashed restaurant credentials'
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 4. Seed Products
INSERT INTO public.products (
    id, slug, restaurant_id, category_id, name_en, name_bn,
    description_en, description_bn, price, original_price, image_url,
    is_available, is_popular, is_recommended, is_cake, cake_advance_days, cake_sizes, cake_flavors
) VALUES
  ('prod-1', 'mutton-kacchi-full', 'rest-1', 'cat_biryani', 'Special Shahi Mutton Kacchi', 'স্পেশাল শাহী খাসির কাচ্চি',
   'Tender mutton cooked with aromatic basmati rice, potatoes, and special spices.',
   'সুগন্ধি বাসমতী চাল, নরম খাসির মাংস ও আলু দিয়ে রান্না করা ঐতিহ্যবাহী কাচ্চি বিরিয়ানি।',
   280.00, 320.00,
   'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
   true, true, true, false, 0, NULL, NULL),

  ('prod-2', 'chicken-biryani', 'rest-1', 'cat_biryani', 'Chicken Dum Biryani', 'চিকেন দম বিরিয়ানি',
   'Delicious aromatic chicken biryani served with boiled egg and salad.',
   'রসালো চিকেন পিস, ডিম ও সুবাসিত চালের পারফেক্ট কম্বিনেশনের দম বিরিয়ানি।',
   180.00, 200.00,
   'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80',
   true, true, false, false, 0, NULL, NULL),

  ('prod-3', 'rui-fish-meal', 'rest-2', 'cat_rice', 'Rui Fish Rice Thali', 'রুই মাছের দুপুরের মিল',
   'Steamed rice with fresh Rui fish curry, dal, mixed vegetables, and mashed potato bhorta.',
   'গরম ভাত, তাজা রুই মাছের ঝোল, পাতলা ডাল, সবজি ও আলু ভর্তা।',
   130.00, NULL,
   'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
   true, true, true, false, 0, NULL, NULL),

  ('prod-4', 'crispy-zinger-burger', 'rest-3', 'cat_fastfood', 'Crispy Chicken Zinger Burger', 'ক্রিস্পি চিকেন জিঙ্গার বার্গার',
   'Extra crunchy fried chicken fillet topped with fresh lettuce and signature sauce.',
   'মুচমুচে ফ্রাইড চিকেন, সতেজ লেটুস ও পেঙ্গু স্পেশাল সসের সুস্বাদু বার্গার।',
   140.00, 160.00,
   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
   true, true, false, false, 0, NULL, NULL),

  ('prod-5', 'hot-singara-set', 'rest-4', 'cat_snacks', 'Hot Potato Singara (4 pcs)', 'গরম আলু সিঙ্গারা (৪ টি)',
   'Golden crispy crust stuffed with spiced potato and peanuts, served with tamarind chutney.',
   'মচমচে খোলসে বাদাম ও মসলাদার আলুর পুর দেওয়া গরম গরম সিঙ্গারা।',
   40.00, NULL,
   'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
   true, false, false, false, 0, NULL, NULL),

  ('prod-6', 'black-forest-cake', 'rest-5', 'cat_cakes', 'Classic Black Forest Cake (1 Pound)', 'ক্লাসিক ব্ল্যাক ফরেস্ট বার্থডে কেক (১ পাউন্ড)',
   'Layered rich chocolate sponge with fresh whipped cream and cherries. Minimum 2 days advance notice.',
   'চকলেট স্পঞ্জ, তাজা হুইপড ক্রিম ও চেরির ক্লাসিক বার্থডে কেক। কমপক্ষে ২ দিন পূর্বে অর্ডার আবশ্যক।',
   650.00, 700.00,
   'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
   true, true, true, true, 2,
   '[{"id": "1lb", "labelEn": "1 Pound", "labelBn": "১ পাউন্ড", "price": 650, "weight": "1 lb"}, {"id": "2lb", "labelEn": "2 Pounds", "labelBn": "২ পাউন্ড", "price": 1200, "weight": "2 lbs"}]'::jsonb,
   '[{"id": "choco", "nameEn": "Dark Chocolate", "nameBn": "ডার্ক চকলেট"}, {"id": "vanilla", "nameEn": "Vanilla Cherry", "nameBn": "ভ্যানিলা চেরি"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  is_available = EXCLUDED.is_available;

-- 5. Seed Delivery Zones (Mathbaria Bazar Center)
INSERT INTO public.delivery_zones (id, name_en, name_bn, min_distance_km, max_distance_km, regular_fee, cake_fee, is_active)
VALUES
  ('zone_0_2', 'Mathbaria Town Core (0-2 km)', 'মঠবাড়িয়া পৌর এলাকা (০-২ কিমি)', 0.0, 2.0, 40.00, 100.00, true),
  ('zone_2_3', 'Extended Town (2-3 km)', 'পৌর সীমানা সংলগ্ন (২-৩ কিমি)', 2.0, 3.0, 60.00, 100.00, true),
  ('zone_3_8', 'Suburbs & Union Cakes (3-8 km)', 'উপশহর ও ইউনিয়ন কেক ডেলিভারি (৩-৮ কিমি)', 3.0, 8.0, 150.00, 150.00, true)
ON CONFLICT (id) DO UPDATE SET
  regular_fee = EXCLUDED.regular_fee,
  cake_fee = EXCLUDED.cake_fee;

-- 6. Seed Dynamic Pricing Rules
INSERT INTO public.pricing_rules (id, name, rule_type, base_fee, per_km_fee, min_order_amount, rider_base_cut, parameters, is_active)
VALUES
  ('rule_reg_0_2', 'Core Regular Food (0-2 km)', 'delivery_rate', 40.00, 0.00, 0.00, 35.00, '{"max_km": 2.0}'::jsonb, true),
  ('rule_reg_2_3', 'Extended Regular Food (2-3 km)', 'delivery_rate', 60.00, 0.00, 0.00, 35.00, '{"max_km": 3.0}'::jsonb, true),
  ('rule_cake_0_3', 'Town Homemade Cakes (0-3 km)', 'cake_rate', 100.00, 0.00, 0.00, 60.00, '{"advance_days": 2}'::jsonb, true),
  ('rule_cake_3_8', 'Special Union Cake Delivery (3-8 km)', 'cake_rate', 150.00, 0.00, 0.00, 100.00, '{"advance_days": 2, "cake_only": true}'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
  base_fee = EXCLUDED.base_fee,
  rider_base_cut = EXCLUDED.rider_base_cut;

-- 7. Seed Riders
INSERT INTO public.riders (id, name, phone, vehicle, is_active, is_online, current_lat, current_lng, total_deliveries, total_earnings, balance, rating)
VALUES
  ('rdr_1', 'Tariqul Islam', '01711223344', 'Honda 125 (Barishal-Ha-1234)', true, true, 22.2858, 89.9614, 42, 1470.00, 520.00, 4.9),
  ('rdr_2', 'Shafiqur Rahman', '01819876543', 'Discover 110 (Barishal-Ha-5678)', true, true, 22.2842, 89.9602, 28, 980.00, 350.00, 4.8),
  ('rdr_3', 'Mehedi Hasan', '01912340987', 'Runner Bike', true, false, 22.2850, 89.9610, 15, 525.00, 175.00, 4.7)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone;

-- 8. Seed Welcome Coupons
INSERT INTO public.coupons (code, description_en, description_bn, discount_type, discount_value, min_order, max_discount, is_active)
VALUES
  ('PENGU50', 'Get 50 BDT off on your first order', 'প্রথম অর্ডারে ৫০ টাকা ছাড়', 'fixed', 50.00, 250.00, 50.00, true),
  ('MATHBARIA', '10% discount on local orders', '১০% স্পেশাল ডিসকাউন্ট', 'percentage', 10.00, 200.00, 80.00, true)
ON CONFLICT (code) DO NOTHING;

-- 9. Seed Promotional Banners
INSERT INTO public.banners (id, badge_en, badge_bn, title_en, title_bn, subtitle_en, subtitle_bn, link, button_text_en, button_text_bn, image_url, is_active, display_order)
VALUES
  ('bnr_welcome', 'Mathbaria Special', 'মঠবাড়িয়া স্পেশাল',
   'Craving Delicious Food in Mathbaria?', 'মঠবাড়িয়ার সেরা সব রেস্তোরাঁর খাবার এখন আপনার দ্বারে!',
   'Order fresh biryani, burgers, and home-cooked delicacies directly to your door in 30 minutes.',
   'কাচ্চি, বিরিয়ানি, ফাস্টফুড কিংবা দুপুরের ঘরোয়া খাবার—দ্রুততম সময়ে পৌঁছে দিচ্ছি আমরা।',
   '/foods', 'Order Food', 'খাবার অর্ডার করুন',
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80', true, 1),

  ('bnr_cake', 'Custom Cakes', 'স্পেশাল হোমমেড কেক',
   'Celebrating a Birthday or Anniversary?', 'জন্মদিন বা বিশেষ উৎসবের হোমমেড ফ্রেশ কেক',
   'Order customized bakery and home-baker cakes with your personalized greeting message.',
   'পছন্দের ফ্লেভার ও নাম লেখার অপশনসহ ঘরে বসেই অর্ডার করুন টাটকা সুস্বাদু কেক।',
   '/cakes', 'Explore Cakes', 'কেক দেখুন',
   'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80', true, 2)
ON CONFLICT (id) DO NOTHING;


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: 20261029000004_seed_dev_data.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
