"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Store,
  Bike,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sliders,
  Phone,
  MapPin,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import { Order, AdminStats, OrderStatus, RiderProfile } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AdminDashboardPage() {
  const { lang, formatPrice, formatNum } = useLanguage();
  const [stats, setStats] = useState<AdminStats>({
    todayOrdersCount: 0,
    todayRevenue: 0,
    activeRestaurantsCount: 0,
    onlineRidersCount: 0,
    totalCommissionEarned: 0,
    totalRiderPayouts: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

  async function loadData() {
    try {
      const [s, o, r] = await Promise.all([
        adminService.getStats(),
        adminService.getAllOrders(),
        adminService.getRiders(),
      ]);
      setStats(s);
      setOrders(o);
      setRiders(r);
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();

    // Supabase Realtime live sync on orders
    if (supabase && isSupabaseConfigured) {
      const channel = supabase
        .channel("admin_orders_channel")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        if (supabase) supabase.removeChannel(channel);
      };
    } else {
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await adminService.updateOrderStatus(orderId, newStatus);
    loadData();
  };

  const handleAssignRider = async (orderId: string, rider: RiderProfile) => {
    await adminService.updateOrderStatus(orderId, "ready_for_pickup", {
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      vehicle: rider.vehicle,
    });
    setAssigningOrderId(null);
    loadData();
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {lang === "bn" ? "অ্যাডমিন ওভারভিউ" : "Business Overview"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === "bn"
              ? "মঠবাড়িয়া পেঙ্গুফুড লাইভ ডেলিভারি ও রেভিনিউ ট্র্যাকার"
              : "Live operations monitoring for Mathbaria PenguFood"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B1A] hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-colors"
          >
            <Sliders className="w-4 h-4" />
            <span>{lang === "bn" ? "ডেলিভারি চার্জ পরিবর্তন" : "Change Delivery Fees"}</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadData();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{lang === "bn" ? "রিফ্রেশ" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-850 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase">{lang === "bn" ? "আজকের অর্ডার" : "Today's Orders"}</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950 flex items-center justify-center text-[#FF6B1A]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {formatNum(stats.todayOrdersCount)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{lang === "bn" ? "লাইভ কাউন্ট" : "Live stream"}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-850 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase">{lang === "bn" ? "আজকের বিক্রি" : "Today's Gross"}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {formatPrice(stats.todayRevenue)}
          </div>
          <div className="text-[11px] text-gray-400 font-semibold mt-1">
            {lang === "bn" ? "ক্যাশ অন ডেলিভারি সহ" : "Including COD"}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-850 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase">{lang === "bn" ? "প্লাটফর্ম কমিশন" : "Commission Earned"}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {formatPrice(stats.totalCommissionEarned)}
          </div>
          <div className="text-[11px] text-gray-400 font-semibold mt-1">
            {lang === "bn" ? "রেস্তোরাঁ কমিশন ১৫%" : "Avg 15% rate"}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-850 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase">{lang === "bn" ? "অনলাইন রাইডার" : "Active Riders"}</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {formatNum(stats.onlineRidersCount)}
          </div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">
            {lang === "bn" ? "মঠবাড়িয়া ডেলিভারি রেডি" : "Ready in Mathbaria"}
          </div>
        </div>
      </div>

      {/* Live Orders Section */}
      <div className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">
              {lang === "bn" ? "লাইভ অর্ডার কন্ট্রোল রুম" : "Live Orders Control Room"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {lang === "bn"
                ? "নতুন অর্ডারে স্ট্যাটাস পরিবর্তন এবং রাইডার এসাইন করুন"
                : "Manage incoming customer orders and dispatch riders"}
            </p>
          </div>

          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B1A] hover:underline"
          >
            <span>{lang === "bn" ? "সব অর্ডার দেখুন" : "View All Orders"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            {lang === "bn" ? "এখনও কোনো অর্ডার পাওয়া যায়নি।" : "No orders recorded yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 px-3">Order ID</th>
                  <th className="pb-3 px-3">{lang === "bn" ? "রেস্তোরাঁ" : "Restaurant"}</th>
                  <th className="pb-3 px-3">{lang === "bn" ? "গ্রাহক" : "Customer"}</th>
                  <th className="pb-3 px-3">{lang === "bn" ? "টাকা" : "Amount"}</th>
                  <th className="pb-3 px-3">{lang === "bn" ? "বর্তমান স্ট্যাটাস" : "Status"}</th>
                  <th className="pb-3 px-3">{lang === "bn" ? "রাইডার" : "Rider"}</th>
                  <th className="pb-3 px-3 text-right">{lang === "bn" ? "অ্যাকশন" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.slice(0, 8).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 px-3 font-black text-gray-900 dark:text-gray-100">
                      <Link href={`/orders/${order.id}`} className="hover:text-[#FF6B1A] underline">
                        {order.id}
                      </Link>
                      <div className="text-[10px] text-gray-400 font-normal">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-800 dark:text-gray-200">
                        {order.restaurantNameBn || order.restaurantNameEn}
                      </div>
                      <div className="text-[11px] text-gray-400">{order.items.length} items</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{order.customer.name}</div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{order.customer.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-black text-gray-900 dark:text-gray-100">{formatPrice(order.pricing.total)}</div>
                      <div className="text-[10px] text-gray-400 font-semibold uppercase">{order.paymentMethod}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          order.status === "delivered"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            : order.status === "on_the_way"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 animate-pulse"
                            : "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {order.rider ? (
                        <div>
                          <div className="font-bold text-gray-800 dark:text-gray-200">{order.rider.name}</div>
                          <div className="text-[10px] text-gray-400">{order.rider.phone}</div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAssigningOrderId(order.id)}
                          className="px-2 py-1 rounded bg-orange-50 dark:bg-orange-950 text-[#FF6B1A] font-bold text-[11px] hover:bg-orange-100"
                        >
                          + {lang === "bn" ? "রাইডার দিন" : "Assign Rider"}
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status === "placed" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order.id, "accepted")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
                          >
                            Accept
                          </button>
                        )}
                        {order.status === "ready_for_pickup" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order.id, "on_the_way")}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
                          >
                            Dispatch
                          </button>
                        )}
                        {order.status === "on_the_way" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order.id, "delivered")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
                          >
                            Delivered
                          </button>
                        )}
                        {order.status !== "delivered" && order.status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order.id, "cancelled")}
                            className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-red-500 font-bold hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Rider Modal */}
      {assigningOrderId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-850 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
                {lang === "bn" ? "অর্ডারে রাইডার এসাইন করুন" : "Assign Rider to Order"}
              </h3>
              <button
                type="button"
                onClick={() => setAssigningOrderId(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lang === "bn"
                ? `অর্ডার #${assigningOrderId} এর জন্য উপযুক্ত রাইডার নির্বাচন করুন:`
                : `Select available rider for order #${assigningOrderId}:`}
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {riders.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleAssignRider(assigningOrderId, r)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-[#FF6B1A] bg-gray-50/50 dark:bg-gray-800/40 text-left transition-colors"
                >
                  <div>
                    <div className="font-bold text-xs text-gray-800 dark:text-gray-200">{r.name}</div>
                    <div className="text-[11px] text-gray-400">{r.phone} • {r.vehicle}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.isOnline
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {r.isOnline ? "Online" : "Offline"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
