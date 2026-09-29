"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "../i18n/LanguageProvide";
import { getQuiz, login, signup, type ErrorCode } from "@/app/actions/auth";

type Mode = "login" | "signup";

export function AuthForm() {
  const { t } = useLang();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [consent, setConsent] = useState(false);
  const [quiz, setQuiz] = useState<{ question: string; token: string } | null>(null);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [error, setError] = useState<{ code: ErrorCode; minutes?: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const loadQuiz = async () => {
    setQuiz(await getQuiz());
    setQuizAnswer("");
  };
  useEffect(() => {
    loadQuiz();
  }, [mode]);

  const errMsg = (code: ErrorCode, minutes?: number) => {
    const raw = t(`auth.err.${code}`);
    return minutes ? raw.replace("{m}", String(minutes)) : raw;
  };

  const submit = () => {
    setError(null);
    if (!quiz) return;

    startTransition(async () => {
      const base = { mobile, pin, quizToken: quiz.token, quizAnswer };
      const res =
        mode === "login"
          ? await login(base)
          : await signup({ ...base, name, consent });

      if (res.ok) {
        toast.success(mode === "login" ? "Welcome back" : "Account created");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setError({ code: res.code, minutes: res.minutes });
      if (res.code === "QUIZ_WRONG") await loadQuiz();
    });
  };

  const inputBase =
    "h-12 rounded-xl text-base tracking-wide";

  return (
    <div className="w-full max-w-md">
      <div className="mb-5 grid grid-cols-2 rounded-full border bg-card p-1 shadow-sm">
        {(["login", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-full py-2.5 text-sm font-medium transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            {t(m === "login" ? "auth.loginTab" : "auth.signupTab")}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-5 rounded-3xl border bg-card p-7 shadow-sm sm:p-9"
      >
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("auth.name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("auth.namePh")}
              className={inputBase}
              autoComplete="name"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="mobile">{t("auth.mobile")}</Label>
          <Input
            id="mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder={t("auth.mobilePh")}
            inputMode="numeric"
            maxLength={10}
            className={inputBase}
            autoComplete="tel"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pin">{t(mode === "signup" ? "auth.pinNew" : "auth.pin")}</Label>
          <div className="relative">
            <Input
              id="pin"
              type={showPin ? "text" : "password"}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              className={`${inputBase} pr-11`}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
            <button
              type="button"
              onClick={() => setShowPin((s) => !s)}
              aria-label={t(showPin ? "auth.hidePin" : "auth.showPin")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {mode === "signup" && (
            <p className="text-xs text-muted-foreground">{t("auth.pinHint")}</p>
          )}
        </div>

        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="pin2">{t("auth.pinConfirm")}</Label>
            <Input
              id="pin2"
              type={showPin ? "text" : "password"}
              value={pin2}
              onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              className={inputBase}
            />
          </div>
        )}

        {quiz && (
          <div className="rounded-2xl bg-muted/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">{t("auth.quizTitle")}</p>
              <button
                type="button"
                onClick={loadQuiz}
                className="text-muted-foreground"
                aria-label={t("auth.quizRefresh")}
              >
                <RefreshCw className="size-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">{quiz.question} =</span>
              <Input
                value={quizAnswer}
                onChange={(e) => setQuizAnswer(e.target.value.replace(/[^\d-]/g, ""))}
                inputMode="numeric"
                className="h-11 w-20 rounded-lg text-center text-base"
              />
            </div>
          </div>
        )}

        {mode === "signup" && (
          <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-4 rounded border-input"
            />
            {t("auth.consent")}
          </label>
        )}

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errMsg(error.code, error.minutes)}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "..." : t(mode === "login" ? "auth.loginBtn" : "auth.signupBtn")}
        </Button>

        {mode === "login" && (
          <a href="/forgot-pin" className="block text-center text-sm text-muted-foreground">
            {t("auth.forgot")}
          </a>
        )}

        {mode === "signup" && pin && pin2 && pin !== pin2 && (
          <p className="text-center text-xs text-destructive">{t("auth.err.PIN_MISMATCH")}</p>
        )}
      </form>
    </div>
  );
}