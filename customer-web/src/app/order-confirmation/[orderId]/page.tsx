"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Home, Receipt, MapPin } from "lucide-react";
import { orderService } from "@/services/orderService";
import { Order } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";

interface OrderConfirmationProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderConfirmationPage({ params }: OrderConfirmationProps) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;

  const { lang, t, formatPrice } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      setLoading(true);
      try {
        const data = await orderService.getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  if (loading) {
    return <LoadingSkeleton count={3} />;
  }

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 space-y-6">
      {/* Success Card Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
          {t.orderConfirmation.title}
        </h1>

        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
          {t.orderConfirmation.subtitle}
        </p>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-4 h-4" />
          <span>{t.orderConfirmation.confirmedNotice}</span>
        </div>
      </div>

      {/* Order Overview Box */}
      <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="text-xs text-gray-400 font-semibold">{t.orderConfirmation.orderId}</div>
            <div className="text-lg font-black text-gray-900 dark:text-gray-100">{orderId}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 font-semibold">{t.orderConfirmation.status}</div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {t.tracking.stages.placed}
            </span>
          </div>
        </div>

        {order && (
          <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-400">{lang === "bn" ? "রেস্তোরাঁ:" : "Restaurant:"}</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {lang === "bn" ? order.restaurantNameBn : order.restaurantNameEn}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">{t.orderConfirmation.paymentMethod}</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {order.paymentMethod === "cod" ? t.checkout.cashOnDelivery : t.checkout.onlinePayment}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">{t.checkout.deliveryAddress}</span>
              <span className="font-bold text-gray-900 dark:text-gray-100 text-right max-w-[240px] truncate">
                {order.customer.address}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-3 border-t border-gray-100 dark:border-gray-800 text-sm font-black text-gray-900 dark:text-gray-100">
              <span>{t.common.total}</span>
              <span className="text-lg text-[#FF6B1A]">{formatPrice(order.pricing.total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Next steps actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href={`/orders/${orderId}`}
          className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-[#FF6B1A] hover:bg-[#E85B0D] shadow-md transition-all active:scale-95"
        >
          <Receipt className="w-4 h-4" />
          <span>{t.orderConfirmation.trackOrder}</span>
        </Link>

        <Link
          href="/"
          className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-bold text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>{t.orderConfirmation.backToHome}</span>
        </Link>
      </div>
    </div>
  );
}
