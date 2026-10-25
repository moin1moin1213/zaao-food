export type Language = 'bn' | 'en';

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  image: string;
  descriptionEn: string;
  descriptionBn: string;
  isCakeCategory?: boolean;
}

export interface Restaurant {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  image: string;
  banner: string;
  cuisinesEn: string[];
  cuisinesBn: string[];
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  openingHoursEn: string;
  openingHoursBn: string;
  minOrder: number;
  addressEn: string;
  addressBn: string;
  distanceKm: number;
  prepTimeMinutes: number;
}

export interface CakeSizeOption {
  id: string;
  labelEn: string;
  labelBn: string;
  price: number;
  weight: string;
}

export interface CakeFlavorOption {
  id: string;
  nameEn: string;
  nameBn: string;
}

export interface FoodItem {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  price: number;
  originalPrice?: number;
  image: string;
  categoryId: string;
  restaurantId: string;
  restaurantNameEn: string;
  restaurantNameBn: string;
  isAvailable: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isPopular?: boolean;
  isRecommended?: boolean;
  isCake?: boolean;
  prepTimeMinutes: number;
  // Cake-specific attributes
  cakeSizes?: CakeSizeOption[];
  cakeFlavors?: CakeFlavorOption[];
  bakerNameEn?: string;
  bakerNameBn?: string;
  minAdvanceDays?: number;
}

export interface CartItem {
  cartItemId: string; // unique item id in cart
  productId: string;
  nameEn: string;
  nameBn: string;
  price: number;
  image: string;
  quantity: number;
  restaurantId: string;
  restaurantNameEn: string;
  restaurantNameBn: string;
  isCake: boolean;
  selectedSize?: CakeSizeOption;
  selectedFlavor?: CakeFlavorOption;
  customMessage?: string;
  requestedDeliveryDate?: string;
  specialInstructions?: string;
}

export interface PromoBanner {
  id: string;
  badgeEn?: string;
  badgeBn?: string;
  titleEn: string;
  titleBn: string;
  subtitleEn: string;
  subtitleBn: string;
  link: string;
  buttonTextEn?: string;
  buttonTextBn?: string;
  secondaryLink?: string;
  secondaryTextEn?: string;
  secondaryTextBn?: string;
  imageUrl?: string;
  bgGradient?: string;
  isActive: boolean;
}

export interface DeliveryFeeRates {
  regular_0_2: number;
  regular_2_3: number;
  cake_0_3: number;
  cake_3_8: number;
}

export type DeliveryZoneType = 'regular_0_2' | 'regular_2_3' | 'special_cake_3_8' | 'out_of_zone';

export interface DeliveryFeeCalculation {
  zone: DeliveryZoneType;
  distanceKm: number;
  fee: number;
  isEligibleForFood: boolean;
  isEligibleForCake: boolean;
  advanceDaysRequired: number;
  messageEn: string;
  messageBn: string;
}

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'rider_picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export interface OrderCustomer {
  name: string;
  phone: string;
  address: string;
  area: string;
  instructions?: string;
  latitude?: number;
  longitude?: number;
}

export interface OrderPricing {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

export interface OrderRider {
  name: string;
  phone: string;
  vehicle: string;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  items: CartItem[];
  restaurantId: string;
  restaurantNameEn: string;
  restaurantNameBn: string;
  restaurantPhone?: string;
  customer: OrderCustomer;
  pricing: OrderPricing;
  paymentMethod: 'cod' | 'online';
  paymentStatus: 'pending' | 'paid';
  rider?: OrderRider;
  estimatedDeliveryMinutes?: number;
  cancellationReason?: string;
}

export interface NotificationItem {
  id: string;
  titleEn: string;
  titleBn: string;
  messageEn: string;
  messageBn: string;
  category: 'order' | 'promo' | 'system';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface UserAddress {
  id: string;
  labelEn: string;
  labelBn: string;
  address: string;
  area: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  addresses: UserAddress[];
  isLoggedIn: boolean;
}
