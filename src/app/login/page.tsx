import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getT } from "@/i18n/server";
import { getSessionUser } from "@/lib/session";
import {Navbar} from "../../components/Navbar";

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard");
  const { t } = await getT();
  return (
    <main className="flex min-h-dvh flex-col items-center bg-gradient-to-b from-secondary to-background">
      <div className="w-full">
        <Navbar backHref="/" backLabel={t("auth.back")} />
      </div>

      <div className="mt-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("auth.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("auth.subtitle")}</p>
      </div>

      <div className="mt-8 flex w-full flex-1 items-start justify-center px-5 pb-16 sm:px-8">
        <AuthForm />
      </div>
    </main>
  );
}