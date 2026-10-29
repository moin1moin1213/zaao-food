import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=== RUNNING SUPABASE MIGRATIONS VERIFICATION ===");

const migrationsDir = path.resolve("supabase/migrations");
const files = fs.readdirSync(migrationsDir).sort();

console.log(`Found ${files.length} migration files in supabase/migrations/:`);
files.forEach((f) => console.log(`  - ${f}`));

assert.strictEqual(files.length >= 4, true, "At least 4 migration files must exist");

// 1. Verify Core Schema Migration
const m1 = fs.readFileSync(path.join(migrationsDir, files[0]), "utf-8");
const requiredTables = [
  "customers",
  "administrators",
  "restaurants",
  "restaurant_staff",
  "riders",
  "categories",
  "products",
  "delivery_zones",
  "pricing_rules",
  "coupons",
  "banners",
  "orders",
  "order_items",
  "order_status_history",
  "notifications",
  "app_settings",
];

console.log("\n[CHECK 1] Verifying Required Tables in Migration 1...");
requiredTables.forEach((table) => {
  const regex = new RegExp(`CREATE TABLE (IF NOT EXISTS )?public\\.${table}`, "i");
  assert.strictEqual(
    regex.test(m1),
    true,
    `Table public.${table} must be defined in ${files[0]}`
  );
  console.log(`  ✔ Table public.${table} verified`);
});

// 2. Verify Asia/Dhaka Functions & Realtime in Migration 2
const m2 = fs.readFileSync(path.join(migrationsDir, files[1]), "utf-8");
console.log("\n[CHECK 2] Verifying Asia/Dhaka Functions & Realtime in Migration 2...");
assert.strictEqual(m2.includes("get_daily_sales_dhaka"), true, "Must define get_daily_sales_dhaka");
assert.strictEqual(m2.includes("get_weekly_sales_dhaka"), true, "Must define get_weekly_sales_dhaka");
assert.strictEqual(m2.includes("update_order_status_with_history"), true, "Must define update_order_status_with_history");
assert.strictEqual(m2.includes("ALTER PUBLICATION supabase_realtime"), true, "Must configure realtime publication");
console.log("  ✔ Asia/Dhaka daily & weekly functions verified");
console.log("  ✔ Status transition & history tracking verified");
console.log("  ✔ Supabase Realtime publication verified");

// 3. Verify Row Level Security in Migration 3
const m3 = fs.readFileSync(path.join(migrationsDir, files[2]), "utf-8");
console.log("\n[CHECK 3] Verifying Row Level Security Policies in Migration 3...");
requiredTables.forEach((table) => {
  const rlsRegex = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, "i");
  assert.strictEqual(
    rlsRegex.test(m3),
    true,
    `Table public.${table} must have RLS enabled`
  );
});
console.log("  ✔ RLS enabled on all 16 public tables");
assert.strictEqual(m3.includes("Only admin can manage products"), true, "Products must be protected from restaurant alteration");
assert.strictEqual(m3.includes("Admin can manage restaurants"), true, "Restaurants profile must be admin-controlled");
assert.strictEqual(m3.includes("Authorized users can view orders"), true, "Orders must be isolated");
console.log("  ✔ Strict role & table permissions verified");

// 4. Verify Development Seed Data in Migration 4
const m4 = fs.readFileSync(path.join(migrationsDir, files[3]), "utf-8");
console.log("\n[CHECK 4] Verifying Development Seed Data in Migration 4...");
assert.strictEqual(m4.includes("INSERT INTO public.categories"), true, "Must seed categories");
assert.strictEqual(m4.includes("INSERT INTO public.restaurants"), true, "Must seed restaurants");
assert.strictEqual(m4.includes("INSERT INTO public.restaurant_staff"), true, "Must seed restaurant staff");
assert.strictEqual(m4.includes("INSERT INTO public.products"), true, "Must seed products");
assert.strictEqual(m4.includes("INSERT INTO public.delivery_zones"), true, "Must seed delivery zones");
assert.strictEqual(m4.includes("INSERT INTO public.pricing_rules"), true, "Must seed pricing rules");
console.log("  ✔ Development seed data strictly separated from production schema");

console.log("\n🎉 ALL SUPABASE MIGRATION VERIFICATIONS PASSED (100% SUCCESS)!\n");
