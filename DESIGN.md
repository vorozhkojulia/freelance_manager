---
name: Freelance Manager
description: A studio pinboard: projects are colored sticky notes on indigo felt; charts and money sit on paper sheets and a receipt tape.
colors:
  board: "oklch(0.36 0.07 270)"
  board-deep: "oklch(0.27 0.06 270)"
  desk: "oklch(0.935 0.006 245)"
  desk-deep: "oklch(0.895 0.009 245)"
  paper: "oklch(0.992 0.003 95)"
  paper-dim: "oklch(0.962 0.005 95)"
  ink: "oklch(0.24 0.025 255)"
  ink-2: "oklch(0.4 0.02 255)"
  ink-3: "oklch(0.5 0.018 255)"
  line: "oklch(0.86 0.008 250)"
  line-strong: "oklch(0.76 0.01 250)"
  signal: "oklch(0.62 0.19 40)"
  signal-ink: "oklch(0.5 0.18 38)"
  signal-bg: "oklch(0.95 0.035 45)"
  paid: "oklch(0.46 0.1 155)"
  paid-bg: "oklch(0.94 0.04 155)"
  pending: "oklch(0.47 0.1 75)"
  pending-bg: "oklch(0.95 0.055 88)"
  planned: "oklch(0.45 0.09 250)"
  planned-bg: "oklch(0.94 0.03 250)"
  sticky-lemon: "oklch(0.93 0.15 100)"
  sticky-lemon-deep: "oklch(0.8 0.16 95)"
  sticky-pink: "oklch(0.86 0.12 5)"
  sticky-pink-deep: "oklch(0.7 0.17 5)"
  sticky-mint: "oklch(0.89 0.12 165)"
  sticky-mint-deep: "oklch(0.72 0.13 165)"
  sticky-sky: "oklch(0.87 0.09 235)"
  sticky-sky-deep: "oklch(0.72 0.12 240)"
  sticky-peach: "oklch(0.87 0.11 55)"
  sticky-peach-deep: "oklch(0.74 0.15 50)"
  sticky-lilac: "oklch(0.85 0.09 305)"
  sticky-lilac-deep: "oklch(0.7 0.14 305)"
typography:
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  hand-display:
    fontFamily: "Kalam, Segoe Print, Bradley Hand, cursive"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.25
  hand-title:
    fontFamily: "Kalam, Segoe Print, Bradley Hand, cursive"
    fontSize: "23px"
    fontWeight: 700
    lineHeight: 1.05
  section:
    fontFamily: "Archivo, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  body-small:
    fontFamily: "Archivo, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.43
  figure:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.43
    fontFeature: "'zero' 1"
  figure-total:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.4
    fontFeature: "'zero' 1"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0.06em"
rounded:
  xs: "2px"
  sm: "3px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "36px"
components:
  sticky-note:
    backgroundColor: "{colors.sticky-lemon}"
    textColor: "{colors.ink}"
    typography: "{typography.body-small}"
    rounded: "0px"
    padding: "28px 16px 16px"
    width: "248px"
  pushpin:
    backgroundColor: "{colors.signal}"
    rounded: "{rounded.full}"
    size: "24px"
  panel-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  button-primary-hover:
    backgroundColor: "{colors.ink-2}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-secondary-hover:
    backgroundColor: "{colors.paper-dim}"
  button-on-board:
    backgroundColor: "{colors.board}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-new-project:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  button-new-project-hover:
    backgroundColor: "{colors.sticky-lemon}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  tab-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  filter-chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  pill-paid:
    backgroundColor: "{colors.paid-bg}"
    textColor: "{colors.paid}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  pill-overdue:
    backgroundColor: "{colors.signal-bg}"
    textColor: "{colors.signal-ink}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-signal:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    padding: "0 6px"
  receipt-tape:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "20px 16px"
---

# Design System: Freelance Manager

## Overview

**Creative North Star: "The Studio Wall"**

A designer's pinboard in a working studio. Deep indigo felt with a faint dot texture is the wall; active projects are colored sticky notes pinned to it, slightly tilted, draggable, tickable and unpinnable. Anything that needs to be read carefully (the deadline runway, the project table, the money) sits on a flat sheet of paper laid over the wall. The mood is warm, handmade and tactile, but the data underneath stays exact and tabular.

Three voices divide the work. Kalam handwriting is the human voice: project names on notes and the Next-up line. Archivo is the interface voice. JetBrains Mono carries figures, dates, codes and the small uppercase table heads. Color has one job per family: six sticky colors identify a project everywhere it appears; signal orange means pinned, urgent or focused; green and amber mean money state.

**Key Characteristics:**
- Felt wall (board) as the dashboard ground, paper sheets and receipt tape as the reading surfaces.
- Six sticky colors bound to a project by list position, carried into chart bars, deadline flags, list swatches and pin toggles.
- Kalam only for project names and the Next-up line; everything else is Archivo or JetBrains Mono.
- One signal orange for pushpins, urgency, today marker, badges and focus.
- Cross-highlighting: hover or focus a project in any view and all views of it light up while the rest dim.
- Depth is physical: dark indigo-tinted casts under notes and sheets.

