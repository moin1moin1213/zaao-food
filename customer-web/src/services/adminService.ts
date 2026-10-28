import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Order, OrderStatus, Restaurant, RiderProfile, DeliveryZone, Coupon, AdminStats, PromoBanner, FoodItem, Category } from "./types";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage/safeStorage";
import { MOCK_RESTAURANTS, MOCK_FOODS, MOCK_CATEGORIES } from "./mockData";
import { catalogService } from "./catalogService";

const MOCK_ZONES: DeliveryZone[] = [
  {
    id: "zone_0_2",
    nameEn: "Mathbaria Town Core (0-2 km)",
    nameBn: "মঠবাড়িয়া পৌর এলাকা (০-২ কিমি)",
    minDistanceKm: 0.0,
    maxDistanceKm: 2.0,
    regularFee: 40,
    cakeFee: 100,
    isActive: true,
  },
  {
    id: "zone_2_3",
    nameEn: "Extended Town (2-3 km)",
    nameBn: "পৌর সীমানা সংলগ্ন (২-৩ কিমি)",
    minDistanceKm: 2.0,
    maxDistanceKm: 3.0,
    regularFee: 60,
    cakeFee: 100,
    isActive: true,
  },
  {
    id: "zone_3_8",
    nameEn: "Suburbs & Union Cakes (3-8 km)",
    nameBn: "উপশহর ও ইউনিয়ন কেক ডেলিভারি (৩-৮ কিমি)",
    minDistanceKm: 3.0,
    maxDistanceKm: 8.0,
    regularFee: 150,
    cakeFee: 150,
    isActive: true,
  },
];

const MOCK_RIDERS: RiderProfile[] = [
  {
    id: "rdr_1",
    name: "Tariqul Islam",
    phone: "01711223344",
    vehicle: "Honda 125 (Dhaka Metro-Ha-1234)",
    isActive: true,
    isOnline: true,
    currentLat: 22.2865,
    currentLng: 89.9620,
    totalDeliveries: 42,
    totalEarnings: 1470,
    balance: 520,
    rating: 4.9,
  },
  {
    id: "rdr_2",
    name: "Shafiqur Rahman",
    phone: "01819876543",
    vehicle: "Discover 110 (Barishal-Ha-5678)",
    isActive: true,
    isOnline: true,
    currentLat: 22.2842,
    currentLng: 89.9602,
    totalDeliveries: 28,
    totalEarnings: 980,
    balance: 350,
    rating: 4.8,
  },
  {
    id: "rdr_3",
    name: "Mehedi Hasan",
    phone: "01912340987",
    vehicle: "Runner Bike",
    isActive: true,
    isOnline: false,
    currentLat: 22.2850,
    currentLng: 89.9610,
    totalDeliveries: 15,
    totalEarnings: 525,
    balance: 175,
    rating: 4.7,
  },
];

