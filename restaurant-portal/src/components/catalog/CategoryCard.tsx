"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Category } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export function CategoryCard({ category, className = "" }: CategoryCardProps) {
  const { lang } = useLanguage();

  const name = lang === "bn" ? category.nameBn : category.nameEn;
  const description = lang === "bn" ? category.descriptionBn : category.descriptionEn;
  const href = category.isCakeCategory ? "/cakes" : `/foods?category=${category.slug}`;

  return (
    <Link
      href={href}
      className={`group flex flex-col items-center p-3 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 shadow-2xs hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/40 transition-all text-center ${className}`}
    >
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden mb-2.5 bg-orange-50 dark:bg-gray-800">
        <Image
          src={category.image}
          alt={name}
          fill
          sizes="80px"
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {category.isCakeCategory && (
          <div className="absolute top-1 right-1 text-xs">🎂</div>
        )}
      </div>

      <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#FF6B1A] transition-colors line-clamp-1">
        {name}
      </h3>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">
        {description}
      </p>
    </Link>
  );
}
