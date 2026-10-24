"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageToggle({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { lang, setLanguage } = useLanguage();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setLanguage(lang === "bn" ? "en" : "bn")}
        aria-label="Switch language"
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm hover:border-[#FF6B1A] transition-all active:scale-95 ${className}`}
      >
        <Globe className="w-3.5 h-3.5 text-[#FF6B1A]" />
        <span>{lang === "bn" ? "EN" : "বাং"}</span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100/70 dark:bg-gray-800/80 shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage("bn")}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
          lang === "bn"
            ? "bg-white dark:bg-gray-700 text-[#FF6B1A] font-bold shadow-xs"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
        }`}
      >
        বাংলা
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
          lang === "en"
            ? "bg-white dark:bg-gray-700 text-[#FF6B1A] font-bold shadow-xs"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
        }`}
      >
        EN
      </button>
    </div>
  );
}
