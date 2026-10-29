"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  User,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Banknote,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { MapLocationPicker } from "@/components/checkout/MapLocationPicker";
import { checkoutFormSchema, CheckoutFormData } from "@/lib/validation/schemas";
import { useCart } from "@/services/cartStore";
import { orderService } from "@/services/orderService";
import { authService } from "@/services/authService";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { POPULAR_LOCATIONS } from "@/lib/pricing/deliveryZoneService";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, discount, total, selectedLocation, clearCart } = useCart();
  const { lang, t, formatPrice } = useLanguage();
  const [selectedPayment, setSelectedPayment] = useState<"cod" | "online">("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | undefined>();

  const currentUser = authService.getCurrentUser();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    defaultValues: {
      fullName: currentUser?.name || "",
      phone: currentUser?.phone || "",
      address: currentUser?.addresses?.[0]?.address || "",
      area: selectedLocation.nameEn,
      instructions: "",
      paymentMethod: "cod",
    },
  });

  if (items.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-xl font-bold">{t.cart.emptyCart}</h2>
        <Link
          href="/foods"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#FF6B1A]"
        >
          {t.cart.startOrdering}
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    setErrorMsg("");

    const parsed = checkoutFormSchema.safeParse(data);
    if (!parsed.success) {
      setErrorMsg(parsed.error.errors[0]?.message || "Invalid form data");
      setIsSubmitting(false);
      return;
    }

    try {
      // Create confirmed customer order
      const newOrder = await orderService.createOrder({
        items,
        customer: {
          name: data.fullName,
          phone: data.phone,
          address: data.address,
          area: data.area,
          instructions: data.instructions,
          latitude: mapCoords?.lat,
          longitude: mapCoords?.lng,
        },
        pricing: {
          subtotal,
          deliveryFee,
          discount,
          total,
        },
        paymentMethod: selectedPayment,
      });

      // Clear the local cart
      clearCart();

      // Redirect to Order Confirmation screen
      router.push(`/order-confirmation/${newOrder.id}`);
    } catch (err: any) {
      console.error("Order submission failed:", err);
      setErrorMsg(
        err.message ||
        (lang === "bn"
          ? "অর্ডার প্রসেস করার সময় একটি সমস্যা হয়েছে।"
          : "An error occurred while creating order.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
          {t.checkout.title}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {lang === "bn" ? "ডেলিভারি ঠিকানা ও যোগাযোগের সঠিক তথ্য নিশ্চিত করুন" : "Confirm delivery address and contact information"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Form Sections 1 to 5 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Customer Contact Details */}
          <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <User className="w-4 h-4 text-[#FF6B1A]" />
              <span>{t.checkout.customerDetails}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.checkout.fullName} *
                </label>
                <input
                  type="text"
                  {...register("fullName", { required: true })}
                  placeholder={t.checkout.fullNamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
                />
                {errors.fullName && (
                  <p className="text-xs text-rose-600 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.checkout.phone} *
                </label>
                <input
                  type="tel"
                  {...register("phone", { required: true })}
                  placeholder={t.checkout.phonePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
                />
                {errors.phone && (
                  <p className="text-xs text-rose-600 mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF6B1A]" />
              <span>{t.checkout.deliveryAddress}</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.checkout.selectArea} *
                </label>
                <select
                  {...register("area", { required: true })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
                >
                  {POPULAR_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.nameEn}>
                      {lang === "bn" ? loc.nameBn : loc.nameEn} ({loc.distanceKm} km)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.checkout.addressDetails} *
                </label>
                <input
                  type="text"
                  {...register("address", { required: true })}
                  placeholder={t.checkout.addressPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
                />
                {errors.address && (
                  <p className="text-xs text-rose-600 mt-1">{errors.address.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Map Location Selection Interface Boundary */}
          <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-3">
            <h2 className="text-base font-black text-gray-900 dark:text-gray-100">
              {t.checkout.mapPicker}
            </h2>
            <MapLocationPicker
              onCoordinatesChange={(c) => setMapCoords(c)}
              selectedAddress={watch("address")}
            />
          </div>

          {/* Section 4: Delivery Instructions */}
          <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-3">
            <h2 className="text-base font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FF6B1A]" />
              <span>{t.checkout.deliveryInstructions}</span>
            </h2>
            <textarea
              {...register("instructions")}
              placeholder={t.checkout.instructionsPlaceholder}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
            />
          </div>

          {/* Section 5: Payment Method */}
          <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-[#FF6B1A]" />
              <span>{t.checkout.paymentMethod}</span>
            </h2>

            <div className="space-y-3">
              {/* Cash On Delivery (Active) */}
              <label
                className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedPayment === "cod"
                    ? "border-[#FF6B1A] bg-orange-50/50 dark:bg-orange-950/20 ring-1 ring-[#FF6B1A]"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={selectedPayment === "cod"}
                  onChange={() => setSelectedPayment("cod")}
                  className="mt-1 text-[#FF6B1A] focus:ring-[#FF6B1A] accent-[#FF6B1A]"
                />
                <div className="flex-1">
                  <div className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#FF6B1A]" />
                    <span>{t.checkout.cashOnDelivery}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {lang === "bn"
                      ? "খাবার বা কেক হাতে পেয়ে সম্পূর্ণ নিরাপদে নগদ টাকায় মূল্য পরিশোধ করুন।"
                      : "Pay physical cash safely to courier upon delivery arrival."}
                  </p>
                </div>
              </label>

              {/* Online Payment (Clearly labeled future integration) */}
              <div className="flex items-start gap-3 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 opacity-70 cursor-not-allowed">
                <input type="radio" disabled className="mt-1" />
                <div className="flex-1">
                  <div className="font-bold text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>{t.checkout.onlinePayment}</span>
                    </span>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {t.checkout.onlinePaymentUnavailable}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    bKash / Nagad / Upay / Visa / Mastercard
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Order Review & Total Summary */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-sm space-y-4 sticky top-24">
            <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
              {t.checkout.finalReview}
            </h3>

            {/* Quick item list */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 text-xs">
              {items.map((i) => (
                <div key={i.cartItemId} className="flex justify-between items-start gap-2">
                  <div className="flex-1 truncate">
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {i.quantity}x
                    </span>{" "}
                    <span>{lang === "bn" ? i.nameBn : i.nameEn}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                    {formatPrice(i.price * i.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Breakdown */}
            <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>{t.common.subtotal}</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.common.deliveryFee}</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-gray-100 dark:border-gray-800 text-base font-black text-gray-900 dark:text-gray-100">
                <span>{t.common.total}</span>
                <span className="text-xl text-[#FF6B1A]">{formatPrice(total)}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-[#FF6B1A] hover:bg-[#E85B0D] disabled:opacity-60 shadow-md transition-all active:scale-98"
            >
              {isSubmitting ? (
                <span>{t.checkout.submitting}</span>
              ) : (
                <>
                  <span>{t.checkout.placeOrder}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
