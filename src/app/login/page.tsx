"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Lock, Eye, EyeOff, ShieldAlert, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { bdPhoneRegex } from "@/lib/validation/schemas";

export default function LoginPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [phone, setPhone] = useState("01712345678");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bdPhoneRegex.test(phone)) {
      setErrorMsg(
        lang === "bn"
          ? "সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর লিখুন (যেমন: ০১৭১২৩৪৫৬৭৮)।"
          : "Please enter a valid 11-digit Bangladeshi phone number."
      );
      return;
    }

    if (password.length < 6) {
      setErrorMsg(
        lang === "bn"
          ? "পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।"
          : "Password must be at least 6 characters."
      );
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Route to profile or home
      router.push("/profile");
    }, 600);
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-6">
      {/* Brand logo & title */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <Logo variant="horizontal" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">
          {t.auth.loginTitle}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t.auth.loginSubtitle}
        </p>
      </div>

      {/* Dev notice banner */}
      <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex items-start gap-2 text-xs text-[#FF6B1A]">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          {t.auth.rtcomNotice}
        </span>
      </div>

      {/* Login Card Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-4"
      >
        {/* Phone Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
            {t.auth.phone} *
          </label>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setErrorMsg("");
              }}
              placeholder={t.auth.phonePlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
            />
            <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
            {t.auth.password} *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg("");
              }}
              placeholder={t.auth.passwordPlaceholder}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
            />
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
              className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded text-[#FF6B1A] focus:ring-[#FF6B1A] accent-[#FF6B1A]"
            />
            <span>{t.auth.rememberMe}</span>
          </label>

          <Link
            href="/forgot-password"
            className="font-bold text-[#FF6B1A] hover:underline"
          >
            {t.auth.forgotPasswordLink}
          </Link>
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 pt-1">
            {errorMsg}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white bg-[#FF6B1A] hover:bg-[#E85B0D] shadow-md transition-all active:scale-95 disabled:opacity-60"
        >
          {loading ? (
            <span>{t.common.loading}</span>
          ) : (
            <>
              <span>{t.auth.loginBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Register link */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
          <span>{t.auth.noAccount} </span>
          <Link href="/register" className="font-bold text-[#FF6B1A] hover:underline">
            {t.nav.register}
          </Link>
        </div>
      </form>
    </div>
  );
}
