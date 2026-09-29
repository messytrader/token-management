"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { supabaseStaffServer, getStaffUser } from "@/lib/supabase/staff-server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeMobile } from "@/lib/validation";

async function requireDeskStaff() {
  const staff = await getStaffUser();
  if (!staff || !["receptionist", "admin", "director"].includes(staff.role)) return null;
  return staff;
}

export type WalkinInput = {
  visitorName: string;
  mobile: string;
  address: string;
  department: string;
  reason: string;
  durationMin: number;
  isUrgent: boolean;
};

export async function createWalkin(input: WalkinInput) {
  const staff = await requireDeskStaff();
  if (!staff) return { ok: false as const, error: "NOT_ALLOWED" };

  const mobile = input.mobile ? normalizeMobile(input.mobile) : null;
  const today = new Date().toISOString().slice(0, 10);

  const sb = await supabaseStaffServer();
  const { data, error } = await sb
    .from("appointments")
    .insert({
      visitor_name: input.visitorName.trim(),
      mobile: mobile ?? "9999999999", // walk-in bina number: placeholder, schema requires format
      address: input.address.trim() || null,
      department: input.department,
      reason: input.reason.trim() || "Walk-in",
      meeting_date: today,
      duration_min: input.durationMin,
      is_urgent: input.isUrgent,
      source: "walkin",
      created_by: staff.id,
    })
    .select("token_no, access_key")
    .single();

  if (error || !data) return { ok: false as const, error: error?.message ?? "SERVER_ERROR" };
  revalidatePath("/admin/desk");
  return { ok: true as const, tokenNo: data.token_no, accessKey: data.access_key };
}

export async function generateResetCode(mobileRaw: string) {
  const staff = await requireDeskStaff();
  if (!staff) return { ok: false as const, error: "NOT_ALLOWED" };

  const mobile = normalizeMobile(mobileRaw);
  if (!mobile) return { ok: false as const, error: "INVALID_MOBILE" };

  const db = supabaseAdmin();
  const { data: user } = await db.from("app_users").select("id").eq("mobile", mobile).maybeSingle();
  if (!user) return { ok: false as const, error: "USER_NOT_FOUND" };

  // 6-digit readable code, 15 min valid
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const code_hash = await bcrypt.hash(code, 10);

  await db.from("otp_challenges").insert({
    mobile,
    purpose: "staff_reset",
    code_hash,
    expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
    created_by: staff.id,
  });

  return { ok: true as const, code };
}