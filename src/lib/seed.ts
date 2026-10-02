import type { Project } from "./types";
import { addDays, today, toISO } from "./dates";

const d = (n: number) => toISO(addDays(today(), n));
const t = (id: string, text: string, done = false) => ({ id, text, done });

/** Synthetic sample data. Replace with real projects. */
export function seedProjects(): Project[] {
  return withExtras([
    {
      id: "p1", code: "NRD", name: "Nordlicht rebrand", client: "Nordlicht Coffee Roasters",
      status: "active", pinned: true, start: d(-19), deadline: d(6), price: 4800, effort: 14,
      description: "Logo refresh, packaging system and a one-page brand guide for a regional roastery moving into supermarkets.",
      tasks: [t("a", "Moodboard signed off", true), t("b", "Logo routes round 2", true), t("c", "Bag label templates", true), t("d", "Colour + type specimen"), t("e", "Brand guide layout"), t("f", "Export final files")],
      invoices: [{ id: "INV-2026-041", label: "Deposit 50%", amount: 2400, issued: d(-18), due: d(-4), paidOn: d(-9) }],
    },
    {
      id: "p2", code: "ATL", name: "Atlas booking app UI", client: "Atlas Travel",
      status: "active", pinned: true, start: d(-30), deadline: d(12), price: 7200, effort: 16,
      description: "Mobile booking flow for a boutique tour operator: search, itinerary, checkout and trip wallet.",
      tasks: [t("a", "Flow map + wireframes", true), t("b", "Search & results screens", true), t("c", "Itinerary view", true), t("d", "Checkout states"), t("e", "Prototype for stakeholder review"), t("f", "Dev handoff notes"), t("g", "Design QA on build")],
      invoices: [
        { id: "INV-2026-036", label: "Deposit 50%", amount: 3600, issued: d(-29), due: d(-15), paidOn: d(-14) },
        { id: "INV-2026-044", label: "Milestone: screens", amount: 1800, issued: d(-6), due: d(5), paidOn: null },
      ],
    },
    {
      id: "p3", code: "KLN", name: "Kiln & Co. webshop", client: "Kiln & Co. Ceramics",
      status: "active", pinned: true, start: d(-14), deadline: d(9), price: 3600, effort: 10,
      description: "Shopify theme customisation for a small ceramics studio: product pages, drop-launch countdown, email capture.",
      tasks: [t("a", "Theme audit", true), t("b", "Product page layout", true), t("c", "Drop countdown module"), t("d", "Email capture + welcome flow"), t("e", "Mobile QA")],
      invoices: [{ id: "INV-2026-038", label: "Deposit 50%", amount: 1800, issued: d(-14), due: d(-4), paidOn: null }],
    },
    {
      id: "p4", code: "HLD", name: "Halden annual report", client: "Halden Foundation",
      status: "active", pinned: false, start: d(-5), deadline: d(21), price: 2900, effort: 6,
      description: "48-page annual report layout with data charts and a print-ready PDF.",
      tasks: [t("a", "Receive final copy", true), t("b", "Master grid + styles"), t("c", "Chart set (8)"), t("d", "Layout pass 1"), t("e", "Proof + corrections"), t("f", "Print-ready export")],
      invoices: [],
    },
    {
      id: "p5", code: "PXW", name: "Pixelwerk landing copy", client: "Pixelwerk Studio",
      status: "active", pinned: false, start: d(-8), deadline: d(3), price: 900, effort: 4,
      description: "Rewrite hero and services copy for the studio landing page, three revision rounds included.",
      tasks: [t("a", "Interview call", true), t("b", "Draft v1", true), t("c", "Client revisions"), t("d", "Final delivery")],
      invoices: [],
    },
    {
      id: "p6", code: "MRD", name: "Meridian dashboard audit", client: "Meridian Analytics",
      status: "planned", pinned: false, start: d(14), deadline: d(45), price: 2400, effort: 8,
      description: "UX audit of the customer analytics dashboard with a prioritised fix list and two workshops.",
      tasks: [t("a", "Kick-off call"), t("b", "Heuristic review"), t("c", "User session review"), t("d", "Findings workshop"), t("e", "Fix list + report")],
      invoices: [],
    },
    {
      id: "p7", code: "BRC", name: "Birch & Bloom identity", client: "Birch & Bloom Florals",
      status: "planned", pinned: false, start: d(25), deadline: d(60), price: 3200, effort: 10,
      description: "Visual identity, signage and social templates for a new flower studio.",
      tasks: [t("a", "Brief + references"), t("b", "Identity routes"), t("c", "Signage mockups"), t("d", "Social templates")],
      invoices: [],
    },
    {
      id: "p8", code: "FJD", name: "Fjord podcast site", client: "Fjord Audio",
      status: "closed", pinned: false, start: d(-70), deadline: d(-28), price: 2600, effort: 8,
      description: "Marketing site and episode archive for an independent podcast network.",
      tasks: [t("a", "Design", true), t("b", "Build", true), t("c", "Launch", true)],
      invoices: [
        { id: "INV-2026-021", label: "Deposit 50%", amount: 1300, issued: d(-70), due: d(-56), paidOn: d(-55) },
        { id: "INV-2026-030", label: "Final 50%", amount: 1300, issued: d(-27), due: d(-13), paidOn: d(-16) },
      ],
    },
    {
      id: "p9", code: "LOP", name: "Loop newsletter templates", client: "Loop Health",
      status: "closed", pinned: false, start: d(-52), deadline: d(-24), price: 1500, effort: 5,
      description: "Six responsive email templates with a modular block library.",
      tasks: [t("a", "Block library", true), t("b", "Six templates", true), t("c", "Client testing", true)],
      invoices: [{ id: "INV-2026-033", label: "Full amount", amount: 1500, issued: d(-23), due: d(-9), paidOn: null }],
    },
    {
      id: "p10", code: "SBL", name: "Sable packaging", client: "Sable Chocolate",
      status: "closed", pinned: false, start: d(-95), deadline: d(-51), price: 3900, effort: 9,
      description: "Packaging system for a bean-to-bar chocolate range, eight SKUs.",
      tasks: [t("a", "Dielines", true), t("b", "Artwork x8", true), t("c", "Press check", true)],
      invoices: [
        { id: "INV-2026-012", label: "Deposit 40%", amount: 1560, issued: d(-95), due: d(-81), paidOn: d(-80) },
        { id: "INV-2026-025", label: "Final 60%", amount: 2340, issued: d(-50), due: d(-36), paidOn: d(-38) },
      ],
    },
  ]);
}

type Base = Omit<Project, "notes">;

/** Adds important notes and "in progress" markers to the sample projects. */
function withExtras(list: Base[]): Project[] {
  const notes: Record<string, { text: string; color: number }[]> = {
    p1: [
      { text: "Client wants a kraft-paper look on the bag labels. Send the two options before Friday.", color: 0 },
      { text: "Print vendor needs CMYK + Pantone refs.", color: 1 },
    ],
    p2: [{ text: "Stakeholder review is Thu 15:00. Prototype must be clickable end to end.", color: 3 }],
    p3: [{ text: "Drop goes live at 18:00 CET. Test the countdown on Safari.", color: 2 }],
  };
  const doing: Record<string, string> = { p1: "d", p2: "d", p3: "c" };
  return list.map((p) => ({
    ...p,
    closedOn: p.status === "closed" ? p.deadline : undefined,
    composeSlot: (notes[p.id] ?? []).length,
    notes: (notes[p.id] ?? []).map((n, i) => ({ id: `${p.id}-n${i}`, slot: i, ...n })),
    tasks: p.tasks.map((t) => (doing[p.id] === t.id ? { ...t, doing: true } : t)),
  }));
}
