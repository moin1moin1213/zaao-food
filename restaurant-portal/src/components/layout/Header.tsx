"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, Bell, User, MapPin, ChevronDown } from "lucide-react";
import { Logo } from "../brand/Logo";
import { ThemeToggle } from "../common/ThemeToggle";
import { LanguageToggle } from "../common/LanguageToggle";
import { LocationSelectorModal } from "../common/LocationSelectorModal";
import { useCart } from "@/services/cartStore";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Header() {
  const router = useRouter();
  const { itemCount, selectedLocation } = useCart();
  const { lang, t, formatNum } = useLanguage();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo & Location */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Logo variant="horizontal" />

            {/* Location selector button */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500 bg-gray-50/80 dark:bg-gray-800/80 text-left transition-all active:scale-95 group"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#FF6B1A] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="max-w-[140px] lg:max-w-[180px]">
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">
                  {t.nav.deliveryLocation}
                </div>
                <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-[#FF6B1A] transition-colors">
                  {lang === "bn" ? selectedLocation.nameBn : selectedLocation.nameEn}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF6B1A] transition-colors" />
            </button>
          </div>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex flex-1 max-w-md mx-4 relative"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.common.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A] focus:bg-white dark:focus:bg-gray-900 transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </form>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search button for tablet */}
            <Link
              href="/search"
              aria-label="Search"
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-orange-300 shadow-sm"
            >
              <Search className="w-4 h-4" />
            </Link>

            {/* Language Switcher */}
            <LanguageToggle className="hidden sm:inline-flex" />

            {/* Dark/Light mode toggle */}
            <ThemeToggle />

            {/* Notification Icon */}
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-orange-300 dark:hover:border-orange-500 shadow-sm transition-transform active:scale-95"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF6B1A]" />
            </Link>

            {/* Cart Icon with Live Item Count */}
            <Link
              href="/cart"
              aria-label="Shopping Cart"
              className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-[#FF6B1A] shadow-sm transition-transform active:scale-95 group"
            >
              <ShoppingBag className="w-4 h-4 group-hover:text-[#FF6B1A] transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#FF6B1A] text-white text-[10px] font-extrabold flex items-center justify-center px-1 shadow-sm">
                  {formatNum(itemCount)}
                </span>
              )}
            </Link>

            {/* User Profile / Login Link */}
            <Link
              href="/profile"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-300 shadow-sm transition-all active:scale-95"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-[#FF6B1A] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="hidden xl:inline text-xs font-bold text-gray-800 dark:text-gray-200">
                {t.nav.profile}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Location Modal */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </>
  );
}
