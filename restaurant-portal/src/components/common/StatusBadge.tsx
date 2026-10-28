"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { OrderStatus } from "@/services/types";

interface StatusBadgeProps {
  type?: "status" | "tag" | "availability";
  status?: OrderStatus;
  label?: string;
  variant?: "success" | "warning" | "error" | "info" | "neutral" | "orange";
  className?: string;
}

export function StatusBadge({ type = "tag", status, label, variant = "neutral", className = "" }: StatusBadgeProps) {
  const { t } = useLanguage();

  if (type === "status" && status) {
    const statusLabels: Record<OrderStatus, string> = {
      placed: t.tracking.stages.placed,
      accepted: t.tracking.stages.accepted,
      preparing: t.tracking.stages.preparing,
      ready_for_pickup: t.tracking.stages.ready_for_pickup,
      rider_picked_up: t.tracking.stages.rider_picked_up,
      on_the_way: t.tracking.stages.on_the_way,
      delivered: t.tracking.stages.delivered,
      cancelled: t.tracking.stages.cancelled,
    };

    const statusStyles: Record<OrderStatus, string> = {
      placed: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      accepted: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      preparing: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      ready_for_pickup: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
      rider_picked_up: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      on_the_way: "bg-orange-50 text-[#FF6B1A] dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800",
      delivered: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      cancelled: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyles[status]} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
        {statusLabels[status] || status}
      </span>
    );
  }

  const variantStyles = {
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    error: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    info: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    orange: "bg-orange-50 text-[#FF6B1A] dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {label}
    </span>
  );
}
