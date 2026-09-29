"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "../../../i18n/LanguageProvide";
import { DEPARTMENTS } from "../../../lib/department";
import {
  checkAvailability,
  submitRequest,
  type DayAvailability,
  type NewRequestInput,
} from "@/app/actions/appointments";

function todayStr() {
  // IST ke hisaab se aaj ki date, browser ki timezone se independent nahi
  // hai par form ke liye kaafi hai — server side rules asli check karte hain
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function NewRequestForm() {
  const { t, lang } = useLang();
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [department, setDepartment] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(10);
  const [isUrgent, setIsUrgent] = useState(false);
  const [urgentNote, setUrgentNote] = useState("");

  const [avail, setAvail] = useState<DayAvailability | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ tokenNo: string; accessKey: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!date) return;
    setChecking(true);
    setAvail(null);
    checkAvailability(date).then((a) => {
      setAvail(a);
      setChecking(false);
    });
  }, [date]);

  const dayStatusText = useMemo(() => {
    if (!avail) return null;
    const key = `form.dayStatus.${avail.reason}`;
    let text = t(key);
    if (avail.reason === "OK") text = text.replace("{n}", String(avail.remaining));
    if (avail.reason === "TOO_FAR") text = text.replace("{n}", "30");
    if (avail.reason === "HOLIDAY") {
      const name = lang === "hi" ? avail.holiday_name_hi : avail.holiday_name_en;
      text = text.replace("{name}", name ?? "");
    }
    return text;
  }, [avail, t, lang]);

  const validate = (): string | null => {
    if (address.trim().length < 3) return t("form.err.ADDRESS");
    if (!department) return t("form.err.DEPARTMENT");
    if (reason.trim().length < 10) return t("form.err.REASON");
    if (!date || (avail && !avail.available)) return t("form.err.DATE");
    if (isUrgent && urgentNote.trim().length < 5) return t("form.err.URGENT_NOTE");
    return null;
  };

  const submit = () => {
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    const input: NewRequestInput = {
      address: address.trim(),
      department: department as NewRequestInput["department"],
      reason: reason.trim(),
      meetingDate: date,
      preferredTime: time,
      durationMin: duration,
      isUrgent,
      urgentNote,
    };

    startTransition(async () => {
      const res = await submitRequest(input);
      if (res.ok) {
        setSuccess({ tokenNo: res.tokenNo, accessKey: res.accessKey });
      } else {
        setError(t(`form.err.${res.code}`) || t("form.err.SERVER_ERROR"));
      }
    });
  };

  if (success) {
    return (
      <div className="rounded-3xl border bg-card p-7 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-6 text-emerald-600" />
        </span>
        <p className="mt-4 text-sm text-muted-foreground">{t("form.success")}</p>
        <p className="mt-2 text-3xl font-bold tracking-wide">{success.tokenNo}</p>
        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={() => router.push(`/t/${success.accessKey}`)}
        >
          {t("form.viewToken")}
        </Button>
      </div>
    );
  }

  const inputBase = "h-12 rounded-xl text-base";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-5 rounded-3xl border bg-card p-7 shadow-sm sm:p-9"
    >
      <div className="space-y-1.5">
        <Label htmlFor="address">{t("form.address")}</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)}
          placeholder={t("form.addressPh")} className={inputBase} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="department">{t("form.department")}</Label>
        <select
          id="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="h-12 w-full rounded-xl border border-input bg-transparent px-3 text-base"
        >
          <option value="">{t("form.departmentPh")}</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.value} value={d.value}>{lang === "hi" ? d.hi : d.en}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reason">{t("form.reason")}</Label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("form.reasonPh")}
          rows={3}
          maxLength={400}
          className="w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-base"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="date">{t("form.date")}</Label>
          <div className="relative">
            <Input id="date" type="date" value={date} min={todayStr()}
              onChange={(e) => setDate(e.target.value)} className={inputBase} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="time">{t("form.time")}</Label>
          <Input id="time" type="time" value={time}
            onChange={(e) => setTime(e.target.value)} className={inputBase} />
        </div>
      </div>

      {checking && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> {t("form.checking")}
        </p>
      )}
      {!checking && dayStatusText && (
        <p
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
            avail?.available ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          <CalendarDays className="size-4 shrink-0" /> {dayStatusText}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="duration">{t("form.duration")}</Label>
        <Input id="duration" type="number" min={5} max={120} step={5} value={duration}
          onChange={(e) => setDuration(Number(e.target.value))} className={`${inputBase} w-28`} />
      </div>

      <label className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-sm text-red-800">
        <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)}
          className="mt-0.5 size-4" />
        {t("form.urgent")}
      </label>

      {isUrgent && (
        <div className="space-y-1.5">
          <Label htmlFor="urgentNote">{t("form.urgentNote")}</Label>
          <Input id="urgentNote" value={urgentNote} onChange={(e) => setUrgentNote(e.target.value)}
            placeholder={t("form.urgentNotePh")} className={inputBase} />
        </div>
      )}

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" /> {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending || checking}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : t("form.submit")}
      </Button>
    </form>
  );
}