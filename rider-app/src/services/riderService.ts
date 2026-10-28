import { supabase } from "./supabase";

export interface RiderOrder {
  id: string;
  createdAt: string;
  status:
    | "placed"
    | "accepted"
    | "preparing"
    | "ready_for_pickup"
    | "rider_picked_up"
    | "on_the_way"
    | "delivered"
    | "cancelled";
  restaurantId: string;
  restaurantNameEn: string;
  restaurantNameBn: string;
  restaurantPhone?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerArea: string;
  customerLat?: number;
  customerLng?: number;
  items: Array<{ nameBn: string; nameEn: string; quantity: number; price: number }>;
  total: number;
  riderFee: number;
  paymentMethod: "cod" | "online";
  estimatedMinutes?: number;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
}

export const riderService = {
  // 1. Update Online/Offline State in Supabase
  async setOnlineStatus(riderId: string, isOnline: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("riders")
        .update({ is_active: isOnline })
        .eq("id", riderId);
      return !error;
    } catch (e) {
      console.warn("setOnlineStatus error:", e);
      return false;
    }
  },

  // 2. Stream Live GPS Coordinates to Supabase
  async updateLocation(riderId: string, lat: number, lng: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("riders")
        .update({
          current_lat: lat,
          current_lng: lng,
        })
        .eq("id", riderId);
      return !error;
    } catch (e) {
      console.warn("updateLocation error:", e);
      return false;
    }
  },

  // 3. Fetch Delivery Requests & Active Orders
  async getDeliveryRequests(riderIdentifier: string | { id: string; name?: string; phone?: string }): Promise<{
    available: RiderOrder[];
    active: RiderOrder | null;
  }> {
    const riderId = typeof riderIdentifier === "string" ? riderIdentifier : riderIdentifier.id;
    const riderPhoneMap: Record<string, string> = {
      rdr_1: "01711223344",
      rdr_2: "01819876543",
      rdr_3: "01912340987",
    };
    const riderPhone = (typeof riderIdentifier === "object" ? riderIdentifier.phone : undefined) || riderPhoneMap[riderId];
    const riderName = typeof riderIdentifier === "object" ? riderIdentifier.name : undefined;

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data) {
        return { available: [], active: null };
      }

      const allOrders: RiderOrder[] = data.map((o: any) => ({
        id: o.id,
        createdAt: o.created_at,
        status: o.status,
        restaurantId: o.restaurant_id,
        restaurantNameEn: o.restaurant_name_en,
        restaurantNameBn: o.restaurant_name_bn,
        restaurantPhone: o.restaurant_phone,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        customerAddress: o.customer_address,
        customerArea: o.customer_area,
        customerLat: o.customer_lat ? Number(o.customer_lat) : undefined,
        customerLng: o.customer_lng ? Number(o.customer_lng) : undefined,
        items: o.items || [],
        total: Number(o.total),
        riderFee: o.rider_fee ? Number(o.rider_fee) : 35,
        paymentMethod: o.payment_method,
        estimatedMinutes: o.estimated_delivery_minutes,
        riderId: o.rider_id || undefined,
        riderName: o.rider_name || undefined,
        riderPhone: o.rider_phone || undefined,
      }));

      // Active order assigned to this rider in progress
      const active =
        allOrders.find(
          (o) =>
            (o.status === "ready_for_pickup" ||
              o.status === "rider_picked_up" ||
              o.status === "on_the_way") &&
            ((riderPhone && o.riderPhone === riderPhone) ||
              (riderName && o.riderName === riderName) ||
              (o.riderId && o.riderId === riderId))
        ) || null;

      // Available orders waiting for a rider
      const available = allOrders.filter(
        (o) =>
          (o.status === "ready_for_pickup" || o.status === "accepted" || o.status === "preparing") &&
          !o.riderPhone &&
          !o.riderName &&
          !o.riderId
      );

      return { available, active };
    } catch (e) {
      console.warn("getDeliveryRequests error:", e);
      return { available: [], active: null };
    }
  },

  // 4. Accept Delivery Request
  async acceptOrder(
    orderId: string,
    rider: { id: string; name: string; phone: string; vehicle: string }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          rider_name: rider.name,
          rider_phone: rider.phone,
          rider_vehicle: rider.vehicle,
          status: "ready_for_pickup",
        })
        .eq("id", orderId);
      return !error;
    } catch (e) {
      console.warn("acceptOrder error:", e);
      return false;
    }
  },

  // 5. Update Trip Delivery Status
  async updateTripStatus(
    orderId: string,
    riderId: string,
    newStatus: "rider_picked_up" | "on_the_way" | "delivered",
    riderFee: number = 35
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status: newStatus,
      };

      if (newStatus === "delivered") {
        updateData.payment_status = "paid";
      }

      const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);

      if (newStatus === "delivered") {
        // Increment rider stats if rpc exists
        try {
          await supabase.rpc("increment_rider_earnings", {
            r_id: riderId,
            fee: riderFee,
          });
        } catch (e) {
          // ignore if rpc not defined
        }
      }

      return !error;
    } catch (e) {
      console.warn("updateTripStatus error:", e);
      return false;
    }
  },

  // 6. Get Completed Deliveries History
  async getEarnings(riderId: string): Promise<{
    totalEarnings: number;
    completedCount: number;
    deliveries: RiderOrder[];
  }> {
    const defaultStats: Record<string, { totalEarnings: number; completedCount: number }> = {
      rdr_1: { totalEarnings: 1470, completedCount: 42 },
      rdr_2: { totalEarnings: 980, completedCount: 28 },
      rdr_3: { totalEarnings: 525, completedCount: 15 },
    };

    const riderPhoneMap: Record<string, string> = {
      rdr_1: "01711223344",
      rdr_2: "01819876543",
      rdr_3: "01912340987",
    };
    const phone = riderPhoneMap[riderId];

    try {
      let query = supabase
        .from("orders")
        .select("*")
        .eq("status", "delivered")
        .order("created_at", { ascending: false });

      if (phone) {
        query = query.eq("rider_phone", phone);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        const fallback = defaultStats[riderId] || { totalEarnings: 0, completedCount: 0 };
        return { ...fallback, deliveries: [] };
      }

      const deliveries: RiderOrder[] = data.map((o: any) => ({
        id: o.id,
        createdAt: o.created_at,
        status: o.status,
        restaurantId: o.restaurant_id,
        restaurantNameEn: o.restaurant_name_en,
        restaurantNameBn: o.restaurant_name_bn,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        customerAddress: o.customer_address,
        customerArea: o.customer_area || "Mathbaria Town",
        items: o.items || [],
        total: Number(o.total),
        riderFee: o.rider_fee ? Number(o.rider_fee) : 35,
        paymentMethod: o.payment_method,
      }));

      const fallback = defaultStats[riderId] || { totalEarnings: 0, completedCount: 0 };
      const calculatedEarnings = deliveries.reduce((sum, d) => sum + d.riderFee, 0) + fallback.totalEarnings;
      const calculatedCount = deliveries.length + fallback.completedCount;

      return {
        totalEarnings: calculatedEarnings,
        completedCount: calculatedCount,
        deliveries,
      };
    } catch (e) {
      console.warn("getEarnings error:", e);
      const fallback = defaultStats[riderId] || { totalEarnings: 0, completedCount: 0 };
      return { ...fallback, deliveries: [] };
    }
  },
};
