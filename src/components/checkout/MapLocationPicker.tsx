"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Info, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MATHBARIA_CENTER } from "@/lib/pricing/deliveryZoneService";

// Dynamically import Leaflet with SSR disabled
const LeafletMap = dynamic(() => import("../map/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-gray-400">
      <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#FF6B1A]" />
      Loading Map...
    </div>
  ),
});

interface MapLocationPickerProps {
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  selectedAddress?: string;
}

/**
 * Interactive OpenStreetMap Delivery Location Picker for Mathbaria
 */
export function MapLocationPicker({ onCoordinatesChange, selectedAddress }: MapLocationPickerProps) {
  const { lang, formatNum } = useLanguage();
  const [coords, setCoords] = useState({
    lat: MATHBARIA_CENTER.lat,
    lng: MATHBARIA_CENTER.lng,
  });
  const [isPinPlaced, setIsPinPlaced] = useState(false);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = {
            lat: Math.round(pos.coords.latitude * 10000) / 10000,
            lng: Math.round(pos.coords.longitude * 10000) / 10000,
          };
          setCoords(newCoords);
          setIsPinPlaced(true);
          onCoordinatesChange?.(newCoords);
        },
        (err) => {
          console.warn("Geolocation permission error or timeout:", err);
          setIsPinPlaced(true);
          onCoordinatesChange?.(coords);
        }
      );
    } else {
      setIsPinPlaced(true);
      onCoordinatesChange?.(coords);
    }
  };

  const handlePinDrop = (newCoords: { lat: number; lng: number }) => {
    setCoords(newCoords);
    setIsPinPlaced(true);
    onCoordinatesChange?.(newCoords);
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#FF6B1A]" />
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
            {lang === "bn" ? "ম্যাপে ডেলিভারি অবস্থান নির্বাচন করুন" : "Pick Delivery Location on Map"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-[#FF6B1A] bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>{lang === "bn" ? "আমার জিপিএস লোকেশন" : "Use GPS"}</span>
        </button>
      </div>

      {/* Interactive OpenStreetMap */}
      <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <LeafletMap
          centerLat={coords.lat}
          centerLng={coords.lng}
          zoom={15}
          allowPinDrop={true}
          onPinDrop={handlePinDrop}
          markers={[
            {
              lat: coords.lat,
              lng: coords.lng,
              label: isPinPlaced ? "আপনার ডেলিভারি পয়েন্ট" : "মঠবাড়িয়া বাজার",
              type: "customer",
            },
          ]}
          className="w-full h-full"
        />

        <div className="absolute top-2 left-2 z-[400] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xs px-2.5 py-1 rounded-lg shadow-sm text-[11px] font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 pointer-events-none">
          {lang === "bn" ? "ম্যাপে ক্লিক করে পিন বসান" : "Click anywhere on map to set pin"}
        </div>

        {/* Status pill */}
        <div className="absolute bottom-2 left-2 z-[400] flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xs px-2.5 py-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 pointer-events-none">
          <span>{formatNum(coords.lat)}° N, {formatNum(coords.lng)}° E</span>
          <span className="font-bold text-[#FF6B1A]">{isPinPlaced ? (lang === "bn" ? "• পিন সেট করা হয়েছে" : "• Pin Set") : ""}</span>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/80 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
        <Info className="w-4 h-4 text-[#FF6B1A] shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          {lang === "bn"
            ? "ডেলিভারি রাইডারের সুবিধার্থে নিচে আপনার সুনির্দিষ্ট বাসা ও সড়কের ঠিকানা উল্লেখ করুন।"
            : "Please enter your detailed street address and house landmark below for prompt dispatch."}
        </span>
      </div>
    </div>
  );
}
