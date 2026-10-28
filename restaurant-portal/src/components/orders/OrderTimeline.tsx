"use client";

import React from "react";
import { CheckCircle2, Clock, ChefHat, Package, Bike, Truck, Home, XCircle } from "lucide-react";
import { OrderStatus } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  className?: string;
}

const STAGES: { key: OrderStatus; icon: React.ElementType }[] = [
  { key: "placed", icon: Clock },
  { key: "accepted", icon: CheckCircle2 },
  { key: "preparing", icon: ChefHat },
  { key: "ready_for_pickup", icon: Package },
  { key: "rider_picked_up", icon: Bike },
  { key: "on_the_way", icon: Truck },
  { key: "delivered", icon: Home },
];

export function OrderTimeline({ currentStatus, className = "" }: OrderTimelineProps) {
  const { t } = useLanguage();

  if (currentStatus === "cancelled") {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-rose-700 dark:text-rose-400">
        <XCircle className="w-6 h-6 shrink-0" />
        <div>
          <div className="font-bold text-sm">{t.tracking.stages.cancelled}</div>
          <div className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
            {t.tracking.stageDescriptions.cancelled}
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === currentStatus);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          return (
            <div key={stage.key} className="relative flex items-start group">
              {/* Step indicator node */}
              <div
                className={`absolute -left-6 sm:-left-8 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all ${
                  isCurrent
                    ? "bg-[#FF6B1A] border-white dark:border-gray-900 text-white ring-4 ring-orange-200 dark:ring-orange-950 scale-110"
                    : isDone
                    ? "bg-emerald-500 border-white dark:border-gray-900 text-white"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>

              {/* Step content */}
              <div className="ml-3 sm:ml-4">
                <div
                  className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${
                    isCurrent
                      ? "text-[#FF6B1A]"
                      : isDone
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  <span>{t.tracking.stages[stage.key]}</span>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 dark:bg-orange-950 text-[#FF6B1A] animate-pulse">
                      Live
                    </span>
                  )}
                </div>

                <div
                  className={`text-xs mt-0.5 leading-relaxed ${
                    isCurrent
                      ? "text-gray-700 dark:text-gray-300 font-medium"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {t.tracking.stageDescriptions[stage.key]}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
