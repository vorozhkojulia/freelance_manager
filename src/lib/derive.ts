import type { Invoice, Project } from "./types";
import { addDays, diffDays, parse, startOfWeek, today } from "./dates";

export const CAPACITY = 35; // billable hours per week

/** Sticky-note palette. `bg` fills notes, `deep` is the legible chart/marker tone. */
export const STICKY = [
  { name: "lemon", bg: "oklch(0.93 0.15 100)", deep: "oklch(0.8 0.16 95)" },
  { name: "pink", bg: "oklch(0.86 0.12 5)", deep: "oklch(0.7 0.17 5)" },
  { name: "mint", bg: "oklch(0.89 0.12 165)", deep: "oklch(0.72 0.13 165)" },
  { name: "sky", bg: "oklch(0.87 0.09 235)", deep: "oklch(0.72 0.12 240)" },
  { name: "peach", bg: "oklch(0.87 0.11 55)", deep: "oklch(0.74 0.15 50)" },
  { name: "lilac", bg: "oklch(0.85 0.09 305)", deep: "oklch(0.7 0.14 305)" },
] as const;

/** Stable per-project colour: position in the (append-only) project list. */
export function colorOf(projects: Project[], id: string) {
  const i = projects.findIndex((p) => p.id === id);
  return STICKY[(i < 0 ? 0 : i) % STICKY.length];
}

export type InvoiceState = "paid" | "pending" | "overdue";
export function invoiceState(inv: Invoice): InvoiceState {
  if (inv.paidOn) return "paid";
  return diffDays(today(), parse(inv.due)) < 0 ? "overdue" : "pending";
}

export function projectMoney(p: Project) {
  const invoiced = p.invoices.reduce((s, i) => s + i.amount, 0);
  const paid = p.invoices.reduce((s, i) => s + (i.paidOn ? i.amount : 0), 0);
  const awaiting = invoiced - paid;
  const uninvoiced = p.status === "closed" ? 0 : Math.max(0, p.price - invoiced);
  return { price: p.price, invoiced, paid, awaiting, uninvoiced };
}

export function totals(projects: Project[]) {
  const t = { received: 0, awaiting: 0, overdue: 0, overdueCount: 0, uninvoiced: 0 };
  for (const p of projects) {
    const m = projectMoney(p);
    t.received += m.paid;
    t.awaiting += m.awaiting;
    t.uninvoiced += m.uninvoiced;
    for (const i of p.invoices)
      if (invoiceState(i) === "overdue") {
        t.overdue += i.amount;
        t.overdueCount += 1;
      }
  }
  return { ...t, expected: t.awaiting + t.uninvoiced };
}

export function progress(p: Project) {
  const done = p.tasks.filter((t) => t.done).length;
  return { done, total: p.tasks.length, ratio: p.tasks.length ? done / p.tasks.length : 0 };
}

export interface WeekLoad {
  start: Date;
  hours: number;
  over: boolean;
  deadlines: Project[];
}

/** Weekly workload from open projects' effort; overloaded when above CAPACITY. */
export function weeklyLoad(projects: Project[], from: Date, weeks: number): WeekLoad[] {
  const open = projects.filter((p) => p.status !== "closed");
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(from, i * 7);
    const end = addDays(start, 6);
    let hours = 0;
    const deadlines: Project[] = [];
    for (const p of open) {
      const s = parse(p.start);
      const e = parse(p.deadline);
      if (s <= end && e >= start) hours += p.effort;
      if (e >= start && e <= end) deadlines.push(p);
    }
    return { start, hours, over: hours > CAPACITY, deadlines };
  });
}

export const currentWeekStart = () => startOfWeek(today());

export function daysLeft(p: Project) {
  return diffDays(today(), parse(p.deadline));
}
