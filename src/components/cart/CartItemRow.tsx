"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Calendar, MessageSquare, Sparkles } from "lucide-react";
import { CartItem } from "@/services/types";
import { QuantitySelector } from "../common/QuantitySelector";
import { PriceDisplay } from "../common/PriceDisplay";
import { useCart } from "@/services/cartStore";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCart();
  const { lang } = useLanguage();

  const name = lang === "bn" ? item.nameBn : item.nameEn;
  const restaurantName = lang === "bn" ? item.restaurantNameBn : item.restaurantNameEn;
  const sizeLabel = item.selectedSize ? (lang === "bn" ? item.selectedSize.labelBn : item.selectedSize.labelEn) : null;
  const flavorLabel = item.selectedFlavor ? (lang === "bn" ? item.selectedFlavor.nameBn : item.selectedFlavor.nameEn) : null;

  return (
    <div className="flex gap-3 sm:gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 shadow-2xs items-start">
      {/* Product Image */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
        <Image src={item.image} alt={name} fill sizes="96px" className="object-cover" />
        {item.isCake && (
          <div className="absolute top-1 left-1 bg-pink-600 text-white rounded p-0.5 text-[10px]">
            <Sparkles className="w-2.5 h-2.5" />
          </div>
        )}
      </div>

      {/* Details & Controls */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {restaurantName}
            </div>
            <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-1">
              {name}
            </h4>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.cartItemId)}
            aria-label="Remove item"
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Cake Options if present */}
        {item.isCake && (
          <div className="mt-1 space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
            {sizeLabel && (
              <div>
                <span className="font-medium text-gray-500 dark:text-gray-400">
                  {lang === "bn" ? "সাইজ: " : "Size: "}
                </span>
                {sizeLabel}
              </div>
            )}
            {flavorLabel && (
              <div>
                <span className="font-medium text-gray-500 dark:text-gray-400">
                  {lang === "bn" ? "ফ্লেভার: " : "Flavor: "}
                </span>
                {flavorLabel}
              </div>
            )}
            {item.customMessage && (
              <div className="flex items-center gap-1 text-pink-700 dark:text-pink-400">
                <MessageSquare className="w-3 h-3 shrink-0" />
                <span className="truncate italic">"{item.customMessage}"</span>
              </div>
            )}
            {item.requestedDeliveryDate && (
              <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>
                  {lang === "bn" ? "কাঙ্ক্ষিত তারিখ: " : "Requested: "}
                  {item.requestedDeliveryDate}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Price and Quantity Selector */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <PriceDisplay price={item.price * item.quantity} size="sm" />

          <QuantitySelector
            quantity={item.quantity}
            onIncrease={() => updateQuantity(item.cartItemId, 1)}
            onDecrease={() => updateQuantity(item.cartItemId, -1)}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
