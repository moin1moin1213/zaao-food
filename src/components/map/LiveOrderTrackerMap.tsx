"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Order } from "@/services/types";
import { Loader2 } from "lucide-react";

// Dynamically import Leaflet component with SSR disabled
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-gray-400">
      <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#FF6B1A]" />
      Loading OpenStreetMap...
    </div>
  ),
});

interface LiveOrderTrackerMapProps {
  order: Order;
  className?: string;
}

export function LiveOrderTrackerMap({ order, className }: LiveOrderTrackerMapProps) {
  // Default Mathbaria coordinates
  const mathbariaCenter = { lat: 22.2858, lng: 89.9614 };

  // Customer Coordinates (or fallback)
  const customerLat = order.customer.latitude || 22.2885;
  const customerLng = order.customer.longitude || 89.9642;

  // Restaurant Coordinates
  const restaurantLat = mathbariaCenter.lat;
  const restaurantLng = mathbariaCenter.lng;

  // Live Rider Location state
  const [riderCoords, setRiderCoords] = useState<{ lat: number; lng: number } | null>(
    order.rider ? { lat: (restaurantLat + customerLat) / 2, lng: (restaurantLng + customerLng) / 2 } : null
  );

  // Subscribe to live rider location if active delivery in progress
  useEffect(() => {
    if (!order.riderId && !order.rider) return;

    if (supabase && isSupabaseConfigured) {
      const riderFilter = order.riderId
        ? `id=eq.${order.riderId}`
        : order.rider?.phone
        ? `phone=eq.${order.rider.phone}`
        : undefined;

      const channel = supabase
        .channel(`order_live_rider_${order.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "riders",
            filter: riderFilter,
          },
          (payload: any) => {
            const updated = payload.new;
            if (updated && updated.current_lat && updated.current_lng) {
              setRiderCoords({
                lat: Number(updated.current_lat),
                lng: Number(updated.current_lng),
              });
            }
          }
        )
        .subscribe();

      return () => {
        if (supabase) supabase.removeChannel(channel);
      };
    }
  }, [order.id, order.riderId, order.rider?.phone]);

  // Construct markers array
  const markers: Array<{
    lat: number;
    lng: number;
    label: string;
    type: "restaurant" | "customer" | "rider";
  }> = [
    {
      lat: restaurantLat,
      lng: restaurantLng,
      label: order.restaurantNameBn || order.restaurantNameEn,
      type: "restaurant",
    },
    {
      lat: customerLat,
      lng: customerLng,
      label: order.customer.address || "ডেলিভারি ঠিকানা",
      type: "customer",
    },
  ];

  // If rider is dispatched or on the way, show live rider marker
  if (
    riderCoords &&
    (order.status === "rider_picked_up" ||
      order.status === "on_the_way" ||
      order.status === "ready_for_pickup")
  ) {
    markers.push({
      lat: riderCoords.lat,
      lng: riderCoords.lng,
      label: `রাইডার: ${order.rider?.name || "Pengu Rider"}`,
      type: "rider",
    });
  }

  return (
    <div className={className}>
      <LeafletMap
        centerLat={restaurantLat}
        centerLng={restaurantLng}
        zoom={15}
        markers={markers}
      />
    </div>
  );
}
