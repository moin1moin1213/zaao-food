import { createClient } from "@supabase/supabase-js";

// Read Supabase configuration from environment variables (Expo & Web compatible)
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const isRiderSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  supabaseUrl !== "https://your-project.supabase.co" &&
  !supabaseUrl.includes("your-project")
);

// Fallback empty client that safely handles offline development mode
export const supabase = isRiderSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey)
  : (createClient("https://placeholder.supabase.co", "placeholder-key"));
