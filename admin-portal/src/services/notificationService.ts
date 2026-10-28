import { NotificationItem } from "./types";
import { MOCK_NOTIFICATIONS } from "./mockData";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage/safeStorage";

const NOTIFICATIONS_STORAGE_KEY = "user_notifications_list";

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    const stored = safeLocalStorageGet<NotificationItem[]>(NOTIFICATIONS_STORAGE_KEY, []);
    if (!stored || stored.length === 0) {
      safeLocalStorageSet(NOTIFICATIONS_STORAGE_KEY, MOCK_NOTIFICATIONS);
      return MOCK_NOTIFICATIONS;
    }
    return stored;
  },

  async markAsRead(id: string): Promise<NotificationItem[]> {
    const list = await this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    safeLocalStorageSet(NOTIFICATIONS_STORAGE_KEY, updated);
    return updated;
  },

  async markAllAsRead(): Promise<NotificationItem[]> {
    const list = await this.getNotifications();
    const updated = list.map((n) => ({ ...n, isRead: true }));
    safeLocalStorageSet(NOTIFICATIONS_STORAGE_KEY, updated);
    return updated;
  },

  async getUnreadCount(): Promise<number> {
    const list = await this.getNotifications();
    return list.filter((n) => !n.isRead).length;
  },
};
