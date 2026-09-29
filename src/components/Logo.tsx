import { Landmark } from "lucide-react";

export function Logo({ size = "default" }: { size?: "default" | "large" }) {
  const box = size === "large" ? "size-12" : "size-10";
  const icon = size === "large" ? "size-6" : "size-5";
  return (
    <div className="flex items-center gap-2.5">
      <span className={`grid ${box} shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm`}>
        <Landmark className={icon} aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-bold text-primary">IGIMS</p>
        <p className="text-[11px] text-muted-foreground">निदेशक कार्यालय</p>
      </div>
    </div>
  );
}