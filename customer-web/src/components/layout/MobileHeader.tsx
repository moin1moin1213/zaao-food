"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, MapPin, ChevronDown } from "lucide-react";
import { Logo } from "../brand/Logo";
import { LocationSelectorModal } from "../common/LocationSelectorModal";
import { LanguageToggle } from "../common/LanguageToggle";
import { ThemeToggle } from "../common/ThemeToggle";
import { useCart } from "@/services/cartStore";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function MobileHeader() {
  const router = useRouter();
  const { selectedLocation } = useCart();
  const { lang, t } = useLanguage();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <>
      <div className="md:hidden border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 pt-3 pb-3 sticky top-0 z-40">
        {/* Top row: Logo, Language, Theme, Notification */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <Logo variant="compact" />

          {/* Location button */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex-1 max-w-[170px] flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-left active:scale-95 transition-transform"
          >
            <MapPin className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
              {lang === "bn" ? selectedLocation.nameBn : selectedLocation.nameEn}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
          </button>

          <div className="flex items-center gap-1.5">
            <LanguageToggle compact />
            <ThemeToggle />
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF6B1A]" />
            </Link>
          </div>
        </div>

        {/* Search bar input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.common.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
        </form>
      </div>

      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </>
  );
}
