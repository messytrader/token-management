import { redirect } from "next/navigation";
import { getStaffUser, supabaseStaffServer } from "@/lib/supabase/staff-server";
import { getT } from "@/i18n/server";
import { SettingsPanel } from "./SettingsPanel";

export default async function SettingsPage() {
  const staff = await getStaffUser();
  if (!staff) redirect("/admin/login");
  if (staff.role !== "admin") redirect("/admin/login");

  const sb = await supabaseStaffServer();
  const { data: leaves } = await sb.from("director_leaves").select("*").order("from_date", { ascending: false });
  const { data: holidays } = await sb.from("holidays").select("*").order("holiday_date", { ascending: false });

  const { t } = await getT();
  return (
    <SettingsPanel
      staffName={staff.full_name}
      initialLeaves={leaves ?? []}
      initialHolidays={holidays ?? []}
      dict={{
        title: t("settings.title"), vipTab: t("settings.vipTab"), leaveTab: t("settings.leaveTab"),
        holidayTab: t("settings.holidayTab"), vipSearch: t("settings.vipSearch"),
        vipSearchBtn: t("settings.vipSearchBtn"), vipSet: t("settings.vipSet"), vipUnset: t("settings.vipUnset"),
        notFound: t("settings.notFound"), leaveFrom: t("settings.leaveFrom"), leaveTo: t("settings.leaveTo"),
        leaveReason: t("settings.leaveReason"), addLeave: t("settings.addLeave"), closeToday: t("settings.closeToday"),
        closeTodayConfirm: t("settings.closeTodayConfirm"), removeLeave: t("settings.removeLeave"),
        holidayDate: t("settings.holidayDate"), holidayNameEn: t("settings.holidayNameEn"),
        holidayNameHi: t("settings.holidayNameHi"), addHoliday: t("settings.addHoliday"),
        removeHoliday: t("settings.removeHoliday"), signOut: t("settings.signOut"), saved: t("settings.saved"),
      }}
    />
  );
}