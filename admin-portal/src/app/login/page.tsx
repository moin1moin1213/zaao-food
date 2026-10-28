"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password.trim()) {
      setError("অনুগ্রহ করে অ্যাডমিন পাসওয়ার্ড প্রদান করুন");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Redirect to dashboard
        window.location.href = "/";
      } else {
        setError(data.error || "ভুল পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    } catch (err: any) {
      setError("লগইন করতে সমস্যা হচ্ছে। সার্ভার সংযোগ চেক করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-orange-100 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF6B1A] to-[#E85B0D] p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>PenguFood Control Room</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">অ্যাডমিন প্যানেল লগইন</h1>
            <p className="text-xs text-orange-100">মঠবাড়িয়া সেন্ট্রাল কন্ট্রোল ও ডেলিভারি সিস্টেম</p>
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
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                মাস্টার পাসওয়ার্ড (Master Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="অ্যাডমিন পাসওয়ার্ড লিখুন"
                  disabled={loading}
                  className="w-full pl-10 pr-11 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A] focus:border-transparent transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                * পাসওয়ার্ডটি আপনার <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">.env</code> ফাইলের <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">ADMIN_PASSWORD</code> থেকে কনফিগার করা যায়।
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#FF6B1A] to-[#E85B0D] hover:opacity-95 shadow-md shadow-orange-500/25 transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>লগইন করুন (Access Dashboard)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>সুরক্ষিত এন্ড-টু-এন্ড অ্যাডমিনিস্ট্রেশন</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
