import en from "./dictionaries/en.json";
import hi from "./dictionaries/hi.json";

export const LANGS = ["hi", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "hi";
export const LANG_COOKIE = "lang";
export const dictionaries = { en, hi } as const;

export function isLang(v: unknown): v is Lang {
  return v === "hi" || v === "en";
}

// "home.title" jaisi key se text nikalta hai. Key na mile to key hi dikhata hai.
export function translate(dict: unknown, key: string): string {
  const val = key.split(".").reduce<unknown>(
    (o, k) =>
      o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined,
    dict
  );
  return typeof val === "string" ? val : key;
}