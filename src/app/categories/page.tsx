"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Utensils } from "lucide-react";
import { catalogService } from "@/services/catalogService";
import { Category } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";

export default function CategoriesPage() {
  const { lang, t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalogService.getCategories().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
          {t.categories.title}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t.categories.subtitle}
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const name = lang === "bn" ? cat.nameBn : cat.nameEn;
            const description = lang === "bn" ? cat.descriptionBn : cat.descriptionEn;
            const href = cat.isCakeCategory ? "/cakes" : `/foods?category=${cat.slug}`;

            return (
              <Link
                key={cat.id}
                href={href}
                className="group flex items-center gap-4 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 shadow-xs hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-900/50 transition-all"
              >
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-orange-50 dark:bg-gray-800 shrink-0">
                  <Image
                    src={cat.image}
                    alt={name}
                    fill
                    sizes="80px"
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {cat.isCakeCategory && (
                    <div className="absolute top-1 right-1 text-sm">🎂</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 group-hover:text-[#FF6B1A] transition-colors truncate">
                    {name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                    {description}
                  </p>
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B1A] mt-2 group-hover:translate-x-0.5 transition-transform">
                    <span>{lang === "bn" ? "খাবার দেখুন" : "Explore Menu"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
