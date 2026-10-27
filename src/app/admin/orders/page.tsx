"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Filter,
  CheckCircle2,
  Clock,
  Bike,
  Phone,
  MapPin,
  RefreshCw,
  Search,
  ExternalLink,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import { Order, OrderStatus, RiderProfile } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

const STATUS_FILTERS: Array<{ id: OrderStatus | "all"; label: string }> = [
  { id: "all", label: "All Orders" },
  { id: "placed", label: "New (Placed)" },
  { id: "accepted", label: "Accepted" },
  { id: "preparing", label: "Kitchen Preparing" },
  { id: "ready_for_pickup", label: "Ready for Pickup" },
  { id: "on_the_way", label: "Out for Delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export default function AdminOrdersStreamPage() {
  const { lang, formatPrice, formatNum } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [assignModalOrder, setAssignModalOrder] = useState<Order | null>(null);

  async function loadData() {
    try {
      const [allOrders, fleet] = await Promise.all([
        adminService.getAllOrders(selectedFilter),
        adminService.getRiders(),
      ]);
      setOrders(allOrders);
      setRiders(fleet);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    if (supabase && isSupabaseConfigured) {
      const channel = supabase
        .channel("admin_orders_stream_page")
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
    }
  }, [selectedFilter]);

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    await adminService.updateOrderStatus(orderId, status);
    loadData();
  };

  const handleAssignRider = async (orderId: string, rider: RiderProfile) => {
    await adminService.updateOrderStatus(orderId, "on_the_way", {
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      vehicle: rider.vehicle,
    });
    setAssignModalOrder(null);
    loadData();
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.phone.includes(q) ||
      o.restaurantNameEn.toLowerCase().includes(q) ||
      o.restaurantNameBn.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-[#FF6B1A]" />
            <span>{lang === "bn" ? "অর্ডার স্ট্রিম ও কন্ট্রোল" : "Orders Stream & Dispatch"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === "bn"
              ? "মঠবাড়িয়ার গ্রাহকদের সব অর্ডারের রিয়েল-টাইম লাইফসাইকেল পর্যবেক্ষণ করুন।"
              : "Live monitoring and dispatch control for all local orders."}
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#FF6B1A]" />
          <span>{lang === "bn" ? "রিফ্রেশ" : "Refresh Stream"}</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-gray-850 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                selectedFilter === f.id
                  ? "bg-[#FF6B1A] text-white shadow-xs"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID, phone..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold focus:outline-hidden"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-850 rounded-3xl border border-gray-100 dark:border-gray-800 text-gray-400 text-xs">
            {lang === "bn" ? "কোনো অর্ডার পাওয়া যায়নি।" : "No orders found for this filter."}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-xs space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-base font-black text-gray-900 dark:text-gray-100">
                    #{order.id}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
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
                  <span className="text-xs text-gray-400 font-semibold">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-sm font-black text-gray-900 dark:text-gray-100">
                      {formatPrice(order.pricing.total)}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">
                      {order.paymentMethod} • {order.paymentStatus}
                    </span>
                  </div>

                  <Link
                    href={`/orders/${order.id}`}
                    target="_blank"
                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-[#FF6B1A]"
                    title="Live Customer View"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Kitchen / Restaurant */}
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                    Restaurant
                  </span>
                  <div className="font-bold text-gray-800 dark:text-gray-200">
                    {order.restaurantNameBn || order.restaurantNameEn}
                  </div>
                  {order.restaurantPhone && (
                    <div className="text-[11px] text-gray-400">{order.restaurantPhone}</div>
                  )}
                </div>

                {/* Customer */}
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                    Customer Details
                  </span>
                  <div className="font-bold text-gray-800 dark:text-gray-200">{order.customer.name}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{order.customer.phone}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{order.customer.address}</span>
                  </div>
                </div>

                {/* Rider */}
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                    Assigned Rider
                  </span>
                  {order.rider ? (
                    <div>
                      <div className="font-bold text-gray-800 dark:text-gray-200">{order.rider.name}</div>
                      <div className="text-[11px] text-gray-400">{order.rider.phone} • {order.rider.vehicle}</div>
                    </div>
                  ) : (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setAssignModalOrder(order)}
                        className="px-2.5 py-1 rounded-lg bg-[#FF6B1A] text-white font-bold text-[11px] hover:bg-orange-600 transition-colors shadow-xs"
                      >
                        + Assign Courier
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List Summary */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {order.items.map((it, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B1A] font-bold text-[11px]"
                    >
                      {it.quantity}x {it.nameBn || it.nameEn}
                    </span>
                  ))}
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center gap-2">
                  {order.status === "placed" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, "accepted")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 text-xs"
                    >
                      Accept
                    </button>
                  )}
                  {order.status === "accepted" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, "preparing")}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 text-xs"
                    >
                      Start Kitchen
                    </button>
                  )}
                  {order.status === "preparing" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, "ready_for_pickup")}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 text-xs"
                    >
                      Ready for Pickup
                    </button>
                  )}
                  {order.status === "ready_for_pickup" && (
                    <button
                      type="button"
                      onClick={() => setAssignModalOrder(order)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 text-xs"
                    >
                      Dispatch Rider
                    </button>
                  )}
                  {order.status === "on_the_way" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, "delivered")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 text-xs"
                    >
                      Confirm Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rider Assignment Modal */}
      {assignModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-850 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
                Dispatch Courier for #{assignModalOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setAssignModalOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pick an active rider to pick up food from {assignModalOrder.restaurantNameBn || assignModalOrder.restaurantNameEn}:
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {riders.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleAssignRider(assignModalOrder.id, r)}
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
