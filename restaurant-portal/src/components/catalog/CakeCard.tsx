"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, User, Sparkles, ArrowRight } from "lucide-react";
import { FoodItem } from "@/services/types";
import { PriceDisplay } from "../common/PriceDisplay";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface CakeCardProps {
  cake: FoodItem;
  className?: string;
}

export function CakeCard({ cake, className = "" }: CakeCardProps) {
  const { lang, t, formatNum } = useLanguage();

  const name = lang === "bn" ? cake.nameBn : cake.nameEn;
  const description = lang === "bn" ? cake.descriptionBn : cake.descriptionEn;
  const bakerName = lang === "bn" ? cake.bakerNameBn : cake.bakerNameEn;
  const minDays = cake.minAdvanceDays || 2;

  return (
    <div
      className={`group flex flex-col justify-between rounded-3xl border border-pink-100 dark:border-pink-950/40 bg-white dark:bg-gray-850 p-4 shadow-xs hover:shadow-xl hover:border-pink-300 dark:hover:border-pink-900 transition-all ${className}`}
    >
      <div>
        {/* Cake Image with advance booking badge */}
        <Link
          href={`/cakes/${cake.slug}`}
          className="block relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-pink-50 dark:bg-gray-800 mb-3.5"
        >
          <Image
            src={cake.image}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Advance Booking Tag */}
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-pink-600 text-white shadow-sm backdrop-blur-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatNum(minDays)} {lang === "bn" ? "দিন আগে বুকিং" : "days advance"}</span>
            </span>
          </div>

          {/* Homemade Badge */}
          <div className="absolute bottom-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-white/90 dark:bg-gray-900/90 text-pink-700 dark:text-pink-300 shadow-sm backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-pink-500" />
              <span>{lang === "bn" ? "হোমমেড" : "Handcrafted"}</span>
            </span>
          </div>
        </Link>

        {/* Baker Name */}
        {bakerName && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-700 dark:text-pink-400 mb-1">
            <User className="w-3.5 h-3.5" />
            <span className="truncate">{bakerName}</span>
          </div>
        )}

        {/* Cake Title */}
        <Link href={`/cakes/${cake.slug}`} className="block">
          <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors line-clamp-1">
            {name}
          </h3>
        </Link>

        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
          {description}
        </p>

        {/* Cake size options summary */}
        {cake.cakeSizes && cake.cakeSizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {cake.cakeSizes.map((s) => (
              <span
                key={s.id}
                className="text-[10px] px-2 py-0.5 rounded-md bg-pink-50 dark:bg-pink-950/30 text-pink-800 dark:text-pink-300 border border-pink-100 dark:border-pink-900/40"
              >
                {s.weight}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Price & Booking action */}
      <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-pink-100/60 dark:border-gray-800">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 block">
            {lang === "bn" ? "শুরু" : "From"}
          </span>
          <PriceDisplay price={cake.price} originalPrice={cake.originalPrice} size="md" />
        </div>

        <Link
          href={`/cakes/${cake.slug}`}
          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-700 hover:to-orange-600 shadow-sm transition-transform active:scale-95"
        >
          <span>{t.cakes.bookNow}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
