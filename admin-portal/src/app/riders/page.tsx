"use client";

import React, { useEffect, useState } from "react";
import {
  Bike,
  Plus,
  Phone,
  CheckCircle2,
  XCircle,
  Radio,
  Star,
  MapPin,
  X,
  Search,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import { RiderProfile } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AdminRidersPage() {
  const { lang, formatPrice, formatNum } = useLanguage();
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRider, setNewRider] = useState<Partial<RiderProfile>>({
    name: "",
    phone: "",
    vehicle: "Motorbike",
    licensePlate: "",
    isActive: true,
    isOnline: false,
  });
  const [saving, setSaving] = useState(false);

  async function loadRiders() {
    try {
      const data = await adminService.getRiders();
      setRiders(data);
    } catch (err) {
      console.error("Failed to load riders:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRiders();
  }, []);

  const handleToggleOnline = async (r: RiderProfile) => {
    await adminService.saveRider({ id: r.id, isOnline: !r.isOnline });
    loadRiders();
  };

  const handleSaveRider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.saveRider(newRider);
      setIsModalOpen(false);
      setNewRider({ name: "", phone: "", vehicle: "Motorbike", licensePlate: "", isActive: true, isOnline: false });
      await loadRiders();
    } catch (err) {
      console.error("Save rider error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Bike className="w-8 h-8 text-[#FF6B1A]" />
            <span>{lang === "bn" ? "ডেলিভারি রাইডার বহর" : "Riders Fleet Management"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === "bn"
              ? "মঠবাড়িয়া পেঙ্গুফুড রাইডারদের উপস্থিতি, একটিভ ডেলিভারি ও পেমেন্ট ট্র্যাক করুন।"
              : "Track rider online status, active order dispatch and delivery compensation."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-[#FF6B1A] hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === "bn" ? "নতুন রাইডার যুক্ত করুন" : "Add Rider"}</span>
        </button>
      </div>

      {/* Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {riders.map((r) => (
          <div
            key={r.id}
            className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-[#FF6B1A] font-black text-base">
                    {r.name.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-gray-900 dark:text-gray-100">{r.name}</h3>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{r.phone}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    r.isOnline
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  <Radio className={`w-3 h-3 ${r.isOnline ? "animate-pulse text-emerald-500" : ""}`} />
                  <span>{r.isOnline ? "Online" : "Offline"}</span>
                </span>
              </div>

              {/* Rider Stats & Details */}
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span>Vehicle:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{r.vehicle}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span>Rating:</span>
                  <div className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{r.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span>Total Deliveries:</span>
                  <span className="font-extrabold text-gray-800 dark:text-gray-200">{formatNum(r.totalDeliveries)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-1.5">
                  <span>Total Earnings:</span>
                  <span className="font-black text-[#FF6B1A]">{formatPrice(r.totalEarnings)}</span>
                </div>
              </div>
            </div>

            {/* Toggle Online status button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleToggleOnline(r)}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                  r.isOnline
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {r.isOnline ? (lang === "bn" ? "অফলাইন করুন" : "Set Offline") : (lang === "bn" ? "অনলাইন করুন" : "Set Online")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Rider Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-850 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
                {lang === "bn" ? "নতুন রাইডার নিবন্ধন" : "Register New Delivery Rider"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRider} className="space-y-3.5 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-gray-600 dark:text-gray-300">Rider Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Tariqul Islam"
                  value={newRider.name || ""}
                  onChange={(e) => setNewRider({ ...newRider, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 dark:text-gray-300">Mobile Phone (Bangladeshi)</label>
                <input
                  required
                  type="text"
                  placeholder="017XXXXXXXX"
                  value={newRider.phone || ""}
                  onChange={(e) => setNewRider({ ...newRider, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 dark:text-gray-300">Vehicle Type & License</label>
                <input
                  type="text"
                  placeholder="e.g. Honda 125 (Barishal-Ha-1234)"
                  value={newRider.vehicle || ""}
                  onChange={(e) => setNewRider({ ...newRider, vehicle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#FF6B1A] text-white hover:bg-orange-600 shadow-md font-bold"
                >
                  {saving ? "Registering..." : "Add to Fleet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
