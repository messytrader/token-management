import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { getT } from "@/i18n/server";
import { LanguageToggle } from "@/components/LanguageToggle";
import { NewRequestForm } from "./NewRequestForm";
import {Navbar} from "../../../components/Navbar";

export default async function NewRequestPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { t } = await getT();

  return (
    <main className="min-h-dvh bg-gradient-to-b from-secondary to-background">
      <Navbar backHref="/dashboard" backLabel={t("form.back")} />

      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 lg:px-12">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("form.title")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("form.subtitle")}</p>
        </div>

        <div className="mt-6">
          <NewRequestForm />
        </div>
      </div>
    </main>
  );
}