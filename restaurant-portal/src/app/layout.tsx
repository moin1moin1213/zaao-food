"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "@/styles/globals.css";
import {
  Store,
  ShoppingBag,
  TrendingUp,
  Power,
  LogOut,
  ChefHat,
  Menu,
  X,
} from "lucide-react";
import { LanguageProvider, useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { RestaurantProvider, useRestaurant } from "./RestaurantContext";

function KitchenNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLanguage();
  const { currentRestaurant, toggleStoreOpen } = useRestaurant();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname === "/login") {
    return null;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
      {/* Brand & Active Restaurant */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐧</span>
          <span className="text-lg font-black tracking-tight text-gray-900">
            Pengu<span className="text-[#FF6B1A]">Food</span>
          </span>
        </div>

        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-orange-50 text-[#FF6B1A] border border-orange-200">
          <ChefHat className="w-3.5 h-3.5" />
          <span>কিচেন প্যানেল</span>
        </div>

        {currentRestaurant && (
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
              {currentRestaurant.image ? (
                <img src={currentRestaurant.image} alt={currentRestaurant.nameBn} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="leading-tight">
              <p className="text-xs font-black text-gray-900 truncate max-w-[160px] sm:max-w-[200px]">
                {currentRestaurant.nameBn}
              </p>
              <p className="text-[10px] text-gray-400">{currentRestaurant.phone}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-2">
        <Link
          href="/"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            pathname === "/"
              ? "bg-[#FF6B1A] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{lang === "bn" ? "লাইভ অর্ডার" : "Kitchen Orders"}</span>
        </Link>

        <Link
          href="/sales"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            pathname === "/sales"
              ? "bg-[#FF6B1A] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{lang === "bn" ? "দৈনিক ও সাপ্তাহিক বিক্রি" : "Daily & Weekly Sales"}</span>
        </Link>
      </nav>

      {/* Controls & Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {currentRestaurant && (
          <button
            type="button"
            onClick={toggleStoreOpen}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
              currentRestaurant.isOpen
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {currentRestaurant.isOpen ? "অর্ডার নেওয়া হচ্ছে (Open)" : "কিচেন বন্ধ (Closed)"}
            </span>
            <span className="sm:hidden">{currentRestaurant.isOpen ? "Open" : "Closed"}</span>
          </button>
        )}

        <LanguageToggle />

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all active:scale-95"
          title="লগআউট"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{lang === "bn" ? "লগআউট" : "Logout"}</span>
        </button>
      </div>
    </header>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col">
      <KitchenNavbar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <title>PenguFood Restaurant Kitchen Portal - Mathbaria</title>
        <meta name="description" content="Kitchen Dashboard for PenguFood Partner Restaurants" />
      </head>
      <body>
        <LanguageProvider>
          <RestaurantProvider>
            <MainContent>{children}</MainContent>
          </RestaurantProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
