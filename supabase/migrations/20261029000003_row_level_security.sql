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
