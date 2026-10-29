import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

// Allowed kitchen state transitions:
// placed -> accepted OR cancelled
// accepted -> preparing OR cancelled
// preparing -> ready_for_pickup OR cancelled
const PERMITTED_RESTAURANT_TRANSITIONS: Record<string, string[]> = {
  placed: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "cancelled"],
};

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId in parameters" }, { status: 400 });
    }

    // 1. Session Authentication Check
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("pengufood_restaurant_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized access: Restaurant login required" }, { status: 401 });
    }

    let session: { restaurantId: string };
    try {
      session = JSON.parse(sessionCookie);
    } catch {
      return NextResponse.json({ error: "Malformed session cookie" }, { status: 401 });
    }

    if (!session?.restaurantId) {
      return NextResponse.json({ error: "Invalid restaurant session" }, { status: 401 });
    }

    const { targetStatus, prepTimeMinutes, cancellationReason } = await req.json();

    if (!targetStatus) {
      return NextResponse.json({ error: "targetStatus is required" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 });
    }

    // 2. Fetch existing order to verify ownership
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 3. Strict Permission Check: Does this order belong to this restaurant?
    if (order.restaurant_id !== session.restaurantId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to manage this order" },
        { status: 403 }
      );
    }

    // 4. State Machine Validation: Can the restaurant make this transition?
    const currentStatus = order.status;
    const allowedTargets = PERMITTED_RESTAURANT_TRANSITIONS[currentStatus] || [];

    if (!allowedTargets.includes(targetStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition: Order in status "${currentStatus}" cannot be changed to "${targetStatus}" by restaurant. Permitted: [${allowedTargets.join(", ")}]`,
        },
        { status: 400 }
      );
    }

    // 5. Construct STRICT update payload (never modify pricing, delivery fee, rider, customer)
    const updatePayload: Record<string, any> = {
      status: targetStatus,
      updated_at: new Date().toISOString(),
    };

    if (targetStatus === "accepted" && prepTimeMinutes) {
      updatePayload.estimated_delivery_minutes = Number(prepTimeMinutes) + 15;
    }

    if (targetStatus === "cancelled" && cancellationReason) {
      updatePayload.cancellation_reason = String(cancellationReason).slice(0, 300);
    }

    // Execute update
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select()
      .single();

    if (updateErr) {
      console.error("Order status update failed:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${targetStatus}`,
      order: updated,
    });
  } catch (err: any) {
    console.error("POST /api/restaurant/orders/[orderId]/status error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
