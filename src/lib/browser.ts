"use client";
import { createClient } from "@supabase/supabase-js";

// Browser me sirf publishable key jaati hai, secret key kabhi nahi.
export function supabaseBrowser() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}