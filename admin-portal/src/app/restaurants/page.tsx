"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Store,
  Plus,
  Edit2,
  Phone,
  Percent,
  CheckCircle2,
  Clock,
  MapPin,
  Save,
  X,
  Search,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { adminService } from "@/services/adminService";
import { Restaurant } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AdminRestaurantsPage() {
  const { lang, formatPrice } = useLanguage();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRestaurant, setEditingRestaurant] = useState<Partial<Restaurant> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadRestaurants() {
    try {
      const data = await adminService.getRestaurants();
      setRestaurants(data);
    } catch (err) {
      console.error("Failed to load restaurants:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRestaurants();
  }, []);

  const handleOpenAddModal = () => {
    setEditingRestaurant({
      nameEn: "",
      nameBn: "",
      phone: "",
      ownerPhone: "",
      addressEn: "Mathbaria Bazar, Mathbaria",
      addressBn: "মঠবাড়িয়া বাজার, মঠবাড়িয়া",
      prepTimeMinutes: 25,
      commissionRate: 15.0,
      isOpen: true,
      minOrder: 0,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
      banner: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
      cuisinesEn: ["Bangladeshi", "Fast Food"],
      cuisinesBn: ["বাংলাদেশি", "ফাস্টফুড"],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: Restaurant) => {
    setEditingRestaurant({ ...r });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (r: Restaurant) => {
    await adminService.saveRestaurant({ id: r.id, isOpen: !r.isOpen });
    loadRestaurants();
  };

  const handleDeleteRestaurant = async (id: string, name: string) => {
    const confirmMsg = lang === "bn"
      ? `আপনি কি নিশ্চিত যে "${name}" রেস্তোরাঁ এবং এর অন্তর্ভুক্ত সকল খাবার মুছে ফেলতে চান?`
      : `Are you sure you want to delete "${name}" and all associated products?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await adminService.deleteRestaurant(id);
      await loadRestaurants();
    } catch (err) {
      console.error("Delete restaurant error:", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant) return;
    setSaving(true);
    try {
      await adminService.saveRestaurant(editingRestaurant);
      setIsModalOpen(false);
      setEditingRestaurant(null);
      await loadRestaurants();
    } catch (err) {
      console.error("Save restaurant error:", err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = restaurants.filter(
    (r) =>
      r.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.nameBn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Store className="w-8 h-8 text-[#FF6B1A]" />
            <span>{lang === "bn" ? "রেস্তোরাঁ ও ফুড শপ ব্যবস্থাপনা" : "Restaurant Partners"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === "bn"
              ? "মঠবাড়িয়ার রেস্তোরাঁ অনুমোদন, কমিশন রেট ও প্রোফাইল নিয়ন্ত্রণ করুন।"
              : "Approve local Mathbaria restaurants, set commissions and manage profiles."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-[#FF6B1A] hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === "bn" ? "নতুন রেস্তোরাঁ যুক্ত করুন" : "Add Restaurant"}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lang === "bn" ? "রেস্তোরাঁ খুঁজুন..." : "Search restaurants..."}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-hidden focus:border-[#FF6B1A]"
        />
      </div>

      {/* Restaurant List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xs flex flex-col justify-between"
          >
            <div>
              {/* Image banner */}
              <div className="relative h-36 w-full bg-slate-100 dark:bg-slate-800">
                <Image src={r.image} alt={r.nameEn} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      r.isOpen
                        ? "bg-emerald-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {r.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-black text-base text-gray-900 dark:text-gray-100">
                    {lang === "bn" ? r.nameBn : r.nameEn}
                  </h3>
                  <div className="text-xs text-gray-400 font-semibold mt-0.5">
                    {r.nameEn} ({r.cuisinesEn.slice(0, 2).join(", ")})
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{r.addressBn || r.addressEn}</span>
                  </div>
                  {r.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{r.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
                    <Percent className="w-3.5 h-3.5 shrink-0" />
                    <span>Platform Commission: {r.commissionRate || 15}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(r)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    r.isOpen
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-100"
                      : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  {r.isOpen ? (lang === "bn" ? "বন্ধ করুন" : "Set Closed") : (lang === "bn" ? "খুলুন" : "Set Open")}
                </button>

                <Link
                  href={`/foods?restaurantId=${r.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B1A] hover:bg-orange-100 transition-colors"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>{lang === "bn" ? "খাবার তালিকা" : "Foods"}</span>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(r)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B1A] hover:underline"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{lang === "bn" ? "এডিট" : "Edit"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteRestaurant(r.id, r.nameEn)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                  title={lang === "bn" ? "রেস্তোরাঁ মুছুন" : "Delete Restaurant"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{lang === "bn" ? "মুছুন" : "Delete"}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Restaurant Modal */}
      {isModalOpen && editingRestaurant && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-850 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
                {editingRestaurant.id
                  ? (lang === "bn" ? "রেস্তোরাঁ এডিট" : "Edit Restaurant")
                  : (lang === "bn" ? "নতুন রেস্তোরাঁ নিবন্ধন" : "Register New Restaurant")}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-600 dark:text-gray-300">Name (English)</label>
                  <input
                    required
                    type="text"
                    value={editingRestaurant.nameEn || ""}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, nameEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600 dark:text-gray-300">Name (Bangla)</label>
                  <input
                    required
                    type="text"
                    value={editingRestaurant.nameBn || ""}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, nameBn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-600 dark:text-gray-300">Phone</label>
                  <input
                    type="text"
                    value={editingRestaurant.phone || ""}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600 dark:text-gray-300">Commission Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingRestaurant.commissionRate || 15}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, commissionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 dark:text-gray-300">Address (Bangla / Mathbaria Location)</label>
                <input
                  type="text"
                  value={editingRestaurant.addressBn || ""}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, addressBn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 dark:text-gray-300">Image Photo URL</label>
                <input
                  type="text"
                  value={editingRestaurant.image || ""}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#FF6B1A] text-white hover:bg-orange-600 shadow-md font-bold"
                >
                  {saving ? "Saving..." : "Save Restaurant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
