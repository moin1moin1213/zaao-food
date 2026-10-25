import { Category, FoodItem, Restaurant, PromoBanner } from "./types";
import { MOCK_CATEGORIES, MOCK_FOODS, MOCK_RESTAURANTS } from "./mockData";

export interface CatalogFilterOptions {
  categorySlug?: string;
  restaurantId?: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  isCake?: boolean;
  searchQuery?: string;
  sortBy?: "price_asc" | "price_desc" | "rating" | "relevance";
}

/**
 * Catalog service adapter. Currently reads from the development mock dataset.
 * Designed for immediate plug-and-play swapping with a Supabase client query adapter.
 */
export const catalogService = {
  async getCategories(): Promise<Category[]> {
    return MOCK_CATEGORIES;
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const cat = MOCK_CATEGORIES.find((c) => c.slug === slug);
    return cat || null;
  },

  async getRestaurants(searchQuery?: string): Promise<Restaurant[]> {
    let results = [...MOCK_RESTAURANTS];
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(
        (r) =>
          r.nameEn.toLowerCase().includes(q) ||
          r.nameBn.toLowerCase().includes(q) ||
          r.cuisinesEn.some((c) => c.toLowerCase().includes(q)) ||
          r.cuisinesBn.some((c) => c.toLowerCase().includes(q))
      );
    }
    return results;
  },

  async getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
    const rest = MOCK_RESTAURANTS.find((r) => r.slug === slug);
    return rest || null;
  },

  async getFoods(options: CatalogFilterOptions = {}): Promise<FoodItem[]> {
    let list = [...MOCK_FOODS];

    if (options.categorySlug) {
      const cat = MOCK_CATEGORIES.find((c) => c.slug === options.categorySlug);
      if (cat) {
        list = list.filter((f) => f.categoryId === cat.id);
      }
    }

    if (options.restaurantId) {
      list = list.filter((f) => f.restaurantId === options.restaurantId);
    }

    if (options.isPopular !== undefined) {
      list = list.filter((f) => !!f.isPopular === options.isPopular);
    }

    if (options.isRecommended !== undefined) {
      list = list.filter((f) => !!f.isRecommended === options.isRecommended);
    }

    if (options.isCake !== undefined) {
      list = list.filter((f) => !!f.isCake === options.isCake);
    }

    if (options.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.nameEn.toLowerCase().includes(q) ||
          f.nameBn.toLowerCase().includes(q) ||
          f.descriptionEn.toLowerCase().includes(q) ||
          f.descriptionBn.toLowerCase().includes(q) ||
          f.restaurantNameEn.toLowerCase().includes(q) ||
          f.restaurantNameBn.toLowerCase().includes(q)
      );
    }

    if (options.sortBy) {
      switch (options.sortBy) {
        case "price_asc":
          list.sort((a, b) => a.price - b.price);
          break;
        case "price_desc":
          list.sort((a, b) => b.price - a.price);
          break;
        default:
          break;
      }
    }

    return list;
  },

  async getFoodBySlug(slug: string): Promise<FoodItem | null> {
    const item = MOCK_FOODS.find((f) => f.slug === slug);
    return item || null;
  },

  async getRelatedFoods(currentFoodId: string, categoryId: string): Promise<FoodItem[]> {
    return MOCK_FOODS.filter((f) => f.categoryId === categoryId && f.id !== currentFoodId).slice(0, 4);
  },

  async getCakes(options: Omit<CatalogFilterOptions, "isCake"> = {}): Promise<FoodItem[]> {
    return this.getFoods({ ...options, isCake: true });
  },

  async getCakeBySlug(slug: string): Promise<FoodItem | null> {
    const item = MOCK_FOODS.find((f) => f.slug === slug && f.isCake);
    return item || null;
  },

  async getHeroBanner(): Promise<PromoBanner> {
    return {
      id: "bnr-default",
      badgeEn: "Mathbaria Local Food Delivery",
      badgeBn: "মঠবাড়িয়া স্পেশাল ডেলিভারি",
      titleEn: "Fresh Flavors & Custom Cakes Delivered Across Mathbaria",
      titleBn: "মঠবাড়িয়ার সেরা রেস্তোরাঁ ও হোমমেড কেক আপনার ঠিকানায়",
      subtitleEn: "Order mouthwatering biryani, traditional meals, fast food, and bespoke celebration cakes.",
      subtitleBn: "মঠবাড়িয়া বাজারের ঐতিহ্যবাহী খাবার, বিরিয়ানি ও হোমমেড কেক সহজে অর্ডার করুন দ্রুত ডেলিভারিতে।",
      link: "/foods",
      buttonTextEn: "Browse Foods",
      buttonTextBn: "সকল খাবার দেখুন",
      secondaryLink: "/cakes",
      secondaryTextEn: "Order Cake",
      secondaryTextBn: "কেক অর্ডার করুন",
      bgGradient: "from-[#FF6B1A] via-[#E85B0D] to-[#9E3905]",
      isActive: true,
    };
  },
};
