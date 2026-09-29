"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, LogOut, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { staffLogout } from "@/app/admin/actions";
import {
  addHoliday, addLeave, closeToday, findByToken, removeHoliday, removeLeave, toggleVip,
} from "../settings/action";
import { Navbar } from "../../../components/Navbar";

type Dict = Record<string, string>;
type Leave = { id: string; from_date: string; to_date: string; reason: string | null };
type Holiday = { holiday_date: string; name_en: string; name_hi: string | null };

export function SettingsPanel({
  staffName, initialLeaves, initialHolidays, dict: d,
}: {
  staffName: string; initialLeaves: Leave[]; initialHolidays: Holiday[]; dict: Dict;
}) {
  const [tab, setTab] = useState<"vip" | "leave" | "holiday">("vip");
  const [pending, startTransition] = useTransition();

  // VIP
  const [tokenQuery, setTokenQuery] = useState("");
  const [found, setFound] = useState<{ id: string; token_no: string; visitor_name: string; is_vip: boolean } | null>(null);

  // Leave
  const [leaves, setLeaves] = useState(initialLeaves);
  const [leaveFrom, setLeaveFrom] = useState("");
  const [leaveTo, setLeaveTo] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  // Holiday
  const [holidays, setHolidays] = useState(initialHolidays);
  const [hDate, setHDate] = useState("");
  const [hEn, setHEn] = useState("");
  const [hHi, setHHi] = useState("");

  const search = () => {
    startTransition(async () => {
      const res = await findByToken(tokenQuery);
      if (res.ok) setFound(res.appt);
      else { setFound(null); toast.error(d.notFound); }
    });
  };

  const doToggleVip = () => {
    if (!found) return;
    startTransition(async () => {
      const res = await toggleVip(found.id, !found.is_vip);
      if (res.ok) { setFound({ ...found, is_vip: !found.is_vip }); toast.success(d.saved); }
    });
  };

  const submitLeave = () => {
    if (!leaveFrom || !leaveTo) return;
    startTransition(async () => {
      const res = await addLeave(leaveFrom, leaveTo, leaveReason);
      if (res.ok) {
        setLeaves((l) => [...l, { id: crypto.randomUUID(), from_date: leaveFrom, to_date: leaveTo, reason: leaveReason || null }]);
        setLeaveFrom(""); setLeaveTo(""); setLeaveReason("");
        toast.success(d.saved);
      }
    });
  };

  const doRemoveLeave = (id: string) => {
    startTransition(async () => {
      await removeLeave(id);
      setLeaves((l) => l.filter((x) => x.id !== id));
    });
  };

  const doCloseToday = () => {
    if (!confirm(d.closeTodayConfirm)) return;
    startTransition(async () => {
      const res = await closeToday();
      if (res.ok) toast.success(d.saved);
    });
  };

  const submitHoliday = () => {
    if (!hDate || !hEn) return;
    startTransition(async () => {
      const res = await addHoliday(hDate, hEn, hHi);
      if (res.ok) {
        setHolidays((h) => [...h, { holiday_date: hDate, name_en: hEn, name_hi: hHi || null }]);
        setHDate(""); setHEn(""); setHHi("");
        toast.success(d.saved);
      }
    });
  };

  const doRemoveHoliday = (date: string) => {
    startTransition(async () => {
      await removeHoliday(date);
      setHolidays((h) => h.filter((x) => x.holiday_date !== date));
    });
  };

  const inputBase = "h-11 rounded-xl";

  return (
        <main className="min-h-dvh bg-gradient-to-b from-secondary to-background">
            <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 lg:px-12">
              <Navbar signOutAction={staffLogout} signOutLabel={d.signOut} showHelp={false} />

        <div className="mt-6">
          <h1 className="text-lg font-semibold">{d.title}</h1>
          <p className="text-sm text-muted-foreground">{staffName}</p>
        </div>

        <div className="mt-5 grid grid-cols-3 rounded-full border bg-card p-1 shadow-sm">
          {(["vip", "leave", "holiday"] as const).map((tb) => (
            <button key={tb} onClick={() => setTab(tb)}
              className={`rounded-full py-2 text-xs font-medium sm:text-sm ${tab === tb ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {d[`${tb}Tab`]}
            </button>
          ))}
        </div>

        {tab === "vip" && (
          <div className="mt-4 space-y-3 rounded-3xl border bg-card p-6 shadow-sm">
            <Label>{d.vipSearch}</Label>
            <div className="flex gap-2">
              <Input value={tokenQuery} onChange={(e) => setTokenQuery(e.target.value)} className={inputBase} />
              <Button onClick={search} disabled={pending}><Search className="size-4" /></Button>
            </div>
            {found && (
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="font-medium">{found.token_no} — {found.visitor_name}</p>
                <Button
                  size="sm" className="mt-2 gap-1.5"
                  variant={found.is_vip ? "outline" : "default"}
                  onClick={doToggleVip} disabled={pending}
                >
                  <Star className="size-4" /> {found.is_vip ? d.vipUnset : d.vipSet}
                </Button>
              </div>
            )}
          </div>
        )}

        {tab === "leave" && (
          <div className="mt-4 space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
            <Button variant="destructive" className="w-full gap-1.5" onClick={doCloseToday} disabled={pending}>
              <AlertTriangle className="size-4" /> {d.closeToday}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{d.leaveFrom}</Label>
                <Input type="date" value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} className={inputBase} />
              </div>
              <div>
                <Label>{d.leaveTo}</Label>
                <Input type="date" value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} className={inputBase} />
              </div>
            </div>
            <Input placeholder={d.leaveReason} value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} className={inputBase} />
            <Button className="w-full" onClick={submitLeave} disabled={pending}>{d.addLeave}</Button>

            <div className="space-y-2">
              {leaves.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                  <span>{l.from_date} → {l.to_date} {l.reason ? `(${l.reason})` : ""}</span>
                  <button onClick={() => doRemoveLeave(l.id)} className="text-red-600"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "holiday" && (
          <div className="mt-4 space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
            <Label>{d.holidayDate}</Label>
            <Input type="date" value={hDate} onChange={(e) => setHDate(e.target.value)} className={inputBase} />
            <Label>{d.holidayNameEn}</Label>
            <Input value={hEn} onChange={(e) => setHEn(e.target.value)} className={inputBase} />
            <Label>{d.holidayNameHi}</Label>
            <Input value={hHi} onChange={(e) => setHHi(e.target.value)} className={inputBase} />
            <Button className="w-full" onClick={submitHoliday} disabled={pending}>{d.addHoliday}</Button>

            <div className="space-y-2">
              {holidays.map((h) => (
                <div key={h.holiday_date} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                  <span>{h.holiday_date} — {h.name_en}</span>
                  <button onClick={() => doRemoveHoliday(h.holiday_date)} className="text-red-600"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}