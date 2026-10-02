import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Invoice, Project, Status } from "./types";
import { seedProjects } from "./seed";
import { toISO, today } from "./dates";

const KEY = "freelance-manager.v1";

function load(): Project[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return (JSON.parse(raw) as Project[]).map((p) => {
        const notes = (p.notes ?? []).map((n, i) => ({ ...n, slot: n.slot ?? i }));
        return {
          ...p,
          notes,
          closedOn: p.status === "closed" ? (p.closedOn ?? p.deadline) : p.closedOn,
          composeSlot: p.composeSlot ?? (notes.length ? Math.max(...notes.map((n) => n.slot)) + 1 : 0),
        };
      });
  } catch {
    /* storage unavailable: fall through to seed */
  }
  return seedProjects();
}

const uid = () => Math.random().toString(36).slice(2, 9);

interface Store {
  projects: Project[];
  selectedId: string;
  select: (id: string) => void;
  togglePin: (id: string) => void;
  setStatus: (id: string, s: Status) => void;
  patch: (id: string, changes: Partial<Pick<Project, "deadline" | "closedOn" | "price" | "effort" | "start" | "description">>) => void;
  toggleTask: (id: string, taskId: string) => void;
  addTask: (id: string, text: string) => void;
  removeTask: (id: string, taskId: string) => void;
  editTask: (id: string, taskId: string, text: string) => void;
  toggleDoing: (id: string, taskId: string) => void;
  moveTask: (id: string, taskId: string, dir: -1 | 1) => void;
  reorderTasks: (id: string, orderedIds: string[]) => void;
  addNote: (id: string, text: string) => void;
  editNote: (id: string, noteId: string, text: string) => void;
  removeNote: (id: string, noteId: string) => void;
  addInvoice: (id: string, inv: Omit<Invoice, "id" | "paidOn">) => void;
  setPaid: (projectId: string, invoiceId: string, paid: boolean) => void;
  addProject: (p: { name: string; client: string; price: number; deadline: string; effort: number; description: string }) => string;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(load);
  const [selectedId, setSelectedId] = useState(() => projects.find((p) => p.pinned)?.id ?? projects[0]?.id ?? "");

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(projects));
    } catch {
      /* ignore */
    }
  }, [projects]);

  const update = useCallback((id: string, fn: (p: Project) => Project) => {
    setProjects((ps) => ps.map((p) => (p.id === id ? fn(p) : p)));
  }, []);

  const store = useMemo<Store>(
    () => ({
      projects,
      selectedId,
      select: setSelectedId,
      togglePin: (id) => update(id, (p) => (p.status === "active" ? { ...p, pinned: !p.pinned } : p)),
      setStatus: (id, status) =>
        update(id, (p) => {
          if (status === p.status) return p;
          const next = { ...p, status, pinned: status === "active" ? p.pinned : false };
          // starting a planned project starts the clock; closing one stamps the closing day
          if (status === "active" && p.status === "planned") next.start = toISO(today());
          if (status === "closed") next.closedOn = toISO(today());
          if (status !== "closed") next.closedOn = undefined;
          return next;
        }),
      patch: (id, changes) => update(id, (p) => ({ ...p, ...changes })),
      toggleTask: (id, taskId) =>
        update(id, (p) => ({
          ...p,
          tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done, doing: t.done ? t.doing : false } : t)),
        })),
      editTask: (id, taskId, text) =>
        update(id, (p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, text } : t)) })),
      toggleDoing: (id, taskId) =>
        update(id, (p) => ({
          ...p,
          tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, doing: !t.doing, done: false } : t)),
        })),
      moveTask: (id, taskId, dir) =>
        update(id, (p) => {
          const i = p.tasks.findIndex((t) => t.id === taskId);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= p.tasks.length) return p;
          const tasks = [...p.tasks];
          [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
          return { ...p, tasks };
        }),
      reorderTasks: (id, orderedIds) =>
        update(id, (p) => {
          const byId = new Map(p.tasks.map((t) => [t.id, t]));
          const tasks = orderedIds.map((k) => byId.get(k)).filter((t): t is Project["tasks"][number] => !!t);
          return tasks.length === p.tasks.length ? { ...p, tasks } : p;
        }),
      addNote: (id, text) =>
        update(id, (p) => {
          const slot = p.composeSlot ?? p.notes.length;
          return { ...p, notes: [...p.notes, { id: uid(), text, color: p.notes.length % 6, slot }], composeSlot: slot + 1 };
        }),
      editNote: (id, noteId, text) =>
        update(id, (p) => ({ ...p, notes: p.notes.map((n) => (n.id === noteId ? { ...n, text } : n)) })),
      removeNote: (id, noteId) =>
        update(id, (p) => {
          // freeze every note's cell first, so the survivors keep their places
          const notes = p.notes.map((n, i) => ({ ...n, slot: n.slot ?? i })).filter((n) => n.id !== noteId);
          const here = p.composeSlot ?? p.notes.length;
          return { ...p, notes, composeSlot: notes.length === 0 ? 0 : here };
        }),
      addTask: (id, text) => update(id, (p) => ({ ...p, tasks: [...p.tasks, { id: uid(), text, done: false }] })),
      removeTask: (id, taskId) => update(id, (p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== taskId) })),
      addInvoice: (id, inv) =>
        update(id, (p) => ({
          ...p,
          invoices: [...p.invoices, { ...inv, id: `INV-${new Date().getFullYear()}-${100 + Math.floor(Math.random() * 899)}`, paidOn: null }],
        })),
      setPaid: (projectId, invoiceId, paid) =>
        update(projectId, (p) => ({
          ...p,
          invoices: p.invoices.map((i) => (i.id === invoiceId ? { ...i, paidOn: paid ? toISO(today()) : null } : i)),
        })),
      addProject: (np) => {
        const id = uid();
        const code = np.name.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase().padEnd(3, "X");
        setProjects((ps) => [
          ...ps,
          { id, code, status: "planned", pinned: false, start: toISO(today()), tasks: [], notes: [], composeSlot: 0, invoices: [], ...np },
        ]);
        setSelectedId(id);
        return id;
      },
      reset: () => {
        const fresh = seedProjects();
        setProjects(fresh);
        setSelectedId(fresh[0].id);
      },
    }),
    [projects, selectedId, update],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside StoreProvider");
  return v;
}
