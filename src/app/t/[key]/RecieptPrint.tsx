"use client";

import { QRCodeSVG } from "qrcode.react";
import type { TokenData } from "@/app/actions/token";

export function ReceiptPrint({
  token,
  dateStr,
  url,
  dict: d,
}: {
  token: TokenData;
  dateStr: string;
  url: string;
  dict: {
    office: string; tokenNo: string; status: Record<string, string>;
    name: string; department: string; date: string; time: string;
    duration: string; minutes: string; urgent: string; vip: string;
    receiptFooter: string;
  };
}) {
  return (
    <div className="hidden print:block print:p-6">
      <div className="mx-auto max-w-sm border-2 border-black p-5 text-black">
        <p className="text-center text-sm font-semibold">{d.office}</p>
        <div className="my-3 border-t border-dashed border-black" />

        <p className="text-center text-xs">{d.tokenNo}</p>
        <p className="text-center text-3xl font-bold tracking-widest">{token.token_no}</p>

        <div className="mt-2 flex justify-center gap-2 text-xs font-medium">
          {token.is_urgent && <span>[{d.urgent}]</span>}
          {token.is_vip && <span>[{d.vip}]</span>}
        </div>

        <div className="my-3 border-t border-dashed border-black" />

        <table className="w-full text-xs">
          <tbody>
            <tr><td className="py-0.5 text-gray-600">{d.name}</td><td className="py-0.5 text-right font-medium">{token.visitor_name}</td></tr>
            <tr><td className="py-0.5 text-gray-600">{d.department}</td><td className="py-0.5 text-right font-medium">{token.department}</td></tr>
            <tr><td className="py-0.5 text-gray-600">{d.date}</td><td className="py-0.5 text-right font-medium">{dateStr}</td></tr>
            {token.preferred_time && (
              <tr><td className="py-0.5 text-gray-600">{d.time}</td><td className="py-0.5 text-right font-medium">{token.preferred_time.slice(0,5)}</td></tr>
            )}
            <tr><td className="py-0.5 text-gray-600">{d.duration}</td><td className="py-0.5 text-right font-medium">{token.duration_min} {d.minutes}</td></tr>
            <tr><td className="py-0.5 text-gray-600">Status</td><td className="py-0.5 text-right font-medium">{d.status[token.status] ?? token.status}</td></tr>
          </tbody>
        </table>

        <div className="my-3 border-t border-dashed border-black" />

        {url && (
          <div className="flex justify-center">
            <QRCodeSVG value={url} size={110} />
          </div>
        )}

        <p className="mt-3 text-center text-[10px] leading-snug text-gray-600">
          {d.receiptFooter}
        </p>
      </div>
    </div>
  );
}