"use client";

import React from "react";
import { Plus, Minus } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
  disabled = false,
  size = "md",
}: QuantitySelectorProps) {
  const { formatNum } = useLanguage();

  const sizeStyles = {
    sm: "h-7 text-xs",
    md: "h-9 text-sm",
    lg: "h-11 text-base",
  };

  const btnStyles = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm ${sizeStyles[size]}`}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || quantity <= min}
        aria-label="Decrease quantity"
        className={`flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-l-lg ${btnStyles[size]}`}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <span className="min-w-[2.2rem] text-center font-bold text-gray-900 dark:text-gray-100 px-1 select-none">
        {formatNum(quantity)}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || quantity >= max}
        aria-label="Increase quantity"
        className={`flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-r-lg ${btnStyles[size]}`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
