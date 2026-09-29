import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { supabaseAdmin } from "./supabase/admin";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 din

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET missing or too short");
  return new TextEncoder().encode(s);
}

export async function createSession(userId: string, sessionVersion: number) {
  const token = await new SignJWT({ sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("60d")
    .sign(key());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export type SessionUser = {
  id: string;
  name: string;
  mobile: string;
  language: "hi" | "en";
};

// Logged-in user ya null. Har baar database se bhi check karta hai
// (user hata diya gaya ho ya PIN badla ho to purana cookie kaam nahi karega).
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (!payload.sub) return null;
    const { data } = await supabaseAdmin()
      .from("app_users")
      .select("id, name, mobile, language, session_version")
      .eq("id", payload.sub)
      .maybeSingle();
    if (!data || data.session_version !== payload.sv) return null;
    return {
      id: data.id,
      name: data.name,
      mobile: data.mobile,
      language: data.language,
    };
  } catch {
    return null;
  }
}