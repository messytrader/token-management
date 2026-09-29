"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "../../i18n/LanguageProvide";
import { resetPinWithCode, type ErrorCode } from "@/app/actions/auth";

export function ResetPinForm() {
  const { t } = useLang();
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await resetPinWithCode({ mobile, code, newPin: pin, confirmPin: pin2 });
      if (res.ok) setSuccess(true);
      else setError(res.code);
    });
  };

  if (success) {
    return (
      <div className="rounded-3xl border bg-card p-7 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-6 text-emerald-600" />
        </span>
        <p className="mt-3 text-sm text-muted-foreground">{t("resetPin.success")}</p>
        <Link href="/login" className="mt-5 inline-block">
          <Button size="lg">{t("resetPin.goLogin")}</Button>
        </Link>
      </div>
    );
  }

  const inputBase = "h-12 rounded-xl text-base";

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm sm:p-7"
    >
      <div className="space-y-1.5">
        <Label>{t("resetPin.mobile")}</Label>
        <Input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
          inputMode="numeric" maxLength={10} className={inputBase} />
      </div>
      <div className="space-y-1.5">
        <Label>{t("resetPin.code")}</Label>
        <Input value={code} onChange={(e) => setCode(e.target.value)} className={inputBase} />
      </div>
      <div className="space-y-1.5">
        <Label>{t("resetPin.newPin")}</Label>
        <Input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric" maxLength={6} type="password" className={inputBase} />
      </div>
      <div className="space-y-1.5">
        <Label>{t("resetPin.confirmPin")}</Label>
        <Input value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric" maxLength={6} type="password" className={inputBase} />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t(`resetPin.err.${error}`)}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : t("resetPin.submit")}
      </Button>
    </form>
  );
}