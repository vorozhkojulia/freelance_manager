import { useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import type { Project } from "@/lib/types";
import { STICKY, daysLeft, progress } from "@/lib/derive";
import { fmtShort, relDays } from "@/lib/dates";
import { money } from "@/lib/money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Block, COLLAPSED_H, CollapseButton } from "./wall";

const ROT = [-2.4, 1.6, -1.1, 2.2, -1.8, 1.3];

/** A pinned project as a sticky note: drag it anywhere, tick tasks on it, fold it to a strip, pull the pin to unpin. */
export function Sticky({
  project,
  index,
  color,
  dimmed,
  onHover,
  onOpen,
  onUnpin,
}: {
  project: Project;
  index: number;
  color: (typeof STICKY)[number];
  dimmed: boolean;
  onHover: (on: boolean) => void;
  onOpen: () => void;
  onUnpin: () => void;
}) {
  const { toggleTask } = useStore();
  const { done, total } = progress(project);
  const left = daysLeft(project);
  const urgent = left <= 3;
  // A task you just ticked stays in view (struck through) so a mis-click is one tap to undo.
  const [justDone, setJustDone] = useState<Set<string>>(new Set());
  const visible = project.tasks.filter((t) => !t.done || justDone.has(t.id)).sort((a, b) => Number(!!b.doing && !b.done) - Number(!!a.doing && !a.done));
  const open = project.tasks.filter((t) => !t.done);
  const shown = visible.slice(0, 4);
  const rot = ROT[index % ROT.length];

  return (
    <Block id={`note:${project.id}`} defaultW={248} flowClass="w-full sm:w-[15.5rem]">
      {({ collapsed, toggle }) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, rotate: rot - 8 }}
          animate={{ opacity: dimmed ? 0.5 : 1, scale: 1, rotate: collapsed ? 0 : rot }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          whileHover={{ rotate: 0, scale: 1.03 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          onHoverStart={() => onHover(true)}
          onHoverEnd={() => onHover(false)}
          style={{ backgroundColor: color.bg }}
          className={cn("note note-flat note-square relative flex w-full flex-col px-4 text-ink", collapsed ? "justify-center py-0" : "min-h-[15.5rem] pb-4 pt-7")}
        >
          {collapsed ? (
            <div className="flex items-center gap-2" style={{ height: COLLAPSED_H }}>
              <button
                type="button"
                onClick={onUnpin}
                aria-label={`Unpin ${project.name}`}
                title="Pull the pin to unpin"
                className="pushpin size-4 shrink-0 rounded-full"
              />
              <button type="button" onClick={onOpen} className="hand min-w-0 flex-1 truncate text-left text-lg font-bold leading-none">
                {project.name}
              </button>
              <span className="mono shrink-0 text-[11px] font-semibold">{relDays(project.deadline)}</span>
              <CollapseButton collapsed onClick={toggle} label={project.name} className="text-ink hover:bg-white/40" />
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onUnpin}
                aria-label={`Unpin ${project.name}`}
                title="Pull the pin to unpin"
                className="pushpin absolute -top-2.5 left-1/2 size-6 -translate-x-1/2 rounded-full transition-transform hover:translate-y-0.5 hover:scale-95"
              />
              <CollapseButton collapsed={false} onClick={toggle} label={project.name} className="absolute right-1.5 top-2 text-ink hover:bg-white/40" />

              <button type="button" onClick={onOpen} className="block pr-6 text-left" aria-label={`Open ${project.name}`}>
                <span className="hand block text-[23px] font-bold leading-[1.05]">{project.name}</span>
                <span className="mt-1 block truncate text-[13px] text-ink-2">{project.client}</span>
              </button>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="mono text-xs">Due {fmtShort(project.deadline)}</span>
                <span
                  className={cn(
                    "mono -rotate-3 rounded-sm border-2 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                    urgent ? "border-signal-ink text-signal-ink" : "border-ink/70 text-ink",
                  )}
                >
                  {relDays(project.deadline)}
                </span>
              </div>

              <ul className="mt-3 space-y-1.5">
                {shown.map((t) => (
                  <li key={t.id}>
                    <label className="group flex cursor-pointer items-start gap-2 text-[13px] leading-snug">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={t.done}
                        onChange={() => {
                          if (!t.done) setJustDone((s) => new Set(s).add(t.id));
                          toggleTask(project.id, t.id);
                        }}
                      />
                      <span
                        className={cn(
                          "mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] border-2 border-ink/70 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-signal",
                          t.done ? "bg-ink text-paper" : "bg-white/40 group-hover:bg-white/80",
                        )}
                      >
                        {t.done && <Check className="size-3" strokeWidth={3.5} aria-hidden />}
                      </span>
                      <span className={cn(t.done && "text-ink-2 line-through")}>{t.text}</span>
                    </label>
                  </li>
                ))}
                {open.length === 0 && <li className="hand text-lg leading-tight">All done. Send the invoice!</li>}
                {visible.length > shown.length && <li className="mono pl-6 text-[11px] text-ink-2">+{visible.length - shown.length} more</li>}
              </ul>

              <div className="mt-auto flex items-end justify-between pt-4">
                <div className="flex gap-[3px]" role="img" aria-label={`${done} of ${total} tasks done`}>
                  {project.tasks.map((t) => (
                    <span key={t.id} className={cn("h-3 w-2 rounded-[2px] border border-ink/70", t.done ? "bg-ink" : "bg-white/30")} />
                  ))}
                </div>
                <span className="mono text-sm font-semibold">{money(project.price)}</span>
              </div>
            </>
          )}
        </motion.div>
      )}
    </Block>
  );
}
