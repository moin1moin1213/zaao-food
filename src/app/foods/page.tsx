"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, UtensilsCrossed } from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { catalogService } from "@/services/catalogService";
import { FoodItem, Category } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function FoodsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "";
  const sortParam = (searchParams.get("sort") as "price_asc" | "price_desc" | "relevance") || "relevance";

  const { lang, t, formatNum } = useLanguage();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(categoryParam);
  const [sortBy, setSortBy] = useState<string>(sortParam);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalogService.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setActiveCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    async function loadFilteredFoods() {
      setLoading(true);
      try {
        const data = await catalogService.getFoods({
          categorySlug: activeCategory || undefined,
          sortBy: sortBy === "relevance" ? undefined : (sortBy as any),
        });
        setFoods(data);
      } catch (err) {
        console.error("Failed to load foods:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFilteredFoods();
  }, [activeCategory, sortBy]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
            {t.foods.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t.foods.subtitle}
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {t.common.sortBy}:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B1A]"
          >
            <option value="relevance">{lang === "bn" ? "প্রাসঙ্গিকতা" : "Relevance"}</option>
            <option value="price_asc">{t.search.priceLowToHigh}</option>
            <option value="price_desc">{t.search.priceHighToLow}</option>
          </select>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveCategory("")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all ${
            !activeCategory
              ? "bg-[#FF6B1A] text-white shadow-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          {t.foods.allFoods}
        </button>

        {categories.map((c) => {
          const isSelected = activeCategory === c.slug;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.slug)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all ${
                isSelected
                  ? "bg-[#FF6B1A] text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              {lang === "bn" ? c.nameBn : c.nameEn}
            </button>
          );
        })}
      </div>

      {/* Food Grid */}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : foods.length === 0 ? (
        <EmptyState
          title={t.common.noResults}
          description={lang === "bn" ? "এই ক্যাটাগরিতে বর্তমানে কোনো খাবার পাওয়া যায়নি।" : "No food items found in this selected category."}
          actionLabel={t.foods.allFoods}
          onAction={() => setActiveCategory("")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {foods.map((food) => (
            <ProductCard key={food.id} product={food} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FoodsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton count={6} />}>
      <FoodsContent />
    </Suspense>
  );
}
