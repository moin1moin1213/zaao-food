"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { CartItem, FoodItem, CakeSizeOption, CakeFlavorOption } from "./types";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage/safeStorage";
import { calculateDeliveryFee, POPULAR_LOCATIONS, DeliveryLocationOption } from "@/lib/pricing/deliveryZoneService";

export interface RestaurantConflictInfo {
  pendingItem: CartItem;
  currentRestaurantNameEn: string;
  currentRestaurantNameBn: string;
  newRestaurantNameEn: string;
  newRestaurantNameBn: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  selectedLocation: DeliveryLocationOption;
  setSelectedLocation: (loc: DeliveryLocationOption) => void;
  addItem: (item: Omit<CartItem, "cartItemId">) => { success: boolean; conflict?: RestaurantConflictInfo };
  confirmReplaceCart: (newItem: CartItem) => void;
  cancelConflict: () => void;
  conflict: RestaurantConflictInfo | null;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  isOnlyCakes: boolean;
  hasCakes: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedLocation, setSelectedLocationState] = useState<DeliveryLocationOption>(POPULAR_LOCATIONS[0]);
  const [conflict, setConflict] = useState<RestaurantConflictInfo | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from safeLocalStorage on mount
  useEffect(() => {
    const savedItems = safeLocalStorageGet<CartItem[]>("cart_items", []);
    const savedLocation = safeLocalStorageGet<DeliveryLocationOption>("selected_location", POPULAR_LOCATIONS[0]);
    if (Array.isArray(savedItems)) {
      setItems(savedItems);
    }
    if (savedLocation && savedLocation.nameEn) {
      setSelectedLocationState(savedLocation);
    }
    setIsLoaded(true);
  }, []);

  // Save changes to safeLocalStorage
  useEffect(() => {
    if (isLoaded) {
      safeLocalStorageSet("cart_items", items);
    }
  }, [items, isLoaded]);

  const setSelectedLocation = (loc: DeliveryLocationOption) => {
    setSelectedLocationState(loc);
    safeLocalStorageSet("selected_location", loc);
  };

  const currentRestaurantId = items.length > 0 ? items[0].restaurantId : null;

  const isOnlyCakes = useMemo(() => {
    return items.length > 0 && items.every((i) => i.isCake);
  }, [items]);

  const hasCakes = useMemo(() => {
    return items.some((i) => i.isCake);
  }, [items]);

  const addItem = (newItemData: Omit<CartItem, "cartItemId">) => {
    const cartItemId = `${newItemData.productId}_${newItemData.selectedSize?.id || "std"}_${newItemData.selectedFlavor?.id || "std"}_${newItemData.requestedDeliveryDate || "none"}`;
    const fullItem: CartItem = { ...newItemData, cartItemId };

    // Check single-restaurant constraint
    if (items.length > 0 && currentRestaurantId && currentRestaurantId !== fullItem.restaurantId) {
      const conflictInfo: RestaurantConflictInfo = {
        pendingItem: fullItem,
        currentRestaurantNameEn: items[0].restaurantNameEn,
        currentRestaurantNameBn: items[0].restaurantNameBn,
        newRestaurantNameEn: fullItem.restaurantNameEn,
        newRestaurantNameBn: fullItem.restaurantNameBn,
      };
      setConflict(conflictInfo);
      return { success: false, conflict: conflictInfo };
    }

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + fullItem.quantity,
        };
        return next;
      }
      return [...prev, fullItem];
    });

    return { success: true };
  };

  const confirmReplaceCart = (newItem: CartItem) => {
    setItems([newItem]);
    setConflict(null);
  };

  const cancelConflict = () => {
    setConflict(null);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const deliveryCalculation = useMemo(() => {
    if (items.length === 0) {
      return { fee: 0 };
    }
    return calculateDeliveryFee(selectedLocation.distanceKm, hasCakes, isOnlyCakes);
  }, [items, selectedLocation, hasCakes, isOnlyCakes]);

  const deliveryFee = items.length === 0 ? 0 : deliveryCalculation.fee;
  const discount = 0;
  const total = items.length === 0 ? 0 : subtotal + deliveryFee - discount;

  const value: CartContextType = {
    items,
    itemCount,
    subtotal,
    deliveryFee,
    discount,
    total,
    selectedLocation,
    setSelectedLocation,
    addItem,
    confirmReplaceCart,
    cancelConflict,
    conflict,
    updateQuantity,
    removeItem,
    clearCart,
    isOnlyCakes,
    hasCakes,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
