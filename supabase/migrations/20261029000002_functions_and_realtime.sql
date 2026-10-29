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
