"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  UtensilsCrossed,
  Plus,
  Power,
  Edit3,
  DollarSign,
  Tag,
  CheckCircle2,
  X,
  Search,
} from "lucide-react";
import { restaurantService } from "@/services/restaurantService";
import { catalogService } from "@/services/catalogService";
import { FoodItem, Category } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { safeLocalStorageGet } from "@/lib/storage/safeStorage";

export default function RestaurantMenuPage() {
  const { lang, formatPrice } = useLanguage();
  const [menu, setMenu] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const activeRestId = safeLocalStorageGet<string>("active_restaurant_id", "");

  const [newItem, setNewItem] = useState<Partial<FoodItem>>({
    nameEn: "",
    nameBn: "",
    descriptionEn: "",
    descriptionBn: "",
    price: 150,
    categoryId: "cat_biryani",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    isCake: false,
  });

  async function loadMenu() {
    if (!activeRestId) return;
    try {
      const [items, cats] = await Promise.all([
        restaurantService.getMenu(activeRestId),
        catalogService.getCategories(),
      ]);
      setMenu(items);
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load restaurant menu:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenu();
  }, [activeRestId]);

  const handleToggleStock = async (item: FoodItem) => {
    const nextStock = !item.isAvailable;
    await restaurantService.toggleProductAvailability(item.id, nextStock);
    setMenu((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, isAvailable: nextStock } : it))
    );
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRestId) return;
    setSaving(true);
    try {
      await restaurantService.saveProduct({
        ...newItem,
        restaurantId: activeRestId,
        categoryId: newItem.categoryId || "cat_biryani",
      });
      setIsAddModalOpen(false);
      setNewItem({
        nameEn: "",
        nameBn: "",
        descriptionEn: "",
        descriptionBn: "",
        price: 150,
        categoryId: "cat_biryani",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        isAvailable: true,
        isCake: false,
      });
      await loadMenu();
    } catch (err) {
      console.error("Create product error:", err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = menu.filter((it) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return it.nameEn.toLowerCase().includes(q) || it.nameBn.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-[#FF6B1A]" />
            <span>{lang === "bn" ? "মেনু ও স্টক নিয়ন্ত্রণ" : "Menu & Stock Management"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === "bn"
              ? "খাবার বা কেক তৈরি শেষ হলে দ্রুত 'স্টক আউট' করুন যাতে গ্রাহক অর্ডার করতে না পারে।"
              : "Toggle food item availability instantly when ingredients or batches run out."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-[#FF6B1A] hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === "bn" ? "নতুন খাবার যোগ করুন" : "Add Food Item"}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search menu item..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 text-xs font-bold focus:outline-hidden"
        />
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`bg-white dark:bg-gray-850 rounded-3xl border overflow-hidden p-4 shadow-xs flex flex-col justify-between transition-all ${
              item.isAvailable
                ? "border-gray-100 dark:border-gray-800"
                : "border-red-200 dark:border-red-950 opacity-70"
            }`}
          >
            <div className="flex gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                <Image src={item.image} alt={item.nameEn} fill className="object-cover" sizes="80px" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100 truncate">
                  {lang === "bn" ? item.nameBn : item.nameEn}
                </h3>
                <div className="text-[11px] text-gray-400 truncate">{item.nameEn}</div>
                <div className="text-sm font-black text-[#FF6B1A]">
                  {formatPrice(item.price)}
                </div>
              </div>
            </div>

            {/* Bottom Stock Toggle */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span
                className={`text-[11px] font-extrabold ${
                  item.isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                }`}
              >
                {item.isAvailable ? "• In Stock (Available)" : "• Out of Stock (Hidden)"}
              </span>

              <button
                type="button"
                onClick={() => handleToggleStock(item)}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-colors ${
                  item.isAvailable
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                }`}
              >
                {item.isAvailable ? "Set Out of Stock" : "Set Available"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-850 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
                {lang === "bn" ? "নতুন মেনু আইটেম যুক্ত করুন" : "Add Food Item"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-gray-600 dark:text-gray-300">Food Name (Bangla)</label>
                <input
                  required
                  type="text"
                  placeholder="যেমন: স্পেশাল বিফ তেহারি"
                  value={newItem.nameBn || ""}
                  onChange={(e) => setNewItem({ ...newItem, nameBn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 dark:text-gray-300">Food Name (English)</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Special Beef Tehari"
                  value={newItem.nameEn || ""}
                  onChange={(e) => setNewItem({ ...newItem, nameEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-600 dark:text-gray-300">Price (BDT ৳)</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={newItem.price || ""}
                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-600 dark:text-gray-300">Category</label>
                  <select
                    value={newItem.categoryId}
                    onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBn} ({c.nameEn})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 dark:text-gray-300">Photo URL</label>
                <input
                  type="text"
                  value={newItem.image || ""}
                  onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#FF6B1A] text-white hover:bg-orange-600 shadow-md font-bold"
                >
                  {saving ? "Adding..." : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
