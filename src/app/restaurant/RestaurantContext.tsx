"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Restaurant } from "@/services/types";
import { adminService } from "@/services/adminService";
import { restaurantService } from "@/services/restaurantService";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage/safeStorage";

interface RestaurantContextType {
  restaurants: Restaurant[];
  currentRestaurantId: string;
  currentRestaurant: Restaurant | null;
  setCurrentRestaurantId: (id: string) => void;
  toggleStoreOpen: () => Promise<void>;
  loading: boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurantId, setCurrentRestaurantIdState] = useState<string>("");
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const list = await adminService.getRestaurants();
        setRestaurants(list);

        const savedRestId = safeLocalStorageGet<string>("active_restaurant_id", "");
        const validId =
          savedRestId && list.some((r) => r.id === savedRestId)
            ? savedRestId
            : list[0]?.id || "rest-1";

        setCurrentRestaurantIdState(validId);
        safeLocalStorageSet("active_restaurant_id", validId);
        const found = list.find((r) => r.id === validId) || list[0] || null;
        setCurrentRestaurant(found);
      } catch (e) {
        console.error("RestaurantProvider init error:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const setCurrentRestaurantId = (id: string) => {
    setCurrentRestaurantIdState(id);
    safeLocalStorageSet("active_restaurant_id", id);
    const found = restaurants.find((r) => r.id === id) || null;
    setCurrentRestaurant(found);
  };

  const toggleStoreOpen = async () => {
    if (!currentRestaurant) return;
    const nextState = !currentRestaurant.isOpen;
    await restaurantService.toggleOpenStatus(currentRestaurant.id, nextState);
    setCurrentRestaurant({ ...currentRestaurant, isOpen: nextState });
    setRestaurants((prev) =>
      prev.map((r) => (r.id === currentRestaurant.id ? { ...r, isOpen: nextState } : r))
    );
  };

  return (
    <RestaurantContext.Provider
      value={{
        restaurants,
        currentRestaurantId,
        currentRestaurant,
        setCurrentRestaurantId,
        toggleStoreOpen,
        loading,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return ctx;
}
