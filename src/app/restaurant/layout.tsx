"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Store,
  ShoppingBag,
  UtensilsCrossed,
  Bell,
  Volume2,
  VolumeX,
  Power,
  ChevronDown,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { restaurantService } from "@/services/restaurantService";
import { adminService } from "@/services/adminService";
import { Restaurant } from "@/services/types";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage/safeStorage";

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestId, setSelectedRestId] = useState<string>("");
  const [currentRest, setCurrentRest] = useState<Restaurant | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    async function init() {
      const list = await adminService.getRestaurants();
      setRestaurants(list);
      const savedRestId = safeLocalStorageGet<string>("active_restaurant_id", "");
      const activeId = savedRestId && list.some((r) => r.id === savedRestId) ? savedRestId : list[0]?.id || "";
      setSelectedRestId(activeId);
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedRestId) return;
    safeLocalStorageSet("active_restaurant_id", selectedRestId);
    const found = restaurants.find((r) => r.id === selectedRestId) || null;
    setCurrentRest(found);
  }, [selectedRestId, restaurants]);

  const handleToggleStoreOpen = async () => {
    if (!currentRest) return;
    const nextStatus = !currentRest.isOpen;
    await restaurantService.toggleOpenStatus(currentRest.id, nextStatus);
    setCurrentRest({ ...currentRest, isOpen: nextStatus });
    setRestaurants((prev) =>
      prev.map((r) => (r.id === currentRest.id ? { ...r, isOpen: nextStatus } : r))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-850 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Restaurant Selector */}
        <div className="flex items-center gap-4 flex-wrap">
          <Logo variant="compact" />

          <div className="h-6 w-px bg-gray-200 dark:border-gray-700 hidden sm:block" />

          {/* Restaurant Switcher */}
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#FF6B1A]" />
            <select
              value={selectedRestId}
              onChange={(e) => setSelectedRestId(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-hidden cursor-pointer"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameBn} ({r.nameEn})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2">
          <Link
            href="/restaurant"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              pathname === "/restaurant"
                ? "bg-[#FF6B1A] text-white shadow-xs"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Kitchen Orders</span>
          </Link>

          <Link
            href="/restaurant/menu"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              pathname === "/restaurant/menu"
                ? "bg-[#FF6B1A] text-white shadow-xs"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Menu & Stock</span>
          </Link>
        </nav>

        {/* Status Toggle & Tools */}
        <div className="flex items-center gap-3">
          {/* Store Open/Close Toggle */}
          {currentRest && (
            <button
              type="button"
              onClick={handleToggleStoreOpen}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                currentRest.isOpen
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                  : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{currentRest.isOpen ? "Taking Orders (Open)" : "Kitchen Paused (Closed)"}</span>
            </button>
          )}

          <div className="h-5 w-px bg-gray-200 dark:border-gray-700" />

          <Link
            href="/admin"
            className="text-xs font-bold text-gray-500 hover:text-[#FF6B1A] hidden sm:block"
          >
            Admin HQ
          </Link>

          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Main View */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">{children}</main>
    </div>
  );
}
