import { NotificationItem } from "./types";
import { MOCK_NOTIFICATIONS } from "./mockData";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage/safeStorage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

const NOTIFICATIONS_STORAGE_KEY = "user_notifications_list";

export const notificationService = {
  async getNotifications(userPhone?: string): Promise<NotificationItem[]> {
    if (supabase && isSupabaseConfigured) {
      try {
        let query = supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (userPhone) {
          query = query.or(`recipient_id.eq.${userPhone},recipient_id.is.null`);
        } else {
          query = query.or(`recipient_role.eq.customer,recipient_id.is.null`);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((n) => ({
            id: n.id,
            titleEn: n.title_en,
            titleBn: n.title_bn,
            messageEn: n.message_en,
            messageBn: n.message_bn,
            category: n.category as any,
            isRead: n.is_read,
            createdAt: n.created_at,
            link: n.link,
          }));
        }
      } catch (err) {
        console.warn("Supabase notifications fetch error, using local fallback:", err);
      }
    }

    const stored = safeLocalStorageGet<NotificationItem[]>(NOTIFICATIONS_STORAGE_KEY, []);
    if (!stored || stored.length === 0) {
      safeLocalStorageSet(NOTIFICATIONS_STORAGE_KEY, MOCK_NOTIFICATIONS);
      return MOCK_NOTIFICATIONS;
    }
    return stored;
  },

  async markAsRead(id: string): Promise<NotificationItem[]> {
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", id);
      } catch (err) {
        console.warn("Supabase markAsRead error:", err);
      }
    }

    const list = await this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    safeLocalStorageSet(NOTIFICATIONS_STORAGE_KEY, updated);
    return updated;
  },

  async markAllAsRead(): Promise<NotificationItem[]> {
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("is_read", false);
      } catch (err) {
        console.warn("Supabase markAllAsRead error:", err);
      }
    }

    const list = await this.getNotifications();
    const updated = list.map((n) => ({ ...n, isRead: true }));
    safeLocalStorageSet(NOTIFICATIONS_STORAGE_KEY, updated);
    return updated;
  },

  async getUnreadCount(userPhone?: string): Promise<number> {
    const list = await this.getNotifications(userPhone);
    return list.filter((n) => !n.isRead).length;
  },
};
