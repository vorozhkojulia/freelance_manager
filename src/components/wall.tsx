import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronUp, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The wall: every block (notes, chart, receipt, table) has its own remembered box on a free canvas.
 * Nothing reflows when another block changes, so a layout the user arranged stays exactly as arranged.
 * First run: blocks flow like a normal page, are measured once, and freeze into boxes.
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  /** null = as tall as the content */
  h: number | null;
  collapsed: boolean;
  z: number;
}
type Layout = Record<string, Box>;

const KEY = "freelance-manager.wall.v2";
const GAP = 16;
export const COLLAPSED_H = 48;
const INTERACTIVE = "button,input,label,a,select,textarea,[data-nodrag]";
const FREE_QUERY = "(min-width: 900px) and (pointer: fine)";


/** Hold Space to grab a card by any part (buttons and text included), so a drag never turns into a mis-click. */
let spaceDown = false;
let hovered = 0;
const spaceSubs = new Set<() => void>();
let spaceBound = false;
const typing = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
};
function bindSpace() {
  if (spaceBound || typeof window === "undefined") return;
  spaceBound = true;
  const set = (v: boolean) => {
    if (spaceDown === v) return;
    spaceDown = v;
    spaceSubs.forEach((f) => f());
  };
  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || typing(e.target)) return;
    if (hovered > 0) {
      e.preventDefault();
      set(true);
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code !== "Space") return;
    if (spaceDown && !typing(e.target)) e.preventDefault();
    set(false);
  });
  window.addEventListener("blur", () => set(false));
}
function useSpaceHeld() {
  bindSpace();
  return useSyncExternalStore(
    (f) => {
      spaceSubs.add(f);
      return () => spaceSubs.delete(f);
    },
    () => spaceDown,
    () => false,
  );
}

