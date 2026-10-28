"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Receipt, User } from "lucide-react";
import { useCart } from "@/services/cartStore";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * Mobile Bottom Navigation.
 * Contains EXACTLY four primary tabs:
 * 1. Home (/)
 * 2. Cart (/cart) with live count badge
 * 3. Orders (/orders)
 * 4. Profile (/profile)
 * Safe-area aware and active route highlighted.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { t, formatNum } = useLanguage();

  const tabs = [
    {
      href: "/",
      label: t.nav.home,
      icon: Home,
      isActive: pathname === "/",
    },
    {
      href: "/cart",
      label: t.nav.cart,
      icon: ShoppingBag,
      isActive: pathname === "/cart",
      badge: itemCount > 0 ? formatNum(itemCount) : undefined,
    },
    {
      href: "/orders",
      label: t.nav.orders,
      icon: Receipt,
      isActive: pathname.startsWith("/orders"),
    },
    {
      href: "/profile",
      label: t.nav.profile,
      icon: User,
      isActive: pathname === "/profile" || pathname === "/login" || pathname === "/register",
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center h-full py-1 transition-colors relative ${
                tab.isActive
                  ? "text-[#FF6B1A] font-bold"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    tab.isActive ? "scale-110" : ""
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] rounded-full bg-[#FF6B1A] text-white text-[10px] font-extrabold flex items-center justify-center px-1 shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">
                {tab.label}
              </span>
              {tab.isActive && (
                <span className="absolute bottom-0 w-8 h-1 rounded-t-full bg-[#FF6B1A]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
