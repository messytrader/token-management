"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createQuiz, verifyQuiz } from "@/lib/quiz";
import { createSession, destroySession } from "@/lib/session";
import { getClientIp, hitRateLimit } from "@/lib/rate-limit";
import { getLang } from "@/i18n/server";
import { cleanName, nameOk, normalizeMobile, pinProblem } from "@/lib/validation";

export type ErrorCode =
  | "NAME" | "INVALID_MOBILE" | "INVALID_PIN_FORMAT" | "WEAK_PIN" | "CONSENT"
  | "QUIZ_WRONG" | "INVALID_CREDENTIALS" | "LOCKED" | "MOBILE_EXISTS"
  | "TOO_MANY" | "SERVER_ERROR" | "PIN_MISMATCH" ;

export type AuthResult =
  | { ok: true }
  | { ok: false; code: ErrorCode; minutes?: number };

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
// Mobile na milne par bhi bcrypt chalate hain, taaki response ka time same rahe.
const DUMMY_HASH = bcrypt.hashSync("000000", 10);

const fail = (code: ErrorCode, minutes?: number): AuthResult => ({
  ok: false,
  code,
  minutes,
});

export async function getQuiz() {
  return createQuiz();
}

type LoginInput = {
  mobile: string;
  pin: string;
  quizToken: string;
  quizAnswer: string;
};

export async function login(input: LoginInput): Promise<AuthResult> {
  try {
    const ip = await getClientIp();
    if (!(await hitRateLimit(`login:ip:${ip}`, 60, 600))) return fail("TOO_MANY");

    const mobile = normalizeMobile(input.mobile);
    if (!mobile) return fail("INVALID_MOBILE");
    if (!/^\d{6}$/.test(input.pin)) return fail("INVALID_PIN_FORMAT");
    if (!(await verifyQuiz(input.quizToken, input.quizAnswer))) return fail("QUIZ_WRONG");

    const db = supabaseAdmin();
    const { data: user } = await db
      .from("app_users")
      .select("id, pin_hash, failed_attempts, locked_until, session_version")
      .eq("mobile", mobile)
      .maybeSingle();

    if (!user) {
      await bcrypt.compare(input.pin, DUMMY_HASH);
      return fail("INVALID_CREDENTIALS");
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutes = Math.ceil(
        (new Date(user.locked_until).getTime() - Date.now()) / 60000
      );
      return fail("LOCKED", minutes);
    }

    const match = await bcrypt.compare(input.pin, user.pin_hash);
    if (!match) {
      const attempts = (user.failed_attempts ?? 0) + 1;
      const lock = attempts >= MAX_ATTEMPTS;
      await db
        .from("app_users")
        .update({
          failed_attempts: lock ? 0 : attempts,
          locked_until: lock
            ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString()
            : null,
        })
        .eq("id", user.id);
      return lock ? fail("LOCKED", LOCK_MINUTES) : fail("INVALID_CREDENTIALS");
    }

    await db
      .from("app_users")
      .update({
        failed_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    await createSession(user.id, user.session_version);
    return { ok: true };
  } catch (e) {
    console.error("login error:", e);
    return fail("SERVER_ERROR");
  }
}

type SignupInput = LoginInput & { name: string; consent: boolean };

export async function signup(input: SignupInput): Promise<AuthResult> {
  try {
    const ip = await getClientIp();
    if (!(await hitRateLimit(`signup:ip:${ip}`, 20, 3600))) return fail("TOO_MANY");

    if (!nameOk(input.name)) return fail("NAME");
    const mobile = normalizeMobile(input.mobile);
    if (!mobile) return fail("INVALID_MOBILE");
    const problem = pinProblem(input.pin);
    if (problem === "FORMAT") return fail("INVALID_PIN_FORMAT");
    if (problem === "WEAK") return fail("WEAK_PIN");
    if (!input.consent) return fail("CONSENT");
    if (!(await verifyQuiz(input.quizToken, input.quizAnswer))) return fail("QUIZ_WRONG");

    const db = supabaseAdmin();
    const { data: existing } = await db
      .from("app_users")
      .select("id")
      .eq("mobile", mobile)
      .maybeSingle();
    if (existing) return fail("MOBILE_EXISTS");

        const pin_hash = await bcrypt.hash(input.pin, 10);
    const { data: created, error } = await db
      .from("app_users")
      .insert({
        name: cleanName(input.name),
        mobile,
        pin_hash,
        language: (await getLang()) ?? "hi",
        consent_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      })
      .select("id, session_version")
      .single();

    if (error || !created) {
      if (error?.code === "23505") return fail("MOBILE_EXISTS"); // unique mobile
      console.error("signup insert error:", error?.message);
      return fail("SERVER_ERROR");
    }

    await createSession(created.id, created.session_version);
    return { ok: true };
  } catch (e) {
    console.error("signup error:", e);
    return fail("SERVER_ERROR");
  }
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

type ResetPinInput = {
  mobile: string;
  code: string;
  newPin: string;
  confirmPin: string;
};

export async function resetPinWithCode(input: ResetPinInput): Promise<AuthResult> {
  try {
    const ip = await getClientIp();
    if (!(await hitRateLimit(`resetpin:ip:${ip}`, 20, 600))) return fail("TOO_MANY");

    const mobile = normalizeMobile(input.mobile);
    if (!mobile) return fail("INVALID_MOBILE");
    if (input.newPin !== input.confirmPin) return fail("PIN_MISMATCH" as ErrorCode);
    const problem = pinProblem(input.newPin);
    if (problem === "FORMAT") return fail("INVALID_PIN_FORMAT");
    if (problem === "WEAK") return fail("WEAK_PIN");

    if (!(await hitRateLimit(`resetpin:mobile:${mobile}`, 8, 600))) return fail("TOO_MANY");

    const db = supabaseAdmin();
    const { data: user } = await db
      .from("app_users")
      .select("id")
      .eq("mobile", mobile)
      .maybeSingle();
    if (!user) return fail("INVALID_CREDENTIALS");

    const { data: challenge } = await db
      .from("otp_challenges")
      .select("id, code_hash, expires_at, attempts, consumed_at")
      .eq("mobile", mobile)
      .eq("purpose", "staff_reset")
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!challenge || new Date(challenge.expires_at) < new Date()) {
      return fail("INVALID_CREDENTIALS");
    }
    if (challenge.attempts >= 5) return fail("INVALID_CREDENTIALS");

    const match = await bcrypt.compare(input.code, challenge.code_hash);
    if (!match) {
      await db
        .from("otp_challenges")
        .update({ attempts: challenge.attempts + 1 })
        .eq("id", challenge.id);
      return fail("INVALID_CREDENTIALS");
    }

    const pin_hash = await bcrypt.hash(input.newPin, 10);
    await db
      .from("app_users")
      .update({
        pin_hash,
        failed_attempts: 0,
        locked_until: null,
        session_version: undefined, // trigger se nahi, seedha increment neeche
      })
      .eq("id", user.id);

    // Purane sessions/cookies invalid karne ke liye session_version badhao
    await db.rpc("increment_session_version", { p_user_id: user.id }).then(
      () => {},
      () => {} // function na ho to bhi PIN reset ho chuka hai, ignore
    );

    await db
      .from("otp_challenges")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", challenge.id);

    return { ok: true };
  } catch (e) {
    console.error("resetPin error:", e);
    return fail("SERVER_ERROR");
  }
}
  