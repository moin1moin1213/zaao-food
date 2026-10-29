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
  Key,
  Lock,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { adminService } from "@/services/adminService";
import { Restaurant } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AdminRestaurantsPage() {
  const { lang, formatPrice } = useLanguage();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [passwordStatus, setPasswordStatus] = useState<Record<string, { isConfigured: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRestaurant, setEditingRestaurant] = useState<(Partial<Restaurant> & { password?: string }) | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Password Reset Modal State
  const [passwordModalRest, setPasswordModalRest] = useState<Restaurant | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // One-Time Credential Reveal State
  const [revealedCredential, setRevealedCredential] = useState<{
    restaurantId: string;
    restaurantName: string;
    plaintextPassword: string;
  } | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  async function loadData() {
    try {
      const [rests, statusMap] = await Promise.all([
        adminService.getRestaurants(),
        adminService.getRestaurantPasswordStatus(),
      ]);
      setRestaurants(rests);
      setPasswordStatus(statusMap || {});
    } catch (err) {
      console.error("Failed to load restaurants or password status:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let pass = "Pengu#";
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleOpenAddModal = () => {
    const nextNum = restaurants.length + 1;
    setEditingRestaurant({
      id: `rest-${nextNum}`,
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
      password: generateRandomPassword(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: Restaurant) => {
    setEditingRestaurant({
      ...r,
      password: "", // Do not display or require changing password during general profile edits
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (r: Restaurant) => {
    await adminService.saveRestaurant({ id: r.id, isOpen: !r.isOpen });
    loadData();
  };

  const handleDeleteRestaurant = async (id: string, name: string) => {
    const confirmMsg =
      lang === "bn"
        ? `আপনি কি নিশ্চিত যে "${name}" রেস্তোরাঁ এবং এর অন্তর্ভুক্ত সকল খাবার মুছে ফেলতে চান?`
        : `Are you sure you want to delete "${name}" and all associated products?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await adminService.deleteRestaurant(id);
      await loadData();
    } catch (err) {
      console.error("Delete restaurant error:", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant || !editingRestaurant.id) return;
    setSaving(true);
    try {
      const restId = editingRestaurant.id;
      const initialPass = editingRestaurant.password?.trim();

      await adminService.saveRestaurant(editingRestaurant);

      // If a password was provided for a new restaurant, securely hash and store it
      if (initialPass) {
        const passResult = await adminService.updateRestaurantPassword(restId, initialPass);
        if (passResult.success && passResult.temporaryPassword) {
          setRevealedCredential({
            restaurantId: restId,
            restaurantName: editingRestaurant.nameBn || editingRestaurant.nameEn || restId,
            plaintextPassword: passResult.temporaryPassword,
          });
        }
      }

      setIsModalOpen(false);
      setEditingRestaurant(null);
      await loadData();
    } catch (err) {
      console.error("Save restaurant error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPasswordModal = (r: Restaurant) => {
    setPasswordModalRest(r);
    setNewPasswordInput(generateRandomPassword());
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalRest || !newPasswordInput.trim()) return;

    setSavingPassword(true);
    try {
      const targetId = passwordModalRest.id;
      const targetName = passwordModalRest.nameBn || passwordModalRest.nameEn;
      const pass = newPasswordInput.trim();

      const result = await adminService.updateRestaurantPassword(targetId, pass);
      if (result.success && result.temporaryPassword) {
        setPasswordStatus((prev) => ({
          ...prev,
          [targetId]: { isConfigured: true },
        }));
        setPasswordModalRest(null);

        // Display one-time credential modal with the plaintext password
        setRevealedCredential({
          restaurantId: targetId,
          restaurantName: targetName,
          plaintextPassword: result.temporaryPassword,
        });
      }
    } catch (err) {
      console.error("Error updating restaurant password:", err);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCopyCredentials = (restId: string, pass: string) => {
    const text = `PenguFood কিচেন পোর্টাল লগইন তথ্য:\nরেস্তোরাঁ আইডি: ${restId}\nপাসওয়ার্ড: ${pass}\nপোর্টাল লিংক: http://localhost:3002`;
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
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
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
            <Store className="w-8 h-8 text-[#FF6B1A]" />
            <span>{lang === "bn" ? "রেস্তোরাঁ ও কিচেন ক্রেডেনশিয়াল ব্যবস্থাপনা" : "Restaurant Partners & Passwords"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {lang === "bn"
              ? "মঠবাড়িয়ার রেস্তোরাঁ অনুমোদন, কিচেন লগইন আইডি ও এনক্রিপ্টেড পাসওয়ার্ড নিয়ন্ত্রণ করুন।"
              : "Manage Mathbaria restaurant profiles, kitchen login IDs, and encrypted passwords."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-[#FF6B1A] hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === "bn" ? "নতুন রেস্তোরাঁ যুক্ত করুন" : "Add Restaurant"}</span>
        </button>
      </div>

      {/* Security Architecture Badge */}
      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3 text-emerald-900 text-xs font-semibold">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <span className="font-black text-emerald-950">জিরো-প্লেইনটেক্সট পাসওয়ার্ড নিরাপত্তা নীতি: </span>
          <span>সকল রেস্তোরাঁর পাসওয়ার্ড PBKDF2 SHA-512 অ্যালগরিদমে এনক্রিপ্ট হয়ে ডাটাবেজে সংরক্ষিত থাকে। কোনো প্লেইনটেক্সট ডাটাবেজ বা ব্রাউজারে সংরক্ষিত হয় না।</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lang === "bn" ? "রেস্তোরাঁ খুঁজুন..." : "Search restaurants..."}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]"
        />
      </div>

      {/* Restaurant List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((r) => {
          const isConfigured = Boolean(passwordStatus[r.id]?.isConfigured);

          return (
            <div
              key={r.id}
              className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Image banner */}
                <div className="relative h-36 w-full bg-slate-100">
                  <Image src={r.image} alt={r.nameEn} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-xs ${
                        r.isOpen ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                      }`}
                    >
                      {r.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3.5">
                  <div>
                    <h3 className="font-black text-base text-gray-900">{lang === "bn" ? r.nameBn : r.nameEn}</h3>
                    <div className="text-xs text-gray-400 font-semibold mt-0.5">
                      {r.nameEn} ({r.cuisinesEn.slice(0, 2).join(", ")})
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
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
                    <div className="flex items-center gap-2 font-bold text-indigo-600">
                      <Percent className="w-3.5 h-3.5 shrink-0" />
                      <span>কমিশন রেট: {r.commissionRate || 15}%</span>
                    </div>
                  </div>

                  {/* RESTAURANT LOGIN CREDENTIALS BOX */}
                  <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-black text-orange-950">
                      <div className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-[#FF6B1A]" />
                        <span>কিচেন পোর্টাল লগইন ক্রেডেনশিয়াল:</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{isConfigured ? "হ্যাশড ও সুরক্ষিত" : "ডিফল্ট পিন"}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-white border border-orange-100">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">লগইন আইডি</span>
                        <span className="font-mono font-black text-gray-800 truncate block">{r.id}</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-orange-100">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">পাসওয়ার্ড স্ট্যাটাস</span>
                        <span className="font-mono font-black text-[#FF6B1A] tracking-wider block">••••••••</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenPasswordModal(r)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#FF6B1A] text-white hover:bg-[#E85B0D] font-black text-xs shadow-xs transition-transform active:scale-95"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>পাসওয়ার্ড পরিবর্তন / রিসেট করুন</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/70">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(r)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                      r.isOpen
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                  >
                    {r.isOpen ? (lang === "bn" ? "বন্ধ করুন" : "Set Closed") : (lang === "bn" ? "খুলুন" : "Set Open")}
                  </button>

                  <Link
                    href={`/foods?restaurantId=${r.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-orange-100/70 text-[#FF6B1A] hover:bg-orange-100 transition-colors"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>{lang === "bn" ? "খাবার তালিকা" : "Foods"}</span>
                  </Link>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(r)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-[#FF6B1A]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>এডিট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteRestaurant(r.id, r.nameEn)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700"
                    title="রেস্তোরাঁ মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">মুছুন</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: CHANGE / RESET RESTAURANT PASSWORD */}
      {passwordModalRest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-orange-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B1A] flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">পাসওয়ার্ড রিসেট করুন</h3>
                  <p className="text-[11px] text-gray-400 font-semibold">{passwordModalRest.nameBn || passwordModalRest.nameEn}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalRest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">রেস্তোরাঁ লগইন আইডি:</span>
                  <span className="font-mono font-bold text-gray-800">{passwordModalRest.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">বর্তমান এনক্রিপশন:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    PBKDF2 SHA-512
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    নতুন পাসওয়ার্ড (New Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput(generateRandomPassword())}
                    className="inline-flex items-center gap-1 text-[11px] text-[#FF6B1A] font-bold hover:underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>র‍্যান্ডম পাসওয়ার্ড</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    required
                    type="text"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="যেমন: Pengu#2026"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A] font-mono font-black text-gray-900"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                  * সেভ করার পর পাসওয়ার্ডটি এনক্রিপ্ট হয়ে যাবে এবং শুধুমাত্র একবার কপি করার সুযোগ দেওয়া হবে।
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalRest(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2 rounded-xl bg-[#FF6B1A] text-white hover:bg-[#E85B0D] shadow-md font-black text-xs disabled:opacity-50"
                >
                  {savingPassword ? "এনক্রিপ্ট ও সেভ হচ্ছে..." : "পাসওয়ার্ড সেভ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ONE-TIME CREDENTIAL REVEAL MODAL */}
      {revealedCredential && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-emerald-800">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">পাসওয়ার্ড সফলভাবে সেট হয়েছে!</h3>
                <p className="text-xs text-gray-500 font-semibold">{revealedCredential.restaurantName}</p>
              </div>
            </div>

            {/* Crucial Security Alert */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold space-y-1">
              <div className="flex items-center gap-1.5 font-black text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>নিরাপত্তা নিশ্চিতকরণ (One-Time Display):</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-normal">
                পাসওয়ার্ডটি সার্ভারে PBKDF2 SHA-512 অ্যালগরিদমে এনক্রিপ্ট হয়ে গেছে। সুরক্ষার স্বার্থে এই প্লেইনটেক্সট পাসওয়ার্ড আর কখনো ডাটাবেজ বা স্ক্রিনে দেখা যাবে না। অনুগ্রহ করে এখনই এটি কপি করে রেস্তোরাঁ কর্তৃপক্ষকে দিন।
              </p>
            </div>

            {/* Credential Details Box */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 font-mono text-xs space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                <span className="text-gray-500 font-sans font-bold">লগইন আইডি:</span>
                <span className="font-black text-gray-900 text-sm">{revealedCredential.restaurantId}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                <span className="text-gray-500 font-sans font-bold">নতুন পাসওয়ার্ড:</span>
                <span className="font-black text-[#FF6B1A] text-sm tracking-wide bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                  {revealedCredential.plaintextPassword}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 font-sans font-bold">কিচেন পোর্টাল লিংক:</span>
                <span className="text-indigo-600 font-semibold">http://localhost:3002</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  handleCopyCredentials(revealedCredential.restaurantId, revealedCredential.plaintextPassword)
                }
                className="w-full py-3 rounded-2xl bg-[#FF6B1A] hover:bg-[#E85B0D] text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ক্রেডেনশিয়াল কপি সম্পন্ন হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>রেস্তোরাঁ লগইন তথ্য কপি করুন</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setRevealedCredential(null)}
                className="w-full py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                ঠিক আছে, সংরক্ষণ করা হয়েছে
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD / EDIT RESTAURANT MODAL */}
      {isModalOpen && editingRestaurant && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">
                {editingRestaurant.nameEn && restaurants.some((r) => r.id === editingRestaurant.id)
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
                  <label className="text-gray-600">রেস্তোরাঁ আইডি (Unique ID)</label>
                  <input
                    required
                    type="text"
                    value={editingRestaurant.id || ""}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600">লগইন পাসওয়ার্ড (Initial Password)</label>
                  <input
                    type="text"
                    value={editingRestaurant.password || ""}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, password: e.target.value })}
                    placeholder="যেমন: Pengu#2026"
                    className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-orange-50/50 font-mono font-bold text-orange-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-600">Name (English)</label>
                  <input
                    required
                    type="text"
                    value={editingRestaurant.nameEn || ""}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, nameEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600">নাম (বাংলা)</label>
                  <input
                    required
                    type="text"
                    value={editingRestaurant.nameBn || ""}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, nameBn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-600">Phone</label>
                  <input
                    type="text"
                    value={editingRestaurant.phone || ""}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600">Commission Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingRestaurant.commissionRate || 15}
                    onChange={(e) =>
                      setEditingRestaurant({ ...editingRestaurant, commissionRate: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-600">ঠিকানা (বাংলা / Mathbaria Location)</label>
                <input
                  type="text"
                  value={editingRestaurant.addressBn || ""}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, addressBn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600">Image Photo URL</label>
                <input
                  type="text"
                  value={editingRestaurant.image || ""}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#FF6B1A] text-white hover:bg-orange-600 shadow-md font-bold disabled:opacity-50"
                >
                  {saving ? "সংরক্ষণ হচ্ছে..." : "রেস্তোরাঁ সেভ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
