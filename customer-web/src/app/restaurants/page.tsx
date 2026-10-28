"use client";

import React, { useEffect, useState } from "react";
import { Search, Store } from "lucide-react";
import { RestaurantCard } from "@/components/catalog/RestaurantCard";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { catalogService } from "@/services/catalogService";
import { Restaurant } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function RestaurantsPage() {
  const { lang, t } = useLanguage();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRestaurants() {
      setLoading(true);
      try {
        const data = await catalogService.getRestaurants(searchQuery);
        setRestaurants(data);
      } catch (err) {
        console.error("Failed to load restaurants:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchRestaurants, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filtered = filterOpenOnly ? restaurants.filter((r) => r.isOpen) : restaurants;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
              {t.restaurants.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t.restaurants.subtitle}
            </p>
          </div>
        </div>

        {/* Search & Open Only Filter */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "bn" ? "রেস্তোরাঁর নাম দিয়ে খুঁজুন..." : "Search restaurant name or cuisine..."}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-300 select-none bg-gray-50 dark:bg-gray-800 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              checked={filterOpenOnly}
              onChange={(e) => setFilterOpenOnly(e.target.checked)}
              className="rounded text-[#FF6B1A] focus:ring-[#FF6B1A] accent-[#FF6B1A]"
            />
            <span>{lang === "bn" ? "শুধুমাত্র খোলা রেস্তোরাঁ" : "Open restaurants only"}</span>
          </label>
        </div>
      </div>

      {/* Restaurant Cards Grid */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t.common.noResults}
          description={lang === "bn" ? "আপনার অনুসন্ধানের সাথে মেলে এমন কোনো রেস্তোরাঁ পাওয়া যায়নি।" : "No restaurants matched your search criteria."}
          actionLabel={lang === "bn" ? "সকল রেস্তোরাঁ দেখুন" : "Reset Filter"}
          onAction={() => {
            setSearchQuery("");
            setFilterOpenOnly(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
}
