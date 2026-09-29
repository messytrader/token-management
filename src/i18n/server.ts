import "server-only";
import { cookies } from "next/headers";
import {
  DEFAULT_LANG,
  LANG_COOKIE,
  dictionaries,
  isLang,
  translate,
  type Lang,
} from "./config";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : DEFAULT_LANG;
}

export async function getT() {
  const lang = await getLang();
  const dict = dictionaries[lang];
  return { lang, t: (key: string) => translate(dict, key) };
}