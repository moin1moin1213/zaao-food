"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Bike,
  DollarSign,
  Tag,
  BarChart3,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  Menu,
  X,
  Layers,
  UtensilsCrossed,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LanguageToggle } from "@/components/common/LanguageToggle";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", labelBn: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders Stream", labelBn: "লাইভ অর্ডার", icon: ShoppingBag },
  { href: "/admin/pricing", label: "Delivery Pricing", labelBn: "ডেলিভারি চার্জ", icon: DollarSign },
  { href: "/admin/restaurants", label: "Restaurants", labelBn: "রেস্তোরাঁ", icon: Store },
  { href: "/admin/foods", label: "Food & Menu", labelBn: "খাবার ও মেনু", icon: UtensilsCrossed },
  { href: "/admin/riders", label: "Riders Fleet", labelBn: "রাইডার তালিকা", icon: Bike },
  { href: "/admin/promotions", label: "Promotions", labelBn: "অফার ও কুপন", icon: Tag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-850 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Logo variant="compact" />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-white dark:bg-gray-850 border-r border-gray-200 dark:border-gray-800 z-40 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <Logo variant="compact" />
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF6B1A] mt-1">
              Admin Control Panel
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#FF6B1A] text-white shadow-md shadow-orange-500/20"
                    : "text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-800 hover:text-[#FF6B1A]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "opacity-100" : "opacity-30"}`} />
              </Link>
            );
          })}
        </nav>

        {/* Bottom Switcher / Return to Customer Site */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <Link
            href="/restaurant"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>Restaurant Portal</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Customer Website</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white dark:bg-gray-850 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-950 text-[#FF6B1A] font-extrabold text-xs">
              Mathbaria HQ
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              PenguFood Operational Management System
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
