import assert from "node:assert";
import crypto from "node:crypto";

console.log("=== RUNNING PENGUFOOD RESTAURANT SECURITY & PERMISSION TESTS ===");

// 1. PBKDF2 SHA-512 Password Hashing & Verification
console.log("\n[TEST 1] PBKDF2 SHA-512 Hashing & Verification...");
function hashPassword(plainText) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(plainText.trim(), salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(plainText, storedHash) {
  if (!plainText || !storedHash) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const computedHash = crypto.pbkdf2Sync(plainText.trim(), salt, 10000, 64, "sha512").toString("hex");
  const computedBuf = Buffer.from(computedHash, "hex");
  const storedBuf = Buffer.from(hash, "hex");
  if (computedBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(computedBuf, storedBuf);
}

const testPlain = "kacchi123";
const hashed = hashPassword(testPlain);
assert.notStrictEqual(hashed, testPlain);
assert.strictEqual(hashed.includes(":"), true);
assert.strictEqual(verifyPassword(testPlain, hashed), true);
assert.strictEqual(verifyPassword("wrongPassword", hashed), false);
assert.strictEqual(verifyPassword("", hashed), false);
console.log("✔ Zero-plaintext cryptographic hashing passed.");

// 2. Strict State Transition Enforcement
console.log("\n[TEST 2] Backend Kitchen Status Transition Restrictions...");
const PERMITTED_RESTAURANT_TRANSITIONS = {
  placed: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "cancelled"],
};

function canRestaurantTransition(currentStatus, targetStatus) {
  const allowed = PERMITTED_RESTAURANT_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

// Permitted transitions
assert.strictEqual(canRestaurantTransition("placed", "accepted"), true);
assert.strictEqual(canRestaurantTransition("placed", "cancelled"), true);
assert.strictEqual(canRestaurantTransition("accepted", "preparing"), true);
assert.strictEqual(canRestaurantTransition("preparing", "ready_for_pickup"), true);

// Forbidden transitions (Restaurant cannot mark delivered or alter rider states)
assert.strictEqual(canRestaurantTransition("placed", "delivered"), false);
assert.strictEqual(canRestaurantTransition("accepted", "delivered"), false);
assert.strictEqual(canRestaurantTransition("preparing", "delivered"), false);
assert.strictEqual(canRestaurantTransition("ready_for_pickup", "delivered"), false);
assert.strictEqual(canRestaurantTransition("ready_for_pickup", "rider_picked_up"), false);
console.log("✔ Backend kitchen transition permissions strictly enforced.");

// 3. Asia/Dhaka Timezone & Saturday Week Start
console.log("\n[TEST 3] Asia/Dhaka Timezone & Saturday-Starting Week Calculation...");
function formatDhakaDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getDhakaDayOfWeek(date) {
  const dayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
  }).format(date);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[dayStr];
}

const testDate = new Date("2026-10-29T01:30:00Z"); // 01:30 UTC = 07:30 Asia/Dhaka (same day)
assert.strictEqual(formatDhakaDate(testDate), "2026-10-29");

// Check Saturday-start calculation
const dhakaDay = getDhakaDayOfWeek(testDate);
const daysSinceSat = (dhakaDay + 1) % 7;
const satDate = new Date(testDate);
satDate.setDate(testDate.getDate() - daysSinceSat);
assert.strictEqual(getDhakaDayOfWeek(satDate), 6); // 6 is Saturday
console.log("✔ Asia/Dhaka Saturday-start business week verified.");

// 4. Accounting Distinction (Cancelled Excluded from Sales)
console.log("\n[TEST 4] Accounting: Cancelled Orders Excluded from Gross Sales & Payouts...");
const sampleOrders = [
  { id: "o1", status: "delivered", pricing: { subtotal: 300 } },
  { id: "o2", status: "delivered", pricing: { subtotal: 200 } },
  { id: "o3", status: "cancelled", pricing: { subtotal: 450 } }, // Must NOT count
];

const commissionRate = 15;
const deliveredOnly = sampleOrders.filter((o) => o.status === "delivered");
const grossSales = deliveredOnly.reduce((s, o) => s + o.pricing.subtotal, 0);
const commission = Math.round(grossSales * (commissionRate / 100));
const netPayout = grossSales - commission;

const cancelledOnly = sampleOrders.filter((o) => o.status === "cancelled");
const lostSales = cancelledOnly.reduce((s, o) => s + o.pricing.subtotal, 0);

assert.strictEqual(grossSales, 500); // 300 + 200 (excludes 450 cancelled)
assert.strictEqual(commission, 75);  // 15% of 500
assert.strictEqual(netPayout, 425);   // 500 - 75
assert.strictEqual(lostSales, 450);   // Distinctly reported as lost sales
console.log("✔ Accounting separation of cancelled orders verified.");

console.log("\n🎉 ALL RESTAURANT SECURITY & PERMISSION TESTS PASSED!\n");
