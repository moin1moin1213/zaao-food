import { DeliveryFeeCalculation, DeliveryZoneType, DeliveryZone } from "@/services/types";
import { safeLocalStorageGet } from "@/lib/storage/safeStorage";

// Mathbaria Bazar central coordinates (Configurable via environment or default)
export const MATHBARIA_CENTER = {
  nameEn: "Mathbaria Bazar, Pirojpur",
  nameBn: "মঠবাড়িয়া বাজার, পিরোজপুর",
  lat: parseFloat(process.env.NEXT_PUBLIC_MATHBARIA_CENTER_LAT || "22.2858"),
  lng: parseFloat(process.env.NEXT_PUBLIC_MATHBARIA_CENTER_LNG || "89.9614"),
};

export interface DeliveryLocationOption {
  id: string;
  nameEn: string;
  nameBn: string;
  distanceKm: number;
  areaType: 'bazar_core' | 'town_area' | 'suburban_union' | 'outer_zone';
}

// Popular locations in and around Mathbaria Upazila
export const POPULAR_LOCATIONS: DeliveryLocationOption[] = [
  { id: "loc-1", nameEn: "Mathbaria Bazar (Center)", nameBn: "মঠবাড়িয়া বাজার (কেন্দ্র)", distanceKm: 0.5, areaType: "bazar_core" },
  { id: "loc-2", nameEn: "College Road, Ward 4", nameBn: "কলেজ রোড, ৪ নং ওয়ার্ড", distanceKm: 1.2, areaType: "town_area" },
  { id: "loc-3", nameEn: "Upazila Hospital Road", nameBn: "উপজেলা স্বাস্থ্য কমপ্লেক্স রোড", distanceKm: 1.8, areaType: "town_area" },
  { id: "loc-4", nameEn: "Thana Road, Ward 2", nameBn: "থানা রোড, ২ নং ওয়ার্ড", distanceKm: 1.5, areaType: "town_area" },
  { id: "loc-5", nameEn: "Tikikata Union Parishad", nameBn: "টিকিকাটা ইউনিয়ন পরিষদ", distanceKm: 2.8, areaType: "town_area" },
  { id: "loc-6", nameEn: "Gulishakhali Road", nameBn: "গুলিশাখালী রোড", distanceKm: 4.5, areaType: "suburban_union" },
  { id: "loc-7", nameEn: "Sapleza Bazar", nameBn: "সাপলেজা বাজার", distanceKm: 6.2, areaType: "suburban_union" },
  { id: "loc-8", nameEn: "Daudkhali High School", nameBn: "দাউদখালী হাইস্কুল মোড়", distanceKm: 7.5, areaType: "suburban_union" },
  { id: "loc-9", nameEn: "Tushkhali Ferry Ghat", nameBn: "তুষখালী ফেরীঘাট", distanceKm: 11.0, areaType: "outer_zone" },
];

/**
 * Calculate straight-line approximate distance in km using the Haversine formula.
 * Note: As stated in business rules, this is an estimate and not verified road distance.
 */
export function calculateStraightLineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number = MATHBARIA_CENTER.lat,
  lon2: number = MATHBARIA_CENTER.lng
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Business delivery rules:
 * Regular Zone: 0 - 3 km from Mathbaria Bazar
 *   - Food delivery fee: ৳40 for 0-2 km; ৳60 for >2-3 km
 *   - Cake delivery fee: ৳100 total
 * Special Cake Zone: > 3 km through 8 km
 *   - Cake orders only! Regular food not supported here.
 *   - Delivery fee: ৳150 total.
 *   - Advance booking required: 2-3 days.
 * Beyond 8 km: Unsupported area.
 */