function loadLayout(): Layout {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

function useFree() {
  const [free, setFree] = useState(() => typeof matchMedia === "function" && matchMedia(FREE_QUERY).matches);
  useEffect(() => {
    const m = matchMedia(FREE_QUERY);
    const on = () => setFree(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return free;
}

interface WallApi {
  abs: boolean;
  layout: Layout;
  setBox: (id: string, patch: Partial<Box>) => void;
  front: (id: string) => void;
  place: (id: string, w: number, h: number) => void;
  register: (id: string) => () => void;
  reportSize: (id: string, h: number) => void;
}

const Ctx = createContext<WallApi | null>(null);
const useWall = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("Block outside WallView");
  return v;
};

export function useWallState() {
  const free = useFree();
  const [layout, setLayout] = useState<Layout>(loadLayout);
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const [visible, setVisible] = useState<string[]>([]);
  const [width, setWidth] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const z = useRef(10);
  const visRef = useRef<string[]>([]);
  const sizeRef = useRef<Record<string, number>>({});
  const widthRef = useRef(0);

  const abs = free && !!layout.runway;

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(layout));
      } catch {
        /* ignore */
      }
    }, 200);
    return () => clearTimeout(t);
  }, [layout]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      widthRef.current = el.clientWidth;
      setWidth(el.clientWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** The one canonical arrangement: notes on top, chart + money aligned side by side, table full width below. */
  const buildDefault = useCallback((noteIds: string[]) => {
    const W = Math.max(widthRef.current, 720);
    const NW = 248;
    const G = 32;
    const cols = Math.max(1, Math.floor((W + G) / (NW + G)));
    const noteH = Math.max(280, ...noteIds.map((id) => sizeRef.current[id] ?? 0));
    const next: Layout = {};
    let zi = 1;
    noteIds.forEach((id, i) => {
      next[id] = { x: (i % cols) * (NW + G), y: Math.floor(i / cols) * (noteH + 40), w: NW, h: null, collapsed: false, z: zi++ };
    });
    const rows = Math.ceil(noteIds.length / cols);
    const y2 = rows ? rows * (noteH + 40) + 8 : 0;
    const MW = 336;
    const RW = Math.max(420, W - MW - G);
    const rowH = Math.max(sizeRef.current.runway ?? 0, sizeRef.current.money ?? 0, 560);
    next.runway = { x: 0, y: y2, w: RW, h: rowH, collapsed: false, z: zi++ };
    next.money = { x: RW + G, y: y2, w: MW, h: rowH, collapsed: false, z: zi++ };
    next.base = { x: 0, y: y2 + rowH + 40, w: W, h: null, collapsed: false, z: zi++ };
    z.current = zi + 10;
    return next;
  }, []);

  // First run: let blocks flow, then freeze into the canonical arrangement.
  useLayoutEffect(() => {
    if (!free || layout.runway) return;
    let cancelled = false;
    const freeze = () => {
      const el = host.current;
      if (cancelled || !el) return;
      const ids = [...el.querySelectorAll<HTMLElement>('[data-block^="note:"]')].map((n) => n.dataset.block!);
      setLayout((prev) => (prev.runway ? prev : buildDefault(ids)));
    };
    (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(() => requestAnimationFrame(freeze)));
    return () => {
      cancelled = true;
    };
  }, [free, layout.runway, buildDefault]);

  const setBox = useCallback((id: string, patch: Partial<Box>) => {
    setLayout((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], ...patch } } : prev));
  }, []);

  const front = useCallback(
    (id: string) => {
      z.current += 1;
      setBox(id, { z: z.current });
    },
    [setBox],
  );

  const register = useCallback((id: string) => {
    visRef.current = [...visRef.current, id];
    setVisible(visRef.current);
    return () => {
      visRef.current = visRef.current.filter((v) => v !== id);
      setVisible(visRef.current);
    };
  }, []);

  const reportSize = useCallback((id: string, h: number) => {
    if (sizeRef.current[id] === h) return;
    sizeRef.current = { ...sizeRef.current, [id]: h };
    setSizes(sizeRef.current);
  }, []);

  /** First free spot (top-most, then left-most) among the blocks that are on the wall right now. */
  const place = useCallback((id: string, w: number, h: number) => {
    setLayout((prev) => {
      if (prev[id]) return prev;
      const rects = visRef.current
        .filter((v) => v !== id && prev[v])
        .map((v) => {
          const b = prev[v];
          return { x: b.x, y: b.y, w: b.w, h: b.collapsed ? COLLAPSED_H : (b.h ?? sizeRef.current[v] ?? 260) };
        });
      const W = Math.max(widthRef.current, w + GAP);
      for (let y = 0; y < 5000; y += GAP)
        for (let x = 0; x <= W - w; x += GAP) {
          const hit = rects.some((r) => x < r.x + r.w + GAP && x + w + GAP > r.x && y < r.y + r.h + GAP && y + h + GAP > r.y);
          if (!hit) {
            z.current += 1;
            return { ...prev, [id]: { x, y, w, h: null, collapsed: false, z: z.current } };
          }
        }
      return prev;
    });
  }, []);

  const height = useMemo(() => {
    let m = 0;
    for (const id of visible) {
      const b = layout[id];
      if (!b) continue;
      m = Math.max(m, b.y + (b.collapsed ? COLLAPSED_H : (b.h ?? sizes[id] ?? 260)));
    }
    return m + 56;
  }, [visible, layout, sizes]);

  const api: WallApi = { abs, layout, setBox, front, place, register, reportSize };
  const reset = (noteIds: string[]) => setLayout(buildDefault(noteIds));

  return { api, host, abs, height, width, reset };
}

