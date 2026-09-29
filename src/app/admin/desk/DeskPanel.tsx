"use client";

import { useState, useTransition } from "react";
import { KeyRound, Plus, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { staffLogout } from "@/app/admin/actions";
import { createWalkin, generateResetCode } from "../desk/action";
import { DEPARTMENTS } from "../../../lib/department";
import {Navbar} from "../../../components/Navbar";

type Dict = Record<string, string>;

export function DeskPanel({ staffName, dict: d, lang }: { staffName: string; dict: Dict; lang: "hi" | "en" }) {
  const [tab, setTab] = useState<"walkin" | "reset">("walkin");
  const [pending, startTransition] = useTransition();

  // Walk-in form
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [department, setDepartment] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(10);
  const [isUrgent, setIsUrgent] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  // Reset form
  const [resetMobile, setResetMobile] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const submitWalkin = () => {
    if (!name.trim() || !department) {
      toast.error("Fill required fields");
      return;
    }
    startTransition(async () => {
      const res = await createWalkin({
        visitorName: name, mobile, address, department, reason, durationMin: duration, isUrgent,
      });
      if (res.ok) {
        setCreatedToken(res.tokenNo);
        setName(""); setMobile(""); setAddress(""); setReason(""); setIsUrgent(false);
        toast.success(d.created);
      } else {
        toast.error(res.error);
      }
    });
  };

  const submitReset = () => {
    startTransition(async () => {
      const res = await generateResetCode(resetMobile);
      if (res.ok) setGeneratedCode(res.code);
      else toast.error(res.error === "USER_NOT_FOUND" ? d.userNotFound : res.error);
    });
  };

  const inputBase = "h-12 rounded-xl text-base";

  return (
        <main className="min-h-dvh bg-gradient-to-b from-secondary to-background">
      <div className="mx-auto max-w-xl px-5 py-8 sm:px-8 lg:px-12">
        <Navbar signOutAction={staffLogout} signOutLabel={d.signOut} showHelp={false} />

        <div className="mt-6">
          <h1 className="text-lg font-semibold">{d.title}</h1>
          <p className="text-sm text-muted-foreground">{staffName}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 rounded-full border bg-card p-1 shadow-sm">
          <button onClick={() => setTab("walkin")}
            className={`rounded-full py-2.5 text-sm font-medium ${tab === "walkin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {d.walkinTab}
          </button>
          <button onClick={() => setTab("reset")}
            className={`rounded-full py-2.5 text-sm font-medium ${tab === "reset" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {d.resetTab}
          </button>
        </div>

        {tab === "walkin" && (
          <div className="mt-4 space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
            {createdToken && (
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <p className="text-sm text-emerald-700">{d.created}</p>
                <p className="text-2xl font-bold tracking-wide text-emerald-800">{createdToken}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{d.name}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className={inputBase} />
            </div>
            <div className="space-y-1.5">
              <Label>{d.mobile}</Label>
              <Input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric" maxLength={10} className={inputBase} />
            </div>
            <div className="space-y-1.5">
              <Label>{d.address}</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className={inputBase} />
            </div>
            <div className="space-y-1.5">
              <Label>{d.department}</Label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}
                className="h-12 w-full rounded-xl border border-input bg-transparent px-3 text-base">
                <option value="">—</option>
                {DEPARTMENTS.map((dep) => (
                  <option key={dep.value} value={dep.value}>{lang === "hi" ? dep.hi : dep.en}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{d.reason}</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} className={inputBase} />
            </div>
            <div className="space-y-1.5">
              <Label>{d.duration}</Label>
              <Input type="number" min={5} max={120} step={5} value={duration}
                onChange={(e) => setDuration(Number(e.target.value))} className={`${inputBase} w-28`} />
            </div>
            <label className="flex items-center gap-2.5 text-sm">
              <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="size-4" />
              {d.urgent}
            </label>
            <Button size="lg" className="w-full gap-1.5" disabled={pending} onClick={submitWalkin}>
              <Plus className="size-4" /> {d.createBtn}
            </Button>
          </div>
        )}

        {tab === "reset" && (
          <div className="mt-4 space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
            <div className="space-y-1.5">
              <Label>{d.resetMobile}</Label>
              <Input value={resetMobile} onChange={(e) => setResetMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric" maxLength={10} className={inputBase} />
            </div>
            <Button size="lg" className="w-full gap-1.5" disabled={pending} onClick={submitReset}>
              <KeyRound className="size-4" /> {d.generateCode}
            </Button>
            {generatedCode && (
              <div className="rounded-xl bg-amber-50 p-4 text-center">
                <p className="text-sm text-amber-800">{d.codeGenerated}</p>
                <p className="mt-1 text-3xl font-bold tracking-widest text-amber-900">{generatedCode}</p>
                <p className="mt-2 text-xs text-amber-700">{d.resetNote}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}