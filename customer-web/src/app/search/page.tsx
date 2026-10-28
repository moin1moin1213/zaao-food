"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, SlidersHorizontal, Utensils, Store, RotateCcw } from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { RestaurantCard } from "@/components/catalog/RestaurantCard";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { catalogService } from "@/services/catalogService";
import { FoodItem, Restaurant, Category } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage/safeStorage";

const RECENT_SEARCHES_KEY = "recent_search_terms";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const sortParam = (searchParams.get("sort") as "price_asc" | "price_desc" | "relevance") || "relevance";

  const { lang, t, formatNum } = useLanguage();
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<"all" | "foods" | "restaurants">("all");
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedSort, setSelectedSort] = useState(sortParam);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodResults, setFoodResults] = useState<FoodItem[]>([]);
  const [restaurantResults, setRestaurantResults] = useState<Restaurant[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    catalogService.getCategories().then(setCategories);
    const recents = safeLocalStorageGet<string[]>(RECENT_SEARCHES_KEY, [
      "কাচ্চি",
      "Kacchi",
      "ইলিশ",
      "Burger",
      "Cake",
      "বোরহানি",
    ]);
    setRecentSearches(recents);
  }, []);

  useEffect(() => {
    setSearchTerm(queryParam);
    setSelectedCategory(categoryParam);
  }, [queryParam, categoryParam]);

  useEffect(() => {
    async function executeSearch() {
      setLoading(true);
      try {
        const [foods, rests] = await Promise.all([
          catalogService.getFoods({
            searchQuery: searchTerm,
            categorySlug: selectedCategory || undefined,
            sortBy: selectedSort === "relevance" ? undefined : selectedSort,
          }),
          catalogService.getRestaurants(searchTerm),
        ]);
        setFoodResults(foods);
        setRestaurantResults(rests);

        // Save recent search if non-empty
        if (searchTerm.trim().length > 1) {
          const trimmed = searchTerm.trim();
          const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
          setRecentSearches(updated);
          safeLocalStorageSet(RECENT_SEARCHES_KEY, updated);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(executeSearch, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedSort]);

  const handleClear = () => {
    setSearchTerm("");
    router.push("/search");
  };

  const handleRecentClick = (term: string) => {
    setSearchTerm(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    safeLocalStorageSet(RECENT_SEARCHES_KEY, []);
  };

  const totalResults = foodResults.length + restaurantResults.length;

  return (
    <div className="space-y-6">
      {/* Search Header Form */}
      <div className="relative">
        <div className="relative w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.common.searchPlaceholder}
            className="w-full pl-11 pr-10 py-3 rounded-2xl text-base border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A] shadow-sm transition-all"
            autoFocus
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-3.5 top-3.5 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Recent Searches Pills (shown when query is short) */}
      {!searchTerm && recentSearches.length > 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {t.search.recentSearches}
            </span>
            <button
              type="button"
              onClick={clearRecentSearches}
              className="text-xs text-[#FF6B1A] hover:underline"
            >
              {t.search.clearRecent}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleRecentClick(term)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#FF6B1A] hover:text-[#FF6B1A] transition-all"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Tab Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
        {/* Result Category Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-white dark:bg-gray-700 text-[#FF6B1A] shadow-xs"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {lang === "bn" ? "সব ফলাফল" : "All Results"} ({formatNum(totalResults)})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("foods")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "foods"
                ? "bg-white dark:bg-gray-700 text-[#FF6B1A] shadow-xs"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {t.nav.foods} ({formatNum(foodResults.length)})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("restaurants")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "restaurants"
                ? "bg-white dark:bg-gray-700 text-[#FF6B1A] shadow-xs"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {t.nav.restaurants} ({formatNum(restaurantResults.length)})
          </button>
        </div>

        {/* Sorting Dropdown & Category Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B1A]"
          >
            <option value="">{t.search.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {lang === "bn" ? c.nameBn : c.nameEn}
              </option>
            ))}
          </select>

          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B1A]"
          >
            <option value="relevance">{lang === "bn" ? "প্রাসঙ্গিকতা" : "Relevance"}</option>
            <option value="price_asc">{t.search.priceLowToHigh}</option>
            <option value="price_desc">{t.search.priceHighToLow}</option>
          </select>
        </div>
      </div>

      {/* Search Results Display */}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : totalResults === 0 ? (
        <EmptyState
          title={t.common.noResults}
          description={t.search.noResultsDesc}
          actionLabel={t.home.browseFoods}
          actionHref="/foods"
        />
      ) : (
        <div className="space-y-8">
          {/* Restaurant Results */}
          {(activeTab === "all" || activeTab === "restaurants") && restaurantResults.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Store className="w-4 h-4 text-[#FF6B1A]" />
                <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                  {t.nav.restaurants} ({formatNum(restaurantResults.length)})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {restaurantResults.map((r) => (
                  <RestaurantCard key={r.id} restaurant={r} />
                ))}
              </div>
            </div>
          )}

          {/* Food Item Results */}
          {(activeTab === "all" || activeTab === "foods") && foodResults.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Utensils className="w-4 h-4 text-[#FF6B1A]" />
                <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                  {t.nav.foods} ({formatNum(foodResults.length)})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {foodResults.map((f) => (
                  <ProductCard key={f.id} product={f} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSkeleton count={4} />}>
      <SearchContent />
    </Suspense>
  );
}