## Colors

Indigo felt, cool desk grey and warm paper, blue-black ink, six pastel sticky colors, one hot orange, and three quiet money tints.

### Primary
- **Signal Orange** (`signal`): pushpin (as a gradient), today marker, tab badges, selection, focus ring, caret. Rare by design.
- **Signal Ink** (`signal-ink`): text and borders for urgency: days-left stamp at 3 days or fewer, overload hours, capacity line, overdue amounts, ring on soon-due deadline flags.
- **Signal Wash** (`signal-bg`): overdue pill and the overbooked-week banner.

### Secondary
- **Felt Indigo** (`board`, `board-deep`): the dashboard wall (with 22px dot grid at 7% white) and the page background behind everything (`board-deep`).
- **Sticky Set** (`sticky-lemon`, `sticky-pink`, `sticky-mint`, `sticky-sky`, `sticky-peach`, `sticky-lilac`): note fill and deadline-flag fill. Each has a `-deep` partner used where the tone must stay legible against paper: chart bars, flag stems, list swatches. Assignment is by project order and never changes.
- **Ledger Green** (`paid`, `paid-bg`), **Ledger Amber** (`pending`, `pending-bg`): received and awaiting money only.
- **Plan Blue** (`planned`, `planned-bg`): planned status only.

### Neutral
- **Desk Grey** (`desk`, `desk-deep`): tracks of progress and receipt bars, closed pill.
- **Docket Paper** (`paper`, `paper-dim`): sheets, tape, inputs, active tab, primary-on-board button; dim variant for hover rows.
- **Blue-Black Ink** (`ink`, `ink-2`, `ink-3`): body text and primary buttons, secondary text, metadata.
- **Rule Lines** (`line`, `line-strong`): hairlines, control borders, dotted leaders, hatch.

### Named Rules
**The Project Color Rule.** A project's sticky color follows it across every screen. Colors identify projects, never status or severity.
**The One Pin Rule.** Signal orange means pinned, urgent, today or focused. It is never a button fill or decoration.
**The Money Tint Rule.** Green and amber appear only on money state.

## Typography

**Display Font:** Kalam (with Segoe Print, Bradley Hand, cursive), handwriting, used sparingly
**Body Font:** Archivo (with ui-sans-serif, system-ui, Segoe UI, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, Cascadia Mono, Consolas, monospace), slashed zero

**Character:** A pen-written voice for people's work, a calm grotesque for interface prose, and a printed mono for numbers. Tabular numerals are on globally.

### Hierarchy
- **Headline** (Archivo 600, 28px, 1.25, -0.025em): the dashboard date heading.
- **Hand Display** (Kalam 400, 26px, 30px from sm): the Next-up line, in sticky lemon on the felt.
- **Hand Title** (Kalam 700, 23px, 1.05): project name on a sticky note. Empty and done states on the wall use Kalam at 18-24px.
- **Section** (Archivo 600, 16px): sheet titles with a right-aligned 14px ink-3 aside.
- **Body** (Archivo 400, 15px, 1.45): base; 13-14px for note tasks, clients and secondary text.
- **Figure** (mono 500, 14-15px; 20px 600 for the tape total): prices, dates, counts, hours, relative days, deadline flags (11px 600).
- **Label** (mono 11px, +0.06em, uppercase, ink-3): table column heads and the tape header.

### Named Rules
**The Hand Is Names Rule.** Kalam is for project names and the Next-up sentence only. Controls, figures and body copy never use it.
**The Mono Is Data Rule.** Anything read off a receipt or docket (price, date, code, hours, days) is mono; sentences are Archivo.

## Layout

One full-height shell, max width 88rem, slim indigo header (logo mark, app name, sample-data note, reset link) over a pill tab bar and one panel. The dashboard panel is the felt itself, padded 16px (28px from sm): header row (date and Next-up left, Tidy up and New project right), overload banner, a wrapping row of pinned notes (gaps 36px x 40px, notes 248px wide from sm, full width below), then a two-column grid of the runway sheet and a 20rem receipt tape (24px gap), then the project base table sheet. Other screens sit on a bordered paper panel. The runway scrolls horizontally below 640px. The project table drops from six columns to three below md. Tab icons hide below sm. Spacing is the 4px scale.

## Elevation & Depth

Hybrid, and physical: flat paper sheets lifted off the felt by dark indigo casts, and notes that lift further on hover. Shadows are always tinted with the board hue, never neutral black or colored glows. On the felt, paper sheets use no border; on paper panels a 1px line border is used.

