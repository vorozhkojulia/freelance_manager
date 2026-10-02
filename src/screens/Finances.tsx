import { useMemo, useState } from "react";
import { Check, TriangleAlert, Undo2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { colorOf, invoiceState, projectMoney, totals, type InvoiceState } from "@/lib/derive";
import { fmtShort } from "@/lib/dates";
import { money } from "@/lib/money";
import { cn } from "@/lib/utils";
import { MoneyTape } from "@/components/MoneyTape";
import { InvoicePill, Paper, TONE, Washi } from "@/components/bits";

type Filter = "all" | InvoiceState;
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
];

const ROW_TINT: Record<InvoiceState, string> = {
  overdue: "bg-signal-bg",
  pending: "bg-pending-bg",
  paid: "bg-paid-bg",
};

export function Finances({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const { projects, setPaid } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const t = totals(projects);

  const invoices = useMemo(
    () =>
      projects
        .flatMap((p) => p.invoices.map((i) => ({ ...i, project: p, state: invoiceState(i) })))
        .filter((i) => filter === "all" || i.state === filter)
        .sort((a, b) => {
          const rank = { overdue: 0, pending: 1, paid: 2 } as const;
          return rank[a.state] - rank[b.state] || a.due.localeCompare(b.due);
        }),
    [projects, filter],
  );

  const bars = useMemo(() => projects.filter((p) => p.price > 0).sort((a, b) => b.price - a.price), [projects]);
  const maxPrice = Math.max(1, ...bars.map((p) => p.price));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[88rem] space-y-8 p-4 sm:p-7">
        <header>
          <h1 className="hand text-[44px] font-bold leading-[1.05]">Finances</h1>
          <p className="mt-1 text-ink-2">What you billed, what has landed, and what is still waiting.</p>
        </header>

        {t.overdueCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter("overdue")}
            className="flex w-full items-center gap-3 rounded-xl bg-signal-bg px-4 py-3 text-left text-sm text-signal-ink transition-colors hover:bg-[oklch(0.93_0.05_45)]"
          >
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            <span>
              <strong className="font-semibold">
                {t.overdueCount} invoice{t.overdueCount > 1 ? "s are" : " is"} overdue: {money(t.overdue)}.
              </strong>{" "}
              Show them.
            </span>
          </button>
        )}

        <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0 space-y-9">
            <Paper
              id="inv-list-h"
              title="Invoices"
              tone={TONE.green}
              aside={
                <div role="group" aria-label="Filter invoices" className="flex gap-1">
                  {FILTERS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      aria-pressed={filter === f.value}
                      onClick={() => setFilter(f.value)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                        filter === f.value ? "bg-ink text-paper" : "text-ink-2 hover:bg-desk-deep",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              }
            >
              <ul className="overflow-hidden rounded-lg border border-line">
                {invoices.map((i) => (
                  <li
                    key={i.id}
                    className={cn(
                      "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-line px-3 py-2.5 transition-[filter] last:border-b-0 hover:brightness-[0.97] sm:grid-cols-[minmax(0,1fr)_6rem_6.5rem_5.5rem_2rem]",
                      ROW_TINT[i.state],
                    )}
                  >
                    <button type="button" onClick={() => onOpenProject(i.project.id)} className="min-w-0 text-left">
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: colorOf(projects, i.project.id).deep }} aria-hidden />
                        <span className="truncate text-sm font-semibold">{i.project.name}</span>
                      </span>
                      <span className="mono block truncate pl-[18px] text-[11px] text-ink-2">
                        {i.id} · {i.label}
                      </span>
                    </button>
                    <span className="mono text-right text-sm font-medium sm:text-left">{money(i.amount)}</span>
                    <span className="mono hidden text-xs text-ink-2 sm:block">
                      {i.state === "paid" && i.paidOn ? `paid ${fmtShort(i.paidOn)}` : `due ${fmtShort(i.due)}`}
                    </span>
                    <span className="justify-self-start">
                      <InvoicePill state={i.state} />
                    </span>
                    <button
                      type="button"
                      onClick={() => setPaid(i.project.id, i.id, i.state !== "paid")}
                      aria-label={i.state === "paid" ? `Mark ${i.id} unpaid` : `Mark ${i.id} paid`}
                      title={i.state === "paid" ? "Mark unpaid" : "Mark paid"}
                      className="justify-self-end rounded p-1.5 text-ink-2 hover:bg-white/70"
                    >
                      {i.state === "paid" ? <Undo2 className="size-4" aria-hidden /> : <Check className="size-4" aria-hidden />}
                    </button>
                  </li>
                ))}
                {invoices.length === 0 && <li className="bg-white/60 px-3 py-8 text-center text-sm text-ink-3">No invoices in this view.</li>}
              </ul>
            </Paper>

            <Paper id="split-h" title="By project" tone={TONE.lilac} aside={<span className="mono text-[11px] text-ink-3">bar length = project price</span>}>
              <ul className="space-y-4">
                {bars.map((p) => {
                  const m = projectMoney(p);
                  const pct = (n: number) => `${(n / maxPrice) * 100}%`;
                  return (
                    <li key={p.id}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                        <button type="button" onClick={() => onOpenProject(p.id)} className="flex min-w-0 items-center gap-2 text-left font-semibold hover:underline">
                          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: colorOf(projects, p.id).deep }} aria-hidden />
                          <span className="truncate">{p.name}</span>
                        </button>
                        <span className="mono shrink-0 text-xs text-ink-2">
                          {money(m.paid)} of {money(m.price)}
                        </span>
                      </div>
                      <div
                        className="flex h-3.5 gap-px overflow-hidden rounded-full bg-desk-deep"
                        role="img"
                        aria-label={`${p.name}: paid ${money(m.paid)}, awaiting ${money(m.awaiting)}, to invoice ${money(m.uninvoiced)}`}
                      >
                        <div className="bg-paid" style={{ width: pct(m.paid) }} />
                        <div className="bg-pending" style={{ width: pct(m.awaiting) }} />
                        <div className="hatch" style={{ width: pct(m.uninvoiced) }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mono mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-2">
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-[3px] bg-paid" aria-hidden /> paid
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-[3px] bg-pending" aria-hidden /> awaiting payment
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="hatch size-3 rounded-[3px] border border-line-strong" aria-hidden /> not yet invoiced
                </span>
              </div>
            </Paper>
          </div>

          <aside className="relative lg:sticky lg:top-2">
            <Washi tone={TONE.yellow} className="-top-3 z-20" />
            <MoneyTape projects={projects} onOpenProject={onOpenProject} className="pt-1" soft />
          </aside>
        </div>
      </div>
    </div>
  );
}
