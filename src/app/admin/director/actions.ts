"use server";

import { revalidatePath } from "next/cache";
import { supabaseStaffServer, getStaffUser } from "../../../lib/supabase/staff-server";

export type DecisionResult = { ok: true } | { ok: false; error: string };

async function requireDirectorOrAdmin() {
  const staff = await getStaffUser();
  if (!staff || (staff.role !== "director" && staff.role !== "admin")) return null;
  return staff;
}

function mapDbError(message: string): string {
  if (message.includes("REMARK_REQUIRED")) return "REMARK_REQUIRED";
  if (message.includes("INVALID_TRANSITION")) return "INVALID_TRANSITION";
  if (message.includes("FINAL_STATUS")) return "FINAL_STATUS";
  if (message.includes("NOT_ALLOWED")) return "NOT_ALLOWED";
  return "SERVER_ERROR";
}

// Pending se decide karna, YA approved<->rejected reversal (remark ke saath)
export async function decide(
  id: string,
  status: "approved" | "rejected",
  remark: string
): Promise<DecisionResult> {
  const staff = await requireDirectorOrAdmin();
  if (!staff) return { ok: false, error: "NOT_ALLOWED" };

  const sb = await supabaseStaffServer();
  const { data, error } = await sb
    .from("appointments")
    .update({ status, director_remark: remark.trim() || null })
    .eq("id", id)
    .in("status", ["pending", "approved", "rejected"])
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: mapDbError(error.message) };
  if (!data) return { ok: false, error: "ALREADY_UPDATED" };

  revalidatePath("/admin/director");
  return { ok: true };
}

// Approved se seedha completed/no_show (in_meeting step nahi)
export async function markDone(
  id: string,
  status: "completed" | "no_show"
): Promise<DecisionResult> {
  const staff = await requireDirectorOrAdmin();
  if (!staff) return { ok: false, error: "NOT_ALLOWED" };

  const sb = await supabaseStaffServer();
  const { data, error } = await sb
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .eq("status", "approved")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: mapDbError(error.message) };
  if (!data) return { ok: false, error: "ALREADY_UPDATED" };

  revalidatePath("/admin/director");
  return { ok: true };
}