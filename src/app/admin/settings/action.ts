"use server";

import { revalidatePath } from "next/cache";
import { supabaseStaffServer, getStaffUser } from "@/lib/supabase/staff-server";

async function requireAdmin() {
  const staff = await getStaffUser();
  if (!staff || staff.role !== "admin") return null;
  return staff;
}

export async function findByToken(tokenNo: string) {
  const staff = await getStaffUser();
  if (!staff) return { ok: false as const };
  const sb = await supabaseStaffServer();
  const { data } = await sb
    .from("appointments")
    .select("id, token_no, visitor_name, is_vip")
    .eq("token_no", tokenNo.trim().toUpperCase())
    .maybeSingle();
  return data ? { ok: true as const, appt: data } : { ok: false as const };
}

export async function toggleVip(id: string, isVip: boolean) {
  const staff = await requireAdmin();
  if (!staff) return { ok: false as const };
  const sb = await supabaseStaffServer();
  const { error } = await sb.from("appointments").update({ is_vip: isVip }).eq("id", id);
  if (error) return { ok: false as const };
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function addLeave(from: string, to: string, reason: string) {
  const staff = await requireAdmin();
  if (!staff) return { ok: false as const };
  const sb = await supabaseStaffServer();
  const { error } = await sb.from("director_leaves").insert({ from_date: from, to_date: to, reason: reason || null });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function removeLeave(id: string) {
  const staff = await requireAdmin();
  if (!staff) return { ok: false as const };
  const sb = await supabaseStaffServer();
  await sb.from("director_leaves").delete().eq("id", id);
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function closeToday() {
  const staff = await requireAdmin();
  if (!staff) return { ok: false as const };
  const today = new Date().toISOString().slice(0, 10);
  const sb = await supabaseStaffServer();
  const { error } = await sb.from("director_leaves").insert({
    from_date: today, to_date: today, reason: "Closed for today",
  });
  if (error) return { ok: false as const };
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function addHoliday(date: string, nameEn: string, nameHi: string) {
  const staff = await requireAdmin();
  if (!staff) return { ok: false as const };
  const sb = await supabaseStaffServer();
  const { error } = await sb.from("holidays").insert({
    holiday_date: date, name_en: nameEn, name_hi: nameHi || null,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function removeHoliday(date: string) {
  const staff = await requireAdmin();
  if (!staff) return { ok: false as const };
  const sb = await supabaseStaffServer();
  await sb.from("holidays").delete().eq("holiday_date", date);
  revalidatePath("/admin/settings");
  return { ok: true as const };
}