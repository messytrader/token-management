import { redirect } from "next/navigation";
import { getStaffUser } from "@/lib/supabase/staff-server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getT } from "@/i18n/server";
import { DirectorPanel } from "./DirectorPanel";

export const dynamic = "force-dynamic";

export default async function DirectorPage() {
  const staff = await getStaffUser();
  if (!staff) redirect("/admin/login");
  if (staff.role !== "director" && staff.role !== "admin") redirect("/admin/login");

  const today = new Date().toISOString().slice(0, 10);
  const { data: appointments } = await supabaseAdmin()
    .from("appointments")
    .select(
      "id, token_no, token_seq, visitor_name, mobile, department, reason, preferred_time, duration_min, is_urgent, is_vip, status, director_remark, priority_rank, created_at"
    )
    .eq("meeting_date", today)
    .not("status", "in", "(expired,cancelled,rescheduled)")
    .order("priority_rank", { ascending: true })
    .order("token_seq", { ascending: true });

  const { t } = await getT();

  const dict = {
    title: t("director.title"),
    todayQueue: t("director.todayQueue"),
    empty: t("director.empty"),
    urgent: t("director.urgent"),
    vip: t("director.vip"),
    approve: t("director.approve"),
    reject: t("director.reject"),
    markInMeeting: t("director.markInMeeting"),
    markCompleted: t("director.markCompleted"),
    markNoShow: t("director.markNoShow"),
    remarkPh: t("director.remarkPh"),
    remarkPhRequired: t("director.remarkPhRequired"),
    changeToReject: t("director.changeToReject"),
    reconsider: t("director.reconsider"),
    confirmChange: t("director.confirmChange"),
    cancelChange: t("director.cancelChange"),
    decidedToday: t("director.decidedToday"),
    showDecided: t("director.showDecided"),
    hideDecided: t("director.hideDecided"),
    mobile: t("director.mobile"),
    reason: t("director.reason"),
    duration: t("director.duration"),
    soundOn: t("director.soundOn"),
    soundOff: t("director.soundOff"),
    signOut: t("director.signOut"),
    statusUpdated: t("director.statusUpdated"),
    history: t("director.history"),
    statsTotal: t("director.statsTotal"),
    statsApproved: t("director.statsApproved"),
    statsRejected: t("director.statsRejected"),
    statsUrgent: t("director.statsUrgent"),
    error: t("director.error"),
    errREMARK_REQUIRED: t("director.err.REMARK_REQUIRED"),
    errINVALID_TRANSITION: t("director.err.INVALID_TRANSITION"),
    errFINAL_STATUS: t("director.err.FINAL_STATUS"),
    errALREADY_UPDATED: t("director.err.ALREADY_UPDATED"),
    errNOT_ALLOWED: t("director.err.NOT_ALLOWED"),
    errSERVER_ERROR: t("director.err.SERVER_ERROR"),
  };

  return (
    <DirectorPanel staffName={staff.full_name} initial={appointments ?? []} today={today} dict={dict} />
  );
}