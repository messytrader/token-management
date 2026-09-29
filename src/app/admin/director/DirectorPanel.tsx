"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell, BellOff, CheckCircle2, ChevronDown, ChevronUp, History as HistoryIcon,
  LogOut, Phone, Star, UserX, XCircle, Zap,
} from "lucide-react";
import {Navbar} from "../../../components/Navbar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabaseStaffBrowser } from "../../../lib/supabase/staff-browser"
import { staffLogout } from "@/app/admin/actions";
import { AlertTriangle } from "lucide-react";
import { decide, markDone } from "./actions";
import { initAutoUnlock, playNewRequestChime, playUrgentChime, playVipChime, unlockAudio } from "@/lib/chime";

type Appt = {
  id: string;
  token_no: string;
  token_seq: number;
  visitor_name: string;
  mobile: string;
  department: string;
  reason: string;
  preferred_time: string | null;
  duration_min: number;
  is_urgent: boolean;
  is_vip: boolean;
  status: string;
  director_remark: string | null;
  priority_rank: number;
  created_at: string;
};

type Dict = Record<string, string>;

const ACTIVE = new Set(["pending", "approved"]);
const FINAL = new Set(["completed", "no_show"]);

function sortAppts(list: Appt[]) {
  return [...list].sort((a, b) =>
    a.priority_rank !== b.priority_rank
      ? a.priority_rank - b.priority_rank
      : a.token_seq - b.token_seq
  );
}

function errText(d: Dict, code: string) {
  const key = `err${code}` as keyof Dict;
  return d[key] ?? d.error;
}