export function calculateDeliveryFee(
  distanceKm: number,
  isCakeOrder: boolean,
  isOnlyCakes: boolean = isCakeOrder
): DeliveryFeeCalculation {
  if (distanceKm < 0) {
    distanceKm = 0;
  }

  // Load dynamically configured rates from Admin Dashboard if available
  let rate0_2 = 40;
  let rate2_3 = 60;
  let cakeRate0_3 = 100;
  let cakeRate3_8 = 150;

  if (typeof window !== "undefined") {
    try {
      const dynamicZones = safeLocalStorageGet<DeliveryZone[]>("admin_delivery_zones", []);
      if (dynamicZones && dynamicZones.length > 0) {
        const z1 = dynamicZones.find((z) => z.id === "zone_0_2");
        const z2 = dynamicZones.find((z) => z.id === "zone_2_3");
        const z3 = dynamicZones.find((z) => z.id === "zone_3_8");
        if (z1) {
          rate0_2 = z1.regularFee;
          cakeRate0_3 = z1.cakeFee;
        }
        if (z2) {
          rate2_3 = z2.regularFee;
        }
        if (z3) {
          cakeRate3_8 = z3.cakeFee;
        }
      }
    } catch (e) {
      // fallback to defaults
    }
  }

  // Case 1: Regular Zone 0 to 2 km
  if (distanceKm <= 2.0) {
    const fee = isCakeOrder ? cakeRate0_3 : rate0_2;
    return {
      zone: 'regular_0_2',
      distanceKm,
      fee,
      isEligibleForFood: true,
      isEligibleForCake: true,
      advanceDaysRequired: isCakeOrder ? 2 : 0,
      messageEn: isCakeOrder
        ? `Regular delivery zone (0–2 km). Homemade cake delivery fee: ৳${fee}.`
        : `Regular delivery zone (0–2 km). Standard delivery fee: ৳${fee}.`,
      messageBn: isCakeOrder
        ? `রেগুলার ডেলিভারি জোন (০–২ কিমি)। হোমমেড কেক ডেলিভারি ফি: ৳${fee}।`
        : `রেগুলার ডেলিভারি জোন (০–২ কিমি)। সাধারণ ডেলিভারি ফি: ৳${fee}।`,
    };
  }

  // Case 2: Regular Zone > 2 km to 3 km
  if (distanceKm <= 3.0) {
    const fee = isCakeOrder ? cakeRate0_3 : rate2_3;
    return {
      zone: 'regular_2_3',
      distanceKm,
      fee,
      isEligibleForFood: true,
      isEligibleForCake: true,
      advanceDaysRequired: isCakeOrder ? 2 : 0,
      messageEn: isCakeOrder
        ? `Regular delivery zone (2–3 km). Homemade cake delivery fee: ৳${fee}.`
        : `Regular delivery zone (2–3 km). Standard delivery fee: ৳${fee}.`,
      messageBn: isCakeOrder
        ? `রেগুলার ডেলিভারি জোন (২–৩ কিমি)। হোমমেড কেক ডেলিভারি ফি: ৳${fee}।`
        : `রেগুলার ডেলিভারি জোন (২–৩ কিমি)। সাধারণ ডেলিভারি ফি: ৳${fee}।`,
    };
  }

  // Case 3: Special Cake Zone > 3 km to 8 km
  if (distanceKm <= 8.0) {
    if (isCakeOrder && isOnlyCakes) {
      return {
        zone: 'special_cake_3_8',
        distanceKm,
        fee: cakeRate3_8,
        isEligibleForFood: false,
        isEligibleForCake: true,
        advanceDaysRequired: 2,
        messageEn: `Special Cake Zone (3–8 km). Advance booking required (2–3 days). Delivery fee: ৳${cakeRate3_8}.`,
        messageBn: `বিশেষ কেক জোন (৩–৮ কিমি)। অগ্রিম বুকিং আবশ্যক (২–৩ দিন)। ডেলিভারি ফি: ৳${cakeRate3_8}।`,
      };
    } else {
      return {
        zone: 'special_cake_3_8',
        distanceKm,
        fee: cakeRate3_8,
        isEligibleForFood: false,
        isEligibleForCake: true,
        advanceDaysRequired: 2,
        messageEn: "Regular food delivery is not available in 3–8 km zone. Only homemade cakes with advance booking are eligible.",
        messageBn: "৩–৮ কিমি দূরত্বের এলাকায় রেগুলার খাবার ডেলিভারি প্রযোজ্য নয়। শুধুমাত্র অগ্রিম বুকিংয়ে হোমমেড কেক ডেলিভারি সম্ভব।",
      };
    }
  }

  // Case 4: Out of delivery area (> 8 km)
  return {
    zone: 'out_of_zone',
    distanceKm,
    fee: 0,
    isEligibleForFood: false,
    isEligibleForCake: false,
    advanceDaysRequired: 0,
    messageEn: `Location is ${distanceKm} km away. Outside our active delivery coverage (maximum 8 km).`,
    messageBn: `লোকেশনটি ${distanceKm} কিমি দূরে। আমাদের বর্তমান ডেলিভারি কভারেজের বাইরে (সর্বোচ্চ ৮ কিমি)।`,
  };
}
