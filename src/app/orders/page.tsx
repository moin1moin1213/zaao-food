"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt, ArrowRight, RotateCcw, Clock, ShieldAlert } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { orderService } from "@/services/orderService";
import { Order } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function OrdersPage() {
  const { lang, t, formatPrice } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"current" | "past">("current");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const data = await orderService.getOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const currentOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const pastOrders = orders.filter((o) => o.status === "delivered" || o.status === "cancelled");
  const displayedOrders = activeTab === "current" ? currentOrders : pastOrders;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
            {t.orders.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t.orders.subtitle}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-100/60 dark:bg-orange-950/40 text-[#FF6B1A] text-xs font-semibold self-start sm:self-auto">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{t.common.devPreview}</span>
        </div>
      </div>

      {/* Tabs: Active Orders vs Past Orders */}
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("current")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "current"
              ? "bg-[#FF6B1A] text-white shadow-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
          }`}
        >
          {t.orders.currentOrders} ({currentOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("past")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "past"
              ? "bg-[#FF6B1A] text-white shadow-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
          }`}
        >
          {t.orders.pastOrders} ({pastOrders.length})
        </button>
      </div>

      {/* Orders List */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : displayedOrders.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-8 h-8" />}
          title={t.orders.noOrders}
          description={t.orders.noOrdersDesc}
          actionLabel={t.home.browseFoods}
          actionHref="/foods"
        />
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString(
              lang === "bn" ? "bn-BD" : "en-US",
              { year: "numeric", month: "short", day: "numeric" }
            );

            return (
              <div
                key={order.id}
                className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B1A] flex items-center justify-center font-black text-xs">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                        {order.id}
                      </div>
                      <div className="text-xs text-gray-400">
                        {order.restaurantNameBn && lang === "bn" ? order.restaurantNameBn : order.restaurantNameEn} • {formattedDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <StatusBadge type="status" status={order.status} />
                  </div>
                </div>

                {/* Items Summary preview */}
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {order.items.map((item) => (
                    <div key={item.cartItemId} className="flex justify-between items-center">
                      <span>
                        {item.quantity}x {lang === "bn" ? item.nameBn : item.nameEn}
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer and Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="text-sm font-black text-gray-900 dark:text-gray-100">
                    <span className="text-xs font-normal text-gray-400 mr-2">{t.common.total}:</span>
                    <span className="text-[#FF6B1A]">{formatPrice(order.pricing.total)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B1A] hover:bg-[#E85B0D] shadow-xs transition-transform active:scale-95"
                    >
                      <span>{t.orders.track}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
