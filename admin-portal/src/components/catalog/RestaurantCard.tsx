"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, MapPin, Store } from "lucide-react";
import { Restaurant } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface RestaurantCardProps {
  restaurant: Restaurant;
  className?: string;
}

export function RestaurantCard({ restaurant, className = "" }: RestaurantCardProps) {
  const { lang, t, formatPrice, formatNum } = useLanguage();

  const name = lang === "bn" ? restaurant.nameBn : restaurant.nameEn;
  const cuisines = lang === "bn" ? restaurant.cuisinesBn : restaurant.cuisinesEn;
  const address = lang === "bn" ? restaurant.addressBn : restaurant.addressEn;
  const hours = lang === "bn" ? restaurant.openingHoursBn : restaurant.openingHoursEn;

  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      className={`group flex flex-col rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 overflow-hidden shadow-xs hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-900/50 transition-all ${
        !restaurant.isOpen ? "opacity-80" : ""
      } ${className}`}
    >
      {/* Banner image with overlay */}
      <div className="relative w-full h-40 sm:h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <Image
          src={restaurant.banner || restaurant.image}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Partner Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/50 text-white backdrop-blur-xs flex items-center gap-1">
            <Store className="w-3 h-3 text-[#FF6B1A]" />
            <span>{lang === "bn" ? "ভেরিফায়েড কিচেন" : "Verified Kitchen"}</span>
          </span>
        </div>

        {/* Status tag */}
        <div className="absolute top-2.5 right-2.5">
          {restaurant.isOpen ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {t.common.open}
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-sm">
              {t.common.closed}
            </span>
          )}
        </div>

        {/* Bottom banner info */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-1 font-bold bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{restaurant.rating}</span>
            <span className="text-gray-300 text-[10px]">({formatNum(restaurant.reviewCount)})</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
            <Clock className="w-3 h-3 text-orange-300" />
            <span>{formatNum(restaurant.prepTimeMinutes)} {lang === "bn" ? "মিনিট" : "mins"}</span>
          </div>
        </div>
      </div>

      {/* Restaurant Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 group-hover:text-[#FF6B1A] transition-colors truncate">
            {name}
          </h3>

          {/* Cuisines pills */}
          <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
            {cuisines.slice(0, 3).map((c, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                {c}
              </span>
            ))}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{address}</span>
          </div>
        </div>

        {/* Min order and opening hours */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{t.common.minOrder}: <strong className="text-gray-800 dark:text-gray-200">{formatPrice(restaurant.minOrder)}</strong></span>
          <span className="text-[11px]">{hours}</span>
        </div>
      </div>
    </Link>
  );
}
