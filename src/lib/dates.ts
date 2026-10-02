const MS_DAY = 86_400_000;

export function today(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
export function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function toISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
export function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_DAY);
}
export function startOfWeek(d: Date): Date {
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(d, -dow);
}
const short = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
const dm = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const long = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });
export const fmtShort = (iso: string) => short.format(parse(iso));
export const fmtDM = (d: Date) => dm.format(d);
export const fmtLong = (d: Date) => long.format(d);

/** "in 6 days", "today", "3 days late" */
export function relDays(iso: string): string {
  const n = diffDays(today(), parse(iso));
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "1 day late";
  return n > 0 ? `in ${n} days` : `${-n} days late`;
}