export const adminService = {
  // 1. Executive Stats & Analytics
  async getStats(): Promise<AdminStats> {
    const orders = await this.getAllOrders();
    const restaurants = await this.getRestaurants();
    const riders = await this.getRiders();

    const todayStr = new Date().toISOString().split("T")[0];
    const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr));

    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.status !== "cancelled" ? o.pricing.total : 0), 0);
    const totalCommission = todayOrders.reduce(
      (sum, o) => sum + (o.status === "delivered" ? (o.commissionAmount || Math.round(o.pricing.subtotal * 0.15)) : 0),
      0
    );
    const totalRiderPay = todayOrders.reduce(
      (sum, o) => sum + (o.status === "delivered" ? (o.riderFee || 35) : 0),
      0
    );

    return {
      todayOrdersCount: todayOrders.length,
      todayRevenue,
      activeRestaurantsCount: restaurants.filter((r) => r.isOpen).length,
      onlineRidersCount: riders.filter((r) => r.isOnline).length,
      totalCommissionEarned: totalCommission,
      totalRiderPayouts: totalRiderPay,
    };
  },

  // 2. All Orders with Live Streaming
  async getAllOrders(statusFilter?: OrderStatus | "all"): Promise<Order[]> {
    if (supabase && isSupabaseConfigured) {
      try {
        let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
        if (statusFilter && statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }
        const { data, error } = await query;
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
            riderFee: o.rider_fee ? Number(o.rider_fee) : 35,
            commissionAmount: o.commission_amount ? Number(o.commission_amount) : Math.round(Number(o.subtotal) * 0.15),
            estimatedDeliveryMinutes: o.estimated_delivery_minutes,
            cancellationReason: o.cancellation_reason,
          }));
        }
      } catch (err) {
        console.warn("Supabase admin orders error:", err);
      }
    }

    const localOrders = safeLocalStorageGet<Order[]>("customer_orders_list", []) || [];
    if (statusFilter && statusFilter !== "all") {
      return localOrders.filter((o) => o.status === statusFilter);
    }
    return localOrders;
  },

  // 3. Assign Rider to Order or Update Status
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    riderData?: { id: string; name: string; phone: string; vehicle: string },
    cancellationReason?: string
  ): Promise<boolean> {
    if (supabase && isSupabaseConfigured) {
      try {
        const updatePayload: any = {
          status: newStatus,
          updated_at: new Date().toISOString(),
        };

        if (riderData) {
          updatePayload.rider_name = riderData.name;
          updatePayload.rider_phone = riderData.phone;
          updatePayload.rider_vehicle = riderData.vehicle;
        }

        if (cancellationReason) {
          updatePayload.cancellation_reason = cancellationReason;
        }

        const { error } = await supabase.from("orders").update(updatePayload).eq("id", orderId);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase updateOrderStatus error:", err);
      }
    }

    // Local Storage fallback
    const orders = safeLocalStorageGet<Order[]>("customer_orders_list", []) || [];
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = newStatus;
      if (riderData) {
        orders[idx].riderId = riderData.id;
        orders[idx].rider = {
          name: riderData.name,
          phone: riderData.phone,
          vehicle: riderData.vehicle,
        };
      }
      if (cancellationReason) {
        orders[idx].cancellationReason = cancellationReason;
      }
      safeLocalStorageSet("customer_orders_list", orders);
      return true;
    }
    return false;
  },

  // 4. Restaurant Management
  async getRestaurants(): Promise<Restaurant[]> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("restaurants").select("*").order("name_en");
        if (!error && data && data.length > 0) {
          return data.map((r) => ({
            id: r.id,
            slug: r.slug,
            nameEn: r.name_en,
            nameBn: r.name_bn,
            phone: r.phone,
            ownerPhone: r.owner_phone,
            image: r.image_url,
            banner: r.banner_url,
            cuisinesEn: r.cuisines_en || [],
            cuisinesBn: r.cuisines_bn || [],
            rating: Number(r.rating) || 5.0,
            reviewCount: r.review_count || 0,
            isOpen: r.is_open,
            openingHoursEn: r.opening_hours_en || "10:00 AM - 10:00 PM",
            openingHoursBn: r.opening_hours_bn || "সকাল ১০:০০ - রাত ১০:০০",
            minOrder: Number(r.min_order) || 0,
            addressEn: r.address_en,
            addressBn: r.address_bn,
            distanceKm: Number(r.distance_km) || 1.0,
            prepTimeMinutes: r.prep_time_minutes || 25,
            commissionRate: r.commission_rate ? Number(r.commission_rate) : 15.0,
            totalSales: r.total_sales ? Number(r.total_sales) : 0,
          }));
        }
      } catch (err) {
        console.warn("Supabase getRestaurants error:", err);
      }
    }

    const localRest = safeLocalStorageGet<Restaurant[]>("admin_restaurants", []);
    if (localRest && localRest.length > 0) return localRest;
    return MOCK_RESTAURANTS;
  },

  async saveRestaurant(restaurant: Partial<Restaurant>): Promise<boolean> {
    const isNew = !restaurant.id;
    const restId = restaurant.id || `rest_${Math.random().toString(36).substr(2, 8)}`;
    const slug = restaurant.slug || restaurant.nameEn?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `rest-${Date.now()}`;

    // Try server API first for service_role privileges
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_restaurant",
          payload: { ...restaurant, id: restId, slug },
        }),
      });
      if (res.ok) return true;
    } catch (e) {
      // fallback
    }

    if (supabase && isSupabaseConfigured) {
      try {
        const payload: any = {
          id: restId,
          slug,
          name_en: restaurant.nameEn,
          name_bn: restaurant.nameBn,
          phone: restaurant.phone || restaurant.ownerPhone,
          image_url: restaurant.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
          banner_url: restaurant.banner || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
          cuisines_en: restaurant.cuisinesEn || ["Bangladeshi"],
          cuisines_bn: restaurant.cuisinesBn || ["বাংলাদেশি"],
          is_open: restaurant.isOpen ?? true,
          min_order: restaurant.minOrder || 0,
          address_en: restaurant.addressEn || "Mathbaria Bazar",
          address_bn: restaurant.addressBn || "মঠবাড়িয়া বাজার",
          prep_time_minutes: restaurant.prepTimeMinutes || 25,
        };

        const { error } = await supabase.from("restaurants").upsert(payload, { onConflict: "id" });
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase saveRestaurant error:", err);
      }
    }

    // Local Storage fallback
    const list = await this.getRestaurants();
    const existingIdx = list.findIndex((r) => r.id === restId);
    const newEntry: Restaurant = {
      id: restId,
      slug,
      nameEn: restaurant.nameEn || "Restaurant",
      nameBn: restaurant.nameBn || "রেস্তোরাঁ",
      image: restaurant.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
      banner: restaurant.banner || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
      cuisinesEn: restaurant.cuisinesEn || ["Bangladeshi"],
      cuisinesBn: restaurant.cuisinesBn || ["বাংলাদেশি"],
      rating: restaurant.rating || 5.0,
      reviewCount: restaurant.reviewCount || 0,
      isOpen: restaurant.isOpen ?? true,
      openingHoursEn: restaurant.openingHoursEn || "10:00 AM - 10:00 PM",
      openingHoursBn: restaurant.openingHoursBn || "সকাল ১০:০০ - রাত ১০:০০",
      minOrder: restaurant.minOrder || 0,
      addressEn: restaurant.addressEn || "Mathbaria Bazar",
      addressBn: restaurant.addressBn || "মঠবাড়িয়া বাজার",
      distanceKm: restaurant.distanceKm || 1.0,
      prepTimeMinutes: restaurant.prepTimeMinutes || 25,
      commissionRate: restaurant.commissionRate || 15.0,
    };

    if (existingIdx >= 0) {
      list[existingIdx] = newEntry;
    } else {
      list.unshift(newEntry);
    }
    safeLocalStorageSet("admin_restaurants", list);
    return true;
  },

  async deleteRestaurant(restaurantId: string): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_restaurant",
          payload: { id: restaurantId },
        }),
      });
      if (res.ok) return true;
    } catch (e) {
      // fallback
    }

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from("products").delete().eq("restaurant_id", restaurantId);
        await supabase.from("restaurants").delete().eq("id", restaurantId);
      } catch (err) {
        console.warn("Supabase deleteRestaurant error:", err);
      }
    }

    const list = await this.getRestaurants();
    const updated = list.filter((r) => r.id !== restaurantId);
    safeLocalStorageSet("admin_restaurants", updated);
    return true;
  },

  // 4b. Foods / Products Management
  async getFoods(options?: { restaurantId?: string; categoryId?: string; search?: string }): Promise<FoodItem[]> {
    return catalogService.getFoods({
      restaurantId: options?.restaurantId,
      searchQuery: options?.search,
    });
  },

  async saveFood(food: Partial<FoodItem>): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_food",
          payload: food,
        }),
      });
      if (res.ok) return true;
    } catch (e) {
      // fallback
    }

    if (supabase && isSupabaseConfigured) {
      try {
        const payload: any = {
          id: food.id || `food_${Date.now()}`,
          slug: food.slug || `${food.nameEn?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "food"}-${Date.now().toString().slice(-4)}`,
          restaurant_id: food.restaurantId,
          category_id: food.categoryId,
          name_en: food.nameEn,
          name_bn: food.nameBn,
          description_en: food.descriptionEn || "",
          description_bn: food.descriptionBn || "",
          price: Number(food.price),
          original_price: food.originalPrice ? Number(food.originalPrice) : null,
          image_url: food.image,
          is_available: food.isAvailable ?? true,
          is_popular: food.isPopular ?? false,
          is_recommended: food.isRecommended ?? false,
          is_cake: food.isCake ?? false,
          cake_advance_days: food.minAdvanceDays || 2,
        };

        const { error } = await supabase.from("products").upsert(payload, { onConflict: "id" });
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase saveFood error:", err);
      }
    }
    return true;
  },

  async deleteFood(foodId: string): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_food",
          payload: { id: foodId },
        }),
      });
      if (res.ok) return true;
    } catch (e) {
      // fallback
    }

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from("products").delete().eq("id", foodId);
      } catch (err) {
        console.warn("Supabase deleteFood error:", err);
      }
    }
    return true;
  },

  async toggleFoodAvailability(foodId: string, isAvailable: boolean): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_food_availability",
          payload: { id: foodId, isAvailable },
        }),
      });
      if (res.ok) return true;
    } catch (e) {
      // fallback
    }

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from("products").update({ is_available: isAvailable }).eq("id", foodId);
      } catch (err) {
        console.warn("Supabase toggleFoodAvailability error:", err);
      }
    }
    return true;
  },

  // 5. Rider Fleet Management
  async getRiders(): Promise<RiderProfile[]> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("riders").select("*").order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((r) => ({
            id: r.id,
            name: r.name,
            phone: r.phone,
            vehicle: r.vehicle || "Motorbike",
            licensePlate: r.license_plate,
            isActive: r.is_active,
            isOnline: r.is_online,
            currentLat: r.current_lat ? Number(r.current_lat) : undefined,
            currentLng: r.current_lng ? Number(r.current_lng) : undefined,
            totalDeliveries: r.total_deliveries || 0,
            totalEarnings: Number(r.total_earnings) || 0,
            balance: Number(r.balance) || 0,
            rating: Number(r.rating) || 5.0,
          }));
        }
      } catch (err) {
        console.warn("Supabase getRiders error:", err);
      }
    }

    const localRiders = safeLocalStorageGet<RiderProfile[]>("admin_riders", []);
    if (localRiders && localRiders.length > 0) return localRiders;
    return MOCK_RIDERS;
  },

  async saveRider(rider: Partial<RiderProfile>): Promise<boolean> {
    const riderId = rider.id || `rdr_${Math.random().toString(36).substr(2, 8)}`;

    if (supabase && isSupabaseConfigured) {
      try {
        const payload: any = {
          id: riderId,
          name: rider.name,
          phone: rider.phone,
          vehicle: rider.vehicle || "Motorbike",
          is_active: rider.isActive ?? true,
          current_lat: rider.currentLat || 22.2858,
          current_lng: rider.currentLng || 89.9614,
        };

        const { error } = await supabase.from("riders").upsert(payload);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase saveRider error:", err);
      }
    }

    const list = await this.getRiders();
    const idx = list.findIndex((r) => r.id === riderId);
    const updated: RiderProfile = {
      id: riderId,
      name: rider.name || "Rider",
      phone: rider.phone || "01700000000",
      vehicle: rider.vehicle || "Motorbike",
      licensePlate: rider.licensePlate,
      isActive: rider.isActive ?? true,
      isOnline: rider.isOnline ?? false,
      currentLat: rider.currentLat || 22.2858,
      currentLng: rider.currentLng || 89.9614,
      totalDeliveries: rider.totalDeliveries || 0,
      totalEarnings: rider.totalEarnings || 0,
      balance: rider.balance || 0,
      rating: rider.rating || 5.0,
    };

    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }
    safeLocalStorageSet("admin_riders", list);
    return true;
  },

  // 6. Dynamic Delivery Zones & Pricing (Zero Source Code Changes Required)
  async getDeliveryZones(): Promise<DeliveryZone[]> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("delivery_zones").select("*").order("min_distance_km");
        if (!error && data && data.length > 0) {
          return data.map((z) => ({
            id: z.id,
            nameEn: z.name_en,
            nameBn: z.name_bn,
            minDistanceKm: Number(z.min_distance_km),
            maxDistanceKm: Number(z.max_distance_km),
            regularFee: Number(z.regular_fee),
            cakeFee: Number(z.cake_fee),
            isActive: z.is_active,
          }));
        }
      } catch (err) {
        console.warn("Supabase getDeliveryZones error:", err);
      }
    }

    const localZones = safeLocalStorageGet<DeliveryZone[]>("admin_delivery_zones", []);
    if (localZones && localZones.length > 0) return localZones;
    return MOCK_ZONES;
  },

  async updateDeliveryZonePricing(zoneId: string, regularFee: number, cakeFee: number): Promise<boolean> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("delivery_zones")
          .update({ regular_fee: regularFee, cake_fee: cakeFee })
          .eq("id", zoneId);

        // Also update app_settings delivery_rates JSON for quick cached reads
        const zones = await this.getDeliveryZones();
        const updatedZones = zones.map((z) => (z.id === zoneId ? { ...z, regularFee, cakeFee } : z));
        const rateMap: Record<string, number> = {};
        updatedZones.forEach((z) => {
          if (z.id === "zone_0_2") rateMap.regular_0_2 = z.regularFee;
          if (z.id === "zone_2_3") rateMap.regular_2_3 = z.regularFee;
          if (z.id === "zone_3_8") rateMap.cake_3_8 = z.cakeFee;
        });

        await supabase.from("app_settings").upsert({
          key: "delivery_rates",
          value: rateMap,
          updated_at: new Date().toISOString(),
        });

        if (!error) return true;
      } catch (err) {
        console.warn("Supabase updateDeliveryZonePricing error:", err);
      }
    }

    const zones = await this.getDeliveryZones();
    const idx = zones.findIndex((z) => z.id === zoneId);
    if (idx >= 0) {
      zones[idx].regularFee = regularFee;
      zones[idx].cakeFee = cakeFee;
      safeLocalStorageSet("admin_delivery_zones", zones);
      return true;
    }
    return false;
  },

  async saveDeliveryZone(zone: Partial<DeliveryZone>): Promise<boolean> {
    const zoneId = zone.id || `zone_${Date.now()}`;
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_zone",
          payload: { ...zone, id: zoneId },
        }),
      });
      if (res.ok) return true;
    } catch (e) {
      // fallback
    }

    if (supabase && isSupabaseConfigured) {
      try {
        const payload: any = {
          id: zoneId,
          name_en: zone.nameEn,
          name_bn: zone.nameBn,
          min_distance_km: zone.minDistanceKm,
          max_distance_km: zone.maxDistanceKm,
          regular_fee: zone.regularFee,
          cake_fee: zone.cakeFee,
          is_active: zone.isActive ?? true,
        };
        await supabase.from("delivery_zones").upsert(payload, { onConflict: "id" });
      } catch (err) {
        console.warn("Supabase saveDeliveryZone error:", err);
      }
    }

    const zones = await this.getDeliveryZones();
    const existingIdx = zones.findIndex((z) => z.id === zoneId);
    const updatedZone: DeliveryZone = {
      id: zoneId,
      nameEn: zone.nameEn || "Delivery Zone",
      nameBn: zone.nameBn || "ডেলিভারি এলাকা",
      minDistanceKm: zone.minDistanceKm || 0,
      maxDistanceKm: zone.maxDistanceKm || 2,
      regularFee: zone.regularFee || 40,
      cakeFee: zone.cakeFee || 100,
      isActive: zone.isActive ?? true,
    };
    if (existingIdx >= 0) {
      zones[existingIdx] = updatedZone;
    } else {
      zones.push(updatedZone);
    }
    safeLocalStorageSet("admin_delivery_zones", zones);
    return true;
  },

  async deleteDeliveryZone(zoneId: string): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_zone",
          payload: { id: zoneId },
        }),
      });
      if (res.ok) return true;
    } catch (e) {
      // fallback
    }

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from("delivery_zones").delete().eq("id", zoneId);
      } catch (err) {
        console.warn("Supabase deleteDeliveryZone error:", err);
      }
    }

    const zones = await this.getDeliveryZones();
    const updated = zones.filter((z) => z.id !== zoneId);
    safeLocalStorageSet("admin_delivery_zones", updated);
    return true;
  },

  // 7. Promotional Coupons
  async getCoupons(): Promise<Coupon[]> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
        if (!error && data) {
          return data.map((c) => ({
            code: c.code,
            descriptionEn: c.description_en,
            descriptionBn: c.description_bn,
            discountType: c.discount_type,
            discountValue: Number(c.discount_value),
            minOrder: Number(c.min_order),
            maxDiscount: c.max_discount ? Number(c.max_discount) : undefined,
            isActive: c.is_active,
            validUntil: c.valid_until,
          }));
        }
      } catch (err) {
        console.warn("Supabase getCoupons error:", err);
      }
    }

    return [
      {
        code: "PENGU50",
        descriptionEn: "50 BDT off on first order",
        descriptionBn: "প্রথম অর্ডারে ৫০ টাকা ছাড়",
        discountType: "fixed",
        discountValue: 50,
        minOrder: 250,
        isActive: true,
      },
      {
        code: "MATHBARIA",
        descriptionEn: "10% off on all local orders",
        descriptionBn: "১০% স্পেশাল ডিসকাউন্ট",
        discountType: "percentage",
        discountValue: 10,
        minOrder: 200,
        isActive: true,
      },
    ];
  },

  async saveCoupon(coupon: Coupon): Promise<boolean> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("coupons").upsert({
          code: coupon.code.toUpperCase(),
          description_en: coupon.descriptionEn,
          description_bn: coupon.descriptionBn,
          discount_type: coupon.discountType,
          discount_value: coupon.discountValue,
          min_order: coupon.minOrder,
          max_discount: coupon.maxDiscount,
          is_active: coupon.isActive,
          valid_until: coupon.validUntil,
        });
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase saveCoupon error:", err);
      }
    }
    return true;
  },
};
