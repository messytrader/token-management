"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";
import { hitRateLimit, getClientIp } from "@/lib/rate-limit";
import { DEPARTMENTS, type DepartmentValue } from "../../lib/department";

export type DayAvailability = {
  date: string;
  available: boolean;
  reason: "OK" | "PAST" | "TOO_FAR" | "WEEKLY_OFF" | "HOLIDAY" | "DIRECTOR_LEAVE" | "DAY_FULL";
  holiday_name_en: string | null;
  holiday_name_hi: string | null;
  remaining: number;
};

export async function checkAvailability(date: string): Promise<DayAvailability | null> {
  const { data, error } = await supabaseAdmin().rpc("get_day_availability", { d: date });
  if (error) {
    console.error("availability error:", error.message);
    return null;
  }
  return data as DayAvailability;
}

export type NewRequestInput = {
  address: string;
  department: DepartmentValue;
  reason: string;
  meetingDate: string;
  preferredTime: string;
  durationMin: number;
  isUrgent: boolean;
  urgentNote: string;
};

export type NewRequestResult =
  | { ok: true; tokenNo: string; accessKey: string }
  | { ok: false; code: "NOT_AVAILABLE" | "DAY_FULL" | "MOBILE_LIMIT" | "TOO_MANY" | "SERVER_ERROR" | "UNAUTHORIZED" };

export async function submitRequest(input: NewRequestInput): Promise<NewRequestResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, code: "UNAUTHORIZED" };

  const ip = await getClientIp();
  if (!(await hitRateLimit(`newreq:user:${user.id}`, 10, 3600))) {
    return { ok: false, code: "TOO_MANY" };
  }
  if (!(await hitRateLimit(`newreq:ip:${ip}`, 20, 3600))) {
    return { ok: false, code: "TOO_MANY" };
  }

  const dept = DEPARTMENTS.find((d) => d.value === input.department);
  if (!dept) return { ok: false, code: "SERVER_ERROR" };

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("appointments")
    .insert({
      user_id: user.id,
      visitor_name: user.name,
      mobile: user.mobile,
      address: input.address.trim(),
      department: dept.value,
      reason: input.reason.trim(),
      meeting_date: input.meetingDate,
      preferred_time: input.preferredTime || null,
      duration_min: input.durationMin,
      is_urgent: input.isUrgent,
      urgent_note: input.isUrgent ? input.urgentNote.trim() : null,
      source: "online",
    })
    .select("token_no, access_key")
    .single();

  if (error || !data) {
    const msg = error?.message ?? "";
    if (msg.includes("DAY_FULL")) return { ok: false, code: "DAY_FULL" };
    if (msg.includes("MOBILE_LIMIT")) return { ok: false, code: "MOBILE_LIMIT" };
    if (
      msg.includes("WEEKLY_OFF") ||
      msg.includes("HOLIDAY") ||
      msg.includes("DIRECTOR_LEAVE") ||
      msg.includes("DATE_PAST") ||
      msg.includes("DATE_TOO_FAR")
    ) {
      return { ok: false, code: "NOT_AVAILABLE" };
    }
    console.error("submitRequest error:", msg);
    return { ok: false, code: "SERVER_ERROR" };
  }

  return { ok: true, tokenNo: data.token_no, accessKey: data.access_key };
}