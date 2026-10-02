import { Fragment, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Pin, PinOff, Plus, TriangleAlert, Wand2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Status } from "@/lib/types";
import { CAPACITY, colorOf, currentWeekStart, progress, totals, weeklyLoad } from "@/lib/derive";
import { fmtLong, fmtShort, relDays, today } from "@/lib/dates";
import { money } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Sticky } from "@/components/Sticky";
import { Receipt, Sheet, TAPE, WallView, useWallState } from "@/components/wall";
import { Runway } from "@/components/Runway";
import { MoneyTape } from "@/components/MoneyTape";
import { ProgressBar, StatusSelect } from "@/components/bits";

const FILTERS: { value: Status | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "planned", label: "Planned" },
  { value: "closed", label: "Closed" },
];

const onBoardBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-paper/30 px-3 py-1.5 text-sm font-medium text-paper transition-colors hover:bg-paper/10 active:bg-paper/20";

export function Dashboard({
  onOpenProject,
  onOpenTimeline,
  onNewProject,
}: {
  onOpenProject: (id: string) => void;
  onOpenTimeline: () => void;
  onNewProject: () => void;
}) {
  const { projects, togglePin, setStatus } = useStore();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const wall = useWallState();

  const pinned = projects.filter((p) => p.pinned && p.status === "active");

  const rows = useMemo(() => {
    const order: Record<Status, number> = { active: 0, planned: 1, closed: 2 };
    return projects
      .filter((p) => filter === "all" || p.status === filter)
      .sort((a, b) => order[a.status] - order[b.status] || a.deadline.localeCompare(b.deadline));
  }, [projects, filter]);

  const sixWeeks = weeklyLoad(projects, currentWeekStart(), 6);
  const thisWeek = sixWeeks[0];
  const overWeeks = sixWeeks.filter((w) => w.over);
  const next = useMemo(
    () => projects.filter((p) => p.status === "active").sort((a, b) => a.deadline.localeCompare(b.deadline))[0],
    [projects],
  );
  const nextLeft = next ? progress(next) : null;
  const t = totals(projects);

  const loadSummary = overWeeks.length
    ? `${overWeeks.length} week${overWeeks.length > 1 ? "s" : ""} over your ${CAPACITY} h limit`
    : `Within your ${CAPACITY} h limit`;

  return (
    <div className="board h-full overflow-auto rounded-xl text-paper">
      <div className="p-4 sm:p-7">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{fmtLong(today())}</h1>
            {next && nextLeft && (
              <button type="button" onClick={() => onOpenProject(next.id)} className="group mt-2 block text-left">
                <span className="hand text-[26px] leading-tight text-[oklch(0.93_0.15_100)] sm:text-[30px]">
                  Next up: {next.name} is due {relDays(next.deadline)}
                </span>
                <span className="block h-[3px] w-full max-w-[26rem] origin-left scale-x-50 rounded-full bg-[oklch(0.93_0.15_100)]/70 transition-transform duration-300 group-hover:scale-x-100" />
                <span className="mt-1 block text-sm text-paper/75">
                  {nextLeft.total - nextLeft.done} of {nextLeft.total} tasks left
                </span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {wall.abs && (
              <span className="mr-1 hidden text-xs text-paper/65 lg:inline">
                Hold <kbd className="mono rounded border border-paper/30 px-1.5 py-0.5 text-[10px]">Space</kbd> to drag a card by any part
              </span>
            )}
            {wall.abs && (
              <button
                type="button"
                className={onBoardBtn}
                onClick={() => {
                  if (confirm("Put every block back to the default arrangement?")) wall.reset(pinned.map((p) => `note:${p.id}`));
                }}
                title="Notes on top, chart and money side by side, table below"
              >
                <Wand2 className="size-4" aria-hidden /> Reset layout
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md bg-paper px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-[oklch(0.93_0.15_100)] active:bg-[oklch(0.85_0.15_100)]"
              onClick={onNewProject}
            >
              <Plus className="size-4" aria-hidden /> New project
            </button>
          </div>
        </header>

        {thisWeek.over && (
          <button
            type="button"
            onClick={onOpenTimeline}
            className="mt-5 flex w-full items-center gap-3 rounded-md bg-signal-bg px-3.5 py-2.5 text-left text-sm text-signal-ink transition-colors hover:bg-[oklch(0.93_0.05_45)]"
          >
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            <span>
              <strong className="font-semibold">This week is overbooked:</strong> {thisWeek.hours} h planned against your {CAPACITY} h limit. See the
              timeline.
            </span>
          </button>
        )}

        {/* The wall keeps every block exactly where it was put. Unpinning a note only removes that note. */}
        <section className="mt-6 px-2 pb-6 pt-4">
          <WallView wall={wall}>
            <AnimatePresence initial={false}>
              {pinned.map((p, i) => (
                <Sticky
                  key={p.id}
                  project={p}
                  index={i}
                  color={colorOf(projects, p.id)}
                  dimmed={hoverId !== null && hoverId !== p.id}
                  onHover={(on) => setHoverId(on ? p.id : null)}
                  onOpen={() => onOpenProject(p.id)}
                  onUnpin={() => togglePin(p.id)}
                />
              ))}
            </AnimatePresence>

            <Sheet
              id="runway"
              title="Next six weeks"
              defaultW={820}
              minW={420}
              flowClass="min-w-[min(100%,30rem)] flex-[1_1_30rem]"
              aside={<span className={cn("text-sm", overWeeks.length ? "font-medium text-signal-ink" : "text-ink-3")}>{loadSummary}</span>}
              summary={loadSummary}
            >
              <Runway projects={projects} hoverId={hoverId} onHover={setHoverId} onOpen={onOpenProject} />
            </Sheet>

            <Receipt id="money" defaultW={336} flowClass="w-full flex-none sm:w-[21rem]" summary={`still expected ${money(t.expected)}`}>
              <MoneyTape projects={projects} onOpenProject={onOpenProject} />
            </Receipt>

            <Sheet
              id="base"
              title="Project base"
              tone={TAPE.base}
              defaultW={1100}
              minW={420}
              flowClass="basis-full"
              summary={`${projects.length} projects · ${pinned.length} pinned`}
              aside={
                <div role="group" aria-label="Filter by status" className="flex gap-1">
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
              <div className="overflow-hidden rounded-[4px] border border-line" data-nodrag>
                <div className="label hidden grid-cols-[2rem_minmax(0,1fr)_6rem_7.5rem_6.5rem_5rem] items-center gap-3 border-b border-line px-3 py-2 md:grid">
                  <span />
                  <span>Project</span>
                  <span>Status</span>
                  <span>Deadline</span>
                  <span>Tasks</span>
                  <span className="text-right">Price</span>
                </div>
                <ul>
                  {rows.map((p, idx) => {
                    const pr = progress(p);
                    const canPin = p.status === "active";
                    const c = colorOf(projects, p.id);
                    const head = idx === 0 || rows[idx - 1].status !== p.status;
                    const count = rows.filter((r) => r.status === p.status).length;
                    return (
                      <Fragment key={p.id}>
                        {head && (
                          <li
                            className={cn(
                              "mono flex items-center gap-2 border-b border-line px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider",
                              p.status === "active" && "bg-active-head text-active",
                              p.status === "planned" && "bg-planned-head text-planned",
                              p.status === "closed" && "bg-desk-deep text-ink-2",
                            )}
                          >
                            {p.status} · {count}
                          </li>
                        )}
                        <li
                          onMouseEnter={() => setHoverId(p.id)}
                          onMouseLeave={() => setHoverId(null)}
                          className={cn(
                            "grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-line px-3 py-2.5 transition-[filter] last:border-b-0 hover:brightness-[0.97] md:grid-cols-[2rem_minmax(0,1fr)_6rem_7.5rem_6.5rem_5rem]",
                            p.status === "active" && "bg-active-row",
                            p.status === "planned" && "bg-planned-bg",
                            p.status === "closed" && "bg-desk text-ink-2",
                          )}
                        >
                          <button
                            type="button"
                            disabled={!canPin}
                            onClick={() => togglePin(p.id)}
                            aria-pressed={p.pinned}
                            aria-label={p.pinned ? `Unpin ${p.name}` : `Pin ${p.name}`}
                            title={canPin ? (p.pinned ? "Unpin" : "Pin to the wall") : "Only active projects can be pinned"}
                            className={cn(
                              "grid size-8 place-items-center rounded-md transition-colors",
                              p.pinned ? "text-ink hover:brightness-95" : "text-ink-3 hover:bg-white/60 disabled:opacity-30 disabled:hover:bg-transparent",
                            )}
                            style={p.pinned ? { backgroundColor: c.bg } : undefined}
                          >
                            {p.pinned ? <Pin className="size-4" aria-hidden /> : <PinOff className="size-4" aria-hidden />}
                          </button>
                          <button type="button" onClick={() => onOpenProject(p.id)} className="min-w-0 text-left">
                            <span className="flex items-center gap-2">
                              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: c.deep }} aria-hidden />
                              <span className={cn("truncate text-ink", p.status === "active" ? "font-semibold" : "font-medium")}>{p.name}</span>
                            </span>
                            <span className="block truncate pl-[18px] text-sm text-ink-2">{p.client}</span>
                          </button>
                          <StatusSelect status={p.status} onChange={(st) => setStatus(p.id, st)} label={`Stage of ${p.name}`} className="justify-self-start" />
                          <span className="mono hidden text-sm md:block">
                            {p.status === "closed" ? `closed ${fmtShort(p.closedOn ?? p.deadline)}` : fmtShort(p.deadline)}
                            {p.status !== "closed" && <span className="block text-[11px] text-ink-3">{relDays(p.deadline)}</span>}
                          </span>
                          <span className="hidden md:block">
                            <ProgressBar ratio={pr.ratio} />
                            <span className="mono text-[11px] text-ink-3">
                              {pr.done}/{pr.total}
                            </span>
                          </span>
                          <span className="mono hidden text-right text-sm md:block">{money(p.price)}</span>
                        </li>
                      </Fragment>
                    );
                  })}
                  {rows.length === 0 && <li className="px-3 py-8 text-center text-sm text-ink-3">No projects with this status.</li>}
                </ul>
              </div>
            </Sheet>
          </WallView>
        </section>
      </div>
    </div>
  );
}
