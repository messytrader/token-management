"use client";

function beep(freq: number, durationMs: number, ctx: AudioContext, delayMs = 0) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);

  const start = ctx.currentTime + delayMs / 1000;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
  gain.gain.linearRampToValueAtTime(0, start + durationMs / 1000);

  osc.start(start);
  osc.stop(start + durationMs / 1000 + 0.02);
}

let ctxSingleton: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!ctxSingleton) ctxSingleton = new AudioContext();
  return ctxSingleton;
}

export function isAudioUnlocked(): boolean {
  return ctxSingleton !== null && ctxSingleton.state === "running";
}

export async function unlockAudio(): Promise<boolean> {
  const ctx = getCtx();
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // ignore
    }
  }
  return ctx.state === "running";
}

export function initAutoUnlock(onUnlocked?: () => void) {
  const unlock = async () => {
    const ok = await unlockAudio();
    if (ok) {
      onUnlocked?.();
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
    }
  };
  document.addEventListener("click", unlock);
  document.addEventListener("touchstart", unlock);
  document.addEventListener("keydown", unlock);
}

// Har chime se pehle resume try karta hai — agar suspended ho gaya (tab
// background me gaya tha, etc.) to bhi chime bajne ka mauka milta hai.
async function ensureRunning(ctx: AudioContext) {
  if (ctx.state === "suspended") {
    try { await ctx.resume(); } catch { /* ignore */ }
  }
}

export async function playUrgentChime() {
  const ctx = getCtx();
  await ensureRunning(ctx);
  beep(740, 160, ctx, 0);
  beep(920, 200, ctx, 200);
  beep(740, 160, ctx, 500); // urgent: teen beeps, zyada dhyan kheeche
}

export async function playVipChime() {
  const ctx = getCtx();
  await ensureRunning(ctx);
  beep(620, 220, ctx, 0);
}

export async function playNewRequestChime() {
  const ctx = getCtx();
  await ensureRunning(ctx);
  beep(520, 140, ctx, 0);
}