import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { hitRateLimit } from "./rate-limit";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET missing or too short");
  return s;
}
const jwtKey = () => new TextEncoder().encode(secret());
const mac = (nonce: string, answer: number) =>
  createHmac("sha256", secret()).update(`${nonce}:${answer}`).digest("hex");

// Sawal + signed token. Jawab token me plain nahi hota, sirf uska HMAC.
export async function createQuiz() {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 2 + Math.floor(Math.random() * 8);
  const nonce = randomBytes(8).toString("hex");
  const token = await new SignJWT({ n: nonce, h: mac(nonce, a + b) })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m")
    .sign(jwtKey());
  return { question: `${a} + ${b}`, token };
}

// Har sawal sirf ek baar use ho sakta hai.
export async function verifyQuiz(token: string, answer: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, jwtKey());
    const n = String(payload.n);
    const h = String(payload.h);
    const num = Number(answer.trim());
    if (!Number.isInteger(num)) return false;

    const fresh = await hitRateLimit(`quiz:${n}`, 1, 600);
    if (!fresh) return false;

    const expected = Buffer.from(mac(n, num));
    const given = Buffer.from(h);
    return expected.length === given.length && timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}