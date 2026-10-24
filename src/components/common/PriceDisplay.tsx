"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function PriceDisplay({ price, originalPrice, className = "", size = "md" }: PriceDisplayProps) {
  const { formatPrice } = useLanguage();

  const sizeClasses = {
    sm: "text-sm font-semibold",
    md: "text-base font-bold",
    lg: "text-xl font-extrabold",
    xl: "text-2xl font-black",
  };

  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className={`text-zaao-primary text-[#FF6B1A] ${sizeClasses[size]}`}>
        {formatPrice(price)}
      </span>
      {originalPrice && originalPrice > price && (
        <span className="text-xs sm:text-sm text-gray-400 line-through">
          {formatPrice(originalPrice)}
        </span>
      )}
    </div>
  );
}
