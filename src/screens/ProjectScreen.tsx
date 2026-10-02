import { useEffect, useRef, useState, type ReactNode } from "react";
import { Reorder, motion, useDragControls, useMotionValue } from "motion/react";
import { Check, ChevronDown, ChevronUp, GripVertical, Pencil, Pin, PinOff, Play, Plus, Receipt, Trash2, Undo2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Note, Project, Status, Task } from "@/lib/types";
import { STICKY, colorOf, invoiceState, progress, projectMoney } from "@/lib/derive";
import { addDays, fmtShort, relDays, toISO, today } from "@/lib/dates";
import { money } from "@/lib/money";
import { cn } from "@/lib/utils";
import { InvoicePill, Paper, StatusPill, TONE, Washi, btnCls, btnPrimaryCls, inputCls } from "@/components/bits";

const STATUSES: Status[] = ["planned", "active", "closed"];
const NOTE_ROT = [-1.6, 1.2, -0.8, 1.8, -1.2, 0.9];
const SIDE_KEY = "freelance-manager.side-w.v2";
const SIDE_MIN = 280;
const SIDE_MAX = 720;
const SIDE_DEFAULT = 440;

export function ProjectScreen() {
  const { projects, selectedId, select } = useStore();
  const project = projects.find((p) => p.id === selectedId) ?? projects[0];

  const groups: { title: string; items: Project[] }[] = [
    { title: "Pinned", items: projects.filter((p) => p.pinned && p.status === "active") },
    { title: "Active", items: projects.filter((p) => p.status === "active" && !p.pinned) },
    { title: "Planned", items: projects.filter((p) => p.status === "planned") },
    { title: "Closed", items: projects.filter((p) => p.status === "closed") },
  ].filter((g) => g.items.length);

  if (!project) return <div className="p-8 text-ink-2">No projects yet.</div>;

  return (
    <div className="grid h-full min-h-0 lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <nav aria-label="Projects" className="hidden overflow-y-auto border-r border-line p-3 lg:block">
        {groups.map((g) => (
          <div key={g.title} className="mb-5">
            <div className="label px-2 pb-1.5">{g.title}</div>
            <ul className="space-y-0.5">
              {g.items.map((p) => {
                const on = p.id === project.id;
                const c = colorOf(projects, p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => select(p.id)}
                      aria-current={on}
                      className={cn("w-full rounded-lg px-2 py-1.5 text-left transition-colors", on ? "text-ink shadow-sm" : "hover:bg-desk")}
                      style={on ? { backgroundColor: c.bg } : undefined}
                    >
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: c.deep }} aria-hidden />
                        <span className={cn("truncate text-sm", on ? "font-semibold" : "font-medium")}>{p.name}</span>
                      </span>
                      <span className={cn("block truncate pl-[18px] text-xs", on ? "text-ink-2" : "text-ink-3")}>{p.client}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="min-h-0 overflow-y-auto">
        <div className="border-b border-line p-3 lg:hidden">
          <label className="block text-sm">
            <span className="label mb-1 block">Project</span>
            <select className={inputCls} value={project.id} onChange={(e) => select(e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ProjectDetail key={project.id} project={project} />
      </div>
    </div>
  );
}

function useSideWidth() {
  const [w, setW] = useState(() => {
    try {
      const v = Number(localStorage.getItem(SIDE_KEY));
      return v >= SIDE_MIN && v <= SIDE_MAX ? v : SIDE_DEFAULT;
    } catch {
      return SIDE_DEFAULT;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(SIDE_KEY, String(w));
    } catch {
      /* ignore */
    }
  }, [w]);
  return [w, (n: number) => setW(Math.min(SIDE_MAX, Math.max(SIDE_MIN, Math.round(n))))] as const;
}

function ProjectDetail({ project }: { project: Project }) {
  const { projects, togglePin, setStatus, patch, addTask, reorderTasks, addNote } = useStore();
  const color = colorOf(projects, project.id);
  const [task, setTask] = useState("");
  const [note, setNote] = useState("");
  const [side, setSide] = useSideWidth();
  const pr = progress(project);
  const doingCount = project.tasks.filter((t) => t.doing && !t.done).length;

  const composeCell = (
      <li key="compose" className="list-none">
        <form
          className="flex min-h-[10rem] flex-col rounded-xl border-2 border-dashed border-line-strong p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) return;
            addNote(project.id, note.trim());
            setNote("");
          }}
        >
          <textarea
            aria-label="New note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
            }}
            placeholder="Something you must not forget: a client quirk, a decision, a link."
            className="hand min-h-[5.5rem] w-full flex-1 resize-none bg-transparent text-[18px] leading-snug text-ink placeholder:text-ink-3 focus-visible:outline-none"
          />
          <button type="submit" className={cn(btnCls, "mt-2 self-start")} disabled={!note.trim()}>
            <Pin className="size-4" aria-hidden /> Pin note
          </button>
        </form>
      </li>
  );

  // Every note owns a fixed cell, so removing one never shifts the others. The new-note card takes the first free cell.
  const bySlot = new Map(project.notes.map((n, i) => [n.slot ?? i, { n, i }] as const));
  const maxSlot = Math.max(-1, ...bySlot.keys());
  const wanted = project.notes.length === 0 ? 0 : (project.composeSlot ?? maxSlot + 1);
  const composeAt = bySlot.has(wanted) ? maxSlot + 1 : wanted;
  const cells = Array.from({ length: Math.max(maxSlot + 1, composeAt + 1) }, (_, k) => {
    const hit = bySlot.get(k);
    if (hit) return <NoteCard key={hit.n.id} note={hit.n} index={hit.i} projectId={project.id} />;
    if (k === composeAt) return composeCell;
    return <li key={`gap-${k}`} aria-hidden className="min-h-[10rem] list-none" />;
  });

  const startSplit = (e: React.PointerEvent) => {
    e.preventDefault();
    const x0 = e.clientX;
    const w0 = side;
    const move = (ev: PointerEvent) => setSide(w0 - (ev.clientX - x0));
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", () => window.removeEventListener("pointermove", move), { once: true });
  };

  return (
    <article className="mx-auto max-w-[88rem] space-y-9 p-4 sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mono flex items-center gap-2 text-xs text-ink-3">
            <span className="hand -rotate-2 rounded-[6px] px-2 py-0.5 text-sm font-bold text-ink shadow-sm" style={{ backgroundColor: color.bg }}>
              {project.code}
            </span>
            <StatusPill status={project.status} />
          </div>
          <h1 className="hand mt-2 text-[44px] font-bold leading-[1.05]">{project.name}</h1>
          <p className="mt-1 text-ink-2">{project.client}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Status" className="flex rounded-md border border-line-strong bg-paper p-0.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={project.status === s}
                onClick={() => setStatus(project.id, s)}
                className={cn(
                  "rounded px-2.5 py-1 text-sm font-medium capitalize transition-colors",
                  project.status === s ? "bg-ink text-paper" : "text-ink-2 hover:bg-desk",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={cn(btnCls, project.pinned && "border-transparent text-ink hover:brightness-95")}
            style={project.pinned ? { backgroundColor: color.bg } : undefined}
            disabled={project.status !== "active"}
            aria-pressed={project.pinned}
            onClick={() => togglePin(project.id)}
            title={project.status !== "active" ? "Only active projects can be pinned" : undefined}
          >
            {project.pinned ? <Pin className="size-4" aria-hidden /> : <PinOff className="size-4" aria-hidden />}
            {project.pinned ? "On the wall" : "Pin to the wall"}
          </button>
        </div>
      </header>

      <dl className="sheet-soft relative grid grid-cols-2 items-start gap-x-6 gap-y-4 rounded-[6px] bg-paper p-5 pt-6 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <Washi tone={TONE.lilac} />
        <div>
          <dt className="label">{project.status === "closed" ? "Closed on" : project.status === "planned" ? "Target deadline" : "Deadline"}</dt>
          <dd className="mt-1">
            <input
              type="date"
              aria-label={project.status === "closed" ? "Closed on" : project.status === "planned" ? "Target deadline" : "Deadline"}
              value={project.status === "closed" ? (project.closedOn ?? project.deadline) : project.deadline}
              onChange={(e) => e.target.value && patch(project.id, project.status === "closed" ? { closedOn: e.target.value } : { deadline: e.target.value })}
              className={cn(inputCls, "mono")}
            />
            <div className="mono mt-1 text-xs text-ink-2">
              {project.status === "active" && relDays(project.deadline)}
              {project.status === "planned" && "a goal, not a promise yet"}
              {project.status === "closed" && `planned for ${fmtShort(project.deadline)}`}
            </div>
          </dd>
        </div>
        <div>
          <dt className="label">Price</dt>
          <dd className="mt-1">
            <input
              type="number"
              aria-label="Price in euro"
              min={0}
              step={50}
              value={project.price}
              onChange={(e) => patch(project.id, { price: Number(e.target.value) })}
              className={cn(inputCls, "mono")}
            />
            <div className="mono mt-1 text-xs text-ink-2">{money(project.price)}</div>
          </dd>
        </div>
        <div>
          <dt className="label">Hours / week</dt>
          <dd className="mt-1">
            <input
              type="number"
              aria-label="Hours per week"
              min={1}
              max={60}
              value={project.effort}
              onChange={(e) => patch(project.id, { effort: Number(e.target.value) })}
              className={cn(inputCls, "mono")}
            />
          </dd>
        </div>
        <div>
          <dt className="label">Started</dt>
          <dd className="mono mt-1 py-1.5 text-sm">
            {project.status === "planned" ? <span className="text-ink-3">Not started yet</span> : fmtShort(project.start)}
          </dd>
        </div>
        <div className="col-span-2 sm:col-span-1 sm:justify-self-end">
          <dt className="label sm:text-right">Money</dt>
          <dd className="mt-1">
            <InvoicesPopover project={project} />
          </dd>
        </div>
      </dl>

      <div
        className="grid items-start gap-9 lg:gap-x-0 lg:[grid-template-columns:minmax(0,1fr)_2.25rem_var(--side)]"
        style={{ ["--side" as string]: `${side}px` }}
      >
        <Paper
          id="tasks-h"
          title="Checklist"
          tone={TONE.yellow}
          aside={
            <span className="mono text-[11px] text-ink-2">
              {pr.done}/{pr.total} done{doingCount ? ` · ${doingCount} in progress` : ""}
            </span>
          }
        >
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-desk-deep" role="presentation">
            <div className="h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${Math.round(pr.ratio * 100)}%` }} />
          </div>
          <div className="min-h-32 resize-y overflow-auto rounded-lg border border-line bg-white/60" title="Drag the corner to make the list taller or shorter">
            <Reorder.Group as="ul" axis="y" values={project.tasks} onReorder={(next: Task[]) => reorderTasks(project.id, next.map((t) => t.id))}>
              {project.tasks.map((t, i) => (
                <TaskRow key={t.id} task={t} project={project} index={i} />
              ))}
              {project.tasks.length === 0 && <li className="list-none px-3 py-4 text-sm text-ink-3">No tasks yet. Add the first step below.</li>}
            </Reorder.Group>
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!task.trim()) return;
              addTask(project.id, task.trim());
              setTask("");
            }}
          >
            <input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Add a task" aria-label="New task" className={inputCls} />
            <button type="submit" className={btnCls} aria-label="Add task">
              <Plus className="size-4" aria-hidden />
            </button>
          </form>
          <p className="mono mt-3 text-[11px] leading-relaxed text-ink-3">
            Drag ⋮⋮ to reorder. Play marks what you are doing now. Pencil edits the title. Drag the list corner to make it taller.
          </p>
        </Paper>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize the notes column"
          aria-valuenow={side}
          aria-valuemin={SIDE_MIN}
          aria-valuemax={SIDE_MAX}
          tabIndex={0}
          title="Drag to resize the notes column. Double-click to reset."
          onPointerDown={startSplit}
          onDoubleClick={() => setSide(SIDE_DEFAULT)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setSide(side + 24);
            if (e.key === "ArrowRight") setSide(side - 24);
          }}
          className="group hidden h-full min-h-24 cursor-col-resize touch-none items-start justify-center pt-10 lg:flex"
        >
          <span className="grid h-14 w-2 place-items-center rounded-full bg-desk-deep transition-colors group-hover:bg-line-strong group-focus-visible:bg-line-strong">
            <span className="h-6 w-px bg-ink-3/60" />
          </span>
        </div>


        <section aria-labelledby="notes-h">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="notes-h" title="Drag notes to move them. Pull a pin to remove a note." className="hand text-[24px] font-bold leading-none">
              Important notes
            </h2>
            <span className="mono text-[11px] text-ink-3">{project.notes.length} pinned</span>
          </div>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(13.5rem,1fr))] gap-x-7 gap-y-9 pt-2">
            {cells}
          </ul>
          {project.notes.length === 0 && <p className="mt-4 text-sm text-ink-3">No notes yet. Pin what you cannot afford to forget.</p>}
        </section>
      </div>

      <Paper id="brief-h" title="Brief" tone={TONE.blue} aside={<span className="mono text-[11px] text-ink-3">saved as you type</span>}>
        <textarea
          aria-label="Project brief"
          rows={16}
          value={project.description}
          placeholder="Paste the client's brief here: goals, audience, scope, references, what is out of scope."
          onChange={(e) => patch(project.id, { description: e.target.value })}
          className="field-sizing-content min-h-[24rem] w-full resize-y rounded-lg border border-line bg-white/60 p-4 text-[15.5px] leading-relaxed text-ink placeholder:text-ink-3 focus-visible:border-signal"
        />
      </Paper>

    </article>
  );
}

