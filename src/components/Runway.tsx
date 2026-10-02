import { useMemo, useState } from "react";
import { CAPACITY, colorOf, currentWeekStart } from "@/lib/derive";
import { addDays, diffDays, fmtDM, fmtShort, parse, relDays, today } from "@/lib/dates";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKS = 6;
const DAYS = WEEKS * 7;
const LANE = 42;
const CAP_H = 28; // caption row height

const OVER_HATCH = "repeating-linear-gradient(135deg, oklch(0.5 0.18 38 / 0.7) 0 3px, oklch(0.5 0.18 38 / 0.18) 3px 7px)";

/**
 * Two stacked charts on one time axis.
 * Top: deadline flags on the day each project is due.
 * Bottom: hours per week, stacked by project, against the freelancer's own weekly limit. Anything above the
 * limit is hatched red and named in the row underneath ("+15 h over").
 * Hover or focus a flag or a segment and that project lights up everywhere.
 */
export function Runway({
  projects,
  hoverId,
  onHover,
  onOpen,
}: {
  projects: Project[];
  hoverId: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const start = currentWeekStart();
  const [readout, setReadout] = useState<string | null>(null);
  const open = projects.filter((p) => p.status !== "closed");

  const cols = useMemo(
    () =>
      Array.from({ length: WEEKS }, (_, i) => {
        const s = addDays(start, i * 7);
        const e = addDays(s, 6);
        const parts = open.filter((p) => parse(p.start) <= e && parse(p.deadline) >= s);
        return { s, parts, total: parts.reduce((n, p) => n + p.effort, 0) };
      }),
    [open, start],
  );
  const maxH = Math.max(CAPACITY * 1.4, ...cols.map((c) => c.total));

  const markers = useMemo(() => {
    const laneEnd: number[] = [];
    return open
      .filter((p) => {
        const d = diffDays(start, parse(p.deadline));
        return d >= 0 && d < DAYS;
      })
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .map((p) => {
        const day = diffDays(start, parse(p.deadline));
        let lane = laneEnd.findIndex((end) => day - end >= 4);
        if (lane === -1) lane = laneEnd.length;
        laneEnd[lane] = day;
        return { p, day, lane };
      });
  }, [open, start]);
  const lanes = Math.max(1, ...markers.map((m) => m.lane + 1));
  const topH = lanes * LANE + 22;
  const pct = (day: number) => `${((day + 0.5) / DAYS) * 100}%`;
  const todayDay = diffDays(start, today());

  const dim = (id: string) => hoverId !== null && hoverId !== id;
  const hoverHandlers = (id: string, text: string) => ({
    onMouseEnter: () => {
      onHover(id);
      setReadout(text);
    },
    onMouseLeave: () => {
      onHover(null);
      setReadout(null);
    },
    onFocus: () => {
      onHover(id);
      setReadout(text);
    },
    onBlur: () => {
      onHover(null);
      setReadout(null);
    },
  });

  return (
    <div>
      <div className="mono mb-5 min-h-[1.25rem] text-[12px] text-ink-2" aria-live="polite">
        {readout ?? "Hover a flag or a bar. Click to open the project."}
      </div>

      <div>
        <div className="relative min-w-[640px]">
          {/* 1. deadlines */}
          <div className="label flex items-center" style={{ height: CAP_H }}>
            Deadlines · the day each project is due
          </div>
          <div className="relative" style={{ height: topH }}>
            {markers.map(({ p, day, lane }) => {
              const c = colorOf(projects, p.id);
              const soon = diffDays(today(), parse(p.deadline)) <= 3;
              const text = `${p.name} · due ${fmtShort(p.deadline)} (${relDays(p.deadline)}) · ${p.effort} h/week`;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpen(p.id)}
                  {...hoverHandlers(p.id, text)}
                  aria-label={text}
                  className={cn("absolute flex -translate-x-1/2 flex-col items-center transition-opacity duration-200", dim(p.id) && "opacity-30")}
                  style={{ left: pct(day), top: lane * LANE, bottom: 0 }}
                >
                  <span
                    className={cn(
                      "mono relative z-10 whitespace-nowrap rounded-[3px] px-1.5 py-1 text-[11px] font-semibold text-ink shadow-[0_3px_4px_-1px_oklch(0.2_0.05_60/0.35)] transition-transform",
                      hoverId === p.id ? "scale-110 rotate-0" : lane % 2 ? "rotate-2" : "-rotate-2",
                      soon && "ring-2 ring-signal-ink",
                    )}
                    style={{ backgroundColor: c.bg }}
                  >
                    {p.code} · {fmtDM(parse(p.deadline))}
                  </span>
                  <span className="w-px flex-1" style={{ backgroundColor: c.deep }} />
                </button>
              );
            })}
          </div>

          {/* shared axis */}
          <div className="relative h-px bg-ink/40" />
          <div className="relative mb-4 h-8">
            {cols.map((c, i) => (
              <span key={i} className="mono absolute top-1 text-[10px] text-ink-3" style={{ left: `${(i / WEEKS) * 100}%`, paddingLeft: 4 }}>
                week of {fmtDM(c.s)}
              </span>
            ))}
          </div>

          {/* 2. workload against the limit */}
          <div className="label flex items-center" style={{ height: CAP_H }}>
            Workload · hours per week against your {CAPACITY} h limit
          </div>
          <div className="relative mt-3 flex h-40 items-end">
            {cols.map((c, i) => (
              <div key={i} className="relative flex h-full flex-1 items-end border-l border-line px-4">
                <div className="relative flex min-w-0 flex-1 flex-col-reverse gap-px" style={{ height: `${(c.total / maxH) * 100}%` }}>
                  {c.parts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onOpen(p.id)}
                      {...hoverHandlers(p.id, `Week of ${fmtDM(c.s)} · ${p.name} takes ${p.effort} h of ${c.total} h`)}
                      aria-label={`Week of ${fmtDM(c.s)}: ${p.name}, ${p.effort} hours`}
                      className={cn("w-full rounded-[2px] transition-opacity duration-200", dim(p.id) && "opacity-25")}
                      style={{ height: `${(p.effort / c.total) * 100}%`, backgroundColor: colorOf(projects, p.id).deep }}
                    />
                  ))}
                  {c.total > CAPACITY && (
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 border-t-2 border-signal-ink"
                      style={{ height: `${((c.total - CAPACITY) / c.total) * 100}%`, backgroundImage: OVER_HATCH }}
                      aria-hidden
                    />
                  )}
                </div>
              </div>
            ))}
            <div
              className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-ink"
              style={{ bottom: `${(CAPACITY / maxH) * 100}%` }}
              aria-hidden
            >
              <span className="mono absolute -top-[18px] right-0 rounded-sm bg-ink px-1.5 py-0.5 text-[10px] font-medium text-paper">
                your limit · {CAPACITY} h
              </span>
            </div>
          </div>

          {/* verdict per week */}
          <div className="mt-1 flex border-t border-ink/40">
            {cols.map((c, i) => {
              const over = c.total - CAPACITY;
              return (
                <div key={i} className="flex-1 border-l border-line px-1 py-3 text-center">
                  <div className="mono text-[13px] font-semibold">{c.total} h</div>
                  {over > 0 ? (
                    <div className="mono mx-auto mt-0.5 w-fit rounded-sm bg-signal-ink px-1.5 py-0.5 text-[11px] font-semibold text-white">+{over} h over</div>
                  ) : (
                    <div className="mono mt-1.5 text-[11px] text-paid">{CAPACITY - c.total} h free</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mono mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-ink-2">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-5 border-t-2 border-signal-ink" style={{ backgroundImage: OVER_HATCH }} aria-hidden />
              hours beyond your limit = overbooked
            </span>
            <span>Each colour is one project.</span>
          </div>

          {/* today */}
          {todayDay >= 0 && todayDay < DAYS && (
            <div className="pointer-events-none absolute top-0 bottom-0 w-px bg-signal" style={{ left: pct(todayDay) }} aria-hidden>
              <span className="mono absolute left-1 rounded-sm bg-signal px-1 text-[10px] font-semibold text-white" style={{ top: CAP_H + topH + 4 }}>
                today
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
