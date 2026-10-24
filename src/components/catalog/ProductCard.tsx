"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Check, Flame, Award } from "lucide-react";
import { FoodItem } from "@/services/types";
import { PriceDisplay } from "../common/PriceDisplay";
import { useCart } from "@/services/cartStore";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ProductCardProps {
  product: FoodItem;
  className?: string;
}

export function ProductCard({ product, className = "" }: ProductCardProps) {
  const { addItem } = useCart();
  const { lang, t } = useLanguage();
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  const name = lang === "bn" ? product.nameBn : product.nameEn;
  const description = lang === "bn" ? product.descriptionBn : product.descriptionEn;
  const restaurantName = lang === "bn" ? product.restaurantNameBn : product.restaurantNameEn;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.isAvailable) return;

    if (product.isCake) {
      // Cake items require selection of size and advance date; redirect to cake details
      window.location.href = `/cakes/${product.slug}`;
      return;
    }

    const res = addItem({
      productId: product.id,
      nameEn: product.nameEn,
      nameBn: product.nameBn,
      price: product.price,
      image: product.image,
      quantity: 1,
      restaurantId: product.restaurantId,
      restaurantNameEn: product.restaurantNameEn,
      restaurantNameBn: product.restaurantNameBn,
      isCake: false,
    });

    if (res.success) {
      setIsAddedRecently(true);
      setTimeout(() => setIsAddedRecently(false), 1200);
    }
  };

  const detailsHref = product.isCake ? `/cakes/${product.slug}` : `/foods/${product.slug}`;

  return (
    <div
      className={`group flex flex-col justify-between rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-3 sm:p-4 shadow-xs hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/50 transition-all ${
        !product.isAvailable ? "opacity-75" : ""
      } ${className}`}
    >
      <div>
        {/* Product Image */}
        <Link href={detailsHref} className="block relative w-full h-36 sm:h-44 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3">
          <Image
            src={product.image}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {product.isPopular && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#FF6B1A] text-white shadow-sm">
                <Flame className="w-3 h-3" />
                {t.foods.popularTag}
              </span>
            )}
            {product.isRecommended && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-sm">
                <Award className="w-3 h-3" />
                {t.foods.recommendedTag}
              </span>
            )}
            {!product.isAvailable && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-900/80 text-white backdrop-blur-xs">
                {t.common.unavailable}
              </span>
            )}
          </div>
        </Link>

        {/* Restaurant Name */}
        <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate mb-1">
          {restaurantName}
        </div>

        {/* Product Title */}
        <Link href={detailsHref} className="block">
          <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-[#FF6B1A] transition-colors">
            {name}
          </h3>
        </Link>

        {/* Description snippet */}
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Price & Add to Cart button */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
        <PriceDisplay price={product.price} originalPrice={product.originalPrice} size="sm" />

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!product.isAvailable}
          aria-label={`Add ${name} to cart`}
          className={`relative inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
            isAddedRecently
              ? "bg-emerald-600 text-white"
              : product.isAvailable
              ? "bg-orange-50 dark:bg-orange-950/40 text-[#FF6B1A] hover:bg-[#FF6B1A] hover:text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isAddedRecently ? (
            <>
              <Check className="w-3.5 h-3.5 animate-in zoom-in" />
              <span>{t.common.addedToCart}</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>{product.isCake ? t.cakes.bookNow : t.common.addToCart}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
