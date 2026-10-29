import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase Admin client not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      // 1. Restaurant Actions
      case "save_restaurant": {
        const {
          id,
          slug,
          nameEn,
          nameBn,
          phone,
          ownerPhone,
          addressEn,
          addressBn,
          image,
          banner,
          cuisinesEn,
          cuisinesBn,
          isOpen,
          minOrder,
          prepTimeMinutes,
          commissionRate,
        } = payload;

        const dbPayload: any = {
          id,
          slug: slug || id,
          name_en: nameEn,
          name_bn: nameBn,
          phone: phone || ownerPhone,
          image_url: image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
          banner_url: banner || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
          cuisines_en: cuisinesEn || ["Bangladeshi"],
          cuisines_bn: cuisinesBn || ["বাংলাদেশি"],
          is_open: isOpen ?? true,
          min_order: minOrder || 0,
          address_en: addressEn || "Mathbaria Bazar",
          address_bn: addressBn || "মঠবাড়িয়া বাজার",
          prep_time_minutes: prepTimeMinutes || 25,
        };

        const { data, error } = await supabaseAdmin
          .from("restaurants")
          .upsert(dbPayload, { onConflict: "id" })
          .select();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // If password is provided, save to restaurant_passwords
        if (payload.password && payload.password.trim()) {
          const { data: existing } = await supabaseAdmin
            .from("app_settings")
            .select("value")
            .eq("key", "restaurant_passwords")
            .single();

          const currentMap = { ...(existing?.value || {}) };
          currentMap[id] = payload.password.trim();

          await supabaseAdmin
            .from("app_settings")
            .upsert({
              key: "restaurant_passwords",
              value: currentMap,
              description: "Restaurant portal credentials and passwords managed by Admin",
              updated_at: new Date().toISOString(),
            }, { onConflict: "key" });
        }

        return NextResponse.json({ success: true, data });
      }

      case "delete_restaurant": {
        const { id } = payload;
        // First delete any products belonging to this restaurant
        await supabaseAdmin.from("products").delete().eq("restaurant_id", id);
        const { error } = await supabaseAdmin.from("restaurants").delete().eq("id", id);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      }

      // 2. Food & Product Actions
      case "save_food": {
        const {
          id,
          slug,
          restaurantId,
          categoryId,
          nameEn,
          nameBn,
          descriptionEn,
          descriptionBn,
          price,
          originalPrice,
          image,
          isAvailable,
          isPopular,
          isRecommended,
          isCake,
          minAdvanceDays,
          cakeSizes,
          cakeFlavors,
        } = payload;

        const foodId = id || `food_${Date.now()}`;
        const foodSlug = slug || `${nameEn?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "food"}-${Date.now().toString().slice(-4)}`;

        const dbPayload: any = {
          id: foodId,
          slug: foodSlug,
          restaurant_id: restaurantId,
          category_id: categoryId,
          name_en: nameEn,
          name_bn: nameBn,
          description_en: descriptionEn || "",
          description_bn: descriptionBn || "",
          price: Number(price),
          original_price: originalPrice ? Number(originalPrice) : null,
          image_url: image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
          is_available: isAvailable ?? true,
          is_popular: isPopular ?? false,
          is_recommended: isRecommended ?? false,
          is_cake: isCake ?? false,
          cake_advance_days: isCake ? Number(minAdvanceDays || 2) : 2,
        };

        const { data, error } = await supabaseAdmin
          .from("products")
          .upsert(dbPayload, { onConflict: "id" })
          .select();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true, data });
      }

      case "delete_food": {
        const { id } = payload;
        const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      }

      case "toggle_food_availability": {
        const { id, isAvailable } = payload;
        const { error } = await supabaseAdmin
          .from("products")
          .update({ is_available: isAvailable })
          .eq("id", id);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      }

      // 3. Delivery Zone Actions
      case "save_zone": {
        const { id, nameEn, nameBn, minDistanceKm, maxDistanceKm, regularFee, cakeFee, isActive } = payload;
        const zoneId = id || `zone_${Date.now()}`;
        const dbPayload: any = {
          id: zoneId,
          name_en: nameEn,
          name_bn: nameBn,
          min_distance_km: Number(minDistanceKm),
          max_distance_km: Number(maxDistanceKm),
          regular_fee: Number(regularFee),
          cake_fee: Number(cakeFee),
          is_active: isActive ?? true,
        };

        const { data, error } = await supabaseAdmin
          .from("delivery_zones")
          .upsert(dbPayload, { onConflict: "id" })
          .select();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true, data });
      }

      case "delete_zone": {
        const { id } = payload;
        const { error } = await supabaseAdmin.from("delivery_zones").delete().eq("id", id);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      }

      // 4. Restaurant Password Management
      case "get_restaurant_passwords": {
        const defaultMap: Record<string, string> = {
          "rest-1": "kacchi123",
          "rest-2": "bismillah123",
          "rest-3": "cafe123",
          "rest-4": "sultana123",
          "rest-5": "roshona123",
        };

        const { data, error } = await supabaseAdmin
          .from("app_settings")
          .select("value")
          .eq("key", "restaurant_passwords")
          .single();

        if (error || !data || !data.value) {
          return NextResponse.json({ success: true, passwords: defaultMap });
        }
        return NextResponse.json({ success: true, passwords: { ...defaultMap, ...data.value } });
      }

      case "update_restaurant_password": {
        const { restaurantId, newPassword } = payload;
        if (!restaurantId || !newPassword) {
          return NextResponse.json({ error: "Missing restaurantId or newPassword" }, { status: 400 });
        }

        const defaultMap: Record<string, string> = {
          "rest-1": "kacchi123",
          "rest-2": "bismillah123",
          "rest-3": "cafe123",
          "rest-4": "sultana123",
          "rest-5": "roshona123",
        };

        const { data: existing } = await supabaseAdmin
          .from("app_settings")
          .select("value")
          .eq("key", "restaurant_passwords")
          .single();

        const currentMap = { ...defaultMap, ...(existing?.value || {}) };
        currentMap[restaurantId] = newPassword.trim();

        const { error } = await supabaseAdmin
          .from("app_settings")
          .upsert({
            key: "restaurant_passwords",
            value: currentMap,
            description: "Restaurant portal credentials and passwords managed by Admin",
            updated_at: new Date().toISOString(),
          }, { onConflict: "key" });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true, passwords: currentMap });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("API admin catalog error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
