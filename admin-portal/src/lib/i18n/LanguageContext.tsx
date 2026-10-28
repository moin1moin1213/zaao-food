"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Language } from "@/services/types";
import { translations, formatCurrency, formatNumber } from "./dictionaries";
import { safeLocalStorageGet, safeLocalStorageSet } from "../storage/safeStorage";

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.bn;
  formatPrice: (amount: number) => string;
  formatNum: (num: number | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("bn");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = safeLocalStorageGet<Language>("preferred_lang", "bn");
    if (saved === "bn" || saved === "en") {
      setLangState(saved);
    }
    setMounted(true);
  }, []);

  const setLanguage = (newLang: Language) => {
    setLangState(newLang);
    safeLocalStorageSet("preferred_lang", newLang);
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLang;
    }
  };

  const t = translations[lang] || translations.bn;

  const value: LanguageContextType = {
    lang,
    setLanguage,
    t,
    formatPrice: (amount: number) => formatCurrency(amount, lang),
    formatNum: (num: number | string) => formatNumber(num, lang),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
