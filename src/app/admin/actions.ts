"use server";

import { redirect } from "next/navigation";
import { supabaseStaffServer } from "@/lib/supabase/staff-server";
import { hitRateLimit, getClientIp } from "@/lib/rate-limit";

export type StaffAuthResult =
  | { ok: true; role: "director" | "admin" | "receptionist" }
  | { ok: false; code: "INVALID_CREDENTIALS" | "NOT_STAFF" | "TOO_MANY" | "SERVER_ERROR" };

export async function staffLogin(email: string, password: string): Promise<StaffAuthResult> {
  try {
    const ip = await getClientIp();
    if (!(await hitRateLimit(`stafflogin:ip:${ip}`, 20, 600))) {
      return { ok: false, code: "TOO_MANY" };
    }
    if (!(await hitRateLimit(`stafflogin:email:${email.toLowerCase()}`, 10, 600))) {
      return { ok: false, code: "TOO_MANY" };
    }

    const sb = await supabaseStaffServer();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { ok: false, code: "INVALID_CREDENTIALS" };

    const { data: staff } = await sb
      .from("staff")
      .select("role, active")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!staff || !staff.active) {
      await sb.auth.signOut();
      return { ok: false, code: "NOT_STAFF" };
    }

    return { ok: true, role: staff.role };
  } catch (e) {
    console.error("staffLogin error:", e);
    return { ok: false, code: "SERVER_ERROR" };
  }
}

export async function staffLogout() {
  const sb = await supabaseStaffServer();
  await sb.auth.signOut();
  redirect("/admin");
}