import { createClient } from "@supabase/supabase-js";
import fs from "fs";

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"](.*)['"]$/, "$1");
      env[key] = val;
    }
  }
  return env;
}

const env = parseEnv(".env");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", url);
if (!url || !key) {
  console.log("Missing Supabase credentials in .env");
  process.exit(0);
}

const sb = createClient(url, key);

async function check() {
  const tables = ["categories", "restaurants", "products", "orders", "riders", "delivery_zones", "coupons", "app_settings"];
  for (const t of tables) {
    try {
      const { data, count, error } = await sb.from(t).select("*", { count: "exact" }).limit(5);
      if (error) {
        console.log(`Table [${t}]: ERROR ->`, error.message);
      } else {
        console.log(`Table [${t}]: OK (${count !== null ? count : data?.length} rows)`);
      }
    } catch (e) {
      console.log(`Table [${t}]: EXCEPTION ->`, e.message);
    }
  }
}

check();
