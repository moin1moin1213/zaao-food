"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Store, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ChefHat, Sparkles, CheckCircle2 } from "lucide-react";

interface RestaurantItem {
  id: string;
  nameEn: string;
  nameBn: string;
  phone: string;
  image?: string;
}

export default function RestaurantLoginPage() {
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [selectedRestId, setSelectedRestId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadList() {
      try {
        const res = await fetch("/api/restaurants-list");
        if (res.ok) {
          const data = await res.json();
          setRestaurants(data);
          if (data.length > 0) {
            setSelectedRestId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load restaurant list:", err);
      }
    }
    loadList();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedRestId) {
      setError("অনুগ্রহ করে আপনার রেস্তোরাঁ নির্বাচন করুন");
      return;
    }
    if (!password.trim()) {
      setError("অনুগ্রহ করে পাসওয়ার্ড বা পিন প্রদান করুন");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: selectedRestId,
          password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = "/";
      } else {
        setError(data.error || "ভুল পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    } catch {
      setError("লগইন করতে সমস্যা হচ্ছে। ইন্টারনেট সংযোগ চেক করুন।");
    } finally {
      setLoading(false);
    }
  };

  const selectedRest = restaurants.find((r) => r.id === selectedRestId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-orange-100 shadow-xl overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#FF6B1A] to-[#D94F04] p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md">
              <ChefHat className="w-3.5 h-3.5 text-yellow-300" />
              <span>Restaurant Kitchen Portal</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">রেস্তোরাঁ কিচেন লগইন</h1>
            <p className="text-xs text-orange-100">মঠবাড়িয়া পার্টনার রেস্তোরাঁ ও কিচেন ড্যাশবোর্ড</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Restaurant Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                রেস্তোরাঁ নির্বাচন করুন (Select Restaurant)
              </label>
              <div className="relative">
                <select
                  value={selectedRestId}
                  onChange={(e) => setSelectedRestId(e.target.value)}
                  disabled={loading}
                  className="w-full py-3 px-3.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B1A] focus:border-transparent transition-all font-semibold text-gray-800"
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nameBn} ({r.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              {selectedRest && (
                <div className="mt-2.5 flex items-center gap-3 p-2.5 rounded-xl bg-orange-50/60 border border-orange-100 text-xs text-gray-700">
                  <div className="w-8 h-8 rounded-lg bg-orange-200 shrink-0 flex items-center justify-center font-bold text-orange-700 overflow-hidden relative">
                    {selectedRest.image ? (
                      <img src={selectedRest.image} alt={selectedRest.nameBn} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-4 h-4" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-gray-900 truncate">{selectedRest.nameBn}</p>
                    <p className="text-[11px] text-gray-500">ফোন: {selectedRest.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Password Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                রেস্তোরাঁ পাসওয়ার্ড / গোপন পিন
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="রেস্তোরাঁর পাসওয়ার্ড বা পিন লিখুন"
                  disabled={loading}
                  className="w-full pl-10 pr-11 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-500 space-y-1">
                <p className="font-semibold text-gray-700">🔑 ডেমো পাসওয়ার্ড নির্দেশিকা:</p>
                <p>• কাচ্চি মহল: <code className="font-bold text-orange-600">kacchi123</code></p>
                <p>• বিসমিল্লাহ হোটেল: <code className="font-bold text-orange-600">bismillah123</code></p>
                <p>• সার্বজনীন মাস্টার পিন: <code className="font-bold text-orange-600">123456</code></p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#FF6B1A] to-[#D94F04] hover:opacity-95 shadow-md shadow-orange-500/25 transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>কিচেনে প্রবেশ করুন (Open Kitchen)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-400">
              PenguFood Mathbaria Partner Network
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
