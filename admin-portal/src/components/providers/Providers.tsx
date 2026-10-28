"use client";

import React, { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { CartProvider } from "@/services/cartStore";
import { RestaurantConflictModal } from "@/components/cart/RestaurantConflictModal";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LanguageProvider>
        <CartProvider>
          {children}
          <RestaurantConflictModal />
        </CartProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
