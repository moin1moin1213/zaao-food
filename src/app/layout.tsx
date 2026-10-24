import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { CartProvider } from "@/services/cartStore";
import { Header } from "@/components/layout/Header";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Footer } from "@/components/layout/Footer";
import { RestaurantConflictModal } from "@/components/cart/RestaurantConflictModal";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zaao Food — Local Food & Homemade Cake Delivery in Mathbaria",
  description: "Mathbaria's dedicated local food and handcrafted homemade cake delivery service. Fresh, authentic meals and celebration cakes dispatched straight to your door.",
  icons: {
    icon: "/zaao-logo-light.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#121316" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-white dark:bg-[#121316] text-[#202124] dark:text-[#F3F4F6] transition-colors safe-pb-nav">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <CartProvider>
              {/* Desktop Header */}
              <Header />

              {/* Mobile Header */}
              <MobileHeader />

              {/* Main Content Area */}
              <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                {children}
              </main>

              {/* Desktop/Tablet Footer */}
              <Footer />

              {/* Exactly 4-tab Mobile Bottom Navigation */}
              <MobileBottomNav />

              {/* Global Modals */}
              <RestaurantConflictModal />
            </CartProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
