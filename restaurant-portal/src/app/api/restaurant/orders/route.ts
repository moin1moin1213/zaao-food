import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("pengufood_restaurant_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized access: Session required" }, { status: 401 });
    }

    let session: { restaurantId: string };
    try {
      session = JSON.parse(sessionCookie);
    } catch {
      return NextResponse.json({ error: "Invalid session cookie" }, { status: 401 });
    }

    if (!session || !session.restaurantId) {
      return NextResponse.json({ error: "Malformed restaurant session" }, { status: 401 });
    }

    const restaurantId = session.restaurantId;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 });
    }

    // Strictly enforce restaurant-level data isolation: query ONLY orders belonging to this restaurant
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching restaurant orders:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map database snake_case fields to camelCase Order objects
    const mappedOrders = (data || []).map((o) => ({
      id: o.id,
      createdAt: o.created_at,
      status: o.status,
      items: o.items || [],
      restaurantId: o.restaurant_id,
      restaurantNameEn: o.restaurant_name_en,
      restaurantNameBn: o.restaurant_name_bn,
      restaurantPhone: o.restaurant_phone,
      customer: {
        name: o.customer_name,
        phone: o.customer_phone,
        address: o.customer_address,
        area: o.customer_area,
        instructions: o.customer_instructions,
        latitude: o.customer_lat,
        longitude: o.customer_lng,
      },
      pricing: {
        subtotal: Number(o.subtotal || 0),
        deliveryFee: Number(o.delivery_fee || 0),
        discount: Number(o.discount || 0),
        total: Number(o.total || 0),
      },
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      riderId: o.rider_id,
      rider: o.rider_name
        ? {
            name: o.rider_name,
            phone: o.rider_phone,
            vehicle: o.rider_vehicle || "Motorbike",
          }
        : undefined,
      estimatedDeliveryMinutes: o.estimated_delivery_minutes,
      cancellationReason: o.cancellation_reason,
      commissionAmount: o.commission_amount ? Number(o.commission_amount) : Math.round(Number(o.subtotal || 0) * 0.15),
      riderFee: o.rider_fee ? Number(o.rider_fee) : 35,
    }));

    return NextResponse.json({
      success: true,
      restaurantId,
      orders: mappedOrders,
    });
  } catch (err: any) {
    console.error("GET /api/restaurant/orders error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
