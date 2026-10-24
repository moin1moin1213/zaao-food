"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Phone, Lock, Eye, EyeOff, ShieldAlert, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { bdPhoneRegex } from "@/lib/validation/schemas";
import { authService } from "@/services/authService";

export default function RegisterPage() {
  const router = useRouter();
  const { lang, t, formatNum } = useLanguage();

  const [step, setStep] = useState<"form" | "otp">("form");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [isCounting, setIsCounting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpInfo, setOtpInfo] = useState("");

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCounting && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setIsCounting(false);
    }
    return () => clearInterval(timer);
  }, [isCounting, countdown]);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg(lang === "bn" ? "অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।" : "Please enter your full name.");
      return;
    }
    if (!bdPhoneRegex.test(phone)) {
      setErrorMsg(
        lang === "bn"
          ? "সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর লিখুন (যেমন: ০১৭১২৩৪৫৬৭৮)।"
          : "Please enter a valid 11-digit Bangladeshi phone number."
      );
      return;
    }
    if (password.length < 6) {
      setErrorMsg(lang === "bn" ? "পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।" : "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(lang === "bn" ? "পাসওয়ার্ড দুটি মেলেনি।" : "Passwords do not match.");
      return;
    }
    if (!acceptTerms) {
      setErrorMsg(
        lang === "bn"
          ? "আপনাকে শর্তাবলীতে সম্মতি প্রদান করতে হবে।"
          : "You must accept the terms of service."
      );
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const otpRes = await authService.sendOtp(phone);
      setOtpInfo(lang === "bn" ? otpRes.messageBn : otpRes.messageEn);
      setStep("otp");
      setCountdown(60);
      setIsCounting(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMsg(lang === "bn" ? "অনুগ্রহ করে ৬ ডিজিটের ওটিপি লিখুন।" : "Please enter the 6-digit OTP code.");
      return;
    }

    setLoading(true);
    const verifyRes = await authService.verifyOtp(phone, otpCode);
    setLoading(false);

    if (verifyRes.success) {
      router.push("/profile");
    } else {
      setErrorMsg(lang === "bn" ? verifyRes.messageBn : verifyRes.messageEn);
    }
  };

  const handleResendOtp = async () => {
    if (isCounting) return;
    setLoading(true);
    const otpRes = await authService.sendOtp(phone);
    setOtpInfo(lang === "bn" ? otpRes.messageBn : otpRes.messageEn);
    setCountdown(60);
    setIsCounting(true);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-6">
      {/* Brand logo & title */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <Logo variant="horizontal" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">
          {step === "form" ? t.auth.registerTitle : t.auth.verifyOtp}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {step === "form" ? t.auth.registerSubtitle : `${phone} নম্বরে ওটিপি পাঠানো হয়েছে (ডেমো)`}
        </p>
      </div>

      {/* Dev notice banner */}
      <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex items-start gap-2 text-xs text-[#FF6B1A]">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          {t.auth.rtcomNotice}
        </span>
      </div>

      {step === "form" ? (
        /* Step 1: Registration Form */
        <form
          onSubmit={handleInitialSubmit}
          className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-4"
        >
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {lang === "bn" ? "পূর্ণ নাম" : "Full Name"} *
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrorMsg("");
                }}
                placeholder={lang === "bn" ? "যেমন: তানভীর হাসান" : "e.g., Tanvir Hasan"}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Phone */}
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

          {/* Password */}
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
                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t.auth.confirmPassword} *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMsg("");
                }}
                placeholder={t.auth.confirmPassword}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Terms Acceptance */}
          <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-gray-600 dark:text-gray-400 pt-1">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 rounded text-[#FF6B1A] focus:ring-[#FF6B1A] accent-[#FF6B1A]"
            />
            <span>{t.auth.termsAgreement}</span>
          </label>

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

          <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span>{t.auth.haveAccount} </span>
            <Link href="/login" className="font-bold text-[#FF6B1A] hover:underline">
              {t.nav.login}
            </Link>
          </div>
        </form>
      ) : (
        /* Step 2: RTCOM OTP Verification Interface */
        <form
          onSubmit={handleVerifyOtp}
          className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-4 animate-in fade-in"
        >
          {otpInfo && (
            <div className="p-3 rounded-xl bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 text-xs">
              {otpInfo}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t.auth.enterOtp} (যেমন: 123456)
            </label>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value.replace(/\D/g, ""));
                setErrorMsg("");
              }}
              placeholder="123456"
              className="w-full text-center tracking-widest text-xl font-bold py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {isCounting ? (
                <span>
                  {formatNum(countdown)} {t.auth.resendIn}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="font-bold text-[#FF6B1A] hover:underline"
                >
                  {t.auth.resendOtp}
                </button>
              )}
            </span>

            <button
              type="button"
              onClick={() => setStep("form")}
              className="text-gray-400 hover:text-gray-600"
            >
              {lang === "bn" ? "নম্বর পরিবর্তন" : "Change Phone"}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white bg-[#FF6B1A] hover:bg-[#E85B0D] disabled:opacity-50 shadow-md transition-all active:scale-95"
          >
            {loading ? <span>{t.common.loading}</span> : <span>{t.auth.registerBtn}</span>}
          </button>
        </form>
      )}
    </div>
  );
}
