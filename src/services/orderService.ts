import { Order, OrderStatus, CartItem, OrderCustomer, OrderPricing } from "./types";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage/safeStorage";

const ORDERS_STORAGE_KEY = "customer_orders_list";

export const orderService = {
  async getOrders(): Promise<Order[]> {
    return safeLocalStorageGet<Order[]>(ORDERS_STORAGE_KEY, []) || [];
  },

  async getOrderById(orderId: string): Promise<Order | null> {
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
      id: `ZF-${orderNum}`,
      createdAt: new Date().toISOString(),
      status: "placed",
      items: params.items,
      restaurantId: params.items[0]?.restaurantId || "rest-unknown",
      restaurantNameEn: params.items[0]?.restaurantNameEn || "Zaao Food Kitchen",
      restaurantNameBn: params.items[0]?.restaurantNameBn || "ঝাও ফুড কিচেন",
      restaurantPhone: "+880 1711-223344",
      customer: params.customer,
      pricing: params.pricing,
      paymentMethod: params.paymentMethod,
      paymentStatus: "pending",
      estimatedDeliveryMinutes: 30,
      rider: {
        name: "Zaao Delivery Rider",
        phone: "+880 1819-998877",
        vehicle: "Delivery Bike",
      },
    };

    const currentOrders = await this.getOrders();
    const updated = [newOrder, ...currentOrders];
    safeLocalStorageSet(ORDERS_STORAGE_KEY, updated);

    return newOrder;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    const currentOrders = await this.getOrders();
    const idx = currentOrders.findIndex((o) => o.id.toLowerCase() === orderId.toLowerCase());
    if (idx === -1) return null;

    currentOrders[idx].status = status;
    safeLocalStorageSet(ORDERS_STORAGE_KEY, currentOrders);
    return currentOrders[idx];
  },
};
