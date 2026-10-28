"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { bdPhoneRegex } from "@/lib/validation/schemas";
import { authService } from "@/services/authService";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  const [step, setStep] = useState<"phone" | "reset">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bdPhoneRegex.test(phone)) {
      setErrorMsg(
        lang === "bn"
          ? "সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর লিখুন।"
          : "Please enter a valid 11-digit phone number."
      );
      return;
    }

    setLoading(true);
    await authService.sendOtp(phone);
    setLoading(false);
    setStep("reset");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg(lang === "bn" ? "৬ ডিজিটের ওটিপি কোড দিন।" : "Enter the 6-digit OTP code.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg(lang === "bn" ? "পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।" : "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(lang === "bn" ? "পাসওয়ার্ড দুটি মেলেনি।" : "Passwords do not match.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(
        lang === "bn"
          ? "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! লগইন পেজে নিয়ে যাওয়া হচ্ছে..."
          : "Password reset successfully! Redirecting to login..."
      );
      setTimeout(() => router.push("/login"), 1500);
    }, 600);
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <Logo variant="horizontal" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">
          {t.auth.forgotTitle}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t.auth.forgotSubtitle}
        </p>
      </div>

      {step === "phone" ? (
        <form
          onSubmit={handleSendOtp}
          className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-4"
        >
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

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white bg-[#FF6B1A] hover:bg-[#E85B0D] shadow-md transition-all active:scale-95 disabled:opacity-60"
          >
            {loading ? <span>{t.common.loading}</span> : <span>{t.auth.sendOtp}</span>}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#FF6B1A]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.common.back} {t.nav.login}</span>
            </Link>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handleResetPassword}
          className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-4"
        >
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t.auth.enterOtp} (যেমন: 123456)
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full text-center tracking-widest text-lg font-bold py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {lang === "bn" ? "নতুন পাসওয়ার্ড" : "New Password"}
            </label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="******"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t.auth.confirmPassword}
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="******"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white bg-[#FF6B1A] hover:bg-[#E85B0D] shadow-md transition-all active:scale-95 disabled:opacity-60"
          >
            {loading ? <span>{t.common.loading}</span> : <span>{lang === "bn" ? "পাসওয়ার্ড নিশ্চিত করুন" : "Set New Password"}</span>}
          </button>
        </form>
      )}
    </div>
  );
}
