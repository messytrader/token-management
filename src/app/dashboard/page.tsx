import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, History, LogOut } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getT } from "@/i18n/server";
import { getSessionUser } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Navbar } from "../../components/Navbar";


const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  in_meeting: "bg-blue-50 text-blue-700",
  completed: "bg-slate-100 text-slate-700",
  rejected: "bg-red-50 text-red-700",
  no_show: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
  expired: "bg-slate-100 text-slate-500",
  rescheduled: "bg-violet-50 text-violet-700",
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { t, lang } = await getT();

  const { data: history } = await supabaseAdmin()
    .from("appointments")
    .select("token_no, access_key, meeting_date, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-secondary to-background">
      <Navbar signOutAction={logout} signOutLabel={t("dashboard.signOut")} />

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:px-12">
        <div>
          <p className="text-sm text-muted-foreground">{t("dashboard.hello")}</p>
          <h1 className="text-xl font-semibold">{user.name}</h1>
        </div>

        <Link
          href="/dashboard/new"
          className="mt-8 flex items-center gap-5 rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ClipboardList className="size-6" />
          </span>
          <div>
            <p className="text-lg font-medium">{t("dashboard.newTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("dashboard.newText")}</p>
          </div>
        </Link>

        <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <History className="size-5 text-muted-foreground" />
            <h2 className="font-medium">{t("dashboard.historyTitle")}</h2>
          </div>

          {!history || history.length === 0 ? (
            <p className="rounded-xl bg-muted/60 p-5 text-sm text-muted-foreground">
              {t("dashboard.historyEmpty")}
            </p>
          ) : (
            <ul className="space-y-3">
              {history.map((h) => (
                <li key={h.access_key}>
                  <Link
                    href={`/t/${h.access_key}`}
                    className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{h.token_no}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.meeting_date).toLocaleDateString(
                          lang === "hi" ? "hi-IN" : "en-IN",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${STATUS_STYLE[h.status] ?? ""}`}
                    >
                      {t(`token.status.${h.status}`)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}