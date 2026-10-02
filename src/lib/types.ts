export type Status = "planned" | "active" | "closed";

export interface Task {
  id: string;
  text: string;
  done: boolean;
  /** being worked on right now */
  doing?: boolean;
}

export interface Note {
  id: string;
  text: string;
  /** index into the sticky palette */
  color: number;
  /** fixed cell on the notes wall, so removing one note never moves the others */
  slot?: number;
}

export interface Invoice {
  id: string;
  label: string;
  amount: number;
  issued: string;
  due: string;
  paidOn: string | null;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  status: Status;
  pinned: boolean;
  start: string;
  deadline: string;
  /** the day a closed project was actually closed */
  closedOn?: string;
  price: number;
  /** planned working hours per week while the project is open */
  effort: number;
  description: string;
  tasks: Task[];
  notes: Note[];
  /** cell of the "new note" card; it only moves when a note is added or every note is gone */
  composeSlot?: number;
  invoices: Invoice[];
}
