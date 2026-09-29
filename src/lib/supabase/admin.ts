import "server-only";
import { createClient } from "@supabase/supabase-js";

// Sirf server par chalta hai. Secret key browser tak kabhi nahi jaati.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}