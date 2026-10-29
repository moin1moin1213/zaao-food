"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  ShoppingBag,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Percent,
  RefreshCw,
  Store,
  XCircle,
  Info,
  CalendarDays,
} from "lucide-react";
import { restaurantService } from "@/services/restaurantService";
import { Order } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useRestaurant } from "../RestaurantContext";

// Timezone Helper: Format any date to YYYY-MM-DD in Asia/Dhaka (UTC+6)
function formatDhakaDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Timezone Helper: Format time in Asia/Dhaka (hh:mm A)
function formatDhakaTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Day of week in Asia/Dhaka (0 = Sun, 1 = Mon, ..., 6 = Sat)
function getDhakaDayOfWeek(date: Date): number {
  const dayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[dayStr] ?? date.getDay();
}

const BENGALI_DAY_NAMES: Record<string, string> = {
  Sat: "শনিবার",
  Sun: "রবিবার",
  Mon: "সোমবার",
  Tue: "মঙ্গলবার",
  Wed: "বুধবার",
  Thu: "বৃহস্পতিবার",
  Fri: "শুক্রবার",
};

export default function RestaurantSalesPage() {
  const { lang, formatPrice, formatNum } = useLanguage();
  const { currentRestaurant, currentRestaurantId } = useRestaurant();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");

  async function loadData() {
    if (!currentRestaurantId) return;
    try {
      setLoading(true);
      const allOrders = await restaurantService.getOrders(currentRestaurantId);
      setOrders(allOrders);
    } catch (err) {
      console.error("Failed to load restaurant sales:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentRestaurantId]);

  // Commission rate (defaults to 15% if not set)
  const commissionRate = currentRestaurant?.commissionRate || 15;

  // 1. TODAY'S SALES & METRICS (Strict Asia/Dhaka Timezone)
  const now = new Date();
  const todayDhakaStr = useMemo(() => formatDhakaDate(now), [now]);

  // Filter orders created today in Asia/Dhaka
  const todayOrders = useMemo(
    () => orders.filter((o) => formatDhakaDate(o.createdAt) === todayDhakaStr),
    [orders, todayDhakaStr]
  );

  const todayDelivered = useMemo(() => todayOrders.filter((o) => o.status === "delivered"), [todayOrders]);
  const todayCancelled = useMemo(() => todayOrders.filter((o) => o.status === "cancelled"), [todayOrders]);

  // Calculations for Today (Delivered only count towards sales)
  const todayGrossSales = useMemo(
    () => todayDelivered.reduce((sum, o) => sum + (o.pricing?.subtotal || o.pricing?.total || 0), 0),
    [todayDelivered]
  );
  const todayCommission = Math.round(todayGrossSales * (commissionRate / 100));
  const todayNetPayout = todayGrossSales - todayCommission;

  // Cancelled lost revenue
  const todayLostSales = useMemo(
    () => todayCancelled.reduce((sum, o) => sum + (o.pricing?.subtotal || o.pricing?.total || 0), 0),
    [todayCancelled]
  );

  // 2. BANGLADESH BUSINESS WEEK (Saturday to Friday in Asia/Dhaka)
  const weeklyData = useMemo(() => {
    // Current day in Dhaka
    const currentDhakaDay = getDhakaDayOfWeek(now);
    // Days since Saturday (Sat = 6 => 0 days, Sun = 0 => 1 day, Mon = 1 => 2 days, etc.)
    const daysSinceSaturday = (currentDhakaDay + 1) % 7;

    const satDate = new Date(now);
    satDate.setDate(now.getDate() - daysSinceSaturday);

    // Build 7 days: Saturday through Friday
    const days: Array<{
      dateStr: string;
      dayLabelEn: string;
      dayLabelBn: string;
      isToday: boolean;
      ordersReceived: number;
      completedCount: number;
      cancelledCount: number;
      grossSales: number;
      commission: number;
      netPayout: number;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(satDate);
      dayDate.setDate(satDate.getDate() + i);
      const dateStr = formatDhakaDate(dayDate);
      const dayNameShort = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", weekday: "short" }).format(dayDate);

      const dayOrders = orders.filter((o) => formatDhakaDate(o.createdAt) === dateStr);
      const dayDelivered = dayOrders.filter((o) => o.status === "delivered");
      const dayCancelled = dayOrders.filter((o) => o.status === "cancelled");

      const gross = dayDelivered.reduce((sum, o) => sum + (o.pricing?.subtotal || o.pricing?.total || 0), 0);
      const comm = Math.round(gross * (commissionRate / 100));
      const net = gross - comm;

      days.push({
        dateStr,
        dayLabelEn: dayNameShort,
        dayLabelBn: BENGALI_DAY_NAMES[dayNameShort] || dayNameShort,
        isToday: dateStr === todayDhakaStr,
        ordersReceived: dayOrders.length,
        completedCount: dayDelivered.length,
        cancelledCount: dayCancelled.length,
        grossSales: gross,
        commission: comm,
        netPayout: net,
      });
    }

    const weekGross = days.reduce((sum, d) => sum + d.grossSales, 0);
    const weekComm = Math.round(weekGross * (commissionRate / 100));
    const weekNet = weekGross - weekComm;
    const weekReceived = days.reduce((sum, d) => sum + d.ordersReceived, 0);
    const weekCompleted = days.reduce((sum, d) => sum + d.completedCount, 0);
    const weekCancelled = days.reduce((sum, d) => sum + d.cancelledCount, 0);
    const maxDayGross = Math.max(...days.map((d) => d.grossSales), 1);

    return {
      days,
      weekGross,
      weekComm,
      weekNet,
      weekReceived,
      weekCompleted,
      weekCancelled,
      maxDayGross,
      weekStartDate: days[0]?.dateStr,
      weekEndDate: days[6]?.dateStr,
    };
  }, [orders, todayDhakaStr, commissionRate]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-[#FF6B1A] border border-orange-200 mb-2">
            <Store className="w-3.5 h-3.5" />
            <span>{currentRestaurant?.nameBn || currentRestaurant?.nameEn || "রেস্তোরাঁ কিচেন"}</span>
            <span className="text-gray-400 font-normal">| এশিয়া/ঢাকা টাইমজোন (UTC+6)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-[#FF6B1A]" />
            <span>দৈনিক ও সাপ্তাহিক বিক্রির হিসাব</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            পেঙ্গুফুড থেকে প্রাপ্ত সকল ডেলিভারিকৃত অর্ডারের মোট বিক্রি, কমিশন ও রেস্তোরাঁর নিট আয়ের সঠিক বিবরণী।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs transition-transform active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#FF6B1A]" : ""}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* Permission & Accounting Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 font-semibold">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">রেস্তোরাঁ বিক্রির নীতিমালা ও হিসাব নির্দেশিকা:</p>
          <p className="text-amber-800 text-[11px] mt-0.5 font-normal leading-relaxed">
            ১. বাতিলকৃত বা রিজেক্ট হওয়া অর্ডার কখনোই মোট বিক্রি বা পাওনায় যুক্ত হয় না।<br />
            ২. পেঙ্গুফুড প্ল্যাটফর্ম কমিশন {commissionRate}% বাদ দেওয়ার পর নিট পাওনা (Net Amount) প্রদর্শিত হচ্ছে।<br />
            ৩. মেনু পরিবর্তন, মূল্য সংশোধন বা প্রোফাইল আপডেট পেঙ্গুফুড অ্যাডমিন টিম নিয়ন্ত্রণ করে।
          </p>
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {/* Card 1: Today's Orders Summary */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#FF6B1A] flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              আজকের প্রাপ্ত অর্ডার
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
              {formatNum(todayOrders.length)} টি
            </div>
            <div className="text-[10px] text-gray-500 font-semibold flex items-center gap-2 mt-1">
              <span className="text-emerald-600 font-bold">✓ {formatNum(todayDelivered.length)} সম্পন্ন</span>
              {todayCancelled.length > 0 && (
                <span className="text-red-500 font-bold">✕ {formatNum(todayCancelled.length)} বাতিল</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Today's Gross Food Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              আজকের মোট খাবার বিক্রি (Gross)
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
              {formatPrice(todayGrossSales)}
            </div>
            <span className="text-[10px] text-gray-400 font-semibold">
              কমিশন কর্তন: -{formatPrice(todayCommission)}
            </span>
          </div>
        </div>

        {/* Card 3: Today's Net Payout */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
              আজকের নিট রেস্তোরাঁ পাওনা (Net)
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
              {formatPrice(todayNetPayout)}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">
              পেঙ্গুফুড কমিশন: {commissionRate}%
            </span>
          </div>
        </div>

        {/* Card 4: Current Week's Net Payout */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/20 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
              চলতি সপ্তাহের মোট নিট আয়
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-950 mt-0.5">
              {formatPrice(weeklyData.weekNet)}
            </div>
            <span className="text-[10px] text-gray-400 font-semibold">
              মোট বিক্রি: {formatPrice(weeklyData.weekGross)} ({formatNum(weeklyData.weekCompleted)} সম্পন্ন)
            </span>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("daily")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === "daily"
              ? "bg-[#FF6B1A] text-white shadow-md shadow-orange-500/20"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>আজকের বিক্রি ও অর্ডার বিবরণ ({formatNum(todayOrders.length)})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("weekly")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === "weekly"
              ? "bg-[#FF6B1A] text-white shadow-md shadow-orange-500/20"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>চলতি সপ্তাহের হিসাব (শনিবার - শুক্রবার)</span>
        </button>
      </div>

      {/* TAB 1: DAILY SALES & ORDERS BREAKDOWN */}
      {activeTab === "daily" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#FF6B1A]" />
              <span>আজকের সম্পন্ন ডেলিভারিসমূহ (Completed Orders)</span>
            </h3>
            <span className="text-xs text-gray-500 font-bold bg-gray-100 px-3 py-1 rounded-xl">
              তারিখ: {todayDhakaStr} (ঢাকা সময়)
            </span>
          </div>

          {todayDelivered.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 space-y-2">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-[#FF6B1A] flex items-center justify-center font-bold text-xl mx-auto">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="font-bold text-sm text-gray-800">আজকে এখনো কোনো ডেলিভারি সম্পন্ন হয়নি</p>
              <p className="text-xs text-gray-400">নতুন অর্ডার আসলে কিচেন ড্যাশবোর্ডে দেখতে পাবেন।</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-black text-[10px] tracking-wider">
                      <th className="py-3 px-4">অর্ডার আইডি</th>
                      <th className="py-3 px-4">সময় (ঢাকা)</th>
                      <th className="py-3 px-4">গ্রাহক</th>
                      <th className="py-3 px-4">খাবারসমূহ</th>
                      <th className="py-3 px-4">খাবারের মোট মূল্য</th>
                      <th className="py-3 px-4">কমিশন ({commissionRate}%)</th>
                      <th className="py-3 px-4 text-emerald-700 font-black">রেস্তোরাঁর পাওনা (Net)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {todayDelivered.map((o) => {
                      const subtotal = o.pricing?.subtotal || o.pricing?.total || 0;
                      const comm = Math.round(subtotal * (commissionRate / 100));
                      const net = subtotal - comm;
                      const timeStr = formatDhakaTime(o.createdAt);

                      return (
                        <tr key={o.id} className="hover:bg-orange-50/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-gray-900">{o.id}</td>
                          <td className="py-3 px-4 text-gray-500 font-semibold">{timeStr}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-800 block">{o.customer?.name}</span>
                            <span className="text-[10px] text-gray-400">{o.customer?.phone}</span>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-gray-700 font-semibold">
                            {o.items.map((it) => `${it.nameBn} (${it.quantity})`).join(", ")}
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900">{formatPrice(subtotal)}</td>
                          <td className="py-3 px-4 font-semibold text-red-600">-{formatPrice(comm)}</td>
                          <td className="py-3 px-4 font-black text-emerald-700 text-sm">{formatPrice(net)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-orange-50/70 border-t-2 border-orange-200 font-black text-xs text-gray-900">
                      <td colSpan={4} className="py-3.5 px-4 text-right">
                        আজকের সর্বমোট নিট পাওনা:
                      </td>
                      <td className="py-3.5 px-4">{formatPrice(todayGrossSales)}</td>
                      <td className="py-3.5 px-4 text-red-600">-{formatPrice(todayCommission)}</td>
                      <td className="py-3.5 px-4 text-emerald-700 text-sm font-black">
                        {formatPrice(todayNetPayout)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Section: Cancelled Orders (Distinctly Tracked & Excluded from Sales) */}
          {todayCancelled.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-red-700 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>আজকের বাতিল বা রিজেক্ট হওয়া অর্ডার ({formatNum(todayCancelled.length)} টি)</span>
                </h3>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                  ক্ষতিগ্রস্ত বিক্রয় মূল্য: {formatPrice(todayLostSales)} (হিসাবে যুক্ত হয়নি)
                </span>
              </div>

              <div className="bg-white rounded-3xl border border-red-100 overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-red-50/50 border-b border-red-100 text-gray-500 uppercase font-black text-[10px]">
                      <th className="py-2.5 px-4">অর্ডার আইডি</th>
                      <th className="py-2.5 px-4">সময়</th>
                      <th className="py-2.5 px-4">গ্রাহক</th>
                      <th className="py-2.5 px-4">বাতিলের কারণ</th>
                      <th className="py-2.5 px-4 text-right">বাতিলকৃত মূল্য</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {todayCancelled.map((o) => (
                      <tr key={o.id} className="text-gray-600">
                        <td className="py-2.5 px-4 font-mono font-bold">{o.id}</td>
                        <td className="py-2.5 px-4">{formatDhakaTime(o.createdAt)}</td>
                        <td className="py-2.5 px-4">{o.customer?.name}</td>
                        <td className="py-2.5 px-4 text-red-600 font-semibold">
                          {o.cancellationReason || "কাস্টমার বা রেস্তোরাঁ কর্তৃক বাতিল"}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-gray-400 line-through">
                          {formatPrice(o.pricing?.subtotal || o.pricing?.total || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEEKLY SALES (SATURDAY TO FRIDAY BANGLADESH WEEK) */}
      {activeTab === "weekly" && (
        <div className="space-y-6">
          {/* Week Info & Visual Graph */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#FF6B1A]" />
                  <span>চলতি সপ্তাহের বিক্রির গ্রাফ (শনিবার থেকে শুক্রবার)</span>
                </h3>
                <span className="text-[11px] text-gray-400 font-semibold">
                  মেয়াদ: {weeklyData.weekStartDate} হতে {weeklyData.weekEndDate} পর্যন্ত (Asia/Dhaka)
                </span>
              </div>
              <span className="text-xs text-indigo-700 font-black bg-indigo-50 px-3 py-1 rounded-xl">
                সাপ্তাহিক মোট নিট পাওনা: {formatPrice(weeklyData.weekNet)}
              </span>
            </div>

            {/* 7-Day Bar Chart */}
            <div className="grid grid-cols-7 gap-2 pt-4 border-t border-gray-100">
              {weeklyData.days.map((d) => {
                const heightPercent = Math.max(12, Math.round((d.grossSales / weeklyData.maxDayGross) * 100));

                return (
                  <div key={d.dateStr} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-black text-gray-700">
                      {d.grossSales > 0 ? formatPrice(d.grossSales) : "৳০"}
                    </span>
                    <div className="w-full bg-gray-100 rounded-xl h-32 flex items-end p-1">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-lg transition-all ${
                          d.isToday ? "bg-[#FF6B1A]" : "bg-indigo-400 hover:bg-indigo-500"
                        }`}
                      />
                    </div>
                    <span className={`text-[11px] font-black ${d.isToday ? "text-[#FF6B1A]" : "text-gray-600"}`}>
                      {d.dayLabelBn}
                    </span>
                    <span className="text-[9px] text-gray-400 font-semibold">{formatNum(d.completedCount)} সম্পন্ন</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day by Day Ledger Table */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900">দিনভিত্তিক বিক্রির বিস্তারিত খতিয়ান (Weekly Breakdown)</h3>
              <span className="text-xs text-gray-400">এশিয়া/ঢাকা ক্যালেন্ডার অনুযায়ী</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-black text-[10px] tracking-wider">
                    <th className="py-3 px-4">বার ও তারিখ</th>
                    <th className="py-3 px-4 text-center">প্রাপ্ত অর্ডার</th>
                    <th className="py-3 px-4 text-center">সম্পন্ন</th>
                    <th className="py-3 px-4 text-center">বাতিল</th>
                    <th className="py-3 px-4">মোট বিক্রি (Gross)</th>
                    <th className="py-3 px-4">কমিশন ({commissionRate}%)</th>
                    <th className="py-3 px-4 text-emerald-700 font-black">রেস্তোরাঁর নিট পাওনা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {weeklyData.days.map((d) => (
                    <tr
                      key={d.dateStr}
                      className={`hover:bg-gray-50 transition-colors ${d.isToday ? "bg-orange-50/30" : ""}`}
                    >
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {d.dayLabelBn} <span className="text-gray-400 font-normal">({d.dateStr})</span>
                        {d.isToday && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-orange-100 text-[#FF6B1A] font-black rounded">
                            আজ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-700">{formatNum(d.ordersReceived)}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{formatNum(d.completedCount)}</td>
                      <td className="py-3 px-4 text-center font-bold text-red-500">{formatNum(d.cancelledCount)}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{formatPrice(d.grossSales)}</td>
                      <td className="py-3 px-4 font-semibold text-red-600">-{formatPrice(d.commission)}</td>
                      <td className="py-3 px-4 font-black text-emerald-700 text-sm">{formatPrice(d.netPayout)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-50/70 border-t-2 border-indigo-200 font-black text-xs text-gray-900">
                    <td className="py-3.5 px-4">সাপ্তাহিক মোট যোগফল:</td>
                    <td className="py-3.5 px-4 text-center font-bold">{formatNum(weeklyData.weekReceived)}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">{formatNum(weeklyData.weekCompleted)}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-red-600">{formatNum(weeklyData.weekCancelled)}</td>
                    <td className="py-3.5 px-4 font-black">{formatPrice(weeklyData.weekGross)}</td>
                    <td className="py-3.5 px-4 text-red-600 font-bold">-{formatPrice(weeklyData.weekComm)}</td>
                    <td className="py-3.5 px-4 text-emerald-700 text-sm font-black">
                      {formatPrice(weeklyData.weekNet)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
