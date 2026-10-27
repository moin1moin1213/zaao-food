"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default leaflet icons in webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MarkerPoint {
  lat: number;
  lng: number;
  label: string;
  type: "restaurant" | "customer" | "rider";
}

interface LeafletMapProps {
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  markers?: MarkerPoint[];
  allowPinDrop?: boolean;
  onPinDrop?: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

export default function LeafletMap({
  centerLat = 22.2858,
  centerLng = 89.9614,
  zoom = 15,
  markers = [],
  allowPinDrop = false,
  onPinDrop,
  className = "w-full h-64 rounded-2xl overflow-hidden",
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: zoom,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    if (allowPinDrop) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        onPinDrop?.({ lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) });
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Polyline when props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const boundsPoints: [number, number][] = [];

    // Custom Icon Creators
    const createCustomIcon = (type: MarkerPoint["type"], label: string) => {
      let iconHtml = "";
      if (type === "restaurant") {
        iconHtml = `
          <div style="background:#4F46E5; color:white; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3); border:2px solid white;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
          </div>
        `;
      } else if (type === "customer") {
        iconHtml = `
          <div style="background:#10B981; color:white; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3); border:2px solid white;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        `;
      } else {
        // Rider Icon with pulse
        iconHtml = `
          <div style="position:relative;">
            <div style="position:absolute; width:44px; height:44px; left:-4px; top:-4px; border-radius:50%; background:rgba(255,107,26,0.35); animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="background:#FF6B1A; color:white; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(255,107,26,0.5); border:2px solid white; position:relative; z-index:2;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
            </div>
          </div>
        `;
      }

      return L.divIcon({
        html: iconHtml,
        className: "leaflet-custom-marker",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });
    };

    markers.forEach((m) => {
      boundsPoints.push([m.lat, m.lng]);
      const marker = L.marker([m.lat, m.lng], {
        icon: createCustomIcon(m.type, m.label),
      });

      marker.bindPopup(`<div style="font-weight:bold; font-size:12px; font-family:sans-serif;">${m.label}</div>`);
      group.addLayer(marker);
    });

    // Draw route line if multiple markers exist
    if (boundsPoints.length >= 2) {
      const line = L.polyline(boundsPoints, {
        color: "#FF6B1A",
        weight: 3,
        opacity: 0.8,
        dashArray: "6, 8",
      }).addTo(map);
      polylineRef.current = line;

      // Fit bounds nicely
      map.fitBounds(L.latLngBounds(boundsPoints), {
        padding: [40, 40],
        maxZoom: 16,
      });
    } else if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 15);
    }
  }, [markers]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute bottom-2 right-2 z-[400] bg-white/90 dark:bg-gray-800/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-gray-600 dark:text-gray-300 shadow-xs border border-gray-200 dark:border-gray-700 pointer-events-none">
        OpenStreetMap • Mathbaria
      </div>
    </div>
  );
}
