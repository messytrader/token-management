"use client";
import { createBrowserClient } from "@supabase/ssr";

// Staff ke Supabase Auth session (cookies) ke saath connect karta hai.
// Isse Realtime authenticated ban ke RLS pass karta hai — anon client se
// appointments table ka realtime silently block ho jaata tha.
export function supabaseStaffBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}