/** Invoices live behind one button in the facts block. */
function InvoicesPopover({ project }: { project: Project }) {
  const { addInvoice, setPaid } = useStore();
  const [open, setOpen] = useState(false);
  const [inv, setInv] = useState({ label: "", amount: "", due: toISO(addDays(today(), 14)) });
  const root = useRef<HTMLDivElement>(null);
  const m = projectMoney(project);
  const overdue = project.invoices.filter((i) => invoiceState(i) === "overdue").length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(btnCls, "relative h-[34px]", open && "bg-paper-dim")}
      >
        <Receipt className="size-4" aria-hidden />
        <span>Invoices</span>
        <span className="mono text-xs text-ink-2">
          {money(m.paid)} / {money(m.price)}
        </span>
        {overdue > 0 && (
          <span className="mono absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-signal px-1 text-[10px] font-semibold leading-4 text-white" aria-label={`${overdue} overdue`}>
            {overdue}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Invoices"
          className="sheet-soft absolute right-0 top-full z-30 mt-3 w-[27rem] max-w-[calc(100vw-2.5rem)] rounded-[6px] bg-paper p-5 pt-6 text-left shadow-[0_18px_28px_-16px_oklch(0.3_0.04_270/0.3)]"
        >
          <Washi tone={TONE.green} />
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="hand text-[24px] font-bold leading-none">Invoices</h2>
            <span className="mono text-[11px] text-ink-2">
              {money(m.paid)} paid of {money(m.price)}
            </span>
          </div>
          <ul className="max-h-64 overflow-auto rounded-lg border border-line bg-white/60">
            {project.invoices.map((i) => {
              const st = invoiceState(i);
              return (
                <li key={i.id} className="flex items-center justify-between gap-3 border-b border-line px-3 py-2.5 last:border-b-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{i.label}</div>
                    <div className="mono text-[11px] text-ink-3">
                      {i.id} · {st === "paid" && i.paidOn ? `paid ${fmtShort(i.paidOn)}` : `due ${fmtShort(i.due)}`}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="mono text-sm">{money(i.amount)}</span>
                    <InvoicePill state={st} />
                    <button
                      type="button"
                      onClick={() => setPaid(project.id, i.id, st !== "paid")}
                      aria-label={st === "paid" ? `Mark ${i.id} unpaid` : `Mark ${i.id} paid`}
                      title={st === "paid" ? "Mark unpaid" : "Mark paid"}
                      className="rounded p-1.5 text-ink-2 hover:bg-desk"
                    >
                      {st === "paid" ? <Undo2 className="size-4" aria-hidden /> : <Check className="size-4" aria-hidden />}
                    </button>
                  </div>
                </li>
              );
            })}
            {project.invoices.length === 0 && <li className="px-3 py-4 text-sm text-ink-3">Nothing invoiced yet.</li>}
          </ul>
          {m.uninvoiced > 0 && <p className="mono mt-2 text-xs text-ink-2">{money(m.uninvoiced)} not yet invoiced</p>}
          <form
            className="mt-3 grid grid-cols-[1fr_5.5rem] gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const amount = Number(inv.amount);
              if (!inv.label.trim() || !amount) return;
              addInvoice(project.id, { label: inv.label.trim(), amount, issued: toISO(today()), due: inv.due });
              setInv({ ...inv, label: "", amount: "" });
            }}
          >
            <input value={inv.label} onChange={(e) => setInv({ ...inv, label: e.target.value })} placeholder="Invoice label" aria-label="Invoice label" className={inputCls} />
            <input value={inv.amount} onChange={(e) => setInv({ ...inv, amount: e.target.value })} type="number" min={1} placeholder="€" aria-label="Invoice amount" className={cn(inputCls, "mono")} />
            <input value={inv.due} onChange={(e) => setInv({ ...inv, due: e.target.value })} type="date" aria-label="Due date" className={cn(inputCls, "mono")} />
            <button type="submit" className={btnPrimaryCls}>
              Issue
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, project, index }: { task: Task; project: Project; index: number }) {
  const { toggleTask, toggleDoing, moveTask, removeTask, editTask } = useStore();
  const controls = useDragControls();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const save = () => {
    const t = draft.trim();
    if (t && t !== task.text) editTask(project.id, task.id, t);
    setDraft(t || task.text);
    setEditing(false);
  };
  const doing = !!task.doing && !task.done;
  const last = index === project.tasks.length - 1;
  const iconBtn = "grid size-6 place-items-center rounded text-ink-2 hover:bg-black/5 hover:text-ink disabled:opacity-25";

  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.02, boxShadow: "0 10px 16px -8px oklch(0.3 0.04 270 / 0.22)", zIndex: 5 }}
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
      style={{ backgroundColor: doing ? "oklch(0.94 0.07 150)" : "oklch(0.992 0.003 95)" }}
      className="group relative flex list-none items-start gap-1.5 border-b border-line py-2.5 pl-1.5 pr-3 last:border-b-0"
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        aria-label={`Drag to reorder: ${task.text}`}
        title="Drag to reorder"
        className="mt-px grid size-6 shrink-0 cursor-grab touch-none place-items-center rounded text-ink-3 hover:bg-black/5 hover:text-ink active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>

      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.text}
        onClick={() => toggleTask(project.id, task.id)}
        className={cn(
          "mt-[3px] grid size-[18px] shrink-0 place-items-center rounded-[5px] border-2 border-ink/70 transition-colors",
          task.done ? "bg-ink text-paper" : "bg-white/70 hover:bg-white",
        )}
      >
        {task.done && <Check className="size-3" strokeWidth={3.5} aria-hidden />}
      </button>

      {/* Long titles wrap; the state tag sits under them so it never squeezes the text. */}
      <div className="min-w-0 flex-1 px-1 pointer-coarse:pr-24">
        {editing ? (
          <textarea
            autoFocus
            aria-label="Edit task"
            value={draft}
            rows={2}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                save();
              }
              if (e.key === "Escape") {
                setDraft(task.text);
                setEditing(false);
              }
            }}
            className="field-sizing-content w-full resize-none rounded-md border border-signal bg-white p-1.5 text-sm leading-snug focus-visible:outline-none"
          />
        ) : (
          <p className={cn("break-words text-sm leading-snug", task.done && "text-ink-3 line-through", doing && "font-semibold")}>{task.text}</p>
        )}
        {doing && (
          <span className="mono mt-1.5 inline-flex items-center gap-1 rounded-full bg-active px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-white">
            <Play className="size-2.5 fill-current" aria-hidden /> In progress
          </span>
        )}
      </div>

      {/* Actions float over the row end on hover, so they never take width from the text. */}
      <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-paper/95 p-0.5 opacity-0 shadow-[0_2px_6px_-2px_oklch(0.3_0.04_270/0.25)] transition-opacity focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100">
        {!task.done && (
          <button
            type="button"
            onClick={() => toggleDoing(project.id, task.id)}
            aria-pressed={doing}
            aria-label={doing ? `Stop: ${task.text}` : `Start: ${task.text}`}
            title={doing ? "Stop: back to to-do" : "Mark as in progress"}
            className={cn(iconBtn, doing && "bg-active text-white hover:bg-active hover:text-white")}
          >
            <Play className="size-3.5 fill-current" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setDraft(task.text);
            setEditing(true);
          }}
          aria-label={`Edit task ${task.text}`}
          title="Edit"
          className={iconBtn}
        >
          <Pencil className="size-3.5" aria-hidden />
        </button>
        <button type="button" disabled={index === 0} onClick={() => moveTask(project.id, task.id, -1)} aria-label={`Move up: ${task.text}`} title="Move up" className={iconBtn}>
          <ChevronUp className="size-4" aria-hidden />
        </button>
        <button type="button" disabled={last} onClick={() => moveTask(project.id, task.id, 1)} aria-label={`Move down: ${task.text}`} title="Move down" className={iconBtn}>
          <ChevronDown className="size-4" aria-hidden />
        </button>
        <button type="button" onClick={() => removeTask(project.id, task.id)} aria-label={`Remove task ${task.text}`} title="Remove" className={cn(iconBtn, "hover:text-signal-ink")}>
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      </span>
    </Reorder.Item>
  );
}

