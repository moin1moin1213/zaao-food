"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trash2, ArrowRight, ShoppingBag, MapPin, Tag } from "lucide-react";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { EmptyState } from "@/components/common/EmptyState";
import { useCart } from "@/services/cartStore";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function CartPage() {
  const { items, subtotal, deliveryFee, discount, total, clearCart, selectedLocation } = useCart();
  const { lang, t, formatPrice } = useLanguage();
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim()) {
      setPromoMessage(
        lang === "bn"
          ? "প্রোমো কোড সার্ভিসটি ব্যাকএন্ড ফেজ ২-এ সক্রিয় হবে।"
          : "Promo validation service will be activated in Phase 2 backend."
      );
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="w-8 h-8" />}
        title={t.cart.emptyCart}
        description={t.cart.emptyCartDesc}
        actionLabel={t.cart.startOrdering}
        actionHref="/foods"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
            {t.cart.title}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {items[0].restaurantNameBn && lang === "bn" ? items[0].restaurantNameBn : items[0].restaurantNameEn}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsClearModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t.cart.clearCart}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart items list */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <CartItemRow key={item.cartItemId} item={item} />
          ))}

          <div className="pt-2">
            <Link
              href="/foods"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#FF6B1A] hover:underline"
            >
              <span>← {t.common.continueShopping}</span>
            </Link>
          </div>
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
              {t.cart.orderSummary}
            </h3>

            {/* Delivery address info */}
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-xs">
              <MapPin className="w-4 h-4 text-[#FF6B1A] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-800 dark:text-gray-200 block">
                  {lang === "bn" ? selectedLocation.nameBn : selectedLocation.nameEn}
                </span>
                <span className="text-gray-500 text-[11px]">
                  {selectedLocation.distanceKm} km {lang === "bn" ? "দূরত্ব" : "away"}
                </span>
              </div>
            </div>

            {/* Promo code box */}
            <form onSubmit={handleApplyPromo} className="space-y-1">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder={lang === "bn" ? "প্রোমো কোড (ঐচ্ছিক)" : "Promo code (Optional)"}
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B1A]"
                  />
                  <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
                <button
                  type="submit"
                  disabled={!promoCode.trim()}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  {lang === "bn" ? "প্রয়োগ" : "Apply"}
                </button>
              </div>
              {promoMessage && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  {promoMessage}
                </div>
              )}
            </form>

            {/* Price Breakdown */}
            <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>{t.common.subtotal}</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>{t.common.deliveryFee}</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatPrice(deliveryFee)}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>{t.common.discount}</span>
                  <span className="font-bold">-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-3 border-t border-gray-100 dark:border-gray-800 text-sm font-black text-gray-900 dark:text-gray-100">
                <span>{t.common.total}</span>
                <span className="text-xl text-[#FF6B1A]">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Proceed to checkout button */}
            <Link
              href="/checkout"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-[#FF6B1A] hover:bg-[#E85B0D] shadow-md transition-all active:scale-98"
            >
              <span>{t.cart.proceedToCheckout}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title={t.cart.clearCartConfirmTitle}
        description={t.cart.clearCartConfirmDesc}
        confirmLabel={t.cart.clearCart}
        isDestructive
        onConfirm={() => {
          clearCart();
          setIsClearModalOpen(false);
        }}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
}
