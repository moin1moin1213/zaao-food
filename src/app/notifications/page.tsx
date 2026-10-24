"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Tag, Info, Receipt, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { notificationService } from "@/services/notificationService";
import { NotificationItem } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function NotificationsPage() {
  const { lang, t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<"all" | "order" | "promo" | "system">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifs() {
      setLoading(true);
      try {
        const list = await notificationService.getNotifications();
        setNotifications(list);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifs();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    const updated = await notificationService.markAsRead(id);
    setNotifications(updated);
  };

  const handleMarkAllAsRead = async () => {
    const updated = await notificationService.markAllAsRead();
    setNotifications(updated);
  };

  const filtered = activeCategory === "all"
    ? notifications
    : notifications.filter((n) => n.category === activeCategory);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#FF6B1A]" />
            <span>{t.notifications.title}</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {unreadCount > 0
              ? lang === "bn"
                ? `${unreadCount}টি অপঠিত বিজ্ঞপ্তি রয়েছে`
                : `${unreadCount} unread notifications`
              : lang === "bn"
              ? "সকল বিজ্ঞপ্তি পড়া হয়েছে"
              : "All caught up"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#FF6B1A] bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{t.notifications.markAllRead}</span>
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(["all", "order", "promo", "system"] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeCategory === cat
                ? "bg-[#FF6B1A] text-white shadow-xs"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            {cat === "all" && t.notifications.all}
            {cat === "order" && t.notifications.orders}
            {cat === "promo" && t.notifications.promos}
            {cat === "system" && t.notifications.system}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8" />}
          title={t.notifications.empty}
          description={t.notifications.emptyDesc}
          actionLabel={t.nav.home}
          actionHref="/"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const title = lang === "bn" ? item.titleBn : item.titleEn;
            const message = lang === "bn" ? item.messageBn : item.messageEn;
            const formattedDate = new Date(item.createdAt).toLocaleDateString(
              lang === "bn" ? "bn-BD" : "en-US",
              { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
            );

            return (
              <div
                key={item.id}
                onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all ${
                  item.isRead
                    ? "bg-white dark:bg-gray-850 border-gray-100 dark:border-gray-800"
                    : "bg-orange-50/40 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50 shadow-2xs"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.category === "order"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                      : item.category === "promo"
                      ? "bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400"
                      : "bg-orange-100 text-[#FF6B1A] dark:bg-orange-950 dark:text-orange-400"
                  }`}
                >
                  {item.category === "order" ? (
                    <Receipt className="w-4 h-4" />
                  ) : item.category === "promo" ? (
                    <Tag className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm truncate ${item.isRead ? "font-bold text-gray-800 dark:text-gray-200" : "font-black text-gray-900 dark:text-gray-100"}`}>
                      {title}
                    </h3>
                    <span className="text-[10px] text-gray-400 shrink-0">{formattedDate}</span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    {message}
                  </p>

                  {item.link && (
                    <Link
                      href={item.link}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B1A] hover:underline mt-2"
                    >
                      <span>{lang === "bn" ? "বিস্তারিত দেখুন" : "View"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
