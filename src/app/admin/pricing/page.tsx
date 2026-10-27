"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Save,
  CheckCircle2,
  AlertCircle,
  Truck,
  Cake,
  ShieldCheck,
  RefreshCw,
  Info,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import { DeliveryZone } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AdminPricingPage() {
  const { lang, formatPrice } = useLanguage();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingZoneId, setSavingZoneId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states for zone editing
  const [formFees, setFormFees] = useState<Record<string, { regular: number; cake: number }>>({});

  async function loadZones() {
    try {
      const data = await adminService.getDeliveryZones();
      setZones(data);
      const initialMap: Record<string, { regular: number; cake: number }> = {};
      data.forEach((z) => {
        initialMap[z.id] = { regular: z.regularFee, cake: z.cakeFee };
      });
      setFormFees(initialMap);
    } catch (err) {
      console.error("Failed to load delivery zones:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadZones();
  }, []);

  const handleFeeChange = (zoneId: string, field: "regular" | "cake", value: string) => {
    const num = Math.max(0, parseInt(value) || 0);
    setFormFees((prev) => ({
      ...prev,
      [zoneId]: {
        ...prev[zoneId],
        [field]: num,
      },
    }));
  };

  const handleSaveZone = async (zoneId: string) => {
    setSavingZoneId(zoneId);
    setSuccessMessage(null);
    setErrorMessage(null);

    const targetFees = formFees[zoneId];
    if (!targetFees) return;

    try {
      const ok = await adminService.updateDeliveryZonePricing(
        zoneId,
        targetFees.regular,
        targetFees.cake
      );

      if (ok) {
        setSuccessMessage(
          lang === "bn"
            ? "ডেলিভারি রেট সফলভাবে আপডেট করা হয়েছে!"
            : "Delivery pricing updated successfully!"
        );
        await loadZones();
      } else {
        setErrorMessage(
          lang === "bn"
            ? "চার্জ আপডেট করতে সমস্যা হয়েছে।"
            : "Failed to update pricing."
        );
      }
    } catch (err) {
      setErrorMessage("Error updating zone.");
    } finally {
      setSavingZoneId(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-[#FF6B1A]" />
          <span>{lang === "bn" ? "ডেলিভারি চার্জ ও জোন কনফিগারেশন" : "Dynamic Delivery Pricing"}</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          {lang === "bn"
            ? "সোর্স কোড পরিবর্তন ছাড়াই এখান থেকে যেকোনো জোনের ডেলিভারি ফি পরিবর্তন করুন।"
            : "Adjust delivery rates directly from this panel without editing any source code."}
        </p>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Info Notice */}
      <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 text-xs text-gray-700 dark:text-gray-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#FF6B1A] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">
            {lang === "bn" ? "রিয়েল-টাইম ডাটাবেস পরিবর্তন:" : "Instant Real-Time Pricing Rules:"}
          </span>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {lang === "bn"
              ? "এখানে কোনো চার্জ সেভ করার সাথে সাথে গ্রাহকের চেকআউট পেজে নতুন রেট কার্যকর হয়ে যাবে।"
              : "Saved rates are committed directly to Supabase and immediately applied during customer cart checkout."}
          </p>
        </div>
      </div>

      {/* Delivery Zones Table Cards */}
      <div className="space-y-4">
        {zones.map((zone) => {
          const fees = formFees[zone.id] || { regular: zone.regularFee, cake: zone.cakeFee };
          const isSaving = savingZoneId === zone.id;

          return (
            <div
              key={zone.id}
              className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <div>
                  <h3 className="font-black text-base text-gray-900 dark:text-gray-100">
                    {lang === "bn" ? zone.nameBn : zone.nameEn}
                  </h3>
                  <div className="text-xs text-gray-400 font-semibold mt-0.5">
                    {zone.minDistanceKm} km – {zone.maxDistanceKm} km range (from Mathbaria Bazar)
                  </div>
                </div>

                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 w-fit">
                  Active Delivery Zone
                </span>
              </div>

              {/* Fee Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Regular Food Fee */}
                <div className="space-y-1.5 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                    <Truck className="w-4 h-4 text-[#FF6B1A]" />
                    <span>{lang === "bn" ? "নিয়মিত খাবারের চার্জ (টাকা)" : "Regular Food Delivery Fee (৳)"}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">৳</span>
                    <input
                      type="number"
                      min={0}
                      value={fees.regular}
                      onChange={(e) => handleFeeChange(zone.id, "regular", e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold text-gray-900 dark:text-gray-100 focus:outline-hidden focus:border-[#FF6B1A]"
                    />
                  </div>
                </div>

                {/* Cake Delivery Fee */}
                <div className="space-y-1.5 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                    <Cake className="w-4 h-4 text-purple-600" />
                    <span>{lang === "bn" ? "হোমমেড কেক ডেলিভারি চার্জ (টাকা)" : "Cake Delivery Fee (৳)"}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">৳</span>
                    <input
                      type="number"
                      min={0}
                      value={fees.cake}
                      onChange={(e) => handleFeeChange(zone.id, "cake", e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold text-gray-900 dark:text-gray-100 focus:outline-hidden focus:border-[#FF6B1A]"
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveZone(zone.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-[#FF6B1A] hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{lang === "bn" ? "চার্জ পরিবর্তন সংরক্ষণ করুন" : "Save Pricing Update"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
