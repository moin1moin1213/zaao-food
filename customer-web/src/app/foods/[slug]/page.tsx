"use client";

import React, { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Flame, Award, Check, ShoppingBag, Store, ShieldCheck } from "lucide-react";
import { QuantitySelector } from "@/components/common/QuantitySelector";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { ProductCard } from "@/components/catalog/ProductCard";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { catalogService } from "@/services/catalogService";
import { FoodItem } from "@/services/types";
import { useCart } from "@/services/cartStore";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface FoodDetailsProps {
  params: Promise<{ slug: string }>;
}

export default function FoodDetailsPage({ params }: FoodDetailsProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { addItem } = useCart();
  const { lang, t, formatNum } = useLanguage();
  const [product, setProduct] = useState<FoodItem | null>(null);
  const [relatedFoods, setRelatedFoods] = useState<FoodItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFood() {
      setLoading(true);
      try {
        const item = await catalogService.getFoodBySlug(slug);
        if (item) {
          setProduct(item);
          const related = await catalogService.getRelatedFoods(item.id, item.categoryId);
          setRelatedFoods(related);
        }
      } catch (err) {
        console.error("Failed to load food:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFood();
  }, [slug]);

  if (loading) {
    return <LoadingSkeleton count={3} />;
  }

  if (!product) {
    return (
      <EmptyState
        title={t.common.noResults}
        description={lang === "bn" ? "খাবারটি খুঁজে পাওয়া যায়নি।" : "Food item not found."}
        actionLabel={t.nav.foods}
        actionHref="/foods"
      />
    );
  }

  const name = lang === "bn" ? product.nameBn : product.nameEn;
  const description = lang === "bn" ? product.descriptionBn : product.descriptionEn;
  const restaurantName = lang === "bn" ? product.restaurantNameBn : product.restaurantNameEn;

  const handleAddToCart = () => {
    if (!product.isAvailable) return;

    const res = addItem({
      productId: product.id,
      nameEn: product.nameEn,
      nameBn: product.nameBn,
      price: product.price,
      image: product.image,
      quantity,
      restaurantId: product.restaurantId,
      restaurantNameEn: product.restaurantNameEn,
      restaurantNameBn: product.restaurantNameBn,
      isCake: false,
      specialInstructions: instructions.trim() || undefined,
    });

    if (res.success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  return (
    <div className="space-y-10">
      {/* Back button */}
      <Link
        href="/foods"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#FF6B1A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t.common.back} {t.nav.foods}</span>
      </Link>

      {/* Main Product Hero Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Product Image Gallery / Main Image */}
        <div className="relative w-full h-72 sm:h-96 rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-md">
          <Image
            src={product.image}
            alt={name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isPopular && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-extrabold bg-[#FF6B1A] text-white shadow-sm">
                <Flame className="w-3.5 h-3.5" />
                {t.foods.popularTag}
              </span>
            )}
            {product.isRecommended && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-sm">
                <Award className="w-3.5 h-3.5" />
                {t.foods.recommendedTag}
              </span>
            )}
          </div>
        </div>

        {/* Product Details & Actions */}
        <div className="space-y-6">
          <div>
            <Link
              href={`/restaurants/${product.restaurantId}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B1A] hover:underline mb-2"
            >
              <Store className="w-3.5 h-3.5" />
              <span>{restaurantName}</span>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 leading-snug">
              {name}
            </h1>

            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>{formatNum(product.prepTimeMinutes)} {lang === "bn" ? "মিনিট" : "mins"}</span>
              </div>
              <div>•</div>
              <div>
                {product.isAvailable ? (
                  <span className="text-emerald-600 font-bold">{t.common.available}</span>
                ) : (
                  <span className="text-rose-600 font-bold">{t.common.unavailable}</span>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {description}
          </p>

          {/* Price display */}
          <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-gray-800/60 border border-orange-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              {lang === "bn" ? "প্রতি আইটেম মূল্য:" : "Item Price:"}
            </span>
            <PriceDisplay price={product.price} originalPrice={product.originalPrice} size="xl" />
          </div>

          {/* Quantity Selector and Instructions */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                {t.common.quantity}
              </label>
              <QuantitySelector
                quantity={quantity}
                onIncrease={() => setQuantity((q) => q + 1)}
                onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
                size="lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                {t.common.specialInstructions}
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={t.common.instructionsPlaceholder}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
              />
            </div>

            {/* Add to Cart CTA */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!product.isAvailable}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-base text-white shadow-md transition-all active:scale-98 ${
                isAdded
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : product.isAvailable
                  ? "bg-[#FF6B1A] hover:bg-[#E85B0D]"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>{t.common.addedToCart}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>{t.common.addToCart}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Related items */}
      {relatedFoods.length > 0 && (
        <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4">
            {lang === "bn" ? "আরও পছন্দ হতে পারে" : "You Might Also Like"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {relatedFoods.map((rf) => (
              <ProductCard key={rf.id} product={rf} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
