import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CartItem, Order, OrderCustomer, OrderStatus } from "@/services/types";

// Mathbaria Town Center reference coordinates
const MATHBARIA_CENTER_LAT = 22.2858;
const MATHBARIA_CENTER_LNG = 89.9614;

// Haversine formula to calculate distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Bangladeshi phone regex: 01[3-9]XXXXXXXX
const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, customer, paymentMethod, couponCode } = body as {
      items: CartItem[];
      customer: OrderCustomer;
      paymentMethod: "cod" | "online";
      couponCode?: string;
    };

    // 1. Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "কার্টে কোনো খাবার পাওয়া যায়নি।" }, { status: 400 });
    }

    if (!customer?.name || !customer?.phone || !customer?.address) {
      return NextResponse.json({ error: "গ্রাহকের নাম, ফোন ও ঠিকানা আবশ্যক।" }, { status: 400 });
    }

    const cleanPhone = customer.phone.replace(/[\s-]/g, "");
    if (!BD_PHONE_REGEX.test(cleanPhone)) {
      return NextResponse.json(
        { error: "সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর প্রদান করুন (যেমন: 01712345678)।" },
        { status: 400 }
      );
    }

    // 2. Single-Restaurant constraint check
    const restaurantId = items[0].restaurantId;
    const hasMultipleRestaurants = items.some((it) => it.restaurantId !== restaurantId);
    if (hasMultipleRestaurants) {
      return NextResponse.json(
        { error: "একসাথে একাধিক রেস্তোরাঁ থেকে অর্ডার করা সম্ভব নয়। দয়া করে যেকোনো একটি রেস্তোরাঁ বেছে নিন।" },
        { status: 400 }
      );
    }

    // 3. Fallback when Supabase is not yet configured (Demo mode)
    if (!supabaseAdmin) {
      const orderNum = Math.floor(10000 + Math.random() * 90000);
      const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      const deliveryFee = 40;
      const demoOrder: Order = {
        id: `PF-${orderNum}`,
        createdAt: new Date().toISOString(),
        status: "placed",
        items,
        restaurantId,
        restaurantNameEn: items[0].restaurantNameEn || "PenguFood Kitchen",
        restaurantNameBn: items[0].restaurantNameBn || "পেঙ্গুফুড কিচেন",
        customer: { ...customer, phone: cleanPhone },
        pricing: { subtotal, deliveryFee, discount: 0, total: subtotal + deliveryFee },
        paymentMethod: paymentMethod || "cod",
        paymentStatus: "pending",
        estimatedDeliveryMinutes: 30,
      };
      return NextResponse.json({ success: true, order: demoOrder, mode: "local_fallback" });
    }

    // 4. Server-Side Price & Product Verification
    const productIds = items.map((it) => it.productId).filter(Boolean);
    const { data: dbProducts, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("*")
      .in("id", productIds);

    if (prodErr || !dbProducts) {
      return NextResponse.json({ error: "পণ্য যাচাইকরণে ত্রুটি হয়েছে: " + prodErr?.message }, { status: 500 });
    }

    const productMap = new Map<string, any>(dbProducts.map((p) => [p.id, p]));

    let validatedSubtotal = 0;
    const validatedItems: CartItem[] = [];
    let isCakeOrder = false;
    let hasRegularFood = false;

    for (const item of items) {
      const dbProd = productMap.get(item.productId);
      if (!dbProd) {
        return NextResponse.json(
          { error: `খাবার "${item.nameBn || item.nameEn}" ডাটাবেজে খুঁজে পাওয়া যায়নি।` },
          { status: 400 }
        );
      }

      if (!dbProd.is_available) {
        return NextResponse.json(
          { error: `দুঃখিত, "${dbProd.name_bn}" এই মুহূর্তে স্টক শেষ বা বন্ধ আছে।` },
          { status: 400 }
        );
      }

      if (dbProd.is_cake) {
        isCakeOrder = true;
      } else {
        hasRegularFood = true;
      }

      // Check authoritative unit price
      let authoritativeUnitPrice = Number(dbProd.price);

      // If item has a custom cake size selected, verify price against cake_sizes JSON
      if (item.selectedSize && dbProd.cake_sizes && Array.isArray(dbProd.cake_sizes)) {
        const matchingSize = dbProd.cake_sizes.find((s: any) => s.id === item.selectedSize?.id);
        if (matchingSize && matchingSize.price) {
          authoritativeUnitPrice = Number(matchingSize.price);
        }
      }

      const itemTotal = authoritativeUnitPrice * item.quantity;
      validatedSubtotal += itemTotal;

      validatedItems.push({
        ...item,
        price: authoritativeUnitPrice,
      });
    }

    // 5. Server-Side Restaurant & Commission Verification
    const { data: restaurant } = await supabaseAdmin
      .from("restaurants")
      .select("name_en, name_bn, phone, is_open, commission_rate, latitude, longitude")
      .eq("id", restaurantId)
      .single();

    if (restaurant && !restaurant.is_open) {
      return NextResponse.json(
        { error: "দুঃখিত, এই রেস্তোরাঁটি বর্তমানে অর্ডার নেওয়া বন্ধ রেখেছে।" },
        { status: 400 }
      );
    }

    const commissionRate = restaurant?.commission_rate ? Number(restaurant.commission_rate) : 15.0;
    const commissionAmount = Math.round(validatedSubtotal * (commissionRate / 100));

    // 6. Server-Side Delivery Fee Calculation
    const destLat = customer.latitude || MATHBARIA_CENTER_LAT;
    const destLng = customer.longitude || MATHBARIA_CENTER_LNG;
    const distanceKm = calculateDistanceKm(MATHBARIA_CENTER_LAT, MATHBARIA_CENTER_LNG, destLat, destLng);

    // Fetch delivery zones from DB
    const { data: dbZones } = await supabaseAdmin
      .from("delivery_zones")
      .select("*")
      .eq("is_active", true)
      .order("min_distance_km", { ascending: true });

    let deliveryFee = 40.0;
    if (distanceKm <= 2.0) {
      deliveryFee = isCakeOrder ? 100.0 : 40.0;
    } else if (distanceKm <= 3.0) {
      deliveryFee = isCakeOrder ? 100.0 : 60.0;
    } else if (distanceKm <= 8.0) {
      if (hasRegularFood) {
        return NextResponse.json(
          { error: "৩ কিমির বাইরে শুধুমাত্র হোমমেড কেক ডেলিভারি করা হয়। সাধারণ খাবারের জন্য এটি কভারেজ এলাকার বাইরে।" },
          { status: 400 }
        );
      }
      deliveryFee = 150.0;
    } else {
      return NextResponse.json(
        { error: "আপনার ঠিকানা মঠবাড়িয়া পেঙ্গুফুডের সর্বোচ্চ ৮ কিমি ডেলিভারি কভারেজ এরিয়ার বাইরে।" },
        { status: 400 }
      );
    }

    // 7. Server-Side Coupon & Discount Calculation
    let discount = 0.0;
    let appliedCoupon: string | null = null;

    if (couponCode && couponCode.trim()) {
      const codeUpper = couponCode.trim().toUpperCase();
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", codeUpper)
        .eq("is_active", true)
        .single();

      if (coupon) {
        if (!coupon.valid_until || new Date(coupon.valid_until) > new Date()) {
          if (validatedSubtotal >= Number(coupon.min_order || 0)) {
            if (coupon.discount_type === "fixed") {
              discount = Number(coupon.discount_value);
            } else if (coupon.discount_type === "percentage") {
              discount = Math.round(validatedSubtotal * (Number(coupon.discount_value) / 100));
            }
            if (coupon.max_discount && discount > Number(coupon.max_discount)) {
              discount = Number(coupon.max_discount);
            }
            appliedCoupon = codeUpper;
          }
        }
      }
    }

    const total = Math.max(0, validatedSubtotal + deliveryFee - discount);
    const orderNum = Math.floor(10000 + Math.random() * 90000);
    const orderId = `PF-${orderNum}`;
    const nowIso = new Date().toISOString();

    // 8. Secure Database Transaction (Orders, Items, History, Notifications)
    const orderPayload = {
      id: orderId,
      created_at: nowIso,
      status: "placed" as OrderStatus,
      restaurant_id: restaurantId,
      restaurant_name_en: restaurant?.name_en || items[0].restaurantNameEn,
      restaurant_name_bn: restaurant?.name_bn || items[0].restaurantNameBn,
      restaurant_phone: restaurant?.phone || "",
      customer_name: customer.name,
      customer_phone: cleanPhone,
      customer_address: customer.address,
      customer_area: customer.area || "Mathbaria Town",
      customer_instructions: customer.instructions || null,
      customer_lat: destLat,
      customer_lng: destLng,
      subtotal: validatedSubtotal,
      delivery_fee: deliveryFee,
      discount,
      coupon_code: appliedCoupon,
      total,
      payment_method: paymentMethod || "cod",
      payment_status: "pending",
      rider_fee: 35.0,
      commission_amount: commissionAmount,
      estimated_delivery_minutes: 30,
      items: validatedItems, // Json document mirror
    };

    const { error: insertOrderErr } = await supabaseAdmin.from("orders").insert(orderPayload);
    if (insertOrderErr) {
      console.error("Order creation database error:", insertOrderErr);
      return NextResponse.json({ error: "অর্ডার সংরক্ষণে সমস্যা হয়েছে: " + insertOrderErr.message }, { status: 500 });
    }

    // Insert normalized order_items
    const orderItemsRows = validatedItems.map((it) => ({
      order_id: orderId,
      product_id: it.productId,
      name_en: it.nameEn,
      name_bn: it.nameBn,
      unit_price: it.price,
      quantity: it.quantity,
      total_price: it.price * it.quantity,
      is_cake: it.isCake || false,
      selected_size: it.selectedSize || null,
      selected_flavor: it.selectedFlavor || null,
      custom_message: it.customMessage || null,
      special_instructions: it.specialInstructions || null,
    }));

    await supabaseAdmin.from("order_items").insert(orderItemsRows);

    // Insert initial status history
    await supabaseAdmin.from("order_status_history").insert({
      order_id: orderId,
      status: "placed",
      changed_by_role: "customer",
      changed_by_id: cleanPhone,
      notes: "অর্ডার সফলভাবে প্লেস করা হয়েছে (Cash on Delivery)",
    });

    // Create notifications for restaurant & customer
    await supabaseAdmin.from("notifications").insert([
      {
        recipient_role: "restaurant",
        recipient_id: restaurantId,
        title_en: `New Order Received: #${orderId}`,
        title_bn: `নতুন অর্ডার এসেছে: #${orderId}`,
        message_en: `Customer ${customer.name} ordered ${validatedItems.length} items. Total: ৳${total}`,
        message_bn: `গ্রাহক ${customer.name} ${validatedItems.length} টি খাবারের অর্ডার দিয়েছেন। মোট: ৳${total}`,
        category: "order",
        order_id: orderId,
        link: "/",
      },
      {
        recipient_role: "customer",
        recipient_id: cleanPhone,
        title_en: `Order Confirmed: #${orderId}`,
        title_bn: `অর্ডার নিশ্চিত হয়েছে: #${orderId}`,
        message_en: `Your food is being notified to ${restaurant?.name_bn || items[0].restaurantNameBn}.`,
        message_bn: `আপনার অর্ডারটি ${restaurant?.name_bn || items[0].restaurantNameBn}-এ প্রেরণ করা হয়েছে।`,
        category: "order",
        order_id: orderId,
        link: `/orders/${orderId}`,
      },
    ]);

    // Increment sales count asynchronously for each product
    for (const it of validatedItems) {
      if (it.productId) {
        supabaseAdmin.rpc("increment_sales_count", {
          prod_id: it.productId,
          qty: it.quantity || 1,
        }).then();
      }
    }

    const createdOrder: Order = {
      id: orderId,
      createdAt: nowIso,
      status: "placed",
      items: validatedItems,
      restaurantId,
      restaurantNameEn: orderPayload.restaurant_name_en,
      restaurantNameBn: orderPayload.restaurant_name_bn,
      restaurantPhone: orderPayload.restaurant_phone,
      customer: {
        name: customer.name,
        phone: cleanPhone,
        address: customer.address,
        area: orderPayload.customer_area,
        instructions: customer.instructions,
        latitude: destLat,
        longitude: destLng,
      },
      pricing: {
        subtotal: validatedSubtotal,
        deliveryFee,
        discount,
        total,
      },
      paymentMethod: orderPayload.payment_method,
      paymentStatus: "pending",
      estimatedDeliveryMinutes: 30,
    };

    return NextResponse.json({ success: true, order: createdOrder });
  } catch (err: any) {
    console.error("Server-side order creation error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
