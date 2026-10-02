import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, TriangleAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { CAPACITY, colorOf, currentWeekStart, weeklyLoad } from "@/lib/derive";
import { addDays, diffDays, fmtDM, fmtShort, parse, relDays, today } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Paper, TONE } from "@/components/bits";

const SPANS = [8, 13, 26] as const;
const DAY = 15; // px per day
const LABEL_W = 184;
const LOAD_H = 132;
const OVER_HATCH = "repeating-linear-gradient(135deg, oklch(0.5 0.18 38 / 0.7) 0 3px, oklch(0.5 0.18 38 / 0.18) 3px 7px)";

export function Timeline({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const { projects } = useStore();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [span, setSpan] = useState<(typeof SPANS)[number]>(13);
  const [offset, setOffset] = useState(0); // weeks away from the default view (which starts one week back)
  const from = useMemo(() => addDays(currentWeekStart(), (offset - 1) * 7), [offset]);
  const to = addDays(from, span * 7 - 1);
  const weeks = useMemo(() => weeklyLoad(projects, from, span), [projects, from, span]);
  const width = span * 7 * DAY;
  const todayDay = diffDays(from, today());
  const todayVisible = todayDay >= 0 && todayDay < span * 7;
  const todayX = todayDay * DAY + DAY / 2;

  const open = useMemo(() => projects.filter((p) => p.status !== "closed"), [projects]);
  const stacks = useMemo(
    () =>
      weeks.map((w) => {
        const end = addDays(w.start, 6);
        return open.filter((p) => parse(p.start) <= end && parse(p.deadline) >= w.start);
      }),
    [weeks, open],
  );
  const maxHours = Math.max(CAPACITY * 1.4, ...weeks.map((w) => w.hours));

  const rows = useMemo(() => {
    const rank = { active: 0, planned: 1, closed: 2 } as const;
    return [...projects]
      .filter((p) => {
        const end = parse(p.status === "closed" ? (p.closedOn ?? p.deadline) : p.deadline);
        return end >= from && parse(p.start) <= to;
      })
      .sort((a, b) => rank[a.status] - rank[b.status] || a.deadline.localeCompare(b.deadline));
  }, [projects, from, to]);

  const crunch = weeks.filter((w) => w.over && w.start >= currentWeekStart());
  const x = (iso: string) => diffDays(from, parse(iso)) * DAY;
  const dim = (id: string) => hoverId !== null && hoverId !== id;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[88rem] space-y-8 p-4 sm:p-7">
        <header>
          <h1 className="hand text-[44px] font-bold leading-[1.05]">Timeline</h1>
          <p className="mt-1 text-ink-2">Every deadline and every hour of the weeks you pick, on one sheet.</p>
        </header>

        {crunch.length > 0 ? (
          <ul className="space-y-2">
            {crunch.map((w) => (
              <li key={w.start.toISOString()} className="flex items-start gap-3 rounded-xl bg-signal-bg px-4 py-3 text-sm text-signal-ink">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <strong className="font-semibold">
                    Week of {fmtDM(w.start)}: {w.hours} h
                  </strong>{" "}
                  planned against your {CAPACITY} h limit, {w.hours - CAPACITY} h over
                  {w.deadlines.length > 0 && <> · due: {w.deadlines.map((p) => `${p.name} (${fmtShort(p.deadline)})`).join(", ")}</>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-paid-bg px-4 py-3 text-sm text-paid">No overbooked weeks in view.</p>
        )}

        <Paper
          id="tl-h"
          title="Load and deadlines"
          tone={TONE.blue}
          aside={
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono text-[11px] text-ink-2">
                {fmtDM(from)} – {fmtDM(to)} · limit {CAPACITY} h / week
              </span>
              <div role="group" aria-label="Move the time window" className="flex items-center gap-0.5 rounded-md border border-line-strong bg-paper p-0.5">
                <button type="button" onClick={() => setOffset((o) => o - 4)} aria-label="Back 4 weeks" title="Back 4 weeks" className="grid size-7 place-items-center rounded text-ink-2 hover:bg-desk">
                  <ChevronsLeft className="size-4" aria-hidden />
                </button>
                <button type="button" onClick={() => setOffset((o) => o - 1)} aria-label="Back 1 week" title="Back 1 week" className="grid size-7 place-items-center rounded text-ink-2 hover:bg-desk">
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setOffset(0)}
                  disabled={offset === 0}
                  className="rounded px-2 py-1 text-xs font-medium text-ink-2 hover:bg-desk disabled:text-ink-3 disabled:hover:bg-transparent"
                >
                  This week
                </button>
                <button type="button" onClick={() => setOffset((o) => o + 1)} aria-label="Forward 1 week" title="Forward 1 week" className="grid size-7 place-items-center rounded text-ink-2 hover:bg-desk">
                  <ChevronRight className="size-4" aria-hidden />
                </button>
                <button type="button" onClick={() => setOffset((o) => o + 4)} aria-label="Forward 4 weeks" title="Forward 4 weeks" className="grid size-7 place-items-center rounded text-ink-2 hover:bg-desk">
                  <ChevronsRight className="size-4" aria-hidden />
                </button>
              </div>
              <div role="group" aria-label="Weeks shown" className="flex gap-1">
                {SPANS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={span === n}
                    onClick={() => setSpan(n)}
                    className={cn("rounded-full px-2.5 py-1 text-xs font-medium transition-colors", span === n ? "bg-ink text-paper" : "text-ink-2 hover:bg-desk-deep")}
                  >
                    {n} wk
                  </button>
                ))}
              </div>
            </div>
          }
        >
          <div className="overflow-x-auto rounded-lg border border-line bg-white/60">
            <div style={{ width: LABEL_W + width }} className="relative">
              {/* week header */}
              <div className="flex border-b border-line">
                <div className="sticky left-0 z-20 shrink-0 border-r border-line bg-paper" style={{ width: LABEL_W }} />
                <div className="flex" style={{ width }}>
                  {weeks.map((w) => {
                    const isNow = w.start.getTime() === currentWeekStart().getTime();
                    return (
                      <div
                        key={w.start.toISOString()}
                        className={cn("mono border-l border-line px-1.5 py-2 text-[11px]", isNow ? "font-semibold text-signal-ink" : "text-ink-3")}
                        style={{ width: DAY * 7 }}
                      >
                        {fmtDM(w.start)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* workload, stacked by project, hatched above the limit */}
              <div className="flex border-b border-line">
                <div className="sticky left-0 z-20 shrink-0 border-r border-line bg-paper p-3" style={{ width: LABEL_W }}>
                  <div className="text-sm font-semibold">Workload</div>
                  <div className="mono text-[11px] text-ink-3">hours per week</div>
                  <div className="mono mt-2 flex items-center gap-1.5 text-[10.5px] text-ink-2">
                    <span className="inline-block h-2.5 w-4 border-t-2 border-signal-ink" style={{ backgroundImage: OVER_HATCH }} aria-hidden />
                    over the limit
                  </div>
                </div>
                <div className="relative flex items-end" style={{ width, height: LOAD_H }}>
                  {weeks.map((w, i) => (
                    <div key={w.start.toISOString()} className="relative flex h-full items-end border-l border-line px-4" style={{ width: DAY * 7 }}>
                      {w.hours > 0 && (
                        <div className="relative flex min-w-0 flex-1 flex-col-reverse gap-px" style={{ height: `${(w.hours / maxHours) * 100}%` }}>
                          {stacks[i].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => onOpenProject(p.id)}
                              onMouseEnter={() => setHoverId(p.id)}
                              onMouseLeave={() => setHoverId(null)}
                              onFocus={() => setHoverId(p.id)}
                              onBlur={() => setHoverId(null)}
                              aria-label={`Week of ${fmtDM(w.start)}: ${p.name}, ${p.effort} hours`}
                              title={`${p.name} · ${p.effort} h`}
                              className={cn("w-full rounded-[2px] transition-opacity duration-200", dim(p.id) && "opacity-25")}
                              style={{ height: `${(p.effort / w.hours) * 100}%`, backgroundColor: colorOf(projects, p.id).deep }}
                            />
                          ))}
                          {w.over && (
                            <div
                              className="pointer-events-none absolute inset-x-0 top-0 border-t-2 border-signal-ink"
                              style={{ height: `${((w.hours - CAPACITY) / w.hours) * 100}%`, backgroundImage: OVER_HATCH }}
                              aria-hidden
                            />
                          )}
                          <span
                            className={cn(
                              "mono absolute left-1/2 -translate-x-1/2 -translate-y-full pb-0.5 text-[11px] font-semibold",
                              w.over ? "text-signal-ink" : "text-ink-2",
                            )}
                            style={{ top: 0 }}
                          >
                            {w.hours}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-ink" style={{ bottom: `${(CAPACITY / maxHours) * 100}%` }} aria-hidden>
                    <span className="mono absolute rounded-sm bg-ink px-1.5 py-0.5 text-[10px] font-medium text-paper" style={{ right: 8, top: -18 }}>
                      your limit · {CAPACITY} h
                    </span>
                  </div>
                </div>
              </div>

              {/* project rows */}
              {rows.map((p) => {
                const c = colorOf(projects, p.id);
                const left = Math.max(0, x(p.start));
                const closed = p.status === "closed";
                const endIso = closed ? (p.closedOn ?? p.deadline) : p.deadline;
                const end = x(endIso) + DAY;
                const planned = p.status === "planned";
                return (
                  <div key={p.id} className={cn("flex border-b border-line last:border-b-0", dim(p.id) && "opacity-40", "transition-opacity duration-200")}>
                    <button
                      type="button"
                      onClick={() => onOpenProject(p.id)}
                      onMouseEnter={() => setHoverId(p.id)}
                      onMouseLeave={() => setHoverId(null)}
                      className="sticky left-0 z-20 shrink-0 border-r border-line bg-paper px-3 py-3 text-left hover:bg-paper-dim"
                      style={{ width: LABEL_W }}
                    >
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: c.deep }} aria-hidden />
                        <span className={cn("truncate text-sm font-medium", closed && "text-ink-2")}>{p.name}</span>
                      </span>
                      <span className="mono block pl-[18px] text-[11px] text-ink-3">
                        {p.effort} h/wk · {p.status}
                      </span>
                    </button>
                    <div className="relative overflow-hidden" style={{ width, height: 56 }}>
                      {weeks.map((_, i) => (
                        <div key={i} className="absolute inset-y-0 border-l border-line" style={{ left: i * DAY * 7 }} />
                      ))}
                      <button
                        type="button"
                        onClick={() => onOpenProject(p.id)}
                        onMouseEnter={() => setHoverId(p.id)}
                        onMouseLeave={() => setHoverId(null)}
                        aria-label={`${p.name}: ${fmtShort(p.start)} to ${fmtShort(p.deadline)}`}
                        className={cn("absolute top-[18px] h-5 rounded-full transition-[filter] hover:brightness-95", closed && "bg-line-strong", planned && "hatch border-2")}
                        style={{
                          left,
                          width: Math.max(DAY, end - left),
                          ...(p.status === "active" ? { backgroundColor: c.deep } : {}),
                          ...(planned ? { borderColor: c.deep } : {}),
                        }}
                      />
                      {/* deadline: a little note stuck on the day it is due */}
                      <span
                        className="mono pointer-events-none absolute top-[10px] z-10 -translate-x-1/2 whitespace-nowrap rounded-[4px] px-1.5 py-1 text-[11px] font-semibold text-ink shadow-[0_2px_4px_-1px_oklch(0.3_0.04_270/0.3)]"
                        style={{ left: Math.max(x(endIso) + DAY / 2, 56), backgroundColor: closed ? "oklch(0.93 0.006 245)" : c.bg, top: 6 + 24 }}
                      >
                        {closed ? "closed " : ""}{fmtDM(parse(endIso))}
                        {!closed && <span className="ml-1 font-normal text-ink-2">{relDays(p.deadline)}</span>}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* today */}
              {todayVisible && (
                <div className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-signal" style={{ left: LABEL_W + todayX }} aria-hidden>
                  <span className="mono absolute left-1 top-1.5 rounded-sm bg-signal px-1 text-[10px] font-semibold text-white">today</span>
                </div>
              )}
            </div>
          </div>
          <p className="mono mt-3 text-[11px] text-ink-3">
            Filled bars are active projects, hatched are planned, grey are closed. Hours are spread evenly from start to deadline. Hover a bar to find
            the same project everywhere.
          </p>
        </Paper>
      </div>
    </div>
  );
}
