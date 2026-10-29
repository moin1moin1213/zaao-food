import { createClient } from "@supabase/supabase-js";

// Security Enforcement: Service role key MUST NEVER be exposed to or used by browser client
const isBrowser = typeof window !== "undefined";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = isBrowser ? undefined : process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseAdminConfigured = Boolean(
  !isBrowser &&
  supabaseUrl &&
  supabaseServiceKey &&
  supabaseUrl !== "https://your-project.supabase.co" &&
  !supabaseUrl.includes("your-project")
);

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
