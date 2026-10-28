"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Calendar, Heart, Search, Info } from "lucide-react";
import { CakeCard } from "@/components/catalog/CakeCard";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { catalogService } from "@/services/catalogService";
import { FoodItem } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function CakesPage() {
  const { lang, t, formatNum } = useLanguage();
  const [cakes, setCakes] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCakes() {
      setLoading(true);
      try {
        const data = await catalogService.getCakes({
          searchQuery,
          sortBy: sortBy === "relevance" ? undefined : (sortBy as any),
        });
        setCakes(data);
      } catch (err) {
        console.error("Failed to load cakes:", err);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(loadCakes, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, sortBy]);

  return (
    <div className="space-y-8">
      {/* 1. Distinctive Pink/Rose Cake Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-600 via-rose-500 to-orange-500 text-white p-6 sm:p-10 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>{t.cakes.badge}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {t.cakes.title}
          </h1>

          <p className="text-xs sm:text-sm text-pink-100 leading-relaxed">
            {t.cakes.subtitle}
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/20 text-xs font-bold text-white backdrop-blur-xs mt-2 border border-white/20">
            <Calendar className="w-4 h-4 text-pink-200" />
            <span>{t.cakes.advanceBookingNotice}</span>
          </div>
        </div>
      </div>

      {/* Special Zone Notification Callout */}
      <div className="p-4 rounded-2xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50 flex items-start gap-3">
        <Info className="w-5 h-5 text-pink-600 dark:text-pink-400 shrink-0 mt-0.5" />
        <div className="text-xs text-pink-900 dark:text-pink-200 leading-relaxed">
          <strong>{lang === "bn" ? "বিশেষ কেক ডেলিভারি জোন (৩–৮ কিমি): " : "Special Cake Zone (3–8 km): "}</strong>
          {t.cakes.specialZoneNotice}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === "bn" ? "কেক বা ফ্লেভারের নাম দিয়ে খুঁজুন..." : "Search cakes by flavor or baker..."}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {t.common.sortBy}:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
          >
            <option value="relevance">{lang === "bn" ? "প্রাসঙ্গিকতা" : "Featured"}</option>
            <option value="price_asc">{t.search.priceLowToHigh}</option>
            <option value="price_desc">{t.search.priceHighToLow}</option>
          </select>
        </div>
      </div>

      {/* Cake Product Grid */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : cakes.length === 0 ? (
        <EmptyState
          title={t.common.noResults}
          description={lang === "bn" ? "কোনো কেক খুঁজে পাওয়া যায়নি।" : "No handcrafted cakes matched your search."}
          actionLabel={lang === "bn" ? "সকল কেক দেখুন" : "Reset Filter"}
          onAction={() => setSearchQuery("")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cakes.map((cake) => (
            <CakeCard key={cake.id} cake={cake} />
          ))}
        </div>
      )}
    </div>
  );
}
