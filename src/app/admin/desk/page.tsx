import { redirect } from "next/navigation";
import { getStaffUser } from "@/lib/supabase/staff-server";
import { getT } from "@/i18n/server";
import { DeskPanel } from "./DeskPanel";

export default async function DeskPage() {
  const staff = await getStaffUser();
  if (!staff) redirect("/admin/login");
  if (!["receptionist", "admin", "director"].includes(staff.role)) redirect("/admin/login");

  const { t, lang } = await getT();
  return (
    <DeskPanel
      staffName={staff.full_name}
      lang={lang}
      dict={{
        title: t("desk.title"), walkinTab: t("desk.walkinTab"), resetTab: t("desk.resetTab"),
        name: t("desk.name"), mobile: t("desk.mobile"), address: t("desk.address"),
        department: t("desk.department"), reason: t("desk.reason"), duration: t("desk.duration"),
        urgent: t("desk.urgent"), createBtn: t("desk.createBtn"), created: t("desk.created"),
        resetMobile: t("desk.resetMobile"), generateCode: t("desk.generateCode"),
        codeGenerated: t("desk.codeGenerated"), resetNote: t("desk.resetNote"),
        userNotFound: t("desk.userNotFound"), signOut: t("desk.signOut"),
      }}
    />
  );
}