"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, ShieldAlert } from "lucide-react";
import { Logo } from "../brand/Logo";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Footer() {
  const { lang, t } = useLanguage();

  return (
    <footer className="hidden md:block border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/80 mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & About */}
          <div className="space-y-4 md:col-span-1">
            <Logo variant="horizontal" />
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {t.footer.aboutText}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-100/60 dark:bg-orange-950/40 text-[#FF6B1A] text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t.common.devPreview}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-[#FF6B1A] transition-colors">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link href="/foods" className="text-gray-600 dark:text-gray-400 hover:text-[#FF6B1A] transition-colors">
                  {t.nav.foods}
                </Link>
              </li>
              <li>
                <Link href="/restaurants" className="text-gray-600 dark:text-gray-400 hover:text-[#FF6B1A] transition-colors">
                  {t.nav.restaurants}
                </Link>
              </li>
              <li>
                <Link href="/cakes" className="text-[#FF6B1A] font-semibold hover:underline transition-colors">
                  🎂 {t.nav.cakes}
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-gray-600 dark:text-gray-400 hover:text-[#FF6B1A] transition-colors">
                  {t.nav.orders}
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4">
              {t.footer.popularCategories}
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/foods?category=biryani" className="hover:text-[#FF6B1A] transition-colors">
                  {lang === "bn" ? "বিরিয়ানি ও পোলাও" : "Biryani & Polao"}
                </Link>
              </li>
              <li>
                <Link href="/foods?category=rice-meals" className="hover:text-[#FF6B1A] transition-colors">
                  {lang === "bn" ? "ভাত ও দুপুরের খাবার" : "Rice & Meals"}
                </Link>
              </li>
              <li>
                <Link href="/foods?category=fast-food" className="hover:text-[#FF6B1A] transition-colors">
                  {lang === "bn" ? "ফাস্ট ফুড ও বার্গার" : "Fast Food & Burgers"}
                </Link>
              </li>
              <li>
                <Link href="/cakes" className="hover:text-[#FF6B1A] transition-colors">
                  {lang === "bn" ? "হোমমেড কেক (অগ্রিম বুকিং)" : "Homemade Cakes (Advance)"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4">
              {t.footer.contactUs}
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#FF6B1A] shrink-0 mt-0.5" />
                <span>{t.footer.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#FF6B1A] shrink-0" />
                <span>{t.footer.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FF6B1A] shrink-0" />
                <span>{t.footer.email}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
          <div>{t.footer.copyright}</div>
          <div className="text-[11px] text-gray-400">{t.footer.phaseNotice}</div>
        </div>
      </div>
    </footer>
  );
}
