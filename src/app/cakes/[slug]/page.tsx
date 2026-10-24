"use client";

import React, { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Sparkles, Check, Info, ShieldAlert, Heart, MessageSquare } from "lucide-react";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { catalogService } from "@/services/catalogService";
import { FoodItem, CakeSizeOption, CakeFlavorOption } from "@/services/types";
import { useCart } from "@/services/cartStore";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface CakeDetailsProps {
  params: Promise<{ slug: string }>;
}

export default function CakeDetailsPage({ params }: CakeDetailsProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { addItem } = useCart();
  const { lang, t, formatNum, formatPrice } = useLanguage();
  const [cake, setCake] = useState<FoodItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<CakeSizeOption | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<CakeFlavorOption | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [isAdded, setIsAdded] = useState(false);
  const [dateError, setDateError] = useState("");
  const [loading, setLoading] = useState(true);

  // Compute minimum date (today + 2 days)
  const minDateObj = new Date();
  minDateObj.setDate(minDateObj.getDate() + 2);
  const minDateString = minDateObj.toISOString().split("T")[0];

  useEffect(() => {
    async function loadCake() {
      setLoading(true);
      try {
        const item = await catalogService.getCakeBySlug(slug);
        if (item) {
          setCake(item);
          if (item.cakeSizes && item.cakeSizes.length > 0) {
            setSelectedSize(item.cakeSizes[0]);
          }
          if (item.cakeFlavors && item.cakeFlavors.length > 0) {
            setSelectedFlavor(item.cakeFlavors[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load cake:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCake();
  }, [slug]);

  if (loading) {
    return <LoadingSkeleton count={3} />;
  }

  if (!cake) {
    return (
      <EmptyState
        title={t.common.noResults}
        description={lang === "bn" ? "কেকটি খুঁজে পাওয়া যায়নি।" : "Cake item not found."}
        actionLabel={t.nav.cakes}
        actionHref="/cakes"
      />
    );
  }

  const name = lang === "bn" ? cake.nameBn : cake.nameEn;
  const description = lang === "bn" ? cake.descriptionBn : cake.descriptionEn;
  const bakerName = lang === "bn" ? cake.bakerNameBn : cake.bakerNameEn;
  const currentPrice = selectedSize ? selectedSize.price : cake.price;
  const minDays = cake.minAdvanceDays || 2;

  const handleBooking = () => {
    if (!deliveryDate) {
      setDateError(lang === "bn" ? "অনুগ্রহ করে ডেলিভারির তারিখ নির্বাচন করুন।" : "Please select requested delivery date.");
      return;
    }

    if (new Date(deliveryDate) < new Date(minDateString)) {
      setDateError(
        lang === "bn"
          ? `ন্যূনতম ${formatNum(minDays)} দিন পূর্বে অগ্রিম বুকিং দেওয়া আবশ্যক (${minDateString})।`
          : `Minimum ${minDays} days advance notice required (${minDateString}).`
      );
      return;
    }

    setDateError("");

    const res = addItem({
      productId: cake.id,
      nameEn: cake.nameEn,
      nameBn: cake.nameBn,
      price: currentPrice,
      image: cake.image,
      quantity: 1,
      restaurantId: cake.restaurantId,
      restaurantNameEn: cake.restaurantNameEn,
      restaurantNameBn: cake.restaurantNameBn,
      isCake: true,
      selectedSize: selectedSize || undefined,
      selectedFlavor: selectedFlavor || undefined,
      customMessage: customMessage.trim() || undefined,
      requestedDeliveryDate: deliveryDate,
    });

    if (res.success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link
        href="/cakes"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-pink-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t.common.back} {t.nav.cakes}</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Cake Photo */}
        <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden bg-pink-50 dark:bg-gray-800 shadow-md">
          <Image
            src={cake.image}
            alt={name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />

          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-600 text-white shadow-sm">
              <Calendar className="w-4 h-4" />
              <span>{formatNum(minDays)} {lang === "bn" ? "দিন আগে বুকিং" : "days advance"}</span>
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl text-white text-xs">
            <span className="font-semibold">{bakerName}</span>
            <span className="text-pink-300 font-bold">{lang === "bn" ? "হোমমেড বেকারি" : "Handcrafted"}</span>
          </div>
        </div>

        {/* Cake Booking Controls */}
        <div className="space-y-6">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 dark:text-pink-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.cakes.badge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 leading-snug">
              {name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/40">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              {lang === "bn" ? "নির্বাচিত সাইজের মূল্য:" : "Calculated Price:"}
            </span>
            <PriceDisplay price={currentPrice} originalPrice={cake.originalPrice} size="xl" />
          </div>

          {/* Size Selection */}
          {cake.cakeSizes && cake.cakeSizes.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">
                {t.cakes.cakeSizes}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cake.cakeSizes.map((size) => {
                  const isSelected = selectedSize?.id === size.id;
                  const label = lang === "bn" ? size.labelBn : size.labelEn;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        isSelected
                          ? "border-pink-600 bg-pink-50/80 dark:bg-pink-950/40 ring-1 ring-pink-600 text-pink-950 dark:text-pink-100"
                          : "border-gray-200 dark:border-gray-700 hover:border-pink-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <div className="text-xs font-bold">{label}</div>
                      <div className="text-xs text-pink-600 font-extrabold mt-1">
                        {formatPrice(size.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Flavor Selection */}
          {cake.cakeFlavors && cake.cakeFlavors.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">
                {t.cakes.selectFlavor}
              </label>
              <div className="flex flex-wrap gap-2">
                {cake.cakeFlavors.map((flv) => {
                  const isSelected = selectedFlavor?.id === flv.id;
                  const flvName = lang === "bn" ? flv.nameBn : flv.nameEn;
                  return (
                    <button
                      key={flv.id}
                      type="button"
                      onClick={() => setSelectedFlavor(flv)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-pink-600 text-white shadow-xs"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {flvName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Message on Cake */}
          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
              {t.cakes.customMessage}
            </label>
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={t.cakes.customMessagePlaceholder}
              maxLength={60}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Requested Delivery Date (2-3 days advance) */}
          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
              {t.cakes.deliveryDate} ({lang === "bn" ? `কমপক্ষে ${formatNum(minDays)} দিন পূর্বে` : `At least ${minDays} days ahead`})
            </label>
            <input
              type="date"
              min={minDateString}
              value={deliveryDate}
              onChange={(e) => {
                setDeliveryDate(e.target.value);
                setDateError("");
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            {dateError && (
              <p className="text-xs text-rose-600 font-semibold mt-1">{dateError}</p>
            )}
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              {t.cakes.deliveryDateNotice}
            </p>
          </div>

          {/* Honest Preview Disclaimer Notice */}
          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <Info className="w-4 h-4 inline mr-1 text-amber-600" />
            {lang === "bn"
              ? "দৃষ্টি আকর্ষণ: এই ধাপে নির্বাচিত তারিখটি প্রিভিউ কার্টে সংরক্ষিত হবে। আসল বেকারের নিশ্চয়তা ফেজ ২ ব্যাকএন্ড অনুমোদনের পর প্রযোজ্য হবে।"
              : "Notice: Requested date is recorded in your development preview cart. Real baker slot confirmation requires Phase 2 backend verification."}
          </div>

          {/* Add to Cart CTA */}
          <button
            type="button"
            onClick={handleBooking}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-base text-white shadow-md transition-all active:scale-98 ${
              isAdded
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-700 hover:to-orange-600"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-5 h-5" />
                <span>{t.common.addedToCart}</span>
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                <span>{t.cakes.bookNow}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
