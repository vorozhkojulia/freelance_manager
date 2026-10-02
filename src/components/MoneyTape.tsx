import { useMemo, useState } from "react";
import { colorOf, invoiceState, projectMoney, totals } from "@/lib/derive";
import type { Project } from "@/lib/types";
import { fmtShort } from "@/lib/dates";
import { money } from "@/lib/money";
import { cn } from "@/lib/utils";

type Seg = "received" | "awaiting" | "toinvoice";

const SWATCH: Record<Seg, string> = {
  received: "bg-paid",
  awaiting: "bg-pending",
  toinvoice: "hatch border border-line-strong",
};

const ROWS = 5;
const ROW_H = 44; // px, fixed so the receipt never changes height when the selection changes

/** Finance summary set as a receipt. Each line is also the legend of the bar under it. */
export function MoneyTape({
  projects,
  onOpenProject,
  className,
  soft,
}: {
  projects: Project[];
  onOpenProject?: (id: string) => void;
  className?: string;
  /** lighter shadow for white pages */
  soft?: boolean;
}) {
  const t = totals(projects);
  const [seg, setSeg] = useState<Seg>("awaiting");
  const sum = t.received + t.awaiting + t.uninvoiced || 1;

  const items = useMemo(() => {
    const rows: { key: string; id: string; name: string; sub: string; amount: number; late?: boolean }[] = [];
    for (const p of projects) {
      if (seg === "toinvoice") {
        const m = projectMoney(p);
        if (m.uninvoiced > 0) rows.push({ key: p.id, id: p.id, name: p.name, sub: `${p.status} project`, amount: m.uninvoiced });
        continue;
      }
      for (const i of p.invoices) {
        const st = invoiceState(i);
        if (seg === "received" && st === "paid")
          rows.push({ key: i.id, id: p.id, name: p.name, sub: `${i.label} · paid ${fmtShort(i.paidOn!)}`, amount: i.amount });
        if (seg === "awaiting" && st !== "paid")
          rows.push({ key: i.id, id: p.id, name: p.name, sub: `${i.label} · ${st === "overdue" ? "overdue since" : "due"} ${fmtShort(i.due)}`, amount: i.amount, late: st === "overdue" });
      }
    }
    return rows.sort((a, b) => b.amount - a.amount);
  }, [projects, seg]);

  const lines: { key: Seg; label: string; hint: string; value: number; tone: string }[] = [
    { key: "received", label: "Received", hint: "paid invoices", value: t.received, tone: "text-paid" },
    { key: "awaiting", label: "Awaiting payment", hint: t.overdueCount ? `${money(t.overdue)} of it is overdue` : "invoiced, not paid yet", value: t.awaiting, tone: "text-pending" },
    { key: "toinvoice", label: "Not yet invoiced", hint: "work still to bill", value: t.uninvoiced, tone: "text-ink" },
  ];

  return (
    <div className={cn(soft ? "drop-shadow-[0_8px_10px_oklch(0.3_0.04_270/0.14)]" : "drop-shadow-[0_10px_12px_oklch(0.1_0.05_270/0.45)]", className)}>
      <section className="tape-paper px-4 text-ink" aria-label="Money summary">
        <div className="label mb-2 text-center">Money · EUR</div>
        <div role="radiogroup" aria-label="Money breakdown" className="space-y-1">
          {lines.map((l) => {
            const active = seg === l.key;
            return (
              <button
                key={l.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSeg(l.key)}
                onMouseEnter={() => setSeg(l.key)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md border px-2 py-1.5 text-left text-ink transition-colors",
                  active ? "border-ink bg-paper-dim" : "border-transparent hover:bg-paper-dim",
                )}
              >
                <span className={cn("size-3.5 shrink-0 rounded-[3px]", SWATCH[l.key])} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-tight">{l.label}</span>
                  <span className={cn("mono block truncate text-[10.5px] leading-tight", l.key === "awaiting" && t.overdueCount ? "text-signal-ink" : "text-ink-3")}>{l.hint}</span>
                </span>
                <span className={cn("mono text-[15px] font-semibold", l.tone)}>{money(l.value)}</span>
              </button>
            );
          })}
        </div>

        <div className="mx-2 mt-2 flex items-baseline justify-between border-t border-dashed border-line-strong pt-2">
          <span className="text-sm font-semibold">Still expected</span>
          <span className="mono text-xl font-semibold">{money(t.expected)}</span>
        </div>
        <div className="mono mx-2 text-[10.5px] text-ink-3">awaiting + not yet invoiced</div>

        <div className="mx-2 mt-3 flex h-3 gap-px overflow-hidden rounded-full bg-desk-deep" aria-hidden>
          {(
            [
              ["received", t.received],
              ["awaiting", t.awaiting],
              ["toinvoice", t.uninvoiced],
            ] as const
          ).map(([k, v]) => (
            <button
              key={k}
              type="button"
              tabIndex={-1}
              onClick={() => setSeg(k)}
              onMouseEnter={() => setSeg(k)}
              className={cn(SWATCH[k], "border-0 transition-opacity duration-200", seg === k ? "opacity-100" : "opacity-35")}
              style={{ flexGrow: v / sum, flexBasis: 0 }}
            />
          ))}
        </div>
        <div className="mono mx-2 mt-1 text-[10.5px] text-ink-3">Whole bar = {money(sum)} on your books</div>

        <ul className="mx-2 mt-3 overflow-y-auto border-t border-line pt-1" style={{ height: ROWS * ROW_H + 4 }} aria-label="Breakdown">
          {items.map((r) => (
            <li key={r.key}>
              <button
                type="button"
                onClick={() => onOpenProject?.(r.id)}
                className="flex w-full items-center gap-2 rounded px-1 text-left text-ink hover:bg-paper-dim"
                style={{ height: ROW_H }}
              >
                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: colorOf(projects, r.id).deep }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium leading-tight">{r.name}</span>
                  <span className={cn("mono block truncate text-[10.5px]", r.late ? "text-signal-ink" : "text-ink-3")}>{r.sub}</span>
                </span>
                <span className="mono text-[13px]">{money(r.amount)}</span>
              </button>
            </li>
          ))}
          {items.length === 0 && <li className="px-1 py-3 text-sm text-ink-3">Nothing here.</li>}
        </ul>
      </section>
    </div>
  );
}
