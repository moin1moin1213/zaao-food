"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "@/styles/globals.css";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Bike,
  DollarSign,
  UtensilsCrossed,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { LanguageProvider, useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageToggle } from "@/components/common/LanguageToggle";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", labelBn: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/orders", label: "Live Orders", labelBn: "লাইভ অর্ডার", icon: ShoppingBag },
  { href: "/pricing", label: "Delivery Pricing", labelBn: "ডেলিভারি চার্জ", icon: DollarSign },
  { href: "/restaurants", label: "Restaurants", labelBn: "রেস্তোরাঁ", icon: Store },
  { href: "/foods", label: "Food & Menu", labelBn: "খাবার ও মেনু", icon: UtensilsCrossed },
  { href: "/riders", label: "Riders Fleet", labelBn: "রাইডার তালিকা", icon: Bike },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // If on login page, render clean layout without sidebar
  if (pathname === "/login") {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
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
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-gray-100 text-gray-700"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🐧</span>
            <span className="font-black text-sm text-[#FF6B1A]">PenguFood Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-bold"
            title="লগআউট"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-gray-200 z-40 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐧</span>
              <span className="text-lg font-black tracking-tight text-gray-900">
                Pengu<span className="text-[#FF6B1A]">Food</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#FF6B1A] mt-1 bg-orange-50 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3" />
              <span>Admin Panel</span>
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
                    : "text-gray-600 hover:bg-orange-50 hover:text-[#FF6B1A]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{lang === "bn" ? item.labelBn : item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] text-gray-400 font-semibold">ভাষা / Language</span>
            <LanguageToggle />
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>{lang === "bn" ? "লগআউট করুন" : "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <title>PenguFood Admin Portal - Mathbaria</title>
        <meta name="description" content="Central Admin Dashboard for PenguFood Delivery Platform" />
      </head>
      <body>
        <LanguageProvider>
          <AdminShell>{children}</AdminShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