const NOTE_POS_KEY = "freelance-manager.notepos.v1";
const readNotePos = (): Record<string, { x: number; y: number }> => {
  try {
    return JSON.parse(localStorage.getItem(NOTE_POS_KEY) ?? "{}");
  } catch {
    return {};
  }
};
const writeNotePos = (id: string, x: number, y: number) => {
  try {
    const all = readNotePos();
    all[id] = { x, y };
    localStorage.setItem(NOTE_POS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
};

/** A note you can drag anywhere on the page; it remembers where you left it. */
function NoteCard({ note, index, projectId }: { note: Note; index: number; projectId: string }) {
  const { editNote, removeNote } = useStore();
  const c = STICKY[note.color % STICKY.length];
  const saved = readNotePos()[note.id];
  const x = useMotionValue(saved?.x ?? 0);
  const y = useMotionValue(saved?.y ?? 0);
  const controls = useDragControls();
  const rot = NOTE_ROT[index % NOTE_ROT.length];
  const fine = typeof matchMedia === "function" && matchMedia("(pointer: fine)").matches;

  return (
    <motion.li
      drag
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      style={{ x, y, rotate: rot, backgroundColor: c.bg, ["--board-bg" as string]: "oklch(0.992 0.003 95)" }}
      whileHover={{ rotate: 0, zIndex: 20 }}
      whileDrag={{ rotate: 0, scale: 1.04, zIndex: 30 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      onDragEnd={() => writeNotePos(note.id, x.get(), y.get())}
      onPointerDown={(e) => {
        if (!fine || (e.target as HTMLElement).closest("button,textarea")) return;
        controls.start(e);
      }}
      className={cn("note note-light note-flat group relative list-none px-4 pb-4 pt-7 text-ink", fine && "cursor-grab active:cursor-grabbing")}
    >
      <button
        type="button"
        onClick={() => removeNote(projectId, note.id)}
        aria-label="Remove note (pull the pin)"
        title="Pull the pin to remove this note"
        className="pushpin absolute -top-2.5 left-1/2 size-6 -translate-x-1/2 rounded-full transition-transform hover:translate-y-0.5 hover:scale-95"
      />
      <textarea
        aria-label="Note"
        value={note.text}
        onChange={(e) => editNote(projectId, note.id, e.target.value)}
        className="hand field-sizing-content min-h-[6.5rem] w-full cursor-text resize-none bg-transparent text-[19px] leading-snug focus-visible:outline-none"
      />
    </motion.li>
  );
}
