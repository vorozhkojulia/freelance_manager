import { forwardRef, useState } from "react";
import { addDays, toISO, today } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { btnCls, btnPrimaryCls, inputCls } from "./bits";

export const NewProjectDialog = forwardRef<HTMLDialogElement, { onCreated: (id: string) => void }>(
  function NewProjectDialog({ onCreated }, ref) {
    const { addProject } = useStore();
    const [error, setError] = useState("");

    const close = () => {
      if (ref && "current" in ref) ref.current?.close();
    };

    return (
      <dialog
        ref={ref}
        className="m-auto w-[min(92vw,30rem)] rounded-xl border border-line bg-paper p-0 text-ink shadow-[0_24px_60px_-12px_oklch(0.24_0.025_255/0.4)] backdrop:bg-ink/40"
      >
        <form
          method="dialog"
          className="space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const name = String(f.get("name") ?? "").trim();
            const client = String(f.get("client") ?? "").trim();
            if (!name || !client) {
              setError("Add a project name and a client.");
              return;
            }
            const id = addProject({
              name,
              client,
              price: Number(f.get("price")) || 0,
              deadline: String(f.get("deadline")),
              effort: Number(f.get("effort")) || 8,
              description: String(f.get("description") ?? "").trim(),
            });
            setError("");
            e.currentTarget.reset();
            close();
            onCreated(id);
          }}
        >
          <h2 className="text-lg font-semibold tracking-tight">New project</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 block text-sm">
              <span className="mb-1 block text-ink-2">Project name</span>
              <input name="name" className={inputCls} placeholder="Website redesign" autoFocus />
            </label>
            <label className="col-span-2 block text-sm">
              <span className="mb-1 block text-ink-2">Client</span>
              <input name="client" className={inputCls} placeholder="Acme GmbH" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-ink-2">Price, €</span>
              <input name="price" type="number" min="0" step="50" className={inputCls} placeholder="2400" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-ink-2">Hours per week</span>
              <input name="effort" type="number" min="1" max="60" defaultValue={8} className={inputCls} />
            </label>
            <label className="col-span-2 block text-sm">
              <span className="mb-1 block text-ink-2">Deadline</span>
              <input name="deadline" type="date" required defaultValue={toISO(addDays(today(), 30))} className={inputCls} />
            </label>
            <label className="col-span-2 block text-sm">
              <span className="mb-1 block text-ink-2">Short description</span>
              <textarea name="description" rows={2} className={inputCls} />
            </label>
          </div>
          {error && (
            <p role="alert" className="text-sm text-signal-ink">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className={btnCls} onClick={close}>
              Cancel
            </button>
            <button type="submit" className={btnPrimaryCls}>
              Create project
            </button>
          </div>
        </form>
      </dialog>
    );
  },
);
