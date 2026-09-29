"use client";

import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Logo } from "./Logo";
import { LanguageToggle } from "./LanguageToggle";
import { SignOutForm } from "./SignOutForm";

type NavbarProps = {
  backHref?: string;
  backLabel?: string;
  signOutAction?: () => void | Promise<void>;
  signOutLabel?: string;
  showHelp?: boolean;
};

export function Navbar({ backHref, backLabel, signOutAction, signOutLabel, showHelp = true }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur">
      <div className="flex w-full items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
        <div className="flex min-w-0 items-center gap-4">
          {backHref && (
            <Link
              href={backHref}
              aria-label={backLabel ?? "Back"}
              className="grid size-11 shrink-0 place-items-center rounded-full border text-muted-foreground hover:bg-muted"
            >
              <ArrowLeft className="size-5" />
            </Link>
          )}
          <Link href="/" className="min-w-0">
            <Logo size="large" />
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {showHelp && (
            <Link
              href="/help"
              className="grid size-11 place-items-center rounded-full border text-muted-foreground hover:bg-muted"
              aria-label="Help"
              title="सहायता"
            >
              <HelpCircle className="size-5" />
            </Link>
          )}
          <LanguageToggle />
          {signOutAction && <SignOutForm action={signOutAction} label={signOutLabel ?? "Sign out"} />}
        </div>
      </div>
    </header>
  );
}