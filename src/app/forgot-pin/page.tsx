import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { getT } from "@/i18n/server";

export default async function ForgotPinPage() {
  const { t } = await getT();
  return (
    <main className="flex min-h-dvh flex-col items-center bg-gradient-to-b from-muted/60 to-background px-5 py-6">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> {t("forgot.back")}
        </Link>
        <div className="mt-8 rounded-3xl border bg-card p-7 text-center shadow-sm">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
            <KeyRound className="size-5" />
          </span>
          <h1 className="mt-4 text-lg font-semibold">{t("forgot.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("forgot.text1")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("forgot.text2")}</p>
        </div>
      </div>
    </main>
  );
}