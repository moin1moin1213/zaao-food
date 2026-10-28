"use client";

import React from "react";
import { useCart } from "@/services/cartStore";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Store, ArrowRight, AlertCircle, X } from "lucide-react";

export function RestaurantConflictModal() {
  const { conflict, confirmReplaceCart, cancelConflict } = useCart();
  const { lang, t } = useLanguage();

  if (!conflict) return null;

  const currentName = lang === "bn" ? conflict.currentRestaurantNameBn : conflict.currentRestaurantNameEn;
  const newName = lang === "bn" ? conflict.newRestaurantNameBn : conflict.newRestaurantNameEn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
              {t.cart.restaurantConflictTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={cancelConflict}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {t.cart.restaurantConflictDesc}
          </p>

          <div className="bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {lang === "bn" ? "বর্তমান রেস্তোরাঁ:" : "Current:"}
              </span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{currentName}</span>
            </div>
            <div className="flex items-center justify-center text-gray-400">
              <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0" />
            </div>
            <div className="flex items-center justify-between text-xs text-orange-600 dark:text-orange-400">
              <span className="font-semibold">{lang === "bn" ? "নতুন রেস্তোরাঁ:" : "New:"}</span>
              <span className="font-bold text-[#FF6B1A]">{newName}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={cancelConflict}
            className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-colors"
          >
            {t.cart.keepExisting}
          </button>
          <button
            type="button"
            onClick={() => confirmReplaceCart(conflict.pendingItem)}
            className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#FF6B1A] hover:bg-[#E85B0D] shadow-md transition-all active:scale-95"
          >
            {t.cart.replaceCart}
          </button>
        </div>
      </div>
    </div>
  );
}
