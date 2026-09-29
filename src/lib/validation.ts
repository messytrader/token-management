// Mobile ko 10 digit me badalta hai (+91, 0 wagairah hata kar). Galat ho to null.
export function normalizeMobile(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

const COMMON_PINS = new Set([
  "121212", "112233", "123123", "123321", "159753", "696969", "143143",
  "102030", "111222", "000123", "789456", "147258",
]);

export function pinProblem(pin: string): "FORMAT" | "WEAK" | null {
  if (!/^\d{6}$/.test(pin)) return "FORMAT";
  if (/^(\d)\1{5}$/.test(pin)) return "WEAK"; // 111111
  if ("0123456789".includes(pin) || "9876543210".includes(pin)) return "WEAK"; // 123456, 654321
  if (COMMON_PINS.has(pin)) return "WEAK";
  return null;
}

export function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function nameOk(raw: string): boolean {
  const n = cleanName(raw);
  return n.length >= 2 && n.length <= 80;
}