export function WallView({ wall, children }: { wall: ReturnType<typeof useWallState>; children: ReactNode }) {
  return (
    <Ctx.Provider value={wall.api}>
      <div
        ref={wall.host}
        role="list"
        aria-label="The wall"
        className={wall.abs ? "relative" : "relative flex flex-wrap items-start gap-x-8 gap-y-10"}
        style={wall.abs ? { height: wall.height } : undefined}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function CollapseButton({ collapsed, onClick, label, className }: { collapsed: boolean; onClick: () => void; label: string; className?: string }) {
  const Icon = collapsed ? ChevronDown : ChevronUp;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={!collapsed}
      aria-label={`${collapsed ? "Expand" : "Collapse"} ${label}`}
      title={collapsed ? "Expand" : "Collapse to a strip"}
      className={cn("grid size-7 shrink-0 place-items-center rounded-md text-ink-2 transition-colors hover:bg-desk-deep hover:text-ink", className)}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}

function ResizeGrip({ id, minW, minH, box, el }: { id: string; minW: number; minH: number; box: Box; el: React.RefObject<HTMLDivElement | null> }) {
  const { setBox } = useWall();
  return (
    <span
      data-resize
      role="separator"
      aria-label="Resize (drag), double-click to fit content"
      title="Drag to resize. Double-click to fit the content."
      onDoubleClick={() => setBox(id, { h: null })}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const sx = e.clientX;
        const sy = e.clientY;
        const w0 = box.w;
        const h0 = el.current?.offsetHeight ?? box.h ?? 300;
        const move = (ev: PointerEvent) =>
          setBox(id, {
            w: Math.max(minW, Math.round(w0 + ev.clientX - sx)),
            h: Math.max(minH, Math.round(h0 + ev.clientY - sy)),
          });
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", () => window.removeEventListener("pointermove", move), { once: true });
      }}
      className="absolute bottom-1 right-1 z-20 grid size-5 cursor-nwse-resize place-items-center rounded text-ink-3 opacity-60 transition-opacity hover:opacity-100"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path d="M9 1 1 9M9 5 5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    </span>
  );
}

/** Positioning shell: drag anywhere that is not a control, remembers its box, collapses to a strip. */
export function Block({
  id,
  defaultW,
  flowClass,
  resizable,
  minW = 300,
  minH = 160,
  children,
}: {
  id: string;
  defaultW: number;
  flowClass?: string;
  resizable?: boolean;
  minW?: number;
  minH?: number;
  children: (a: { collapsed: boolean; toggle: () => void; abs: boolean }) => ReactNode;
}) {
  const { abs, layout, setBox, front, place, register, reportSize } = useWall();
  const box = layout[id];
  const ref = useRef<HTMLDivElement>(null);
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const space = useSpaceHeld();

  useEffect(() => register(id), [id, register]);
  useEffect(() => {
    if (abs && !box) place(id, defaultW, 260);
  }, [abs, box, id, defaultW, place]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => reportSize(id, el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [id, reportSize, abs, box]);

  if (abs && !box) return null;

  const collapsed = box ? box.collapsed : localCollapsed;
  const toggle = () => (box ? setBox(id, { collapsed: !box.collapsed }) : setLocalCollapsed((v) => !v));

  const onPointerDown = (e: React.PointerEvent) => {
    if (!abs || !box || e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest("[data-resize]")) return;
    if (!spaceDown && t.closest(INTERACTIVE)) return;
    e.preventDefault();
    front(id);
    const sx = e.clientX;
    const sy = e.clientY;
    const { x, y } = box;
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 3) moved = true;
      setBox(id, { x: Math.max(0, Math.round(x + ev.clientX - sx)), y: Math.max(0, Math.round(y + ev.clientY - sy)) });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener(
      "pointerup",
      () => {
        window.removeEventListener("pointermove", move);
        // a drag started on a button must not also click it
        if (moved) window.addEventListener("click", (c) => { c.preventDefault(); c.stopPropagation(); }, { capture: true, once: true });
      },
      { once: true },
    );
  };

  return (
    <div
      ref={ref}
      role="listitem"
      data-block={id}
      onPointerDown={onPointerDown}
      onPointerEnter={() => (hovered += 1)}
      onPointerLeave={() => (hovered = Math.max(0, hovered - 1))}
      data-space={space ? "true" : undefined}
      className={cn(abs ? "absolute cursor-grab active:cursor-grabbing" : "relative", !abs && flowClass)}
      style={
        abs && box
          ? { left: box.x, top: box.y, width: box.w, height: collapsed ? undefined : (box.h ?? undefined), zIndex: box.z }
          : undefined
      }
    >
      {children({ collapsed, toggle, abs })}
      {resizable && abs && box && !collapsed && <ResizeGrip id={id} minW={minW} minH={minH} box={box} el={ref} />}
    </div>
  );
}

