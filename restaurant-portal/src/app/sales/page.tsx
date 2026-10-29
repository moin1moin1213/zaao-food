"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  ShoppingBag,
  ArrowUpRight,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Percent,
  Download,
  Filter,
  RefreshCw,
  Store,
} from "lucide-react";
import { restaurantService } from "@/services/restaurantService";
import { Order } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useRestaurant } from "../RestaurantContext";

export default function RestaurantSalesPage() {
  const { lang, formatPrice, formatNum } = useLanguage();
  const { currentRestaurant, currentRestaurantId } = useRestaurant();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");

  async function loadData() {
    if (!currentRestaurantId) return;
    try {
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

  // Delivered/completed orders only for sales calculations
  const deliveredOrders = orders.filter((o) => o.status === "delivered");

  // Commission rate (defaults to 15% if not set)
  const commissionRate = currentRestaurant?.commissionRate || 15;

  // 1. Daily Calculations (Today)
  const todayStr = new Date().toISOString().split("T")[0];
  const todayDelivered = deliveredOrders.filter((o) => o.createdAt.startsWith(todayStr));
  const todayGrossSales = todayDelivered.reduce((sum, o) => sum + (o.pricing?.subtotal || o.pricing?.total || 0), 0);
  const todayCommission = Math.round(todayGrossSales * (commissionRate / 100));
  const todayNetPayout = todayGrossSales - todayCommission;

  // 2. Weekly Calculations (Past 7 Days)
  const now = new Date();
  const past7Days: Array<{
    dateStr: string;
    dayLabelEn: string;
    dayLabelBn: string;
    ordersCount: number;
    grossSales: number;
    commission: number;
    netPayout: number;
  }> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dStr = d.toISOString().split("T")[0];

    const dayOrders = deliveredOrders.filter((o) => o.createdAt.startsWith(dStr));
    const dayGross = dayOrders.reduce((sum, o) => sum + (o.pricing?.subtotal || o.pricing?.total || 0), 0);
    const dayComm = Math.round(dayGross * (commissionRate / 100));
    const dayNet = dayGross - dayComm;

    const dayNameEn = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNamesBn: Record<string, string> = {
      Sun: "রবিবার",
      Mon: "সোমবার",
      Tue: "মঙ্গলবার",
      Wed: "বুধবার",
      Thu: "বৃহস্পতিবার",
      Fri: "শুক্রবার",
      Sat: "শনিবার",
    };

    past7Days.push({
      dateStr: dStr,
      dayLabelEn: dayNameEn,
      dayLabelBn: dayNamesBn[dayNameEn] || dayNameEn,
      ordersCount: dayOrders.length,
      grossSales: dayGross,
      commission: dayComm,
      netPayout: dayNet,
    });
  }

  const weeklyGrossSales = past7Days.reduce((sum, d) => sum + d.grossSales, 0);
  const weeklyOrdersCount = past7Days.reduce((sum, d) => sum + d.ordersCount, 0);
  const weeklyCommission = Math.round(weeklyGrossSales * (commissionRate / 100));
  const weeklyNetPayout = weeklyGrossSales - weeklyCommission;
  const maxDayGross = Math.max(...past7Days.map((d) => d.grossSales), 1);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-[#FF6B1A] border border-orange-200 mb-2">
            <Store className="w-3.5 h-3.5" />
            <span>{currentRestaurant?.nameBn || "রেস্তোরাঁ কিচেন"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-[#FF6B1A]" />
            <span>দৈনিক ও সাপ্তাহিক বিক্রির হিসাব</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            পেঙ্গুফুড থেকে প্রাপ্ত সকল ডেলিভারিকৃত অর্ডারের মোট বিক্রি এবং রেস্তোরাঁর নিট আয়ের বিবরণী।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 font-semibold">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">রেস্তোরাঁ মেনু ও প্রোফাইল নীতি:</p>
          <p className="text-amber-800 text-[11px] mt-0.5 font-normal">
            খাবারের মূল্য, ছবি, স্টক ও রেস্তোরাঁ প্রোফাইল পেঙ্গুফুড কেন্দ্রীয় অ্যাডমিন টিম কর্তৃক নিয়ন্ত্রিত হয়। কোনো খাবার যুক্ত বা পরিবর্তন করতে অ্যাডমিনের সাথে যোগাযোগ করুন।
          </p>
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {/* Card 1: Today's Orders */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#FF6B1A] flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              আজকের সফল অর্ডার
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
              {formatNum(todayDelivered.length)} টি
            </div>
          </div>
        </div>

        {/* Card 2: Today's Gross Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              আজকের মোট বিক্রি
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
              {formatPrice(todayGrossSales)}
            </div>
          </div>
        </div>

        {/* Card 3: Today's Net Payout */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
              আজকের রেস্তোরাঁ পাওনা (Net)
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
              {formatPrice(todayNetPayout)}
            </div>
            <span className="text-[10px] text-gray-400 font-semibold">
              কমিশন ({commissionRate}%): {formatPrice(todayCommission)}
            </span>
          </div>
        </div>

        {/* Card 4: Weekly Gross Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/20 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
              ৭ দিনের মোট বিক্রি
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-950 mt-0.5">
              {formatPrice(weeklyGrossSales)}
            </div>
            <span className="text-[10px] text-gray-400 font-semibold">
              ৭ দিনের নিট পাওনা: {formatPrice(weeklyNetPayout)}
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
          <span>আজকের বিক্রির বিবরণ ({formatNum(todayDelivered.length)})</span>
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
          <Calendar className="w-4 h-4" />
          <span>চলতি সপ্তাহের হিসাব (গত ৭ দিন)</span>
        </button>
      </div>

      {/* TAB 1: DAILY SALES BREAKDOWN */}
      {activeTab === "daily" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#FF6B1A]" />
              <span>আজকের সম্পন্ন হওয়া অর্ডারসমূহ</span>
            </h3>
            <span className="text-xs text-gray-400 font-semibold">
              তারিখ: {new Date().toLocaleDateString("bn-BD")}
            </span>
          </div>

          {todayDelivered.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 space-y-2">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-[#FF6B1A] flex items-center justify-center font-bold text-xl mx-auto">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="font-bold text-sm text-gray-800">আজকে এখনো কোনো অর্ডার সম্পন্ন হয়নি</p>
              <p className="text-xs text-gray-400">নতুন অর্ডার আসলে কিচেন ড্যাশবোর্ডে দেখতে পাবেন।</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-black text-[10px] tracking-wider">
                      <th className="py-3 px-4">অর্ডার আইডি</th>
                      <th className="py-3 px-4">অর্ডারের সময়</th>
                      <th className="py-3 px-4">গ্রাহক</th>
                      <th className="py-3 px-4">খাবারসমূহ</th>
                      <th className="py-3 px-4">মোট বিল</th>
                      <th className="py-3 px-4">কমিশন ({commissionRate}%)</th>
                      <th className="py-3 px-4 text-emerald-700 font-black">রেস্তোরাঁর পাওনা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {todayDelivered.map((o) => {
                      const subtotal = o.pricing?.subtotal || o.pricing?.total || 0;
                      const comm = Math.round(subtotal * (commissionRate / 100));
                      const net = subtotal - comm;
                      const timeStr = new Date(o.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

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
        </div>
      )}

      {/* TAB 2: WEEKLY SALES (PAST 7 DAYS) */}
      {activeTab === "weekly" && (
        <div className="space-y-6">
          {/* Visual Bar Chart */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF6B1A]" />
                <span>গত ৭ দিনের বিক্রির গ্রাফ (Past 7 Days Trend)</span>
              </h3>
              <span className="text-xs text-indigo-700 font-black">
                সাপ্তাহিক গড়: {formatPrice(Math.round(weeklyGrossSales / 7))}/দিন
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-4 border-t border-gray-100">
              {past7Days.map((d) => {
                const heightPercent = Math.max(12, Math.round((d.grossSales / maxDayGross) * 100));
                const isToday = d.dateStr === todayStr;

                return (
                  <div key={d.dateStr} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-black text-gray-700">
                      {d.grossSales > 0 ? formatPrice(d.grossSales) : "৳০"}
                    </span>
                    <div className="w-full bg-gray-100 rounded-xl h-32 flex items-end p-1">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-lg transition-all ${
                          isToday ? "bg-[#FF6B1A]" : "bg-indigo-400 hover:bg-indigo-500"
                        }`}
                      />
                    </div>
                    <span className={`text-[11px] font-black ${isToday ? "text-[#FF6B1A]" : "text-gray-500"}`}>
                      {d.dayLabelBn}
                    </span>
                    <span className="text-[9px] text-gray-400 font-semibold">{formatNum(d.ordersCount)} অর্ডার</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day by Day Ledger Table */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-black text-sm text-gray-900">দিনভিত্তিক বিক্রির বিস্তারিত টেবিল</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-black text-[10px] tracking-wider">
                    <th className="py-3 px-4">দিন ও তারিখ</th>
                    <th className="py-3 px-4">সম্পন্ন অর্ডার সংখ্যা</th>
                    <th className="py-3 px-4">মোট বিক্রি (Gross)</th>
                    <th className="py-3 px-4">পেঙ্গুফুড কমিশন ({commissionRate}%)</th>
                    <th className="py-3 px-4 text-emerald-700 font-black">রেস্তোরাঁর নিট পাওনা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {past7Days.map((d) => (
                    <tr key={d.dateStr} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {d.dayLabelBn} <span className="text-gray-400 font-normal">({d.dateStr})</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800">{formatNum(d.ordersCount)} টি</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{formatPrice(d.grossSales)}</td>
                      <td className="py-3 px-4 font-semibold text-red-600">-{formatPrice(d.commission)}</td>
                      <td className="py-3 px-4 font-black text-emerald-700 text-sm">{formatPrice(d.netPayout)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-50/70 border-t-2 border-indigo-200 font-black text-xs text-gray-900">
                    <td className="py-3.5 px-4">৭ দিনের সর্বমোট:</td>
                    <td className="py-3.5 px-4 font-black text-indigo-900">{formatNum(weeklyOrdersCount)} টি</td>
                    <td className="py-3.5 px-4">{formatPrice(weeklyGrossSales)}</td>
                    <td className="py-3.5 px-4 text-red-600">-{formatPrice(weeklyCommission)}</td>
                    <td className="py-3.5 px-4 text-emerald-700 text-sm font-black">
                      {formatPrice(weeklyNetPayout)}
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
