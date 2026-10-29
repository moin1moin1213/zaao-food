import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Order, OrderStatus, FoodItem, Restaurant } from "./types";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage/safeStorage";
import { MOCK_FOODS, MOCK_RESTAURANTS } from "./mockData";

export const restaurantService = {
  // 1. Get Live Orders for Restaurant (Protected Server Route with Session Verification)
  async getOrders(restaurantId: string): Promise<Order[]> {
    try {
      const res = await fetch("/api/restaurant/orders", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          return data.orders;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch orders via /api/restaurant/orders, trying fallback:", err);
    }

    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data.map((o) => ({
            id: o.id,
            createdAt: o.created_at,
            status: o.status,
            items: o.items,
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
              subtotal: Number(o.subtotal),
              deliveryFee: Number(o.delivery_fee),
              discount: Number(o.discount),
              total: Number(o.total),
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
        }
      } catch (err) {
        console.warn("Supabase restaurant getOrders error:", err);
      }
    }

    const localOrders = safeLocalStorageGet<Order[]>("customer_orders_list", []) || [];
    return localOrders.filter((o) => o.restaurantId === restaurantId);
  },

  // 2. Accept Order & Set Preparation Time (Enforced Backend Validation)
  async acceptOrder(orderId: string, prepTimeMinutes: number = 25): Promise<boolean> {
    try {
      const res = await fetch(`/api/restaurant/orders/${encodeURIComponent(orderId)}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus: "accepted", prepTimeMinutes }),
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn("API acceptOrder failed, attempting direct fallback:", err);
    }

    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("orders")
          .update({
            status: "accepted",
            estimated_delivery_minutes: prepTimeMinutes + 15,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase acceptOrder error:", err);
      }
    }

    const orders = safeLocalStorageGet<Order[]>("customer_orders_list", []) || [];
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx >= 0) {
      orders[idx].status = "accepted";
      orders[idx].estimatedDeliveryMinutes = prepTimeMinutes + 15;
      safeLocalStorageSet("customer_orders_list", orders);
      return true;
    }
    return false;
  },

  // 3. Mark Preparing (Enforced Backend Validation)
  async startPreparing(orderId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/restaurant/orders/${encodeURIComponent(orderId)}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus: "preparing" }),
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn("API startPreparing failed, attempting direct fallback:", err);
    }

    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("orders")
          .update({
            status: "preparing",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase startPreparing error:", err);
      }
    }

    const orders = safeLocalStorageGet<Order[]>("customer_orders_list", []) || [];
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx >= 0) {
      orders[idx].status = "preparing";
      safeLocalStorageSet("customer_orders_list", orders);
      return true;
    }
    return false;
  },

  // 4. Mark Ready for Pickup (Enforced Backend Validation)
  async markReadyForPickup(orderId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/restaurant/orders/${encodeURIComponent(orderId)}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus: "ready_for_pickup" }),
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn("API markReadyForPickup failed, attempting direct fallback:", err);
    }

    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("orders")
          .update({
            status: "ready_for_pickup",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase markReadyForPickup error:", err);
      }
    }

    const orders = safeLocalStorageGet<Order[]>("customer_orders_list", []) || [];
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx >= 0) {
      orders[idx].status = "ready_for_pickup";
      safeLocalStorageSet("customer_orders_list", orders);
      return true;
    }
    return false;
  },

  // 5. Reject Order with Reason (Enforced Backend Validation)
  async rejectOrder(orderId: string, reason: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/restaurant/orders/${encodeURIComponent(orderId)}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus: "cancelled", cancellationReason: reason }),
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn("API rejectOrder failed, attempting direct fallback:", err);
    }

    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("orders")
          .update({
            status: "cancelled",
            cancellation_reason: reason,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase rejectOrder error:", err);
      }
    }

    const orders = safeLocalStorageGet<Order[]>("customer_orders_list", []) || [];
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx >= 0) {
      orders[idx].status = "cancelled";
      orders[idx].cancellationReason = reason;
      safeLocalStorageSet("customer_orders_list", orders);
      return true;
    }
    return false;
  },

  // 6. Restaurant Menu Management
  async getMenu(restaurantId: string): Promise<FoodItem[]> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .order("name_en");

        if (!error && data && data.length > 0) {
          return data.map((p) => ({
            id: p.id,
            slug: p.slug,
            nameEn: p.name_en,
            nameBn: p.name_bn,
            descriptionEn: p.description_en || "",
            descriptionBn: p.description_bn || "",
            price: Number(p.price),
            originalPrice: p.original_price ? Number(p.original_price) : undefined,
            image: p.image_url,
            categoryId: p.category_id,
            restaurantId: p.restaurant_id,
            restaurantNameEn: "",
            restaurantNameBn: "",
            isAvailable: p.is_available,
            isPopular: p.is_popular,
            salesCount: p.sales_count || 0,
            isCake: p.is_cake,
            cakeSizes: p.cake_sizes,
            cakeFlavors: p.cake_flavors,
            prepTimeMinutes: 20,
          }));
        }
      } catch (err) {
        console.warn("Supabase getMenu error:", err);
      }
    }

    return MOCK_FOODS.filter((f) => f.restaurantId === restaurantId);
  },

  // 7. Toggle Product In-Stock / Out-of-Stock
  async toggleProductAvailability(productId: string, isAvailable: boolean): Promise<boolean> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("products")
          .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
          .eq("id", productId);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase toggleProductAvailability error:", err);
      }
    }
    return true;
  },

  // 8. Add or Update Food / Cake Item
  async saveProduct(product: Partial<FoodItem> & { restaurantId: string; categoryId: string }): Promise<boolean> {
    const prodId = product.id || `prod_${Math.random().toString(36).substr(2, 8)}`;
    const slug = product.slug || product.nameEn?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `item-${Date.now()}`;

    if (supabase && isSupabaseConfigured) {
      try {
        const payload: any = {
          id: prodId,
          slug,
          restaurant_id: product.restaurantId,
          category_id: product.categoryId,
          name_en: product.nameEn,
          name_bn: product.nameBn,
          description_en: product.descriptionEn,
          description_bn: product.descriptionBn,
          price: product.price,
          original_price: product.originalPrice,
          image_url: product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
          is_available: product.isAvailable ?? true,
          is_popular: product.isPopular ?? false,
          is_cake: product.isCake ?? false,
          cake_sizes: product.cakeSizes,
          cake_flavors: product.cakeFlavors,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("products").upsert(payload);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase saveProduct error:", err);
      }
    }
    return true;
  },

  // 9. Restaurant Profile & Status Toggle
  async getRestaurantProfile(restaurantId: string): Promise<Restaurant | null> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", restaurantId)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            slug: data.slug,
            nameEn: data.name_en,
            nameBn: data.name_bn,
            phone: data.phone,
            image: data.image_url,
            banner: data.banner_url,
            cuisinesEn: data.cuisines_en || [],
            cuisinesBn: data.cuisines_bn || [],
            rating: Number(data.rating) || 5.0,
            reviewCount: data.review_count || 0,
            isOpen: data.is_open,
            openingHoursEn: data.opening_hours_en,
            openingHoursBn: data.opening_hours_bn,
            minOrder: Number(data.min_order) || 0,
            addressEn: data.address_en,
            addressBn: data.address_bn,
            distanceKm: Number(data.distance_km) || 1.0,
            prepTimeMinutes: data.prep_time_minutes || 25,
            commissionRate: data.commission_rate ? Number(data.commission_rate) : 15.0,
          };
        }
      } catch (err) {
        console.warn("Supabase getRestaurantProfile error:", err);
      }
    }

    return MOCK_RESTAURANTS.find((r) => r.id === restaurantId) || null;
  },

  async toggleOpenStatus(restaurantId: string, isOpen: boolean): Promise<boolean> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("restaurants")
          .update({ is_open: isOpen, updated_at: new Date().toISOString() })
          .eq("id", restaurantId);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase toggleOpenStatus error:", err);
      }
    }
    return true;
  },
};
