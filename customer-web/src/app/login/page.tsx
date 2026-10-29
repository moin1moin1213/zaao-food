"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Lock, Eye, EyeOff, ArrowRight, KeyRound, RotateCcw } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { bdPhoneRegex } from "@/lib/validation/schemas";
import { authService } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const { lang, t, formatNum } = useLanguage();

  const [loginMethod, setLoginMethod] = useState<"otp" | "password">("otp");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Login States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [isCounting, setIsCounting] = useState(false);
  const [otpInfo, setOtpInfo] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCounting && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setIsCounting(false);
    }
    return () => clearInterval(timer);
  }, [isCounting, countdown]);

  // 1. Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bdPhoneRegex.test(phone)) {
      setErrorMsg(
        lang === "bn"
          ? "সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর লিখুন (যেমন: ০১৭১২৩৪৫৬৭৮)।"
          : "Please enter a valid 11-digit Bangladeshi phone number."
      );
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await authService.sendOtp(phone);
      if (res.success) {
        setOtpSent(true);
        setOtpInfo(lang === "bn" ? res.messageBn : res.messageEn);
        setCountdown(60);
        setIsCounting(true);
      } else {
        setErrorMsg(lang === "bn" ? res.messageBn : res.messageEn);
      }
    } catch (err: any) {
      setErrorMsg(lang === "bn" ? "ওটিপি পাঠাতে ব্যর্থ হয়েছে।" : "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP & Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMsg(
        lang === "bn"
          ? "অনুগ্রহ করে ৬ ডিজিটের ওটিপি কোডটি লিখুন।"
          : "Please enter the 6-digit OTP code."
      );
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const verifyRes = await authService.verifyOtp(phone, otpCode);
      if (verifyRes.success) {
        router.push("/profile");
      } else {
        setErrorMsg(lang === "bn" ? verifyRes.messageBn : verifyRes.messageEn);
      }
    } catch (err: any) {
      setErrorMsg(lang === "bn" ? "যাচাইকরণ ব্যর্থ হয়েছে।" : "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Resend OTP
  const handleResendOtp = async () => {
    if (isCounting) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await authService.sendOtp(phone);
      setOtpInfo(lang === "bn" ? res.messageBn : res.messageEn);
      setCountdown(60);
      setIsCounting(true);
    } catch (err: any) {
      setErrorMsg(lang === "bn" ? "পুনরায় পাঠানো সম্ভব হয়নি।" : "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Password Login
  const handlePasswordSubmit = (e: React.FormEvent) => {
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
    authService.login(phone);
    setTimeout(() => {
      setLoading(false);
      router.push("/profile");
    }, 400);
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

      {/* Main Login Card */}
      <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-5">
        {/* Login Method Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setLoginMethod("otp");
              setErrorMsg("");
            }}
            className={`py-2 rounded-xl transition-all ${
              loginMethod === "otp"
                ? "bg-white dark:bg-gray-700 text-[#FF6B1A] shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            📱 {lang === "bn" ? "ওটিপি দিয়ে লগইন" : "OTP Login"}
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod("password");
              setErrorMsg("");
            }}
            className={`py-2 rounded-xl transition-all ${
              loginMethod === "password"
                ? "bg-white dark:bg-gray-700 text-[#FF6B1A] shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            🔒 {lang === "bn" ? "পাসওয়ার্ড দিয়ে লগইন" : "Password Login"}
          </button>
        </div>

        {/* ---------------- OTP LOGIN FORM ---------------- */}
        {loginMethod === "otp" && (
          <>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
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
                      placeholder="017XXXXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
                    />
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {lang === "bn" ? "আপনার নম্বরে ৬ ডিজিটের ওটিপি এসএমএস পাঠানো হবে।" : "A 6-digit OTP will be sent to your mobile."}
                  </p>
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
                  {loading ? (
                    <span>{t.common.loading}</span>
                  ) : (
                    <>
                      <span>{lang === "bn" ? "ওটিপি কোড পাঠান" : "Send OTP Code"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {otpInfo && (
                  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 text-xs text-orange-800 dark:text-orange-200 leading-relaxed">
                    {otpInfo}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {lang === "bn" ? "৬ ডিজিটের ওটিপি লিখুন *" : "Enter 6-Digit OTP *"}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode("");
                        setErrorMsg("");
                      }}
                      className="text-[11px] text-[#FF6B1A] hover:underline"
                    >
                      {lang === "bn" ? "নম্বর পরিবর্তন" : "Change Phone"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ""));
                        setErrorMsg("");
                      }}
                      placeholder="• • • • • •"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-center text-lg tracking-widest font-mono font-bold border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
                    />
                    <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {isCounting
                      ? `${lang === "bn" ? "পুনরায় পাঠান:" : "Resend in:"} ${formatNum(countdown)}s`
                      : (lang === "bn" ? "কোড পাননি?" : "Didn't receive code?")}
                  </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isCounting || loading}
                    className="font-bold text-[#FF6B1A] hover:underline disabled:opacity-40 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{lang === "bn" ? "আবার পাঠান" : "Resend OTP"}</span>
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
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white bg-[#FF6B1A] hover:bg-[#E85B0D] shadow-md transition-all active:scale-95 disabled:opacity-60"
                >
                  {loading ? (
                    <span>{t.common.loading}</span>
                  ) : (
                    <>
                      <span>{lang === "bn" ? "ভেরিফাই ও লগইন করুন" : "Verify & Login"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* ---------------- PASSWORD LOGIN FORM ---------------- */}
        {loginMethod === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                  placeholder="017XXXXXXXX"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>

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
          </form>
        )}

        {/* Register link */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
          <span>{t.auth.noAccount} </span>
          <Link href="/register" className="font-bold text-[#FF6B1A] hover:underline">
            {t.nav.register}
          </Link>
        </div>
      </div>
    </div>
  );
}
