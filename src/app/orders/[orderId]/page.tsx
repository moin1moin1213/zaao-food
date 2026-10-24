"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Phone,
  Store,
  Bike,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { orderService } from "@/services/orderService";
import { Order, OrderStatus } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface OrderTrackingProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderTrackingPage({ params }: OrderTrackingProps) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;

  const { lang, t, formatPrice, formatNum } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadOrder() {
    try {
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      console.error("Failed to load order tracking:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrder();

    // Polling boundary interface (prepared for Supabase Realtime subscription)
    const interval = setInterval(loadOrder, 15000);
    return () => clearInterval(interval);
  }, [orderId]);



  if (loading) {
    return <LoadingSkeleton count={3} />;
  }

  if (!order) {
    return (
      <EmptyState
        title={t.common.noResults}
        description={lang === "bn" ? "অর্ডারটি পাওয়া যায়নি।" : "Order reference not found."}
        actionLabel={t.nav.orders}
        actionHref="/orders"
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#FF6B1A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.common.back} {t.nav.orders}</span>
        </Link>

        {/* Live Refresh control */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadOrder();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{lang === "bn" ? "স্ট্যাটাস রিফ্রেশ" : "Refresh Status"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Timeline & Map; Right Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: 7-stage Tracking Timeline & Map Placeholder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estimated Arrival Banner */}
          <div className="rounded-3xl border border-orange-100 dark:border-orange-950/60 bg-gradient-to-r from-orange-50/80 via-white to-orange-50/40 dark:from-gray-850 dark:to-gray-850 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-[#FF6B1A] uppercase tracking-wider">
                {lang === "bn" ? "আনুমানিক ডেলিভারি সময়" : "Estimated Arrival"}
              </span>
              <div className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Clock className="w-6 h-6 text-[#FF6B1A]" />
                <span>
                  {order.status === "delivered"
                    ? lang === "bn"
                      ? "পৌঁছে গেছে"
                      : "Delivered"
                    : `${formatNum(order.estimatedDeliveryMinutes || 25)} ${lang === "bn" ? "মিনিট" : "Minutes"}`}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {order.customer.address}
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-400">{t.orderConfirmation.orderId}</div>
              <div className="text-sm font-black text-gray-800 dark:text-gray-200">{order.id}</div>
            </div>
          </div>

          {/* 7-Stage Timeline */}
          <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs">
            <h2 className="text-base font-black text-gray-900 dark:text-gray-100 mb-6">
              {t.tracking.timelineTitle}
            </h2>
            <OrderTimeline currentStatus={order.status} />
          </div>

          {/* Leaflet & OpenStreetMap Live Route Map Boundary */}
          <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                {t.tracking.mapTrackingTitle}
              </h3>
              <span className="text-[11px] font-bold text-gray-400">Mathbaria Bazar Hub</span>
            </div>

            <div className="relative w-full h-52 sm:h-64 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-dashed border-gray-300 dark:border-gray-700 overflow-hidden flex flex-col items-center justify-center text-center p-4">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#FF6B1A_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="relative z-10 flex items-center justify-center gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                    <Store className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 mt-1">
                    {lang === "bn" ? "রেস্তোরাঁ" : "Kitchen"}
                  </span>
                </div>

                <div className="w-20 sm:w-32 h-0.5 bg-dashed border-t-2 border-[#FF6B1A] relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#FF6B1A] text-white flex items-center justify-center text-[10px]">
                    <Bike className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 mt-1">
                    {lang === "bn" ? "আপনার ঠিকানা" : "Destination"}
                  </span>
                </div>
              </div>

              <div className="relative z-10 text-xs text-gray-500 dark:text-gray-400 mt-5 max-w-sm">
                {t.tracking.mapTrackingNotice}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Assigned Courier & Order Details Summary */}
        <div className="space-y-4">
          {/* Rider Details Card */}
          {order.rider && (
            <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-5 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Bike className="w-4 h-4 text-[#FF6B1A]" />
                <span>{t.tracking.riderInfo}</span>
              </h3>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-gray-800 dark:text-gray-200">
                    {order.rider.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {t.tracking.riderVehicle}: {order.rider.vehicle}
                  </div>
                </div>

                <a
                  href={`tel:${order.rider.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t.tracking.callRider}</span>
                </a>
              </div>
            </div>
          )}

          {/* Restaurant Contact Card */}
          <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-5 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Store className="w-4 h-4 text-[#FF6B1A]" />
              <span>{lang === "bn" ? order.restaurantNameBn : order.restaurantNameEn}</span>
            </h3>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{order.restaurantPhone}</span>
              <a
                href={`tel:${order.restaurantPhone}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-[#FF6B1A] bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{t.tracking.callRestaurant}</span>
              </a>
            </div>
          </div>

          {/* Order Items Breakdown */}
          <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-5 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-100 dark:border-gray-800">
              {t.cart.orderSummary}
            </h3>

            <div className="space-y-2 text-xs">
              {order.items.map((i) => (
                <div key={i.cartItemId} className="flex justify-between items-start">
                  <div>
                    <span className="font-bold">{i.quantity}x</span>{" "}
                    <span>{lang === "bn" ? i.nameBn : i.nameEn}</span>
                    {i.customMessage && (
                      <div className="text-[11px] text-pink-600 italic">"{i.customMessage}"</div>
                    )}
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {formatPrice(i.price * i.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex justify-between">
                <span>{t.common.subtotal}</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatPrice(order.pricing.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t.common.deliveryFee}</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatPrice(order.pricing.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-gray-100 dark:border-gray-800 text-sm font-black text-gray-900 dark:text-gray-100">
                <span>{t.common.total}</span>
                <span className="text-base text-[#FF6B1A]">{formatPrice(order.pricing.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
