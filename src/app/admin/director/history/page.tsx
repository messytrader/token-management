import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStaffUser, supabaseStaffServer } from "@/lib/supabase/staff-server";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

type Row = {
  meeting_date: string;
  visitor_name: string;
  department: string;
  status: string;
  is_urgent: boolean;
};

export default async function HistoryPage() {
  const staff = await getStaffUser();
  if (!staff) redirect("/admin/login");
  if (staff.role !== "director" && staff.role !== "admin") redirect("/admin/login");

  const { t } = await getT();
  const sb = await supabaseStaffServer();

  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fromStr = from.toISOString().slice(0, 10);

  const { data } = await sb
    .from("appointments")
    .select("meeting_date, visitor_name, department, status, is_urgent")
    .gte("meeting_date", fromStr)
    .order("meeting_date", { ascending: false });

  const rows = (data ?? []) as Row[];

  // Day-wise stats
  const byDay = new Map<
    string,
    { total: number; approved: number; rejected: number; urgent: number; completed: number; no_show: number }
  >();
  for (const r of rows) {
    const e = byDay.get(r.meeting_date) ?? { total: 0, approved: 0, rejected: 0, urgent: 0, completed: 0, no_show: 0 };
    e.total++;
    if (["approved", "in_meeting", "completed"].includes(r.status)) e.approved++;
    if (r.status === "rejected") e.rejected++;
    if (r.status === "completed") e.completed++;
    if (r.status === "no_show") e.no_show++;
    if (r.is_urgent) e.urgent++;
    byDay.set(r.meeting_date, e);
  }
  const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  const met = rows.filter((r) => r.status === "completed");

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <main className="min-h-dvh bg-gradient-to-b from-slate-100 to-background px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/director" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> {t("history.back")}
        </Link>

        <h1 className="mt-4 text-lg font-semibold">{t("history.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("history.subtitle")} · {t("history.days")}</p>

        <div className="mt-4 overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2">{t("history.colDate")}</th>
                <th className="px-3 py-2 text-right">{t("history.colTotal")}</th>
                <th className="px-3 py-2 text-right">{t("history.colApproved")}</th>
                <th className="px-3 py-2 text-right">{t("history.colRejected")}</th>
                <th className="px-3 py-2 text-right">{t("history.colUrgent")}</th>
                <th className="px-3 py-2 text-right">{t("history.colCompleted")}</th>
                <th className="px-3 py-2 text-right">{t("history.colNoShow")}</th>
              </tr>
            </thead>
            <tbody>
              {days.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">{t("history.empty")}</td></tr>
              )}
              {days.map(([date, s]) => (
                <tr key={date} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{fmt(date)}</td>
                  <td className="px-3 py-2 text-right">{s.total}</td>
                  <td className="px-3 py-2 text-right text-emerald-600">{s.approved}</td>
                  <td className="px-3 py-2 text-right text-red-600">{s.rejected}</td>
                  <td className="px-3 py-2 text-right text-amber-600">{s.urgent}</td>
                  <td className="px-3 py-2 text-right">{s.completed}</td>
                  <td className="px-3 py-2 text-right">{s.no_show}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-6 text-sm font-medium text-muted-foreground">{t("history.meetingsTitle")}</h2>
        <div className="mt-2 space-y-2">
          {met.length === 0 && (
            <p className="rounded-2xl border bg-card p-5 text-center text-sm text-muted-foreground">
              {t("history.empty")}
            </p>
          )}
          {met.map((m, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border bg-card p-3">
              <div>
                <p className="font-medium">{m.visitor_name}</p>
                <p className="text-xs text-muted-foreground">{m.department} · {fmt(m.meeting_date)}</p>
              </div>
              {m.is_urgent && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {t("director.urgent")}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}