import { getT } from "@/i18n/server";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ResetPinForm } from "./ResetPinForm";

export default async function ResetPinPage() {
  const { t } = await getT();
  return (
    <main className="flex min-h-dvh flex-col items-center bg-gradient-to-b from-muted/60 to-background px-5 py-6">
      <div className="flex w-full max-w-md justify-end">
        <LanguageToggle />
      </div>
      <div className="mt-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("resetPin.title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("resetPin.subtitle")}</p>
      </div>
      <div className="mt-6 w-full max-w-md">
        <ResetPinForm />
      </div>
    </main>
  );
}