"use client";

import { useLang } from "../i18n/LanguageProvide";

export function LanguageToggle() {
  const { lang, setLang } = useLang();

  const item = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center rounded-full border bg-card p-1 shadow-sm"
    >
      <button
        type="button"
        onClick={() => setLang("hi")}
        aria-pressed={lang === "hi"}
        className={item(lang === "hi")}
      >
        हिन्दी
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={item(lang === "en")}
      >
        EN
      </button>
    </div>
  );
}