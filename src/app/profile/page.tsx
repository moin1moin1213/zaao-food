"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Phone,
  MapPin,
  Globe,
  Moon,
  Receipt,
  HelpCircle,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  Plus,
  Edit3,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { authService } from "@/services/authService";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ProfilePage() {
  const { lang, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<"privacy" | "terms" | null>(null);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsLogoutModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
          {t.profile.title}
        </h1>
      </div>

      {/* Guest vs Logged in user info */}
      {!currentUser?.isLoggedIn ? (
        <div className="rounded-3xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20 p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF6B1A] flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-base text-gray-900 dark:text-gray-100">
            {t.profile.loginPromptTitle}
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
            {t.profile.loginPromptDesc}
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#FF6B1A] hover:bg-[#E85B0D] shadow-md transition-transform active:scale-95"
            >
              <span>{t.profile.loginAction}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-[#FF6B1A] font-black text-xl flex items-center justify-center">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-black text-base text-gray-900 dark:text-gray-100">
                {currentUser.name}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{currentUser.phone}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Addresses Section */}
      {currentUser && (
        <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF6B1A]" />
              <span>{t.profile.savedAddresses}</span>
            </h3>
          </div>

          <div className="space-y-2 pt-1">
            {currentUser.addresses.map((addr) => (
              <div
                key={addr.id}
                className="flex items-start justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 text-xs"
              >
                <div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 block">
                    {lang === "bn" ? addr.labelBn : addr.labelEn}
                    {addr.isDefault && (
                      <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                        {lang === "bn" ? "প্রধান" : "Default"}
                      </span>
                    )}
                  </span>
                  <span className="text-gray-500 mt-0.5 block">{addr.address}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* App Settings Menu */}
      <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
          {t.profile.appSettings}
        </h3>

        <div className="space-y-3">
          {/* Language Toggle Row */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B1A] flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {t.profile.language}
              </span>
            </div>
            <LanguageToggle />
          </div>

          {/* Theme Toggle Row */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {t.profile.theme}
              </span>
            </div>
            <ThemeToggle />
          </div>

          {/* Order history shortcut */}
          <Link
            href="/orders"
            className="flex items-center justify-between py-2 hover:text-[#FF6B1A] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {t.orders.title}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Support & Legal Section */}
      <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-6 shadow-xs space-y-3">
        <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
          {t.profile.supportAndLegal}
        </h3>

        <div className="space-y-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#FF6B1A]" />
              <span>{t.profile.helpSupport}</span>
            </div>
            <span className="text-[11px] font-bold text-gray-500">{t.profile.supportPhone}</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveLegalModal("privacy")}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <span>{t.profile.privacyPolicy}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveLegalModal("terms")}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>{t.profile.termsConditions}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Logout button if logged in */}
      {currentUser?.isLoggedIn && (
        <button
          type="button"
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.nav.logout}</span>
        </button>
      )}

      {/* Logout confirmation modal */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title={t.nav.logout}
        description={t.profile.logoutConfirm}
        confirmLabel={t.nav.logout}
        isDestructive
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

      {/* Legal Dialog Modal */}
      {activeLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">
              {activeLegalModal === "privacy" ? t.profile.privacyPolicy : t.profile.termsConditions}
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                {lang === "bn"
                  ? "পেঙ্গুফুড (মঠবাড়িয়া, পিরোজপুর) গ্রাহকের ব্যক্তিগত তথ্যের সর্বোচ্চ সুরক্ষা দিতে প্রতিশ্রুতিবদ্ধ। গ্রাহকের ফোন নম্বর ও ডেলিভারি ঠিকানা শুধুমাত্র খাদ্য ও কেক ডেলিভারি সম্পন্ন করার কাজে ব্যবহার করা হয়।"
                  : "PenguFood (Mathbaria, Pirojpur) is dedicated to protecting customer data integrity. Phone numbers and locations are utilized exclusively for fulfilling food and cake deliveries."}
              </p>
              <p>
                {lang === "bn"
                  ? "১. অর্ডার ও ডেলিভারি: সকল সাধারণ খাদ্য অর্ডার ০–৩ কিমি জোনে এবং হোমমেড কেক ২-৩ দিনের অগ্রিম বুকিংয়ে ৩–৮ কিমি জোনে পৌঁছে দেওয়া হয়।"
                  : "1. Orders & Delivery: Standard food deliveries cover the 0-3 km zone, while custom cakes with 2-3 days advance booking cover the 3-8 km zone."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveLegalModal(null)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF6B1A]"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
