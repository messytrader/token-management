import "server-only";
import { headers } from "next/headers";
import { supabaseAdmin } from "./supabase/admin";

// true = allowed, false = limit cross ho gayi
export async function hitRateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  const { data, error } = await supabaseAdmin().rpc("hit_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("rate limit error:", error.message);
    return true; // database ki dikkat me user ko rokna nahi
  }
  return data === true;
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}