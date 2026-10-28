"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Flame, Clock, Award, ShieldCheck, HeartHandshake, Truck } from "lucide-react";
import { CategoryCard } from "@/components/catalog/CategoryCard";
import { ProductCard } from "@/components/catalog/ProductCard";
import { RestaurantCard } from "@/components/catalog/RestaurantCard";
import { CakeCard } from "@/components/catalog/CakeCard";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { catalogService } from "@/services/catalogService";
import { Category, FoodItem, Restaurant, PromoBanner } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function HomePage() {
  const { lang, t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularFoods, setPopularFoods] = useState<FoodItem[]>([]);
  const [recommendedFoods, setRecommendedFoods] = useState<FoodItem[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [cakes, setCakes] = useState<FoodItem[]>([]);
  const [heroBanner, setHeroBanner] = useState<PromoBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, pop, rec, rests, cakeList, banner] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getFoods({ isPopular: true }),
          catalogService.getFoods({ isRecommended: true }),
          catalogService.getRestaurants(),
          catalogService.getCakes(),
          catalogService.getHeroBanner(),
        ]);
        setCategories(cats);
        setPopularFoods(pop.filter((f) => !f.isCake).slice(0, 4));
        setRecommendedFoods(rec.filter((f) => !f.isCake).slice(0, 4));
        setRestaurants(rests.slice(0, 3));
        setCakes(cakeList.slice(0, 3));
        setHeroBanner(banner);
      } catch (err) {
        console.error("Error loading home catalog:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* 1. Hero Promotional Banner (Admin Manageable) */}
      <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${heroBanner?.bgGradient || "from-[#FF6B1A] via-[#E85B0D] to-[#9E3905]"} text-white p-6 sm:p-10 lg:p-12 shadow-lg`}>
        {/* Subtle background graphic */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>
              {lang === "bn"
                ? (heroBanner?.badgeBn || "মঠবাড়িয়া স্পেশাল ডেলিভারি")
                : (heroBanner?.badgeEn || "Mathbaria Local Food Delivery")}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {lang === "bn"
              ? (heroBanner?.titleBn || t.home.heroTitle)
              : (heroBanner?.titleEn || t.home.heroTitle)}
          </h1>

          <p className="text-sm sm:text-base text-orange-100 leading-relaxed max-w-xl">
            {lang === "bn"
              ? (heroBanner?.subtitleBn || t.home.heroSubtitle)
              : (heroBanner?.subtitleEn || t.home.heroSubtitle)}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={heroBanner?.link || "/foods"}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-white text-[#FF6B1A] hover:bg-orange-50 shadow-md transition-transform active:scale-95"
            >
              <span>
                {lang === "bn"
                  ? (heroBanner?.buttonTextBn || t.home.browseFoods)
                  : (heroBanner?.buttonTextEn || t.home.browseFoods)}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {heroBanner?.secondaryLink && (
              <Link
                href={heroBanner.secondaryLink}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-black/25 hover:bg-black/35 text-white border border-white/20 backdrop-blur-xs transition-all active:scale-95"
              >
                <span>
                  🎂 {lang === "bn"
                    ? (heroBanner.secondaryTextBn || t.home.orderCake)
                    : (heroBanner.secondaryTextEn || t.home.orderCake)}
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2. Food Categories */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
              {t.home.categoriesTitle}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lang === "bn" ? "আপনার পছন্দের খাবার নির্বাচন করুন" : "Browse by dining category"}
            </p>
          </div>
          <Link
            href="/categories"
            className="text-xs font-bold text-[#FF6B1A] hover:underline flex items-center gap-1"
          >
            <span>{t.common.viewAll}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton count={6} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Popular Foods */}
      {(loading || popularFoods.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#FF6B1A] flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
                  {t.home.popularFoodsTitle}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lang === "bn" ? "মঠবাড়িয়ার গ্রাহকদের সর্বাধিক পছন্দের খাবার" : "Top ordered dishes this week"}
                </p>
              </div>
            </div>
            <Link
              href="/foods?sort=popular"
              className="text-xs font-bold text-[#FF6B1A] hover:underline flex items-center gap-1"
            >
              <span>{t.home.viewAllFoods}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {popularFoods.map((food) => (
                <ProductCard key={food.id} product={food} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. Dedicated Homemade Cake Showcase */}
      {(loading || cakes.length > 0) && (
        <section className="rounded-3xl border border-pink-100 dark:border-pink-950/40 bg-gradient-to-r from-pink-50/70 via-rose-50/40 to-orange-50/40 dark:from-pink-950/20 dark:to-gray-900/40 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-pink-600 text-white shadow-xs mb-2">
                <span>🎂 {t.cakes.badge}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                {t.home.cakeSectionTitle}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-xl">
                {t.home.cakeSectionSubtitle}
              </p>
            </div>
            <Link
              href="/cakes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 shadow-sm transition-transform active:scale-95 shrink-0 self-start md:self-auto"
            >
              <span>{t.home.viewAllCakes}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <LoadingSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {cakes.map((cake) => (
                <CakeCard key={cake.id} cake={cake} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 5. Nearby Restaurants */}
      {(loading || restaurants.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
                {t.home.nearbyRestaurantsTitle}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lang === "bn" ? "মঠবাড়িয়া শহরের বিশ্বস্ত রেস্তোরাঁ ও রান্নাঘর" : "Reputed partner kitchens in Mathbaria"}
              </p>
            </div>
            <Link
              href="/restaurants"
              className="text-xs font-bold text-[#FF6B1A] hover:underline flex items-center gap-1"
            >
              <span>{t.home.viewAllRestaurants}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {restaurants.map((rest) => (
                <RestaurantCard key={rest.id} restaurant={rest} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 6. Recommended For You */}
      {(loading || recommendedFoods.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
                  {t.home.recommendedTitle}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lang === "bn" ? "খাঁটি দেশি স্বাদের আকর্ষণীয় প্ল্যাটার ও মিল" : "Chef's curated Bengali meal selections"}
                </p>
              </div>
            </div>
            <Link
              href="/foods?sort=recommended"
              className="text-xs font-bold text-[#FF6B1A] hover:underline flex items-center gap-1"
            >
              <span>{t.common.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {recommendedFoods.map((food) => (
                <ProductCard key={food.id} product={food} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Empty Database State Notice (Before Admin adds any items) */}
      {!loading && popularFoods.length === 0 && cakes.length === 0 && restaurants.length === 0 && (
        <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-8 sm:p-12 text-center space-y-3 bg-gray-50/50 dark:bg-gray-850/50">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-[#FF6B1A] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
            {lang === "bn" ? "রেস্তোরাঁ ও মেনু যুক্ত করা হচ্ছে" : "Kitchens & Menus Being Added"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            {lang === "bn"
              ? "অ্যাডমিন প্যানেল থেকে মঠবাড়িয়ার নতুন রেস্তোরাঁ ও সুস্বাদু খাবারের মেনু যুক্ত করা মাত্রই এখানে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।"
              : "As soon as restaurants and food items are added via the Admin Panel, they will appear right here."}
          </p>
        </div>
      )}

      {/* 7. Value Propositions / Why PenguFood */}
      <section className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-850 p-6 sm:p-8">
        <h2 className="text-base sm:text-lg font-black text-center text-gray-900 dark:text-gray-100 mb-6">
          {t.home.whyZaao}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-[#FF6B1A] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">{t.home.fastDelivery}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {t.home.fastDeliveryDesc}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">{t.home.freshHygiene}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {t.home.freshHygieneDesc}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">{t.home.cashOnDelivery}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {t.home.cashOnDeliveryDesc}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
