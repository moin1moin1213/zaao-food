import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { riderService, RiderOrder } from "./src/services/riderService";
import { supabase } from "./src/services/supabase";

// Mock Active Rider Profile (Mathbaria Fleet)
const INITIAL_RIDER = {
  id: "rdr_1",
  name: "Tariqul Islam",
  phone: "01711223344",
  vehicle: "Honda 125 (Barishal-Ha-1234)",
};

export default function App() {
  const [rider, setRider] = useState(INITIAL_RIDER);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<"delivery" | "earnings" | "profile">("delivery");
  const [activeOrder, setActiveOrder] = useState<RiderOrder | null>(null);
  const [availableRequests, setAvailableRequests] = useState<RiderOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"bn" | "en">("bn");

  // Earnings state
  const [earnings, setEarnings] = useState({
    totalEarnings: 1470,
    completedCount: 42,
    deliveries: [] as RiderOrder[],
  });

  // Load orders from Supabase
  async function loadData() {
    setLoading(true);
    try {
      const { available, active } = await riderService.getDeliveryRequests(rider.id);
      setAvailableRequests(available);
      setActiveOrder(active);

      const earningsData = await riderService.getEarnings(rider.id);
      setEarnings(earningsData);
    } catch (e) {
      console.warn("Failed to load rider data:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    // Supabase Realtime synchronization on orders table
    const channel = supabase
      .channel("rider_app_realtime_orders")
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
      supabase.removeChannel(channel);
    };
  }, [rider.id]);

  // Online / Offline Switch
  const toggleOnlineSwitch = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    await riderService.setOnlineStatus(rider.id, nextState);
  };

  // Accept Delivery Request
  const handleAcceptOrder = async (order: RiderOrder) => {
    Alert.alert(
      lang === "bn" ? "ডেলিভারি গ্রহণ করবেন?" : "Accept Delivery?",
      `${order.restaurantNameBn || order.restaurantNameEn} -> ${order.customerAddress}`,
      [
        { text: lang === "bn" ? "না" : "Cancel", style: "cancel" },
        {
          text: lang === "bn" ? "হ্যাঁ, গ্রহণ করুন" : "Yes, Accept",
          onPress: async () => {
            await riderService.acceptOrder(order.id, rider);
            loadData();
          },
        },
      ]
    );
  };

  // Step 1 -> Step 2: Arrived at Restaurant
  const handleArrivedAtRestaurant = () => {
    Alert.alert(
      lang === "bn" ? "রেস্তোরাঁয় পৌঁছেছেন?" : "Arrived at Restaurant?",
      lang === "bn" ? "রান্নাঘর থেকে খাবার সংগ্রহ করুন।" : "Please pick up the food parcel.",
      [{ text: "OK" }]
    );
  };

  // Step 2 -> Step 3: Picked Up
  const handleConfirmPickedUp = async (orderId: string) => {
    await riderService.updateTripStatus(orderId, rider.id, "rider_picked_up");
    // Simulate initial GPS coordinates update
    await riderService.updateLocation(rider.id, 22.2858, 89.9614);
    loadData();
  };

  // Step 3 -> Step 4: On the way
  const handleStartDelivery = async (orderId: string) => {
    await riderService.updateTripStatus(orderId, rider.id, "on_the_way");
    // Simulate rider moving closer to customer
    await riderService.updateLocation(rider.id, 22.2875, 89.9630);
    loadData();
  };

  // Step 4 -> Complete: Delivered & Collect Cash
  const handleConfirmDelivered = async (order: RiderOrder) => {
    Alert.alert(
      lang === "bn" ? "ডেলিভারি সম্পন্ন ও ক্যাশ গ্রহণ" : "Confirm Delivery & Collect Cash",
      lang === "bn"
        ? `গ্রাহকের কাছ থেকে মোট ৳${order.total} ক্যাশ গ্রহণ করুন।`
        : `Collect ৳${order.total} Cash on Delivery from customer.`,
      [
        { text: lang === "bn" ? "ফিরে যান" : "Cancel", style: "cancel" },
        {
          text: lang === "bn" ? "ক্যাশ পেয়েছি ও সম্পন্ন" : "Cash Received & Done",
          onPress: async () => {
            await riderService.updateTripStatus(order.id, rider.id, "delivered", order.riderFee);
            loadData();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.mascotBadge}>
            <Text style={styles.mascotEmoji}>🐧</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>PenguFood Rider</Text>
            <Text style={styles.headerSubtitle}>
              {rider.name} • {rider.vehicle.split(" ")[0]}
            </Text>
          </View>
        </View>

        {/* Online / Offline Switch */}
        <View style={styles.onlineContainer}>
          <Text style={[styles.onlineLabel, isOnline ? styles.textOnline : styles.textOffline]}>
            {isOnline ? (lang === "bn" ? "অনলাইন" : "ONLINE") : (lang === "bn" ? "অফলাইন" : "OFFLINE")}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineSwitch}
            trackColor={{ false: "#4B5563", true: "#10B981" }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Navigation Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "delivery" && styles.tabButtonActive]}
          onPress={() => setActiveTab("delivery")}
        >
          <Text style={[styles.tabText, activeTab === "delivery" && styles.tabTextActive]}>
            {lang === "bn" ? "ডেলিভারি ট্রিপ" : "Delivery"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "earnings" && styles.tabButtonActive]}
          onPress={() => setActiveTab("earnings")}
        >
          <Text style={[styles.tabText, activeTab === "earnings" && styles.tabTextActive]}>
            {lang === "bn" ? "উপার্জন (টাকা)" : "Earnings"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "profile" && styles.tabButtonActive]}
          onPress={() => setActiveTab("profile")}
        >
          <Text style={[styles.tabText, activeTab === "profile" && styles.tabTextActive]}>
            {lang === "bn" ? "প্রোফাইল" : "Profile"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* TAB 1: DELIVERY */}
        {activeTab === "delivery" && (
          <View>
            {!isOnline ? (
              <View style={styles.offlineBox}>
                <Text style={styles.offlineIcon}>💤</Text>
                <Text style={styles.offlineTitle}>
                  {lang === "bn" ? "আপনি বর্তমানে অফলাইনে আছেন" : "You are currently Offline"}
                </Text>
                <Text style={styles.offlineSubtitle}>
                  {lang === "bn"
                    ? "মঠবাড়িয়া পৌর এলাকা ও সংলগ্ন অঞ্চল থেকে অর্ডারের রিকোয়েস্ট পেতে অনলাইন সুইচ অন করুন।"
                    : "Switch to Online above to receive active customer orders in Mathbaria."}
                </Text>
                <TouchableOpacity style={styles.goOnlineBtn} onPress={toggleOnlineSwitch}>
                  <Text style={styles.goOnlineBtnText}>
                    {lang === "bn" ? "অনলাইন শুরু করুন" : "Go Online Now"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : activeOrder ? (
              /* ACTIVE TRIP WORKFLOW */
              <View style={styles.card}>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>
                    {lang === "bn" ? "চলমান ডেলিভারি" : "ACTIVE TRIP IN PROGRESS"}
                  </Text>
                </View>

                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>Order #{activeOrder.id}</Text>
                  <Text style={styles.orderFee}>+৳{activeOrder.riderFee} আয়</Text>
                </View>

                {/* Step 1: Restaurant Pickup */}
                <View style={styles.tripSection}>
                  <Text style={styles.sectionHeading}>
                    📍 {lang === "bn" ? "খাবার পিকআপ রেস্তোরাঁ:" : "Pickup Restaurant:"}
                  </Text>
                  <Text style={styles.restaurantName}>
                    {lang === "bn" ? activeOrder.restaurantNameBn : activeOrder.restaurantNameEn}
                  </Text>
                  <Text style={styles.addressText}>মঠবাড়িয়া বাজার কেন্দ্র</Text>
                  {activeOrder.restaurantPhone && (
                    <Text style={styles.phoneText}>📞 {activeOrder.restaurantPhone}</Text>
                  )}
                </View>

                {/* Items Checklist */}
                <View style={styles.itemsBox}>
                  <Text style={styles.itemsTitle}>
                    📦 {lang === "bn" ? "খাবারের তালিকা:" : "Items to Handover:"}
                  </Text>
                  {activeOrder.items.map((it, idx) => (
                    <Text key={idx} style={styles.itemRow}>
                      • {it.quantity}x {it.nameBn || it.nameEn}
                    </Text>
                  ))}
                </View>

                {/* Step 2: Customer Destination */}
                <View style={styles.tripSection}>
                  <Text style={styles.sectionHeading}>
                    🏠 {lang === "bn" ? "গ্রাহকের ডেলিভারি ঠিকানা:" : "Customer Destination:"}
                  </Text>
                  <Text style={styles.customerName}>{activeOrder.customerName}</Text>
                  <Text style={styles.addressText}>{activeOrder.customerAddress}</Text>
                  <Text style={styles.phoneText}>📞 {activeOrder.customerPhone}</Text>
                  <Text style={styles.cashCollectNotice}>
                    💰 {lang === "bn" ? `ক্যাশ সংগ্রহ করতে হবে: ৳${activeOrder.total}` : `Collect COD: ৳${activeOrder.total}`}
                  </Text>
                </View>

                {/* Action Stage Buttons */}
                <View style={styles.actionsBox}>
                  {activeOrder.status === "ready_for_pickup" && (
                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() => handleConfirmPickedUp(activeOrder.id)}
                    >
                      <Text style={styles.actionBtnText}>
                        {lang === "bn" ? "খাবার সংগ্রহ করেছি (Picked Up)" : "Confirm Order Picked Up"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {activeOrder.status === "rider_picked_up" && (
                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() => handleStartDelivery(activeOrder.id)}
                    >
                      <Text style={styles.actionBtnText}>
                        {lang === "bn" ? "গ্রাহকের উদ্দেশ্যে রওনা হলাম (On the Way)" : "Start Trip to Customer"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {activeOrder.status === "on_the_way" && (
                    <TouchableOpacity
                      style={styles.actionBtnSuccess}
                      onPress={() => handleConfirmDelivered(activeOrder)}
                    >
                      <Text style={styles.actionBtnText}>
                        {lang === "bn"
                          ? `ডেলিভারি সম্পন্ন ও ৳${activeOrder.total} ক্যাশ গ্রহণ`
                          : `Delivered & Collected ৳${activeOrder.total}`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              /* AVAILABLE BROADCAST REQUESTS */
              <View>
                <Text style={styles.sectionTitle}>
                  {lang === "bn" ? "নতুন ডেলিভারি রিকোয়েস্ট" : "Available Delivery Requests"}
                </Text>

                {availableRequests.length === 0 ? (
                  <View style={styles.emptyRequests}>
                    <Text style={styles.emptyIcon}>⏳</Text>
                    <Text style={styles.emptyTitle}>
                      {lang === "bn" ? "বর্তমানে নতুন রিকোয়েস্ট নেই" : "No new orders right now"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {lang === "bn"
                        ? "নতুন কোনো গ্রাহক অর্ডার দেওয়ার সাথে সাথেই এখানে রিকোয়েস্ট চলে আসবে।"
                        : "Orders will appear here in real-time as customers place them."}
                    </Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
                      <Text style={styles.refreshBtnText}>
                        {lang === "bn" ? "রিফ্রেশ করুন" : "Refresh"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  availableRequests.map((req) => (
                    <View key={req.id} style={styles.requestCard}>
                      <View style={styles.requestHeader}>
                        <Text style={styles.requestRestName}>
                          {lang === "bn" ? req.restaurantNameBn : req.restaurantNameEn}
                        </Text>
                        <Text style={styles.requestFee}>+৳{req.riderFee}</Text>
                      </View>

                      <Text style={styles.requestDropoff}>
                        📍 {lang === "bn" ? "গন্তব্য:" : "Dropoff:"} {req.customerAddress}
                      </Text>
                      <Text style={styles.requestItems}>
                        📦 {req.items.length} {lang === "bn" ? "টি আইটেম" : "items"} • ৳{req.total} COD
                      </Text>

                      <View style={styles.requestButtons}>
                        <TouchableOpacity
                          style={styles.acceptBtn}
                          onPress={() => handleAcceptOrder(req)}
                        >
                          <Text style={styles.acceptBtnText}>
                            {lang === "bn" ? "গ্রহণ করুন" : "Accept Delivery"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {/* TAB 2: EARNINGS */}
        {activeTab === "earnings" && (
          <View>
            <View style={styles.earningsCard}>
              <Text style={styles.earningsLabel}>
                {lang === "bn" ? "আজকের মোট উপার্জন" : "Today's Total Earnings"}
              </Text>
              <Text style={styles.earningsAmount}>৳{earnings.totalEarnings}</Text>
              <Text style={styles.earningsSub}>
                {lang === "bn"
                  ? `${earnings.completedCount} টি ডেলিভারি সম্পন্ন হয়েছে`
                  : `${earnings.completedCount} Deliveries completed`}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              {lang === "bn" ? "সম্পন্ন ডেলিভারি বিবরণ" : "Recent Delivery History"}
            </Text>

            {earnings.deliveries.length === 0 ? (
              <Text style={styles.emptyHistoryText}>
                {lang === "bn" ? "আজ এখনও কোনো ডেলিভারি রেকর্ড নেই।" : "No deliveries recorded yet."}
              </Text>
            ) : (
              earnings.deliveries.map((del) => (
                <View key={del.id} style={styles.historyRow}>
                  <View>
                    <Text style={styles.historyRest}>
                      {del.restaurantNameBn || del.restaurantNameEn}
                    </Text>
                    <Text style={styles.historyAddress}>{del.customerAddress}</Text>
                  </View>
                  <Text style={styles.historyFee}>+৳{del.riderFee}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 3: PROFILE */}
        {activeTab === "profile" && (
          <View style={styles.card}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarLetter}>{rider.name.slice(0, 1)}</Text>
              </View>
              <View>
                <Text style={styles.profileName}>{rider.name}</Text>
                <Text style={styles.profilePhone}>{rider.phone}</Text>
              </View>
            </View>

            <View style={styles.profileDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vehicle:</Text>
                <Text style={styles.detailValue}>{rider.vehicle}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>City Zone:</Text>
                <Text style={styles.detailValue}>Mathbaria, Pirojpur</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Emergency Support:</Text>
                <Text style={styles.detailValue}>01700-000000</Text>
              </View>
            </View>

            {/* Registered Rider Switcher for Mathbaria */}
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionHeading, { marginBottom: 8 }]}>
                {lang === "bn" ? "রাইডার একাউন্ট নির্বাচন করুন (সুইচ):" : "Switch Rider Account:"}
              </Text>
              {[
                { id: "rdr_1", name: "Tariqul Islam", phone: "01711223344", vehicle: "Honda 125 (Barishal-Ha-1234)" },
                { id: "rdr_2", name: "Shafiqur Rahman", phone: "01819876543", vehicle: "Discover 110 (Barishal-Ha-5678)" },
                { id: "rdr_3", name: "Mehedi Hasan", phone: "01912340987", vehicle: "Runner Bike" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: rider.id === item.id ? "#FF6B1A" : "#E5E7EB",
                    backgroundColor: rider.id === item.id ? "#FFF7ED" : "#FFFFFF",
                    marginBottom: 6,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onPress={() => {
                    setRider(item);
                  }}
                >
                  <View>
                    <Text style={{ fontWeight: "800", fontSize: 13, color: "#111827" }}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: "#6B7280" }}>{item.phone} • {item.vehicle.split(" ")[0]}</Text>
                  </View>
                  {rider.id === item.id && (
                    <Text style={{ color: "#FF6B1A", fontWeight: "900", fontSize: 11 }}>Active</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Language Switch */}
            <TouchableOpacity
              style={[styles.langToggleBtn, { marginTop: 14 }]}
              onPress={() => setLang(lang === "bn" ? "en" : "bn")}
            >
              <Text style={styles.langToggleText}>
                Language: {lang === "bn" ? "বাংলা (Switch to English)" : "English (Switch to বাংলা)"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
  },
  mascotBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF6B1A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  mascotEmoji: {
    fontSize: 22,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "500",
  },
  onlineContainer: {
    alignItems: "flex-end",
  },
  onlineLabel: {
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 2,
  },
  textOnline: {
    color: "#10B981",
  },
  textOffline: {
    color: "#9CA3AF",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: "#FF6B1A",
  },
  tabText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  offlineBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  offlineIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  offlineTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 6,
  },
  offlineSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  goOnlineBtn: {
    backgroundColor: "#10B981",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
  },
  goOnlineBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  activeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  activeBadgeText: {
    color: "#92400E",
    fontSize: 10,
    fontWeight: "900",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 10,
    marginBottom: 14,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  orderFee: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FF6B1A",
  },
  tripSection: {
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  customerName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  addressText: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "600",
    marginTop: 3,
  },
  cashCollectNotice: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "800",
    marginTop: 6,
  },
  itemsBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  itemsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4B5563",
    marginBottom: 4,
  },
  itemRow: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
    marginVertical: 1,
  },
  actionsBox: {
    marginTop: 8,
  },
  actionBtnPrimary: {
    backgroundColor: "#FF6B1A",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  actionBtnSuccess: {
    backgroundColor: "#059669",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 12,
  },
  emptyRequests: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  emptySubtitle: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  refreshBtn: {
    marginTop: 14,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
  },
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  requestRestName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  requestFee: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FF6B1A",
  },
  requestDropoff: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 2,
  },
  requestItems: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 12,
  },
  requestButtons: {
    flexDirection: "row",
    gap: 8,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#FF6B1A",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  acceptBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  earningsCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  earningsLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  earningsAmount: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
    marginVertical: 6,
  },
  earningsSub: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyHistoryText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 20,
  },
  historyRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  historyRest: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  historyAddress: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  historyFee: {
    fontSize: 14,
    fontWeight: "900",
    color: "#059669",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 14,
    marginBottom: 14,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF6B1A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  profilePhone: {
    fontSize: 12,
    color: "#6B7280",
  },
  profileDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  langToggleBtn: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
});
