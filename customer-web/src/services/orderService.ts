import { Order, OrderStatus, CartItem, OrderCustomer, OrderPricing } from "./types";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage/safeStorage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

const ORDERS_STORAGE_KEY = "customer_orders_list";

export const orderService = {
  async getOrders(): Promise<Order[]> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
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
            estimatedDeliveryMinutes: o.estimated_delivery_minutes,
            rider: o.rider_name
              ? {
                  name: o.rider_name,
                  phone: o.rider_phone,
                  vehicle: o.rider_vehicle || "Motorbike",
                }
              : undefined,
          }));
        }
      } catch (err) {
        console.warn("Supabase orders query error, falling back to local:", err);
      }
    }

    return safeLocalStorageGet<Order[]>(ORDERS_STORAGE_KEY, []) || [];
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            createdAt: data.created_at,
            status: data.status,
            items: data.items,
            restaurantId: data.restaurant_id,
            restaurantNameEn: data.restaurant_name_en,
            restaurantNameBn: data.restaurant_name_bn,
            restaurantPhone: data.restaurant_phone,
            customer: {
              name: data.customer_name,
              phone: data.customer_phone,
              address: data.customer_address,
              area: data.customer_area,
              instructions: data.customer_instructions,
              latitude: data.customer_lat,
              longitude: data.customer_lng,
            },
            pricing: {
              subtotal: Number(data.subtotal),
              deliveryFee: Number(data.delivery_fee),
              discount: Number(data.discount),
              total: Number(data.total),
            },
            paymentMethod: data.payment_method,
            paymentStatus: data.payment_status,
            estimatedDeliveryMinutes: data.estimated_delivery_minutes,
            rider: data.rider_name
              ? {
                  name: data.rider_name,
                  phone: data.rider_phone,
                  vehicle: data.rider_vehicle || "Motorbike",
                }
              : undefined,
          };
        }
      } catch (err) {
        console.warn("Supabase getOrderById error, checking local:", err);
      }
    }

    const orders = await this.getOrders();
    const found = orders.find((o) => o.id.toLowerCase() === orderId.toLowerCase());
    return found || null;
  },

  async createOrder(params: {
    items: CartItem[];
    customer: OrderCustomer;
    pricing: OrderPricing;
    paymentMethod: "cod" | "online";
    couponCode?: string;
  }): Promise<Order> {
    // 1. Prioritize Secure Server-Side Order Creation & Validation
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: params.items,
          customer: params.customer,
          paymentMethod: params.paymentMethod,
          couponCode: params.couponCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "অর্ডার প্রক্রিয়াকরণে সমস্যা হয়েছে।");
      }

      if (data.success && data.order) {
        // Cache to local storage for offline history
        const currentOrders = safeLocalStorageGet<Order[]>(ORDERS_STORAGE_KEY, []) || [];
        const updated = [data.order, ...currentOrders.filter((o) => o.id !== data.order.id)];
        safeLocalStorageSet(ORDERS_STORAGE_KEY, updated);
        return data.order;
      }
    } catch (err: any) {
      if (err.message && !err.message.includes("fetch")) {
        // Validation error from server (e.g. out of zone, store closed)
        throw err;
      }
      console.warn("Server order API unreachable, attempting offline local creation:", err);
    }

    // 2. Offline / Demo Fallback Mode
    const orderNum = Math.floor(10000 + Math.random() * 90000);
    const newOrder: Order = {
      id: `PF-${orderNum}`,
      createdAt: new Date().toISOString(),
      status: "placed",
      items: params.items,
      restaurantId: params.items[0]?.restaurantId || "rest-1",
      restaurantNameEn: params.items[0]?.restaurantNameEn || "PenguFood Kitchen",
      restaurantNameBn: params.items[0]?.restaurantNameBn || "পেঙ্গুফুড কিচেন",
      restaurantPhone: "+880 1711-223344",
      customer: params.customer,
      pricing: params.pricing,
      paymentMethod: params.paymentMethod,
      paymentStatus: "pending",
      estimatedDeliveryMinutes: 30,
      rider: undefined,
    };

    // Save to local storage cache
    const currentOrders = safeLocalStorageGet<Order[]>(ORDERS_STORAGE_KEY, []) || [];
    const updated = [newOrder, ...currentOrders];
    safeLocalStorageSet(ORDERS_STORAGE_KEY, updated);

    return newOrder;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from("orders").update({ status }).eq("id", orderId);
      } catch (err) {
        console.warn("Supabase status update error:", err);
      }
    }

    const currentOrders = await this.getOrders();
    const idx = currentOrders.findIndex((o) => o.id.toLowerCase() === orderId.toLowerCase());
    if (idx === -1) return null;

    currentOrders[idx].status = status;
    safeLocalStorageSet(ORDERS_STORAGE_KEY, currentOrders);
    return currentOrders[idx];
  },
};
