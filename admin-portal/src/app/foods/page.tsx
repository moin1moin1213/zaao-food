"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Search,
  Store,
  Tag,
  CheckCircle2,
  XCircle,
  Flame,
  Star,
  Sparkles,
  Cake,
  X,
  Save,
  Image as ImageIcon,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import { FoodItem, Restaurant, Category } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MOCK_CATEGORIES } from "@/services/mockData";

// Curated high-quality food photography presets for Mathbaria restaurants
const FOOD_IMAGE_PRESETS = [
  {
    label: "Kacchi Biryani",
    url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Chicken Roast & Polao",
    url: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Hyderabadi Dum Biryani",
    url: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Ilish Bhaja & Khichuri",
    url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Beef Kala Bhuna",
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Deshi Chicken Curry",
    url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Monster Cheese Burger",
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Crispy Fried Chicken",
    url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Egg Chicken Kathi Roll",
    url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Singara & Evening Snacks",
    url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Shahi Borhani Drink",
    url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Chocolate Truffle Cake",
    url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Red Velvet Cake",
    url: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Black Forest Cherry Cake",
    url: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Floral Buttercream Cake",
    url: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80",
  },
];

function AdminFoodsContent() {
  const searchParams = useSearchParams();
  const initialRestId = searchParams.get("restaurantId") || "";

  const { lang, formatPrice } = useLanguage();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestId, setSelectedRestId] = useState(initialRestId);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Partial<FoodItem> | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [foodsList, restList, catList] = await Promise.all([
        adminService.getFoods(),
        adminService.getRestaurants(),
        adminService.getCategories(),
      ]);
      setFoods(foodsList);
      setRestaurants(restList);
      setCategories(catList);
    } catch (err) {
      console.error("Failed to load foods or restaurants:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Food List
  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      const matchesSearch =
        !searchQuery ||
        f.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.descriptionEn && f.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.descriptionBn && f.descriptionBn.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRest = !selectedRestId || f.restaurantId === selectedRestId;
      const matchesCat =
        selectedCategory === "all" ||
        f.categoryId === selectedCategory ||
        (selectedCategory === "cakes" && f.isCake);
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in_stock" && f.isAvailable) ||
        (stockFilter === "out_of_stock" && !f.isAvailable);

      return matchesSearch && matchesRest && matchesCat && matchesStock;
    });
  }, [foods, searchQuery, selectedRestId, selectedCategory, stockFilter]);

  // Open Modal to Add
  const handleOpenAddModal = () => {
    const defaultRest = restaurants[0]?.id || "rest-1";
    setEditingFood({
      nameEn: "",
      nameBn: "",
      descriptionEn: "",
      descriptionBn: "",
      price: 150,
      originalPrice: undefined,
      restaurantId: selectedRestId || defaultRest,
      categoryId: "cat_biryani",
      image: FOOD_IMAGE_PRESETS[0].url,
      isAvailable: true,
      isPopular: false,
      isRecommended: false,
      isCake: false,
      minAdvanceDays: 2,
    });
    setIsModalOpen(true);
  };

  // Open Modal to Edit
  const handleOpenEditModal = (f: FoodItem) => {
    setEditingFood({ ...f });
    setIsModalOpen(true);
  };

  // Fast In-Stock / Out-of-Stock Toggle
  const handleToggleStock = async (f: FoodItem) => {
    const nextState = !f.isAvailable;
    // Optimistic UI update
    setFoods((prev) =>
      prev.map((item) => (item.id === f.id ? { ...item, isAvailable: nextState } : item))
    );
    try {
      await adminService.toggleFoodAvailability(f.id, nextState);
    } catch (err) {
      console.error("Toggle stock error:", err);
      loadData();
    }
  };

  // Delete Food Item
  const handleDeleteFood = async (f: FoodItem) => {
    const confirmMsg =
      lang === "bn"
        ? `আপনি কি নিশ্চিত যে "${f.nameBn || f.nameEn}" খাবারটি মুছে ফেলতে চান?`
        : `Are you sure you want to delete "${f.nameEn}"?`;
    if (!window.confirm(confirmMsg)) return;

    // Optimistic UI update
    setFoods((prev) => prev.filter((item) => item.id !== f.id));
    try {
      await adminService.deleteFood(f.id);
    } catch (err) {
      console.error("Delete food error:", err);
      loadData();
    }
  };

  // Save Food Item
  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFood) return;
    setSaving(true);
    try {
      await adminService.saveFood(editingFood);
      setIsModalOpen(false);
      setEditingFood(null);
      await loadData();
    } catch (err) {
      console.error("Save food error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            <UtensilsCrossed className="w-7 h-7 text-[#FF6B1A]" />
            <span>{lang === "bn" ? "খাবার ও মেনু ক্যাটালগ" : "Food & Menu Catalog"}</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {lang === "bn"
              ? "মঠবাড়িয়ার রেস্তোরাঁ ও হোম বেকারদের খাবার, ছবি ও দাম অ্যাডমিন প্যানেল থেকে যোগ, এডিট বা ডিলিট করুন।"
              : "Add, edit, or remove food items, pricing, stock, and photos across Mathbaria restaurants."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF6B1A] text-white text-xs font-bold hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === "bn" ? "নতুন খাবার যোগ করুন" : "Add Food Item"}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-gray-850 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === "bn" ? "খাবারের নাম বা বিবরণ..." : "Search food name..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs font-semibold rounded-2xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 focus:outline-hidden focus:border-[#FF6B1A]"
            />
          </div>

          {/* Restaurant Filter */}
          <div>
            <select
              value={selectedRestId}
              onChange={(e) => setSelectedRestId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-2xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 focus:outline-hidden focus:border-[#FF6B1A]"
            >
              <option value="">{lang === "bn" ? "সকল রেস্তোরাঁ" : "All Restaurants"}</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {lang === "bn" ? r.nameBn : r.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-2xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 focus:outline-hidden focus:border-[#FF6B1A]"
            >
              <option value="all">{lang === "bn" ? "সকল ক্যাটাগরি" : "All Categories"}</option>
              <option value="cat_biryani">{lang === "bn" ? "বিরিয়ানি ও পোলাও" : "Biryani & Polao"}</option>
              <option value="cat_rice">{lang === "bn" ? "ভাত ও তরকারি" : "Rice & Curries"}</option>
              <option value="cat_fastfood">{lang === "bn" ? "বার্গার ও ফাস্টফুড" : "Burgers & Fast Food"}</option>
              <option value="cat_snacks">{lang === "bn" ? "সান্ধ্যকালীন নাশতা" : "Evening Snacks"}</option>
              <option value="cat_cakes">{lang === "bn" ? "হোমমেড কেক" : "Homemade Cakes"}</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-2xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 focus:outline-hidden focus:border-[#FF6B1A]"
            >
              <option value="all">{lang === "bn" ? "সকল স্টক অবস্থা" : "All Stock Status"}</option>
              <option value="in_stock">{lang === "bn" ? "উপলব্ধ (In Stock)" : "In Stock Only"}</option>
              <option value="out_of_stock">{lang === "bn" ? "স্টক শেষ (Out of Stock)" : "Out of Stock"}</option>
            </select>
          </div>
        </div>

        {/* Counter Bar */}
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
          <span>
            {lang === "bn"
              ? `মোট ${filteredFoods.length} টি খাবার প্রদর্শিত হচ্ছে`
              : `Showing ${filteredFoods.length} foods`}
          </span>
          {(searchQuery || selectedRestId || selectedCategory !== "all" || stockFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedRestId("");
                setSelectedCategory("all");
                setStockFilter("all");
              }}
              className="text-[#FF6B1A] hover:underline"
            >
              {lang === "bn" ? "ফিল্টার ক্লিয়ার করুন" : "Clear filters"}
            </button>
          )}
        </div>
      </div>

      {/* Foods Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Loading food catalog...</div>
      ) : filteredFoods.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-gray-850 rounded-3xl border border-gray-100 dark:border-gray-800">
          <UtensilsCrossed className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {lang === "bn" ? "কোনো খাবার পাওয়া যায়নি" : "No foods found"}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {lang === "bn" ? "নতুন খাবার যোগ করতে উপরের বাটনে চাপুন।" : "Try clearing filters or add a new food item."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFoods.map((food) => {
            const rest = restaurants.find((r) => r.id === food.restaurantId);
            return (
              <div
                key={food.id}
                className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Food Image with Badges */}
                  <div className="relative h-44 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <Image
                      src={food.image || FOOD_IMAGE_PRESETS[0].url}
                      alt={food.nameEn}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />

                    {/* Stock status overlay badge */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
                          food.isAvailable
                            ? "bg-emerald-500/90 text-white"
                            : "bg-red-500/90 text-white"
                        }`}
                      >
                        {food.isAvailable
                          ? lang === "bn" ? "স্টকে আছে" : "In Stock"
                          : lang === "bn" ? "স্টক নেই" : "Out of Stock"}
                      </span>

                      {food.isPopular && (
                        <span className="px-2 py-1 rounded-xl text-[10px] font-black bg-[#FF6B1A] text-white flex items-center gap-1 shadow-xs">
                          <Flame className="w-3 h-3 fill-current" />
                          <span>Hot</span>
                        </span>
                      )}

                      {food.isCake && (
                        <span className="px-2 py-1 rounded-xl text-[10px] font-black bg-pink-500 text-white flex items-center gap-1 shadow-xs">
                          <Cake className="w-3 h-3" />
                          <span>Cake</span>
                        </span>
                      )}
                    </div>

                    {/* Price Tag */}
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-gray-950/80 backdrop-blur-md text-white font-black text-xs shadow-md">
                      {formatPrice(food.price)}
                      {food.originalPrice && (
                        <span className="text-[10px] text-gray-400 line-through ml-1.5 font-normal">
                          {formatPrice(food.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
                        {lang === "bn" ? food.nameBn : food.nameEn}
                      </h3>
                      <div className="text-[11px] text-gray-400 line-clamp-1">
                        {lang === "bn" ? food.nameEn : food.nameBn}
                      </div>
                    </div>

                    {/* Restaurant badge */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      <Store className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
                      <span className="truncate">
                        {rest
                          ? lang === "bn" ? rest.nameBn : rest.nameEn
                          : food.restaurantNameBn || food.restaurantNameEn}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {lang === "bn"
                        ? food.descriptionBn || food.descriptionEn
                        : food.descriptionEn || food.descriptionBn}
                    </p>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
                  {/* Stock Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleStock(food)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors ${
                      food.isAvailable
                        ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100"
                    }`}
                  >
                    {food.isAvailable
                      ? lang === "bn" ? "স্টক শেষ করুন" : "Set Out of Stock"
                      : lang === "bn" ? "স্টকে আনুন" : "Set In Stock"}
                  </button>

                  <div className="flex items-center gap-3">
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(food)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B1A] hover:underline"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{lang === "bn" ? "এডিট" : "Edit"}</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteFood(food)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                      title={lang === "bn" ? "খাবারটি মুছুন" : "Delete Food"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{lang === "bn" ? "মুছুন" : "Delete"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Food Modal */}
      {isModalOpen && editingFood && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-850 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-[#FF6B1A]" />
                <span>
                  {editingFood.id
                    ? lang === "bn" ? "খাবারের তথ্য ও ছবি এডিট করুন" : "Edit Food Details & Image"
                    : lang === "bn" ? "নতুন খাবার যুক্ত করুন" : "Add New Food Item"}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="space-y-4 text-xs font-bold">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-600 dark:text-gray-300">Food Name (English) *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Shahi Mutton Kacchi Biryani"
                    value={editingFood.nameEn || ""}
                    onChange={(e) => setEditingFood({ ...editingFood, nameEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600 dark:text-gray-300">Food Name (Bangla) *</label>
                  <input
                    required
                    type="text"
                    placeholder="যেমন: শাহী খাসির কাচ্চি বিরিয়ানি"
                    value={editingFood.nameBn || ""}
                    onChange={(e) => setEditingFood({ ...editingFood, nameBn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                  />
                </div>
              </div>

              {/* Restaurant & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-600 dark:text-gray-300">Restaurant / Vendor *</label>
                  <select
                    required
                    value={editingFood.restaurantId || ""}
                    onChange={(e) => setEditingFood({ ...editingFood, restaurantId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                  >
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nameEn} ({r.nameBn})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-600 dark:text-gray-300">Category *</label>
                  <select
                    required
                    value={editingFood.categoryId || "cat_biryani"}
                    onChange={(e) => {
                      const catId = e.target.value;
                      const isCake = catId === "cat_cakes";
                      setEditingFood({ ...editingFood, categoryId: catId, isCake });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                  >
                    <option value="cat_biryani">Biryani & Polao (বিরিয়ানি ও পোলাও)</option>
                    <option value="cat_rice">Rice & Curries (ভাত ও তরকারি)</option>
                    <option value="cat_fastfood">Burgers & Fast Food (বার্গার ও ফাস্টফুড)</option>
                    <option value="cat_snacks">Evening Snacks (সান্ধ্যকালীন নাশতা)</option>
                    <option value="cat_cakes">Homemade Cakes (হোমমেড কেক)</option>
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-600 dark:text-gray-300">Selling Price (BDT ৳) *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={editingFood.price || ""}
                    onChange={(e) => setEditingFood({ ...editingFood, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-600 dark:text-gray-300">Original Price (BDT ৳ - Optional)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Regular / Cut-off price"
                    value={editingFood.originalPrice || ""}
                    onChange={(e) =>
                      setEditingFood({
                        ...editingFood,
                        originalPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                  />
                </div>
              </div>

              {/* Food Image Selection */}
              <div className="space-y-2 p-3.5 bg-orange-50/50 dark:bg-gray-800/40 rounded-2xl border border-orange-100 dark:border-gray-700">
                <label className="text-gray-800 dark:text-gray-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#FF6B1A]" />
                    <span>Food Image (ছবি যোগ বা পরিবর্তন করুন) *</span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-normal">Direct URL or Preset</span>
                </label>

                {/* Input URL */}
                <input
                  required
                  type="url"
                  placeholder="Paste image URL (https://...)"
                  value={editingFood.image || ""}
                  onChange={(e) => setEditingFood({ ...editingFood, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-normal text-xs"
                />

                {/* Presets Quick Picker */}
                <div>
                  <div className="text-[10px] text-gray-500 mb-1.5 font-bold uppercase tracking-wider">
                    Or select a Mathbaria dish photo preset:
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {FOOD_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setEditingFood({ ...editingFood, image: preset.url })}
                        className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                          editingFood.image === preset.url
                            ? "bg-[#FF6B1A] text-white border-[#FF6B1A] font-black"
                            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#FF6B1A]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview */}
                {editingFood.image && (
                  <div className="flex items-center gap-3 pt-2">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                      <Image
                        src={editingFood.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      <div className="font-bold text-gray-800 dark:text-gray-200">Live Image Preview</div>
                      <span>This photo will appear on the customer website and mobile view.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Toggles (Stock, Hot Selling, Recommended, Cake) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFood.isAvailable ?? true}
                    onChange={(e) => setEditingFood({ ...editingFood, isAvailable: e.target.checked })}
                    className="accent-[#FF6B1A] w-4 h-4 rounded-sm"
                  />
                  <span className="text-[11px]">In Stock</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFood.isPopular ?? false}
                    onChange={(e) => setEditingFood({ ...editingFood, isPopular: e.target.checked })}
                    className="accent-[#FF6B1A] w-4 h-4 rounded-sm"
                  />
                  <span className="text-[11px]">Hot Selling</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFood.isRecommended ?? false}
                    onChange={(e) => setEditingFood({ ...editingFood, isRecommended: e.target.checked })}
                    className="accent-[#FF6B1A] w-4 h-4 rounded-sm"
                  />
                  <span className="text-[11px]">Chef Special</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFood.isCake ?? false}
                    onChange={(e) => setEditingFood({ ...editingFood, isCake: e.target.checked })}
                    className="accent-[#FF6B1A] w-4 h-4 rounded-sm"
                  />
                  <span className="text-[11px]">Celebration Cake</span>
                </label>
              </div>

              {/* Advance Days for Cakes */}
              {editingFood.isCake && (
                <div className="space-y-1 p-3 bg-pink-50/50 dark:bg-pink-950/20 rounded-2xl border border-pink-100 dark:border-pink-900">
                  <label className="text-pink-900 dark:text-pink-300">Cake Advance Preparation Notice (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={editingFood.minAdvanceDays || 2}
                    onChange={(e) => setEditingFood({ ...editingFood, minAdvanceDays: parseInt(e.target.value) || 2 })}
                    className="w-full px-3 py-2 rounded-xl border border-pink-200 dark:border-pink-800 bg-white dark:bg-gray-900 font-semibold"
                  />
                </div>
              )}

              {/* Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-600 dark:text-gray-300">Description (English)</label>
                  <textarea
                    rows={2}
                    placeholder="Ingredients, preparation details..."
                    value={editingFood.descriptionEn || ""}
                    onChange={(e) => setEditingFood({ ...editingFood, descriptionEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-normal text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600 dark:text-gray-300">Description (Bangla)</label>
                  <textarea
                    rows={2}
                    placeholder="উপকরণ ও বিশেষ স্বাদ..."
                    value={editingFood.descriptionBn || ""}
                    onChange={(e) => setEditingFood({ ...editingFood, descriptionBn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-normal text-xs"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-6 py-2 rounded-xl bg-[#FF6B1A] text-white hover:bg-orange-600 shadow-md font-bold text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Food Item"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminFoodsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-gray-400">Loading food catalog...</div>}>
      <AdminFoodsContent />
    </Suspense>
  );
}
