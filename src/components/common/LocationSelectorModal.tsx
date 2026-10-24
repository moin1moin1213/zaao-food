"use client";

import React, { useState } from "react";
import { MapPin, X, Check, Navigation, Info } from "lucide-react";
import { useCart } from "@/services/cartStore";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { POPULAR_LOCATIONS, DeliveryLocationOption, calculateDeliveryFee } from "@/lib/pricing/deliveryZoneService";

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationSelectorModal({ isOpen, onClose }: LocationSelectorModalProps) {
  const { selectedLocation, setSelectedLocation, hasCakes } = useCart();
  const { lang, formatPrice, formatNum } = useLanguage();
  const [customDistance, setCustomDistance] = useState<string>("");

  if (!isOpen) return null;

  const handleSelect = (loc: DeliveryLocationOption) => {
    setSelectedLocation(loc);
    onClose();
  };

  const handleCustomApply = () => {
    const dist = parseFloat(customDistance);
    if (!isNaN(dist) && dist > 0) {
      const customLoc: DeliveryLocationOption = {
        id: `custom-${Date.now()}`,
        nameEn: `Custom Location (${dist} km)`,
        nameBn: `কাস্টম লোকেশন (${formatNum(dist)} কিমি)`,
        distanceKm: dist,
        areaType: dist <= 3 ? "town_area" : dist <= 8 ? "suburban_union" : "outer_zone",
      };
      setSelectedLocation(customLoc);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-[#FF6B1A] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                {lang === "bn" ? "ডেলিভারি লোকেশন নির্বাচন করুন" : "Select Delivery Location"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lang === "bn" ? "মঠবাড়িয়া বাজার কেন্দ্র থেকে দূরত্ব অনুযায়ী ফি নির্ধারিত হবে" : "Fees calculated from Mathbaria Bazar hub"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-4 space-y-2 flex-1 pr-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            {lang === "bn" ? "মঠবাড়িয়ার জনপ্রিয় এলাকাসমূহ" : "Popular Mathbaria Locations"}
          </div>

          {POPULAR_LOCATIONS.map((loc) => {
            const isSelected = selectedLocation.id === loc.id;
            const feeCalc = calculateDeliveryFee(loc.distanceKm, hasCakes);
            const isAvailable = loc.distanceKm <= 8.0;

            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelect(loc)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left border transition-all ${
                  isSelected
                    ? "border-[#FF6B1A] bg-orange-50/50 dark:bg-orange-950/30 ring-1 ring-[#FF6B1A]"
                    : "border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? "bg-[#FF6B1A] text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900 dark:text-gray-100">
                      {lang === "bn" ? loc.nameBn : loc.nameEn}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {lang === "bn"
                        ? `দূরত্ব: ${formatNum(loc.distanceKm)} কিমি • ফি: ${isAvailable ? formatPrice(feeCalc.fee) : "অনুপলব্ধ"}`
                        : `Distance: ${loc.distanceKm} km • Fee: ${isAvailable ? formatPrice(feeCalc.fee) : "Unsupported"}`}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#FF6B1A] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {lang === "bn" ? "অথবা কাস্টম দূরত্ব দিন (কিমি):" : "Or enter custom distance (km):"}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="25"
                placeholder={lang === "bn" ? "যেমন: ২.৫" : "e.g., 2.5"}
                value={customDistance}
                onChange={(e) => setCustomDistance(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
              />
              <button
                type="button"
                onClick={handleCustomApply}
                disabled={!customDistance}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#FF6B1A] hover:bg-[#E85B0D] disabled:opacity-50 transition-all"
              >
                {lang === "bn" ? "প্রয়োগ" : "Apply"}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Info className="w-4 h-4 text-[#FF6B1A] shrink-0" />
          <span>
            {lang === "bn"
              ? "০–৩ কিমি সাধারণ খাবার (৳৪০–৬০)। ৩–৮ কিমি বিশেষ কেক জোন (৳১৫০)।"
              : "0–3 km for meals (৳40–60). 3–8 km for cakes only (৳150)."}
          </span>
        </div>
      </div>
    </div>
  );
}
