"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Info, ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MATHBARIA_CENTER } from "@/lib/pricing/deliveryZoneService";

interface MapLocationPickerProps {
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  selectedAddress?: string;
}

/**
 * Map Integration Boundary.
 * Designed to cleanly host Leaflet.js and OpenStreetMap in Phase 2.
 * Honest missing-configuration / preview boundary with Mathbaria central coordinates.
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

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#FF6B1A]" />
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
            {lang === "bn" ? "ম্যাপ অবস্থান নির্বাচন (ইন্টিগ্রেশন বাউন্ডারি)" : "Map Pinpoint (OpenStreetMap Boundary)"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-[#FF6B1A] bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>{lang === "bn" ? "আমার অবস্থান" : "Use GPS"}</span>
        </button>
      </div>

      {/* Map Interactive Canvas Simulation / Boundary */}
      <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center p-4">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#FF6B1A_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Central Pin */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-[#FF6B1A] text-white flex items-center justify-center shadow-lg animate-bounce">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="w-4 h-1.5 bg-black/20 rounded-full blur-[1px] mt-0.5" />
        </div>

        <div className="relative z-10 mt-3 max-w-xs">
          <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
            {lang === "bn" ? "মঠবাড়িয়া পৌরসভা ও বাজার কেন্দ্র" : "Mathbaria Bazar Central Hub"}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            {formatNum(coords.lat)}° N, {formatNum(coords.lng)}° E
          </div>
        </div>

        {/* Status pill */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xs px-2.5 py-1 rounded-lg">
          <span>Leaflet / OSM Leaflet Ready</span>
          <span>{isPinPlaced ? (lang === "bn" ? "পিন চিহ্নিত" : "Pin Placed") : (lang === "bn" ? "ডিফল্ট কেন্দ্র" : "Default Hub")}</span>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-amber-50/70 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          {lang === "bn"
            ? "ম্যাপটি অফলাইন ডেভেলপমেন্ট মোডে রয়েছে। আপনার লিখিত ঠিকানাকেই ডেলিভারির জন্য প্রধান বিবেচনা করা হবে।"
            : "Map interface is operating in development offline mode. Your street address below will be used as primary delivery destination."}
        </span>
      </div>
    </div>
  );
}
