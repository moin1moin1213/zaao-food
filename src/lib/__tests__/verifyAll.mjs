// Automated test verification script for Zaao Food Phase 1 Business Rules

import assert from "node:assert";

// 1. Numerals and currency formatting
const bengaliDigitMap = {
  "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
  "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯",
};

function toBengaliDigits(input) {
  return String(input).replace(/[0-9]/g, (digit) => bengaliDigitMap[digit] || digit);
}

function formatCurrency(amount, lang) {
  const rounded = Math.round(amount);
  return lang === "bn" ? `৳${toBengaliDigits(rounded)}` : `৳${rounded}`;
}

// 2. Delivery zone calculation rules (Mathbaria Bazar Center)
function calculateDeliveryFee(distanceKm, isCakeOrder, isOnlyCakes = isCakeOrder) {
  if (distanceKm <= 2.0) {
    return {
      zone: 'regular_0_2',
      fee: isCakeOrder ? 100 : 40,
      isEligibleForFood: true,
      isEligibleForCake: true,
      advanceDaysRequired: isCakeOrder ? 2 : 0,
    };
  }
  if (distanceKm <= 3.0) {
    return {
      zone: 'regular_2_3',
      fee: isCakeOrder ? 100 : 60,
      isEligibleForFood: true,
      isEligibleForCake: true,
      advanceDaysRequired: isCakeOrder ? 2 : 0,
    };
  }
  if (distanceKm <= 8.0) {
    if (isCakeOrder && isOnlyCakes) {
      return {
        zone: 'special_cake_3_8',
        fee: 150,
        isEligibleForFood: false,
        isEligibleForCake: true,
        advanceDaysRequired: 2,
      };
    } else {
      return {
        zone: 'special_cake_3_8',
        fee: 150,
        isEligibleForFood: false,
        isEligibleForCake: true,
        advanceDaysRequired: 2,
      };
    }
  }
  return {
    zone: 'out_of_zone',
    fee: 0,
    isEligibleForFood: false,
    isEligibleForCake: false,
    advanceDaysRequired: 0,
  };
}

// 3. Bangladeshi phone validation
const bdPhoneRegex = /^01[3-9]\d{8}$/;

console.log("=== RUNNING ZAAO FOOD VERIFICATION TESTS ===");

// TEST 1: Currency & Numerals
console.log("\n[TEST 1] Currency & Bengali Numeral Formatting...");
assert.strictEqual(formatCurrency(40, "bn"), "৳৪০");
assert.strictEqual(formatCurrency(40, "en"), "৳40");
assert.strictEqual(formatCurrency(150, "bn"), "৳১৫০");
assert.strictEqual(formatCurrency(150, "en"), "৳150");
assert.strictEqual(formatCurrency(1250, "bn"), "৳১২৫০");
assert.strictEqual(formatCurrency(1250, "en"), "৳1250");
console.log("✔ Currency and numeral tests passed.");

// TEST 2: Delivery Zones & Pricing
console.log("\n[TEST 2] Delivery Zones & Pricing Rules (Mathbaria Bazar Center)...");
// 0 - 2 km regular food: ৳40
const regularFood0_2 = calculateDeliveryFee(1.2, false, false);
assert.strictEqual(regularFood0_2.fee, 40);
assert.strictEqual(regularFood0_2.zone, "regular_0_2");
assert.strictEqual(regularFood0_2.isEligibleForFood, true);

// 2 - 3 km regular food: ৳60
const regularFood2_3 = calculateDeliveryFee(2.8, false, false);
assert.strictEqual(regularFood2_3.fee, 60);
assert.strictEqual(regularFood2_3.zone, "regular_2_3");
assert.strictEqual(regularFood2_3.isEligibleForFood, true);

// 0 - 3 km homemade cake: ৳100
const regularCake0_2 = calculateDeliveryFee(1.5, true, true);
assert.strictEqual(regularCake0_2.fee, 100);
const regularCake2_3 = calculateDeliveryFee(2.9, true, true);
assert.strictEqual(regularCake2_3.fee, 100);

// 3 - 8 km Special Cake Zone: ৳150, Cakes only, advance booking required
const specialCake = calculateDeliveryFee(5.0, true, true);
assert.strictEqual(specialCake.fee, 150);
assert.strictEqual(specialCake.zone, "special_cake_3_8");
assert.strictEqual(specialCake.isEligibleForCake, true);
assert.strictEqual(specialCake.isEligibleForFood, false);
assert.strictEqual(specialCake.advanceDaysRequired, 2);

// 3 - 8 km with regular food: food ineligible
const specialFood = calculateDeliveryFee(5.0, false, false);
assert.strictEqual(specialFood.isEligibleForFood, false);

// Beyond 8 km: Out of zone
const outOfZone = calculateDeliveryFee(10.5, true, true);
assert.strictEqual(outOfZone.zone, "out_of_zone");
assert.strictEqual(outOfZone.isEligibleForCake, false);
assert.strictEqual(outOfZone.isEligibleForFood, false);
console.log("✔ Delivery zones & pricing business rules passed.");

// TEST 3: Bangladeshi Phone Numbers
console.log("\n[TEST 3] Bangladeshi Phone Number Regex Validation...");
assert.strictEqual(bdPhoneRegex.test("01712345678"), true);
assert.strictEqual(bdPhoneRegex.test("01819998877"), true);
assert.strictEqual(bdPhoneRegex.test("01912345678"), true);
assert.strictEqual(bdPhoneRegex.test("01312345678"), true);
assert.strictEqual(bdPhoneRegex.test("01412345678"), true);
assert.strictEqual(bdPhoneRegex.test("01512345678"), true);
assert.strictEqual(bdPhoneRegex.test("01612345678"), true);
// Invalid cases:
assert.strictEqual(bdPhoneRegex.test("01212345678"), false); // 012 is invalid operator
assert.strictEqual(bdPhoneRegex.test("017123"), false);       // Too short
assert.strictEqual(bdPhoneRegex.test("017123456789"), false); // Too long
assert.strictEqual(bdPhoneRegex.test("1712345678"), false);   // Missing leading 0
console.log("✔ Phone number validation tests passed.");

// TEST 4: Single Restaurant Conflict Check Logic
console.log("\n[TEST 4] Single-Restaurant Order Constraint Check...");
function checkRestaurantConflict(existingItems, newItem) {
  if (existingItems.length === 0) return { conflict: false };
  const currentRestId = existingItems[0].restaurantId;
  if (currentRestId !== newItem.restaurantId) {
    return {
      conflict: true,
      currentRestName: existingItems[0].restaurantName,
      newRestName: newItem.restaurantName,
    };
  }
  return { conflict: false };
}

const existingCart = [{ restaurantId: "rest-1", restaurantName: "Kacchi Mahal" }];
const sameRestItem = { restaurantId: "rest-1", restaurantName: "Kacchi Mahal" };
const diffRestItem = { restaurantId: "rest-2", restaurantName: "Bismillah Hotel" };

assert.strictEqual(checkRestaurantConflict(existingCart, sameRestItem).conflict, false);
const conflictCheck = checkRestaurantConflict(existingCart, diffRestItem);
assert.strictEqual(conflictCheck.conflict, true);
assert.strictEqual(conflictCheck.currentRestName, "Kacchi Mahal");
assert.strictEqual(conflictCheck.newRestName, "Bismillah Hotel");
console.log("✔ Single-restaurant conflict logic passed.");

console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! (100% SUCCESS)\n");
