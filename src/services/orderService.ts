import { Order, OrderStatus, CartItem, OrderCustomer, OrderPricing } from "./types";
import { MOCK_SAMPLE_ORDERS } from "./mockData";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage/safeStorage";

const ORDERS_STORAGE_KEY = "customer_orders_list";

export const orderService = {
  async getOrders(): Promise<Order[]> {
    const stored = safeLocalStorageGet<Order[]>(ORDERS_STORAGE_KEY, []);
    if (!stored || stored.length === 0) {
      // Seed with initial sample development orders
      safeLocalStorageSet(ORDERS_STORAGE_KEY, MOCK_SAMPLE_ORDERS);
      return MOCK_SAMPLE_ORDERS;
    }
    return stored;
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const orders = await this.getOrders();
    const found = orders.find((o) => o.id.toLowerCase() === orderId.toLowerCase());
    return found || null;
  },

  async createPreviewOrder(params: {
    items: CartItem[];
    customer: OrderCustomer;
    pricing: OrderPricing;
    paymentMethod: "cod" | "online";
  }): Promise<Order> {
    const orderNum = Math.floor(10000 + Math.random() * 90000);
    const newOrder: Order = {
      id: `ZA-${orderNum}`,
      isPreview: true,
      createdAt: new Date().toISOString(),
      status: "placed",
      items: params.items,
      restaurantId: params.items[0]?.restaurantId || "rest-unknown",
      restaurantNameEn: params.items[0]?.restaurantNameEn || "Zaao Food Partner",
      restaurantNameBn: params.items[0]?.restaurantNameBn || "ঝাও ফুড পার্টনার",
      restaurantPhone: "+880 1711-000000",
      customer: params.customer,
      pricing: params.pricing,
      paymentMethod: params.paymentMethod,
      paymentStatus: "pending",
      estimatedDeliveryMinutes: 30,
      rider: {
        name: "Zaao Rider (Assigned upon dispatch)",
        phone: "+880 1800-000000",
        vehicle: "Bicycle / Bike",
      },
    };

    const currentOrders = await this.getOrders();
    const updated = [newOrder, ...currentOrders];
    safeLocalStorageSet(ORDERS_STORAGE_KEY, updated);

    return newOrder;
  },

  /**
   * Mock simulation of status progression for development preview testing.
   * Supabase Realtime channel subscription boundary will replace this.
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    const currentOrders = await this.getOrders();
    const idx = currentOrders.findIndex((o) => o.id === orderId);
    if (idx === -1) return null;

    currentOrders[idx].status = status;
    safeLocalStorageSet(ORDERS_STORAGE_KEY, currentOrders);
    return currentOrders[idx];
  },
};
