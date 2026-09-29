"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer, Radio, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "../../../lib/browser";
import { getQueuePosition, type TokenData } from "@/app/actions/token";
import { ReceiptPrint } from "../[key]/RecieptPrint";

type Dict = {
  office: string;
  tokenNo: string;
  status: Record<string, string>;
  statusLine: Record<string, string>;
  position: string;
  positionZero: string;
  remark: string;
  urgent: string;
  vip: string;
  details: string;
  name: string;
  department: string;
  date: string;
  time: string;
  duration: string;
  minutes: string;
  print: string;
  backHome: string;
  liveNote: string;
  receiptFooter: string;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_meeting: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  no_show: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  expired: "bg-slate-100 text-slate-500 border-slate-200",
  rescheduled: "bg-violet-50 text-violet-700 border-violet-200",
};

export function TokenView({
  accessKey,
  initial,
  initialPosition,
  lang,
  dict: d,
}: {
  accessKey: string;
  initial: TokenData;
  initialPosition: number | null;
  lang: "hi" | "en";
  dict: Dict;
}) {
  const [token, setToken] = useState(initial);
  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    const sb = supabaseBrowser();
    const channel = sb
      .channel(`token-${token.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "appointments", filter: `id=eq.${token.id}` },
        async (payload) => {
          const row = payload.new as TokenData;
          setToken(row);
          if (row.status === "approved" || row.status === "in_meeting") {
            setPosition(await getQueuePosition(row.id));
          } else {
            setPosition(null);
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [token.id]);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const dateStr = new Date(token.meeting_date).toLocaleDateString(
    lang === "hi" ? "hi-IN" : "en-IN",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <>
      <main className="min-h-dvh bg-gradient-to-b from-muted/60 to-background px-5 py-6 print:hidden">
        <div className="mx-auto max-w-md">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <ArrowLeft className="size-4" /> {d.backHome}
          </Link>

          <div className="mt-5 rounded-3xl border bg-card p-7 text-center shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {d.office}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">{d.tokenNo}</p>
            <p className="mt-1 text-4xl font-bold tracking-wide">{token.token_no}</p>

            <div className="mt-4 flex justify-center gap-2">
              {token.is_urgent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                  <Zap className="size-3" /> {d.urgent}
                </span>
              )}
              {token.is_vip && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  <Star className="size-3" /> {d.vip}
                </span>
              )}
            </div>

            <div
              className={`mt-5 rounded-2xl border px-4 py-3 ${STATUS_STYLE[token.status] ?? ""}`}
            >
              <p className="font-semibold">{d.status[token.status] ?? token.status}</p>
              <p className="mt-0.5 text-sm opacity-90">
                {d.statusLine[token.status] ?? ""}
              </p>
            </div>

            {(token.status === "approved" || token.status === "in_meeting") &&
              position !== null && (
                <div className="mt-4 rounded-2xl bg-primary/5 p-4">
                  <p className="text-3xl font-bold">
                    {position === 0 ? d.positionZero : position}
                  </p>
                  {position > 0 && (
                    <p className="mt-1 text-sm text-muted-foreground">{d.position}</p>
                  )}
                </div>
              )}

            {token.director_remark && (
              <div className="mt-4 rounded-xl bg-muted/60 p-3 text-left text-sm">
                <p className="font-medium text-muted-foreground">{d.remark}</p>
                <p className="mt-1">{token.director_remark}</p>
              </div>
            )}

            {url && (
              <div className="mt-5 flex justify-center">
                <div className="rounded-2xl border bg-white p-3">
                  <QRCodeSVG value={url} size={128} />
                </div>
              </div>
            )}

            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Radio className="size-3" /> {d.liveNote}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm font-medium">{d.details}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">{d.name}</dt><dd>{token.visitor_name}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">{d.department}</dt><dd>{token.department}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">{d.date}</dt><dd>{dateStr}</dd></div>
              {token.preferred_time && (
                <div className="flex justify-between"><dt className="text-muted-foreground">{d.time}</dt><dd>{token.preferred_time.slice(0,5)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted-foreground">{d.duration}</dt><dd>{token.duration_min} {d.minutes}</dd></div>
            </dl>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="mt-4 w-full gap-2"
            onClick={() => window.print()}
          >
            <Printer className="size-4" /> {d.print}
          </Button>
        </div>
      </main>

      <ReceiptPrint token={token} dateStr={dateStr} url={url} dict={d} />
    </>
  );
}