### Shadow Vocabulary
- **Sheet lift** (`box-shadow: 0 18px 30px -16px oklch(0.1 0.05 270 / 0.7)`): runway and table sheets on the felt. The main panel uses `0 18px 40px -14px` at the same color and alpha.
- **Sticky rest** (`0 1px 0 oklch(0.2 0.05 60 / 0.12), 0 14px 16px -8px oklch(0.1 0.05 270 / 0.55)`): note at rest, over a soft top-left light fold gradient and a faint bottom shade.
- **Sticky lifted** (`0 1px 0 ..., 0 26px 24px -10px oklch(0.1 0.05 270 / 0.65)`): on hover or drag, with the note straightening and scaling to 1.03 or 1.06.
- **Pushpin** (`0 5px 5px -2px oklch(0.1 0.05 270 / 0.55)` plus inset bottom shade over a radial orange gradient): one per note.
- **Tape** (`drop-shadow(0 10px 12px oklch(0.1 0.05 270 / 0.45))`): a filter, because the torn-edge mask clips box-shadow.
- **Deadline flag** (`0 3px 4px -1px oklch(0.2 0.05 60 / 0.35)`): small notes on the runway.

### Named Rules
**The Cast, Not Glow Rule.** Shadows are soft, low, board-tinted casts of a physical object. No colored glows.

## Shapes

Notes are square-cornered paper with a 26px curled bottom-right corner (a diagonal split in board color and a faint shade). Notes are tilted by a fixed cycle of small angles (-2.4, 1.6, -1.1, 2.2, -1.8, 1.3 degrees) and straighten when hovered or dragged. The due stamp on a note is a 2px-bordered 2px-radius label tilted -3 degrees. Sheets are 12px radius, tables and lists 8px, controls 6px, chart bars and flags 2-3px, status and filters and tabs and badges fully round. The receipt tape has 12px sawtooth torn top and bottom edges, dotted leaders between labels and figures, a dashed total divider, and a hatched segment for not-yet-invoiced money.

## Components

### Buttons
- **Shape:** gently rounded (6px).
- **Primary:** ink fill, paper text, 6px 14px; hover ink-2.
- **Secondary:** paper fill, 1px line-strong border; hover paper-dim, active desk; 50% opacity disabled.
- **On the felt:** ghost with 1px paper/30 border and paper text; hover paper/10. The felt's primary action (New project) is a paper fill that turns sticky lemon on hover.
- **Focus:** global 2px signal outline, 2px offset.

### Chips and Pills
- Filters are full-round; selected is ink with paper text, unselected ink-2 with desk-deep hover.
- Status and invoice pills: 12px medium, tinted background with matching dark text. Active status carries a small signal dot.

### Cards / Containers
- **Paper sheet:** paper, 12px radius, Sheet lift on the felt, padding 16px (20px from sm).
- **Lists and tables:** 1px line border, 8px radius, line dividers, paper-dim row hover, mono uppercase column heads.

### Inputs / Fields
- Paper fill, 1px line-strong border, 6px radius, 6px 10px padding, placeholder ink-3; focus turns border to signal beside the global outline. Caret and accent color are signal.

### Navigation
- Pill tabs on the felt: paper/75 text, active pill is paper with ink text and slides between tabs on a spring. Inactive panels sit behind the active one as scaled, dimmed cards. A signal badge (mono 11px, white) shows overdue invoice count or a warning for an overbooked week.

### Sticky Note (signature)
A project pinned to the wall. Orange pushpin at top center (it is the unpin control), Kalam name, client, mono due date and tilted relative-days stamp (signal-ink at 3 days or fewer), up to three open tasks with custom checkboxes, "+N more", then a row of task-progress ticks and the mono price. Draggable with a fine pointer, position remembered, Tidy up springs all back to the row.

### Runway (signature)
Six-week chart on paper. Top: deadline flags in project sticky color at their due day, tilted alternately, hung on a deep-tone stem across staggered lanes; a 2px signal-ink ring marks due within 3 days. Bottom: weekly stacked bars in each project's deep tone with hour totals, a dashed signal-ink capacity line ("your limit"), and a signal today marker. A mono readout line above describes whatever is hovered. Hover or focus of any flag, bar, note or table row dims the others (opacity 30% flags, 25% bars, 50% notes).

### Receipt Tape (signature)
Paper roll with torn edges. Three selectable lines (Received, Awaiting payment, Not yet invoiced) joined by dotted leaders to mono figures in money tints, dashed divider, "Still expected" total, a segmented rounded bar (green, amber, hatched) that grows to the selected share and dims the rest, and a five-row breakdown with project color swatches.

## Do's and Don'ts

### Do:
- **Do** bind each project to one sticky color and use its `-deep` tone wherever the color must sit on paper.
- **Do** set figures, dates and codes in JetBrains Mono with tabular numerals.
- **Do** keep orange for pins, urgency, today, badges and focus; use `signal-ink` for orange text.
- **Do** show depth with board-tinted casts and let notes straighten and lift on hover.
- **Do** keep every hover-highlight cross-linked: a project lit in one view lights in all.
- **Do** respect reduced motion; state transitions run 200-300ms on ease-out-expo (`cubic-bezier(0.16, 1, 0.3, 1)`), notes and tabs use springs.

### Don't:
- **Don't** put Kalam on controls, figures, tables or body copy.
- **Don't** use sticky colors for status or severity, or green and amber outside money state.
- **Don't** use torn or sawtooth edges on anything other than receipt-like objects.
- **Don't** add dark mode; paper sheets and pastel notes are the world.
- **Don't** fall back to a uniform SaaS card grid or hero KPI tiles for pinned projects.
