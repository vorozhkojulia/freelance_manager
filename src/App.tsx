import { useRef, useState } from "react";
import { CalendarRange, FileText, LayoutDashboard, Wallet } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { StoreProvider, useStore } from "@/lib/store";
import { CAPACITY, currentWeekStart, invoiceState, weeklyLoad } from "@/lib/derive";
import { Dashboard } from "@/screens/Dashboard";
import { ProjectScreen } from "@/screens/ProjectScreen";
import { Timeline } from "@/screens/Timeline";
import { Finances } from "@/screens/Finances";

type Screen = "dashboard" | "project" | "timeline" | "finances";

function Shell() {
  const { projects, select, reset } = useStore();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const dialog = useRef<HTMLDialogElement>(null);

  const openProject = (id: string) => {
    select(id);
    setScreen("project");
  };

  const overloaded = weeklyLoad(projects, currentWeekStart(), 8).some((w) => w.over);
  const overdue = projects.flatMap((p) => p.invoices).filter((i) => invoiceState(i) === "overdue").length;

  const badge = (text: string | number, label: string) => (
    <span
      className="mono grid min-w-5 place-items-center rounded-full bg-signal px-1.5 text-[11px] font-medium leading-5 text-white"
      aria-label={label}
    >
      {text}
    </span>
  );

  const tabs = [
    {
      title: "Dashboard",
      value: "dashboard",
      icon: <LayoutDashboard className="hidden size-4 sm:block" aria-hidden />,
      content: (
        <Panel board>
          <Dashboard onOpenProject={openProject} onOpenTimeline={() => setScreen("timeline")} onNewProject={() => dialog.current?.showModal()} />
        </Panel>
      ),
    },
    {
      title: "Project",
      value: "project",
      icon: <FileText className="hidden size-4 sm:block" aria-hidden />,
      content: (
        <Panel>
          <ProjectScreen />
        </Panel>
      ),
    },
    {
      title: "Timeline",
      value: "timeline",
      icon: <CalendarRange className="hidden size-4 sm:block" aria-hidden />,
      badge: overloaded ? badge("!", `Overbooked weeks ahead (capacity ${CAPACITY} h)`) : undefined,
      content: (
        <Panel>
          <Timeline onOpenProject={openProject} />
        </Panel>
      ),
    },
    {
      title: "Finances",
      value: "finances",
      icon: <Wallet className="hidden size-4 sm:block" aria-hidden />,
      badge: overdue ? badge(overdue, `${overdue} overdue invoices`) : undefined,
      content: (
        <Panel>
          <Finances onOpenProject={openProject} />
        </Panel>
      ),
    },
  ];

  return (
    <div className="mx-auto flex h-dvh max-w-[88rem] flex-col px-3 pb-3 pt-4 sm:px-6 sm:pb-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Mark />
          <span className="text-[15px] font-semibold tracking-tight text-paper">Freelance Manager</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-paper/65">
          <span className="hidden sm:inline">Sample data · saved in this browser only</span>
          <button
            type="button"
            onClick={() => {
              if (confirm("Replace everything with the sample projects?")) reset();
            }}
            className="rounded px-1.5 py-1 underline underline-offset-2 hover:text-paper"
          >
            Reset sample data
          </button>
        </div>
      </header>

      <Tabs
        tabs={tabs}
        value={screen}
        onValueChange={(v) => setScreen(v as Screen)}
        containerClassName="gap-1 pb-1"
        tabClassName="rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap sm:px-3.5 text-paper/75 transition-colors hover:text-paper data-[active=true]:text-ink"
        activeTabClassName="bg-paper dark:bg-paper"
        contentClassName="mt-9"
      />

      <NewProjectDialog ref={dialog} onCreated={openProject} />
    </div>
  );
}

function Panel({ children, board }: { children: React.ReactNode; board?: boolean }) {
  return (
    <div
      className={
        board
          ? "h-full overflow-hidden rounded-xl shadow-[0_18px_40px_-14px_oklch(0.1_0.05_270/0.7)]"
          : "h-full overflow-hidden rounded-xl border border-line bg-paper shadow-[0_18px_40px_-14px_oklch(0.1_0.05_270/0.7)]"
      }
    >
      {children}
    </div>
  );
}

function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="7" fill="oklch(0.992 0.003 95)" />
      <rect x="5" y="9" width="22" height="3" rx="1" fill="oklch(0.82 0.008 250)" />
      <rect x="11" y="6" width="10" height="9" rx="2" fill="oklch(0.62 0.19 40)" />
      <rect x="9" y="17" width="14" height="9" fill="oklch(0.93 0.15 100)" />
    </svg>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
