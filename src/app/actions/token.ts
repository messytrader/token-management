"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type TokenData = {
  id: string;
  token_no: string;
  visitor_name: string;
  department: string;
  meeting_date: string;
  preferred_time: string | null;
  duration_min: number;
  is_urgent: boolean;
  is_vip: boolean;
  status: string;
  director_remark: string | null;
  created_at: string;
};

export async function getTokenByKey(accessKey: string): Promise<TokenData | null> {
  const { data, error } = await supabaseAdmin()
    .from("appointments")
    .select(
      "id, token_no, visitor_name, department, meeting_date, preferred_time, duration_min, is_urgent, is_vip, status, director_remark, created_at"
    )
    .eq("access_key", accessKey)
    .maybeSingle();

  if (error || !data) return null;
  return data as TokenData;
}

export async function getQueuePosition(id: string): Promise<number | null> {
  const { data, error } = await supabaseAdmin().rpc("queue_position", { p_id: id });
  if (error) {
    console.error("queue position error:", error.message);
    return null;
  }
  return data as number;
}