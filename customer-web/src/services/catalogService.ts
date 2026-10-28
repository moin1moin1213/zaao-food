import { Category, FoodItem, Restaurant, PromoBanner, CatalogFilterOptions } from "./types";
import { MOCK_CATEGORIES, MOCK_FOODS, MOCK_RESTAURANTS } from "./mockData";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Catalog Service.
 * Automatically queries real production data from Supabase if configured,
 * otherwise falls back to local data with clear status indicators.
 */
export const catalogService = {
  async getCategories(): Promise<Category[]> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("display_order", { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((c) => ({
            id: c.id,
            slug: c.slug,
            nameEn: c.name_en,
            nameBn: c.name_bn,
            image: c.image_url,
            descriptionEn: c.description_en || "",
            descriptionBn: c.description_bn || "",
            isCakeCategory: c.slug === "cakes",
          }));
        }
      } catch (err) {
        console.warn("Supabase categories query error, using local fallback:", err);
      }
    }
    return MOCK_CATEGORIES;
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find((c) => c.slug === slug) || null;
  },

  async getRestaurants(searchQuery?: string): Promise<Restaurant[]> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .order("rating", { ascending: false });

        if (!error && data && data.length > 0) {
          let results: Restaurant[] = data.map((r) => ({
            id: r.id,
            slug: r.slug,
            nameEn: r.name_en,
            nameBn: r.name_bn,
            phone: r.phone,
            image: r.image_url,
            banner: r.banner_url,
            cuisinesEn: r.cuisines_en || [],
            cuisinesBn: r.cuisines_bn || [],
            rating: Number(r.rating) || 5.0,
            reviewCount: r.review_count || 0,
            isOpen: r.is_open,
            openingHoursEn: r.opening_hours_en,
            openingHoursBn: r.opening_hours_bn,
            minOrder: Number(r.min_order) || 0,
            addressEn: r.address_en,
            addressBn: r.address_bn,
            distanceKm: Number(r.distance_km) || 1.0,
            prepTimeMinutes: r.prep_time_minutes || 25,
          }));

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
        }
      } catch (err) {
        console.warn("Supabase restaurants query error, using local fallback:", err);
      }
    }

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
    const rests = await this.getRestaurants();
    return rests.find((r) => r.slug === slug) || null;
  },

  async getFoods(options: CatalogFilterOptions = {}): Promise<FoodItem[]> {
    if (supabase && isSupabaseConfigured) {
      try {
        let query = supabase.from("products").select("*, restaurants(name_en, name_bn)");

        if (options.categorySlug) {
          const cat = await this.getCategoryBySlug(options.categorySlug);
          if (cat) query = query.eq("category_id", cat.id);
        }
        if (options.restaurantId) {
          query = query.eq("restaurant_id", options.restaurantId);
        }
        if (options.isRecommended !== undefined) {
          query = query.eq("is_recommended", options.isRecommended);
        }
        if (options.isCake !== undefined) {
          query = query.eq("is_cake", options.isCake);
        }

        // Query database with is_popular ordering
        query = query.order("is_popular", { ascending: false });

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          let list: FoodItem[] = data.map((p) => ({
            id: p.id,
            slug: p.slug,
            nameEn: p.name_en,
            nameBn: p.name_bn,
            descriptionEn: p.description_en || "",
            descriptionBn: p.description_bn || "",
            price: Number(p.price),
            originalPrice: p.original_price ? Number(p.original_price) : undefined,
            image: p.image_url,
            categoryId: p.category_id,
            restaurantId: p.restaurant_id,
            restaurantNameEn: p.restaurants?.name_en || "PenguFood Kitchen",
            restaurantNameBn: p.restaurants?.name_bn || "পেঙ্গুফুড কিচেন",
            isAvailable: p.is_available,
            isPopular: p.is_popular,
            isRecommended: p.is_recommended,
            salesCount: p.sales_count ? Number(p.sales_count) : 0,
            isCake: p.is_cake,
            prepTimeMinutes: 25,
            minAdvanceDays: p.cake_advance_days || 2,
            cakeSizes: p.cake_sizes || undefined,
            cakeFlavors: p.cake_flavors || undefined,
          }));

          // If filtering specifically for Hot Selling / Popular:
          // Include items marked is_popular by Admin OR items with sales_count > 0
          if (options.isPopular) {
            list = list.filter((f) => f.isPopular || (f.salesCount && f.salesCount > 0));
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
                list.sort((a, b) => {
                  if (a.isPopular && !b.isPopular) return -1;
                  if (!a.isPopular && b.isPopular) return 1;
                  return (b.salesCount || 0) - (a.salesCount || 0);
                });
                break;
            }
          } else {
            // Default Priority: Admin manual Hot Selling (isPopular) first, then Highest salesCount descending
            list.sort((a, b) => {
              if (a.isPopular && !b.isPopular) return -1;
              if (!a.isPopular && b.isPopular) return 1;
              return (b.salesCount || 0) - (a.salesCount || 0);
            });
          }
          return list;
        }

        const hasFilter = Boolean(
          options.categorySlug ||
          options.restaurantId ||
          options.searchQuery ||
          options.isPopular !== undefined ||
          options.isRecommended !== undefined ||
          options.isCake !== undefined
        );

        if (!error && data && data.length === 0 && hasFilter) {
          return [];
        }
      } catch (err) {
        console.warn("Supabase products query error, using local fallback:", err);
      }
    }

    // Local Fallback
    let list = [...MOCK_FOODS];
    if (options.categorySlug) {
      list = list.filter((f) => {
        const cat = MOCK_CATEGORIES.find((c) => c.slug === options.categorySlug);
        return cat ? f.categoryId === cat.id : false;
      });
    }
    if (options.restaurantId) {
      list = list.filter((f) => f.restaurantId === options.restaurantId);
    }
    if (options.isPopular !== undefined) {
      list = list.filter((f) => f.isPopular === options.isPopular);
    }
    if (options.isRecommended !== undefined) {
      list = list.filter((f) => f.isRecommended === options.isRecommended);
    }
    if (options.isCake !== undefined) {
      list = list.filter((f) => f.isCake === options.isCake);
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
          list.sort((a, b) => {
            if (a.isPopular && !b.isPopular) return -1;
            if (!a.isPopular && b.isPopular) return 1;
            return (b.salesCount || 0) - (a.salesCount || 0);
          });
          break;
      }
    } else {
      list.sort((a, b) => {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return (b.salesCount || 0) - (a.salesCount || 0);
      });
    }
    return list;
  },

  async getFoodBySlug(slug: string): Promise<FoodItem | null> {
    const list = await this.getFoods();
    return list.find((f) => f.slug === slug) || null;
  },

  async getRelatedFoods(currentFoodId: string, categoryId: string): Promise<FoodItem[]> {
    const list = await this.getFoods();
    return list.filter((f) => f.categoryId === categoryId && f.id !== currentFoodId).slice(0, 4);
  },

  async getCakes(options: Omit<CatalogFilterOptions, "isCake"> = {}): Promise<FoodItem[]> {
    return this.getFoods({ ...options, isCake: true });
  },

  async getCakeBySlug(slug: string): Promise<FoodItem | null> {
    const list = await this.getCakes();
    return list.find((f) => f.slug === slug && f.isCake) || null;
  },

  async getHeroBanner(): Promise<PromoBanner> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .limit(1)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            badgeEn: data.badge_en,
            badgeBn: data.badge_bn,
            titleEn: data.title_en,
            titleBn: data.title_bn,
            subtitleEn: data.subtitle_en || "",
            subtitleBn: data.subtitle_bn || "",
            link: data.link,
            buttonTextEn: data.button_text_en,
            buttonTextBn: data.button_text_bn,
            secondaryLink: data.secondary_link,
            secondaryTextEn: data.secondary_text_en,
            secondaryTextBn: data.secondary_text_bn,
            bgGradient: data.bg_gradient || "from-[#FF6B1A] via-[#E85B0D] to-[#9E3905]",
            isActive: data.is_active,
          };
        }
      } catch (err) {
        console.warn("Supabase banners query error, using default:", err);
      }
    }

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
