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
