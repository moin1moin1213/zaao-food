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
  }): Promise<Order> {
    const orderNum = Math.floor(10000 + Math.random() * 90000);
    const newOrder: Order = {
      id: `PF-${orderNum}`,
      createdAt: new Date().toISOString(),
      status: "placed",
      items: params.items,
      restaurantId: params.items[0]?.restaurantId || "rest_1",
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

    // Save to Supabase if configured
    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("orders").insert({
          id: newOrder.id,
          created_at: newOrder.createdAt,
          status: newOrder.status,
          restaurant_id: newOrder.restaurantId,
          restaurant_name_en: newOrder.restaurantNameEn,
          restaurant_name_bn: newOrder.restaurantNameBn,
          restaurant_phone: newOrder.restaurantPhone,
          customer_name: newOrder.customer.name,
          customer_phone: newOrder.customer.phone,
          customer_address: newOrder.customer.address,
          customer_area: newOrder.customer.area,
          customer_instructions: newOrder.customer.instructions,
          customer_lat: newOrder.customer.latitude,
          customer_lng: newOrder.customer.longitude,
          items: newOrder.items,
          subtotal: newOrder.pricing.subtotal,
          delivery_fee: newOrder.pricing.deliveryFee,
          discount: newOrder.pricing.discount,
          total: newOrder.pricing.total,
          payment_method: newOrder.paymentMethod,
          payment_status: newOrder.paymentStatus,
          estimated_delivery_minutes: newOrder.estimatedDeliveryMinutes,
        });

        if (error) {
          console.warn("Supabase order insert warning:", error);
        } else {
          // Increment sales count for each product in this order
          for (const item of newOrder.items) {
            if (item.productId) {
              try {
                await supabase.rpc("increment_sales_count", {
                  prod_id: item.productId,
                  qty: item.quantity || 1,
                });
              } catch (rpcErr) {
                // Silently ignore if rpc not created yet
              }
            }
          }
        }
      } catch (err) {
        console.warn("Supabase order insert failed, saved locally:", err);
      }
    }

    // Save to local storage cache as well
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
