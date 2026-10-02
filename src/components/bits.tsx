import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/types";
import type { InvoiceState } from "@/lib/derive";

const STATUS: Record<Status, { label: string; cls: string; dot: string }> = {
  active: { label: "Active", cls: "text-white bg-active", dot: "bg-white" },
  planned: { label: "Planned", cls: "text-white bg-planned", dot: "bg-white/80" },
  closed: { label: "Closed", cls: "text-ink-2 bg-desk-deep", dot: "bg-ink-3" },
};

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  const s = STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", s.cls, className)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden />
      {s.label}
    </span>
  );
}

const INV: Record<InvoiceState, { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "text-paid bg-paid-bg" },
  pending: { label: "Pending", cls: "text-pending bg-pending-bg" },
  overdue: { label: "Overdue", cls: "text-signal-ink bg-signal-bg" },
};

export function InvoicePill({ state }: { state: InvoiceState }) {
  const s = INV[state];
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>;
}

export function ProgressBar({ ratio, className }: { ratio: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-desk-deep", className)} role="presentation">
      <div className="h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${Math.round(ratio * 100)}%` }} />
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-base font-semibold tracking-tight">{children}</h2>
      {aside && <div className="text-sm text-ink-3">{aside}</div>}
    </div>
  );
}

export const inputCls =
  "w-full rounded-md border border-line-strong bg-paper px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-3 focus-visible:border-signal";

export const btnCls =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-line-strong bg-paper px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-paper-dim active:bg-desk disabled:opacity-50";

export const btnPrimaryCls =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-ink px-3.5 py-1.5 text-sm font-medium text-paper transition-colors hover:bg-ink-2 active:bg-ink disabled:opacity-50";

/** Decorative washi tape that holds a sheet to the page. */
export function Washi({ tone = "oklch(0.88 0.1 235 / 0.85)", className }: { tone?: string; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ ["--tape" as string]: tone }}
      className={cn("tape pointer-events-none absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-[1.5deg]", className)}
    />
  );
}

export function Paper({
  id,
  title,
  aside,
  tone,
  className,
  children,
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  tone?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={cn("sheet-soft relative rounded-[6px] bg-paper p-5 pt-7", className)}>
      <Washi tone={tone} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 id={id} className="hand text-[24px] font-bold leading-none">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export const TONE = {
  blue: "oklch(0.88 0.1 235 / 0.85)",
  yellow: "oklch(0.9 0.1 95 / 0.85)",
  green: "oklch(0.88 0.1 165 / 0.85)",
  lilac: "oklch(0.86 0.09 305 / 0.85)",
} as const;


/** Change a project's stage in place. Looks like the status pill, behaves like a select. */
export function StatusSelect({ status, onChange, label, className }: { status: Status; onChange: (s: Status) => void; label: string; className?: string }) {
  const s = STATUS[status];
  return (
    <span className={cn("relative inline-flex", className)}>
      <select
        aria-label={label}
        value={status}
        onChange={(e) => onChange(e.target.value as Status)}
        className={cn("cursor-pointer appearance-none rounded-full py-0.5 pl-5 pr-6 text-xs font-medium focus-visible:outline-offset-2", s.cls)}
      >
        <option value="planned">Planned</option>
        <option value="active">Active</option>
        <option value="closed">Closed</option>
      </select>
      <span className={cn("pointer-events-none absolute left-2 top-1/2 size-1.5 -translate-y-1/2 rounded-full", s.dot)} aria-hidden />
      <svg className="pointer-events-none absolute right-2 top-1/2 size-2.5 -translate-y-1/2 opacity-80" viewBox="0 0 10 10" aria-hidden>
        <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: status === "closed" ? "var(--color-ink-2)" : "white" }} />
      </svg>
    </span>
  );
}