export function DirectorPanel({
  staffName,
  initial,
  today,
  dict: d,
}: {
  staffName: string;
  initial: Appt[];
  today: string;
  dict: Dict;
}) {
  const [items, setItems] = useState<Appt[]>(sortAppts(initial));
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [reversing, setReversing] = useState<Record<string, boolean>>({});
  const [soundOn, setSoundOn] = useState(true);
  const [showDecided, setShowDecided] = useState(false);
  const soundOnRef = useRef(soundOn);
    const [audioUnlocked, setAudioUnlocked] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
    id: string;
    action: "reject" | "no_show";
    tokenNo: string;
    name: string;
  } | null>(null);
    const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  soundOnRef.current = soundOn;

  useEffect(() => {
    initAutoUnlock(() => setAudioUnlocked(true));
  }, []);
  useEffect(() => {
    const sb = supabaseStaffBrowser();
    const channel = sb
      .channel("director-today")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `meeting_date=eq.${today}` },
        (payload) => {
          const row = payload.new as Appt;

          setItems((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((x) => x.id !== (payload.old as Appt).id);
            }
            const relevant = !["expired", "cancelled", "rescheduled"].includes(row.status);
            const exists = prev.some((x) => x.id === row.id);

            if (!relevant) return prev.filter((x) => x.id !== row.id);
            if (exists) return sortAppts(prev.map((x) => (x.id === row.id ? row : x)));

            if (payload.eventType === "INSERT" && soundOnRef.current) {
              if (row.is_urgent) playUrgentChime();
              else if (row.is_vip) playVipChime();
              else playNewRequestChime();
            }
            return sortAppts([...prev, row]);
          });
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [today]);

  const pending = useMemo(() => items.filter((a) => a.status === "pending"), [items]);
  const approved = useMemo(() => items.filter((a) => a.status === "approved"), [items]);
  const decidedToday = useMemo(
    () => items.filter((a) => a.status === "rejected" || FINAL.has(a.status)),
    [items]
  );

  const stats = useMemo(() => {
    const approvedCount = items.filter((a) => a.status === "approved" || a.status === "completed").length;
    const rejected = items.filter((a) => a.status === "rejected").length;
    const urgent = items.filter((a) => a.is_urgent).length;
    return { total: items.length, approved: approvedCount, rejected, urgent };
  }, [items]);

  const doDecide = async (id: string, status: "approved" | "rejected", remarkRequired: boolean) => {
    if (busyIds.has(id)) return;
    const remark = remarks[id] ?? "";
    if (remarkRequired && remark.trim().length === 0) {
      toast.error(d.errREMARK_REQUIRED);
      return;
    }
    setBusyIds((s) => new Set(s).add(id));

    const prevStatus = items.find((x) => x.id === id)?.status;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status, director_remark: remark || x.director_remark } : x)));

    const res = await decide(id, status, remark);
    if (res.ok) {
      toast.success(d.statusUpdated);
      setReversing((r) => ({ ...r, [id]: false }));
    } else {
      toast.error(errText(d, res.error));
      if (prevStatus) {
        setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: prevStatus } : x)));
      }
    }

    setBusyIds((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  };

  const doFinish = async (id: string, status: "completed" | "no_show") => {
    if (busyIds.has(id)) return; // dobara click ignore
    setBusyIds((s) => new Set(s).add(id));

    // Optimistic: turant local state se hata do, Realtime event ka wait mat karo
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));

    const res = await markDone(id, status);
    if (!res.ok) {
      toast.error(errText(d, res.error));
      // Fail hua to wapas approved kar do
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: "approved" } : x)));
    } else {
      toast.success(d.statusUpdated);
    }

    setBusyIds((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  };
    const requestReject = (a: Appt, remarkRequired: boolean) => {
    if (a.is_urgent) {
      setConfirmModal({ id: a.id, action: "reject", tokenNo: a.token_no, name: a.visitor_name });
    } else {
      doDecide(a.id, "rejected", remarkRequired);
    }
  };

  const requestNoShow = (a: Appt) => {
    if (a.is_urgent) {
      setConfirmModal({ id: a.id, action: "no_show", tokenNo: a.token_no, name: a.visitor_name });
    } else {
      doFinish(a.id, "no_show");
    }
  };

  const confirmModalAction = () => {
    if (!confirmModal) return;
    if (confirmModal.action === "reject") {
      doDecide(confirmModal.id, "rejected", true); // urgent reject: remark hamesha zaroori
    } else {
      doFinish(confirmModal.id, "no_show");
    }
    setConfirmModal(null);
  };

  const cardStyle = (a: Appt) =>
    a.is_urgent ? "border-red-200 bg-red-50/60" : a.is_vip ? "border-amber-200 bg-amber-50/50" : "border-border bg-card";

  const STATUS_BADGE: Record<string, string> = {
    rejected: "bg-red-100 text-red-700",
    completed: "bg-emerald-100 text-emerald-700",
    no_show: "bg-slate-200 text-slate-700",
  };

  const renderCard = (a: Appt, kind: "pending" | "approved") => (
    <div key={a.id} className={`rounded-2xl border p-4 shadow-sm ${cardStyle(a)}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-wide">{a.token_no}</span>
            {a.is_urgent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                <Zap className="size-3" /> {d.urgent}
              </span>
            )}
            {a.is_vip && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                <Star className="size-3" /> {d.vip}
              </span>
            )}
          </div>
          <p className="mt-1 font-medium">{a.visitor_name}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="size-3" /> {a.mobile} · {a.department}
          </p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
          {a.duration_min} {d.duration}
          {a.preferred_time ? ` · ${a.preferred_time.slice(0, 5)}` : ""}
        </span>
      </div>

      <p className="mt-2 text-sm">
        <span className="text-muted-foreground">{d.reason}: </span>
        {a.reason}
      </p>

      {kind === "pending" && (
        <div className="mt-3 space-y-2">
          <input
            value={remarks[a.id] ?? ""}
            onChange={(e) => setRemarks((r) => ({ ...r, [a.id]: e.target.value }))}
            placeholder={d.remarkPh}
            className="h-10 w-full rounded-xl border border-input bg-white/70 px-3 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => doDecide(a.id, "approved", false)}>
              <CheckCircle2 className="size-4" /> {d.approve}
            </Button>
            <Button size="sm" variant="destructive" className="flex-1 gap-1.5"
              onClick={() => doDecide(a.id, "rejected", false)}>
              <XCircle className="size-4" /> {d.reject}
            </Button>
          </div>
        </div>
      )}

      {kind === "approved" && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              disabled={busyIds.has(a.id)}
              onClick={() => doFinish(a.id, "completed")}>
              <CheckCircle2 className="size-4" /> {d.markCompleted}
            </Button>
            <Button size="sm" variant="outline" className="flex-1 gap-1.5"
              disabled={busyIds.has(a.id)}
              onClick={() => doFinish(a.id, "no_show")}>
              <UserX className="size-4" /> {d.markNoShow}
            </Button>
          </div>

          {!reversing[a.id] ? (
            <button
              onClick={() => setReversing((r) => ({ ...r, [a.id]: true }))}
              className="w-full text-center text-xs text-red-600 underline underline-offset-2"
            >
              {d.changeToReject}
            </button>
          ) : (
            <div className="rounded-xl border border-red-200 bg-white/70 p-2.5 space-y-2">
              <input
                value={remarks[a.id] ?? ""}
                onChange={(e) => setRemarks((r) => ({ ...r, [a.id]: e.target.value }))}
                placeholder={d.remarkPhRequired}
                className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
              />
              <div className="flex gap-2">
                                     <Button size="sm" variant="outline" className="flex-1 gap-1.5"
              disabled={busyIds.has(a.id)}
              onClick={() => requestNoShow(a)}>
              <UserX className="size-4" /> {d.markNoShow}
            </Button>
            <Button size="sm" variant="destructive" className="flex-1 gap-1.5"
              disabled={busyIds.has(a.id)}
              onClick={() => requestReject(a, false)}>
              <XCircle className="size-4" /> {d.reject}
            </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-dvh bg-gradient-to-b from-secondary to-background">
            <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:px-12">
        {/* <header className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{d.title}</h1>
            <p className="text-sm text-muted-foreground">{staffName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/director/history"
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium"
            >
              <HistoryIcon className="size-3.5" /> {d.history}
            </Link>
                        <button
              onClick={async () => {
                const ok = await unlockAudio();
                setAudioUnlocked(ok);
                setSoundOn((s) => !s);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium"
              title={soundOn ? d.soundOn : d.soundOff}
            >
              {soundOn ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
            </button>
            <form action={staffLogout}>
              <button className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <LogOut className="size-3.5" /> {d.signOut}
              </button>
            </form>
          </div>
        </header> */}

                <Navbar
          signOutAction={staffLogout}
          signOutLabel={d.signOut}
          showHelp={false}
        />

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{d.title}</h1>
            <p className="text-sm text-muted-foreground">{staffName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/director/history"
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium"
            >
              <HistoryIcon className="size-3.5" /> {d.history}
            </Link>
          </div>
        </div>
                <button
          onClick={async () => {
            const ok = await unlockAudio();
            setAudioUnlocked(ok);
            setSoundOn((s) => !s);
          }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
        >
          {soundOn ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
          {soundOn ? d.soundOn : d.soundOff}
        </button>
                {!audioUnlocked && (
          <button
            onClick={async () => {
              const ok = await unlockAudio();
              setAudioUnlocked(ok);
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
          >
            <Bell className="size-4" /> {d.enableSoundBanner}
          </button>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { label: d.statsTotal, value: stats.total, color: "text-foreground" },
            { label: d.statsApproved, value: stats.approved, color: "text-emerald-600" },
            { label: d.statsRejected, value: stats.rejected, color: "text-red-600" },
            { label: d.statsUrgent, value: stats.urgent, color: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {pending.length > 0 && (
          <>
            <p className="mt-5 text-sm font-medium text-muted-foreground">{d.pendingSection}</p>
            <div className="mt-3 space-y-3">{pending.map((a) => renderCard(a, "pending"))}</div>
          </>
        )}

        <p className="mt-5 text-sm font-medium text-muted-foreground">{d.approvedSection}</p>
        {approved.length === 0 ? (
          <p className="mt-3 rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            {d.empty}
          </p>
        ) : (
          <div className="mt-3 space-y-3">{approved.map((a) => renderCard(a, "approved"))}</div>
        )}

        {decidedToday.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowDecided((s) => !s)}
              className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground"
            >
              {d.decidedToday} ({decidedToday.length})
              {showDecided ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {showDecided && (
              <div className="mt-2 space-y-2">
                {decidedToday.map((a) => (
                  <div key={a.id} className="rounded-xl border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{a.token_no}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{a.visitor_name}</span>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[a.status] ?? "bg-muted"}`}>
                        {a.status}
                      </span>
                    </div>
                    {a.director_remark && (
                      <p className="mt-1 text-xs text-muted-foreground">{a.director_remark}</p>
                    )}

                    {a.status === "rejected" && !reversing[a.id] && (
                      <button
                        onClick={() => setReversing((r) => ({ ...r, [a.id]: true }))}
                        className="mt-2 text-xs text-emerald-600 underline underline-offset-2"
                      >
                        {d.reconsider}
                      </button>
                    )}
                    {a.status === "rejected" && reversing[a.id] && (
                      <div className="mt-2 flex gap-2">
                                        <Button size="sm" variant="destructive" className="flex-1"
                  onClick={() => requestReject(a, true)}>
                  {d.confirmChange}
                </Button>
                        <Button size="sm" variant="outline" className="flex-1"
                          onClick={() => setReversing((r) => ({ ...r, [a.id]: false }))}>
                          {d.cancelChange}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
            {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-lg">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-5" />
              <p className="font-semibold">{d.urgentConfirmTitle}</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {d.urgentConfirmText
                .replace("{token}", confirmModal.tokenNo)
                .replace("{name}", confirmModal.name)}
            </p>

            {confirmModal.action === "reject" && (
              <input
                value={remarks[confirmModal.id] ?? ""}
                onChange={(e) => setRemarks((r) => ({ ...r, [confirmModal.id]: e.target.value }))}
                placeholder={d.remarkPhRequired}
                className="mt-3 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
              />
            )}

            <div className="mt-4 flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                disabled={
                  confirmModal.action === "reject" &&
                  !(remarks[confirmModal.id] ?? "").trim()
                }
                onClick={confirmModalAction}
              >
                {d.urgentConfirmYes}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirmModal(null)}>
                {d.cancelChange}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}