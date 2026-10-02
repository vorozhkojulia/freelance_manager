# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
React + TypeScript + Tailwind CSS v4 + shadcn/ui structure (`components/ui`), user-specified. Vite as bundler (chosen by Claude; the brief did not name one). Project data is local: seeded project base plus localStorage.

## Users
A solo freelancer who opens the dashboard daily, usually at the start of the workday, to see what is due, what is overloaded, and what money is coming in. Runs roughly 3–10 concurrent projects for a handful of clients.

## Product Purpose
Freelance Manager is a single-user workspace to manage planned, active and closed projects and the money attached to them. Success: the freelancer knows in seconds which deadlines collide, which projects need attention today, and how much is invoiced, paid and still pending.

## Positioning
A pinboard for the projects that matter right now: active projects can be pinned as colored sticky notes on a studio wall, above the full project base. Deadlines of all projects sit on one timeline so overload is visible before it happens.

## Operating Context
Solo daily use on desktop, occasional phone check. Interface language: English. Currency: euro (EUR). No accounts, no backend at this stage: state persists in the browser.

## Capabilities and Constraints
- Dashboard: project list with statuses (planned / active / closed), finance summary (expected, received, outstanding).
- Project card: client, deadline, price, short description, task checklist.
- Calendar/timeline: deadlines of all projects on one screen, with workload/overload visibility.
- Finance: simple tracker of invoiced, paid, pending.
- Pin: mark active projects to keep them at the top as quick-access cards.
- Screen switching uses the supplied animated `Tabs` component (`components/ui/tabs.tsx`, motion-based stacked-card tabs) — a binding user requirement.
- Editing scope, invoicing workflow details, multi-currency: undecided.

## Evidence on Hand
No real data exists. All projects, clients and amounts are synthetic seed data and must be labelled/replaceable.

## Product Principles
- The day's deadlines and money are readable at a glance.
- Pinned projects are always one click away.
- Overload is shown, not computed in the user's head.
- Local, fast, no setup.
