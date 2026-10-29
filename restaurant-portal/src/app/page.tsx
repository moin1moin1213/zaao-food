"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  RefreshCw,
  ChefHat,
  Bike,
  Phone,
  Flame,
  Check,
  X,
  FileText,
} from "lucide-react";
import { restaurantService } from "@/services/restaurantService";
import { Order, OrderStatus } from "@/services/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useRestaurant } from "./RestaurantContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export default function RestaurantOrdersPage() {
  const { lang, formatPrice, formatNum } = useLanguage();
  const { currentRestaurantId } = useRestaurant();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"incoming" | "kitchen" | "ready" | "history">("incoming");
  const [loading, setLoading] = useState(true);
  const [selectedPrepTime, setSelectedPrepTime] = useState<number>(25);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Web Audio chime generator for new orders
  const playChime = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Audio permission or autoplay blocked
    }
  };

  async function loadOrders() {
    if (!currentRestaurantId) return;
    try {
      const data = await restaurantService.getOrders(currentRestaurantId);
      setOrders(data);
    } catch (err) {
      console.error("Failed to load restaurant orders:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    if (supabase && isSupabaseConfigured && currentRestaurantId) {
      const channel = supabase
        .channel(`restaurant_orders_${currentRestaurantId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `restaurant_id=eq.${currentRestaurantId}`,
          },
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              playChime();
            }
            loadOrders();
          }
        )
        .subscribe();

      return () => {
        if (supabase) supabase.removeChannel(channel);
      };
    } else {
      const interval = setInterval(loadOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [currentRestaurantId]);

  const handleAccept = async (orderId: string) => {
    await restaurantService.acceptOrder(orderId, selectedPrepTime);
    loadOrders();
  };

  const handleStartPreparing = async (orderId: string) => {
    await restaurantService.startPreparing(orderId);
    loadOrders();
  };

  const handleMarkReady = async (orderId: string) => {
    await restaurantService.markReadyForPickup(orderId);
    loadOrders();
  };

  const handleRejectConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingOrderId) return;
    await restaurantService.rejectOrder(rejectingOrderId, rejectReason || "Item out of stock");
    setRejectingOrderId(null);
    setRejectReason("");
    loadOrders();
  };

  // Categorize orders
  const incomingOrders = orders.filter((o) => o.status === "placed");
  const kitchenOrders = orders.filter((o) => o.status === "accepted" || o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready_for_pickup" || o.status === "rider_picked_up" || o.status === "on_the_way");
  const completedOrders = orders.filter((o) => o.status === "delivered" || o.status === "cancelled");

  const currentList =
    activeTab === "incoming"
      ? incomingOrders
      : activeTab === "kitchen"
      ? kitchenOrders
      : activeTab === "ready"
      ? readyOrders
      : completedOrders;

  return (
    <div className="space-y-6">
      {/* Top Banner & Audio Chime Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-[#FF6B1A]" />
            <span>{lang === "bn" ? "কিচেন অর্ডার ড্যাশবোর্ড" : "Kitchen Orders Dispatch"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === "bn"
              ? "নতুন অর্ডারের প্রস্তুতি, সময় নির্ধারণ ও রাইডার পিকআপ নিশ্চিত করুন।"
              : "Manage real-time food preparation, cooking timers and rider handover."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              soundEnabled
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
            <span>{soundEnabled ? "Audio Alert ON" : "Muted"}</span>
          </button>

          <button
            type="button"
            onClick={loadOrders}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#FF6B1A]" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-100 dark:bg-gray-800/60 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab("incoming")}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "incoming"
              ? "bg-[#FF6B1A] text-white shadow-md shadow-orange-500/20"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
          }`}
        >
          <span>Incoming</span>
          {incomingOrders.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-[#FF6B1A] text-[10px] font-black flex items-center justify-center animate-bounce">
              {incomingOrders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("kitchen")}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "kitchen"
              ? "bg-[#FF6B1A] text-white shadow-md shadow-orange-500/20"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
          }`}
        >
          <span>Cooking ({kitchenOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ready")}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "ready"
              ? "bg-[#FF6B1A] text-white shadow-md shadow-orange-500/20"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
          }`}
        >
          <span>Ready / In Transit ({readyOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "history"
              ? "bg-[#FF6B1A] text-white shadow-md shadow-orange-500/20"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
          }`}
        >
          <span>History ({completedOrders.length})</span>
        </button>
      </div>

      {/* Order Cards Feed */}
      <div className="space-y-4">
        {currentList.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-850 rounded-3xl border border-gray-100 dark:border-gray-800 text-gray-400 text-xs space-y-2">
            <ChefHat className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 stroke-[1.5]" />
            <div className="font-bold">No orders in this stage right now.</div>
          </div>
        ) : (
          currentList.map((order) => (
            <div
              key={order.id}
              className={`bg-white dark:bg-gray-850 rounded-3xl border p-6 shadow-xs space-y-4 transition-all ${
                order.status === "placed"
                  ? "border-orange-300 dark:border-orange-900 ring-2 ring-orange-500/20 animate-pulse"
                  : "border-gray-100 dark:border-gray-800"
              }`}
            >
              {/* Order Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-gray-900 dark:text-gray-100">
                    Order #{order.id}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      order.status === "placed"
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        : order.status === "preparing"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : order.status === "ready_for_pickup"
                        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    }`}
                  >
                    {order.status === "placed"
                      ? "NEW ORDER!"
                      : order.status === "preparing"
                      ? "Cooking in Kitchen"
                      : order.status === "ready_for_pickup"
                      ? "Ready for Rider Pickup"
                      : order.status}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-[#FF6B1A]">
                    {formatPrice(order.pricing.total)}
                  </div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">
                    {order.paymentMethod} • {order.items.length} items
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 space-y-2">
                <div className="text-[11px] font-extrabold uppercase text-gray-400 tracking-wider">
                  Food Items to Prepare
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-gray-900 dark:text-gray-100">
                          {it.quantity}x {it.nameBn || it.nameEn}
                        </span>
                        {it.customMessage && (
                          <div className="text-[11px] text-[#FF6B1A] font-semibold mt-0.5">
                            ✍ Cake Message: &quot;{it.customMessage}&quot;
                          </div>
                        )}
                        {it.selectedFlavor && (
                          <div className="text-[10px] text-gray-400">Flavor: {it.selectedFlavor.nameEn}</div>
                        )}
                        {it.specialInstructions && (
                          <div className="text-[10px] text-gray-500 italic">Note: {it.specialInstructions}</div>
                        )}
                      </div>
                      <span className="font-bold text-gray-700 dark:text-gray-300">
                        {formatPrice(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Notes */}
              {order.customer.instructions && (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 rounded-2xl text-xs text-amber-800 dark:text-amber-300">
                  <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{lang === "bn" ? "গ্রাহকের বিশেষ নির্দেশনা:" : "Customer Note:"} {order.customer.instructions}</span>
                </div>
              )}

              {/* Action Buttons based on status */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lang === "bn" ? "প্রস্তুতির আনুমানিক সময়:" : "Est. Prep:"} {formatNum(order.estimatedDeliveryMinutes || 25)} {lang === "bn" ? "মিনিট" : "mins"}</span>
                </div>

                <div className="flex items-center gap-2">
                  {order.status === "placed" && (
                    <>
                      {/* Prep time select */}
                      <select
                        value={selectedPrepTime}
                        onChange={(e) => setSelectedPrepTime(Number(e.target.value))}
                        className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-xs font-bold"
                      >
                        <option value={15}>{formatNum(15)} {lang === "bn" ? "মিনিট" : "mins"}</option>
                        <option value={20}>{formatNum(20)} {lang === "bn" ? "মিনিট" : "mins"}</option>
                        <option value={25}>{formatNum(25)} {lang === "bn" ? "মিনিট" : "mins"}</option>
                        <option value={35}>{formatNum(35)} {lang === "bn" ? "মিনিট" : "mins"}</option>
                        <option value={45}>{formatNum(45)} {lang === "bn" ? "মিনিট" : "mins"}</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleAccept(order.id)}
                        className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-colors"
                      >
                        {lang === "bn" ? "অর্ডার গ্রহণ করুন" : "Accept Order"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setRejectingOrderId(order.id)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        {lang === "bn" ? "প্রত্যাখ্যান" : "Reject"}
                      </button>
                    </>
                  )}

                  {order.status === "accepted" && (
                    <button
                      type="button"
                      onClick={() => handleStartPreparing(order.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-[#FF6B1A] hover:bg-orange-600 shadow-md transition-colors"
                    >
                      <Flame className="w-4 h-4" />
                      <span>{lang === "bn" ? "রান্না শুরু করুন" : "Start Cooking"}</span>
                    </button>
                  )}

                  {order.status === "preparing" && (
                    <button
                      type="button"
                      onClick={() => handleMarkReady(order.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === "bn" ? "খাবার প্রস্তুত (রাইডার পিকআপ)" : "Food Ready for Rider"}</span>
                    </button>
                  )}

                  {order.status === "ready_for_pickup" && (
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Bike className="w-4 h-4" />
                      <span>{lang === "bn" ? "রাইডারের জন্য অপেক্ষমাণ..." : "Waiting for Courier Handover..."}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Order Modal */}
      {rejectingOrderId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-850 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
              Reject Order #{rejectingOrderId}
            </h3>
            <form onSubmit={handleRejectConfirm} className="space-y-3 text-xs font-bold">
              <label className="text-gray-600 dark:text-gray-300">Reason for rejection:</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Rice finished, Kitchen closing early"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-semibold"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingOrderId(null)}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-red-600 text-white font-bold"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
