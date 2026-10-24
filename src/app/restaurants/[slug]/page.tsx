"use client";

import React, { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Clock, MapPin, Search, AlertCircle, ArrowLeft, ShieldAlert } from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { catalogService } from "@/services/catalogService";
import { Restaurant, FoodItem } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface RestaurantDetailsProps {
  params: Promise<{ slug: string }>;
}

export default function RestaurantDetailsPage({ params }: RestaurantDetailsProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { lang, t, formatPrice, formatNum } = useLanguage();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const rest = await catalogService.getRestaurantBySlug(slug);
        if (rest) {
          setRestaurant(rest);
          const foods = await catalogService.getFoods({ restaurantId: rest.id });
          setMenuItems(foods);
        }
      } catch (err) {
        console.error("Failed to load restaurant details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  if (loading) {
    return <LoadingSkeleton count={4} />;
  }

  if (!restaurant) {
    return (
      <EmptyState
        title={t.common.noResults}
        description={lang === "bn" ? "রেস্তোরাঁটি খুঁজে পাওয়া যায়নি।" : "Restaurant not found."}
        actionLabel={t.nav.restaurants}
        actionHref="/restaurants"
      />
    );
  }

  const name = lang === "bn" ? restaurant.nameBn : restaurant.nameEn;
  const address = lang === "bn" ? restaurant.addressBn : restaurant.addressEn;
  const hours = lang === "bn" ? restaurant.openingHoursBn : restaurant.openingHoursEn;
  const cuisines = lang === "bn" ? restaurant.cuisinesBn : restaurant.cuisinesEn;

  const filteredMenu = menuItems.filter((item) => {
    if (!menuSearch.trim()) return true;
    const q = menuSearch.toLowerCase().trim();
    return (
      item.nameEn.toLowerCase().includes(q) ||
      item.nameBn.toLowerCase().includes(q) ||
      item.descriptionEn.toLowerCase().includes(q) ||
      item.descriptionBn.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/restaurants"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#FF6B1A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t.common.back} {t.nav.restaurants}</span>
      </Link>

      {/* Restaurant Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md">
        <div className="relative w-full h-48 sm:h-72">
          <Image
            src={restaurant.banner || restaurant.image}
            alt={name}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>

        {/* Floating Restaurant Details Card on Banner */}
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {restaurant.isOpen ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {t.common.open}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
                {t.common.closed}
              </span>
            )}

            <div className="flex items-center gap-1 text-xs font-bold bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{restaurant.rating}</span>
              <span className="text-gray-300">({formatNum(restaurant.reviewCount)} {lang === "bn" ? "রিভিউ" : "reviews"})</span>
            </div>

            <div className="flex items-center gap-1 text-xs bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
              <Clock className="w-3.5 h-3.5 text-orange-300" />
              <span>{formatNum(restaurant.prepTimeMinutes)} {lang === "bn" ? "মিনিট" : "mins"}</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-3xl font-black">{name}</h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-200">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>{address}</span>
            </div>
            <div>•</div>
            <div>{t.common.minOrder}: <strong>{formatPrice(restaurant.minOrder)}</strong></div>
            <div>•</div>
            <div>{hours}</div>
          </div>
        </div>
      </div>

      {/* Closed Warning notice if restaurant is closed */}
      {!restaurant.isOpen && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-3 text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <p className="text-xs sm:text-sm font-medium">
            {t.restaurants.closedNotice}
          </p>
        </div>
      )}

      {/* Menu Search and Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">
          {t.restaurants.menuCategories} ({formatNum(filteredMenu.length)})
        </h2>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            placeholder={t.restaurants.menuSearchPlaceholder}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Menu Items Grid */}
      {filteredMenu.length === 0 ? (
        <EmptyState
          title={t.common.noResults}
          description={lang === "bn" ? "এই মেন্যুতে কোনো খাবার খুঁজে পাওয়া যায়নি।" : "No items match your menu search."}
          actionLabel={lang === "bn" ? "সকল মেন্যু দেখুন" : "Clear Search"}
          onAction={() => setMenuSearch("")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMenu.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
    </div>
  );
}
