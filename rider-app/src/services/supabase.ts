import { createClient } from "@supabase/supabase-js";

// Shared Supabase Configuration for PenguFood Android Rider App
const SUPABASE_URL = "https://poucylcolmmxlkhvosjl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdWN5bGNvbG1teGxraHZvc2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwODI5MTQsImV4cCI6MjEwNzY1ODkxNH0.4Zlal9qMnqyJtGStkep2k9U5QXU2JJ8fnXwbrZbJoHQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
