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
}

export const riderService = {
  // 1. Update Online/Offline State in Supabase
  async setOnlineStatus(riderId: string, isOnline: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("riders")
        .update({ is_online: isOnline, updated_at: new Date().toISOString() })
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", riderId);
      return !error;
    } catch (e) {
      console.warn("updateLocation error:", e);
      return false;
    }
  },

  // 3. Fetch Delivery Requests & Active Orders
  async getDeliveryRequests(riderId: string): Promise<{
    available: RiderOrder[];
    active: RiderOrder | null;
  }> {
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
      }));

      // Active order assigned to this rider in progress
      const active =
        allOrders.find(
          (o: any) =>
            (o.status === "ready_for_pickup" ||
              o.status === "rider_picked_up" ||
              o.status === "on_the_way") &&
            (o as any).rider_id === riderId
        ) || null;

      // Available orders waiting for a rider
      const available = allOrders.filter(
        (o) =>
          (o.status === "ready_for_pickup" || o.status === "accepted" || o.status === "preparing") &&
          !(o as any).rider_id
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
          rider_id: rider.id,
          rider_name: rider.name,
          rider_phone: rider.phone,
          rider_vehicle: rider.vehicle,
          status: "ready_for_pickup",
          updated_at: new Date().toISOString(),
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
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "delivered") {
        updateData.payment_status = "paid";
      }

      const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);

      if (newStatus === "delivered") {
        // Increment rider stats
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
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("rider_id", riderId)
        .eq("status", "delivered")
        .order("updated_at", { ascending: false });

      if (error || !data) {
        return { totalEarnings: 0, completedCount: 0, deliveries: [] };
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
        customerArea: o.customer_area,
        items: o.items || [],
        total: Number(o.total),
        riderFee: o.rider_fee ? Number(o.rider_fee) : 35,
        paymentMethod: o.payment_method,
      }));

      const totalEarnings = deliveries.reduce((sum, d) => sum + d.riderFee, 0);

      return {
        totalEarnings,
        completedCount: deliveries.length,
        deliveries,
      };
    } catch (e) {
      return { totalEarnings: 0, completedCount: 0, deliveries: [] };
    }
  },
};
