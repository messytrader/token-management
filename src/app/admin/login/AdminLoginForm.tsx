"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "../../../i18n/LanguageProvide";
import { staffLogin } from "@/app/admin/actions";

const HOME: Record<string, string> = {
  director: "/admin/director",
  admin: "/admin/settings",
  receptionist: "/admin/desk",
};

export function AdminLoginForm() {
  const { t } = useLang();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await staffLogin(email, password);
      if (res.ok) {
        router.push(HOME[res.role] ?? "/admin");
        router.refresh();
      } else {
        setError(t(`staffAuth.err.${res.code}`));
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="w-full max-w-md space-y-6 rounded-3xl border bg-card p-8 shadow-sm sm:p-10"
    >
      <div className="flex flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
          <ShieldCheck className="size-7" />
        </span>
        <h1 className="mt-4 text-xl font-semibold">{t("staffAuth.title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("staffAuth.subtitle")}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("staffAuth.email")}</Label>
        <Input id="email" type="email" value={email} autoComplete="username"
          onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t("staffAuth.password")}</Label>
        <div className="relative">
          <Input id="password" type="password" value={password} autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl pl-11" />
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : t("staffAuth.loginBtn")}
      </Button>
    </form>
  );
}