const SHEET_CLS = "paper-sheet rounded-[5px] bg-paper text-ink";

/** Washi tape holding a sheet to the wall. It is also the visible drag handle. */
function Tape({ tone }: { tone: string }) {
  return (
    <span
      title="Drag to move"
      aria-hidden
      style={{ ["--tape" as string]: tone }}
      className="tape absolute -top-3 left-1/2 z-20 grid h-6 w-24 -translate-x-1/2 -rotate-[1.5deg] cursor-grab place-items-center text-ink/70 active:cursor-grabbing"
    >
      <GripHorizontal className="size-4" strokeWidth={2.5} />
    </span>
  );
}

export const TAPE = {
  runway: "oklch(0.88 0.1 235 / 0.85)",
  money: "oklch(0.9 0.1 95 / 0.85)",
  base: "oklch(0.87 0.1 5 / 0.85)",
} as const;

/** A paper sheet with a title bar: resizable, collapsible to a one-line strip. */
export function Sheet({
  id,
  title,
  aside,
  summary,
  defaultW,
  flowClass,
  minW,
  tone = TAPE.runway,
  children,
}: {
  id: string;
  title: string;
  tone?: string;
  aside?: ReactNode;
  summary: ReactNode;
  defaultW: number;
  flowClass?: string;
  minW?: number;
  children: ReactNode;
}) {
  return (
    <Block id={id} defaultW={defaultW} flowClass={flowClass} minW={minW} resizable>
      {({ collapsed, toggle }) =>
        collapsed ? (
          <div className={cn(SHEET_CLS, "relative flex items-center gap-3 px-4")} style={{ height: COLLAPSED_H }}>
            <Tape tone={tone} />
            <h2 className="hand text-[22px] font-bold leading-none">{title}</h2>
            <span className="mono min-w-0 flex-1 truncate text-xs text-ink-2">{summary}</span>
            <CollapseButton collapsed onClick={toggle} label={title} />
          </div>
        ) : (
          <section aria-label={title} className={cn(SHEET_CLS, "relative flex h-full flex-col p-4 pt-6 sm:p-5 sm:pt-7")}>
            <Tape tone={tone} />
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <h2 className="hand text-[24px] font-bold leading-none">{title}</h2>
              <div className="flex items-center gap-2">
                {aside}
                <CollapseButton collapsed={false} onClick={toggle} label={title} />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto" data-nodrag>
              {children}
            </div>
          </section>
        )
      }
    </Block>
  );
}

/** The receipt: same behaviour, its own paper. */
export function Receipt({
  id,
  summary,
  defaultW,
  flowClass,
  children,
}: {
  id: string;
  summary: ReactNode;
  defaultW: number;
  flowClass?: string;
  children: ReactNode;
}) {
  return (
    <Block id={id} defaultW={defaultW} flowClass={flowClass} resizable minW={260} minH={220}>
      {({ collapsed, toggle }) =>
        collapsed ? (
          <div className={cn(SHEET_CLS, "relative flex items-center gap-3 px-4")} style={{ height: COLLAPSED_H }}>
            <Tape tone={TAPE.money} />
            <h2 className="hand text-[22px] font-bold leading-none">Money</h2>
            <span className="mono min-w-0 flex-1 truncate text-xs text-ink-2">{summary}</span>
            <CollapseButton collapsed onClick={toggle} label="Money" />
          </div>
        ) : (
          <div className="relative h-full">
            <Tape tone={TAPE.money} />
            <div className="h-full overflow-auto px-2 pb-2 pt-0">{children}</div>
            <CollapseButton collapsed={false} onClick={toggle} label="Money" className="absolute right-3 top-4 z-20" />
          </div>
        )
      }
    </Block>
  );
}
