---
name: ScoutAI
description: The scout's observation dossier made interactive. Printed facts in ink, every judgment a pen mark on a ruled scale.
colors:
  paper: "#f4f6fa"
  sheet: "#fbfcfe"
  ink: "#14233f"
  ink-2: "#44526f"
  ink-3: "#62708d"
  rule: "#cfd6e4"
  rule-strong: "#7a89a6"
  pen: "#2455d9"
  pen-on: "#ffffff"
  pen-wash: "#e4ebfc"
  stamp: "#c8312b"
  stamp-wash: "#fbebe9"
  mark-1: "#2455d9"
  mark-2: "#c8312b"
  mark-3: "#0e8a6b"
  night-paper: "#0b1324"
  night-sheet: "#101a2e"
  night-ink: "#e8edf7"
  night-ink-2: "#a9b6cf"
  night-ink-3: "#8a99b6"
  night-rule: "#27375a"
  night-rule-strong: "#5a6d96"
  night-pen: "#6f93ff"
  night-pen-on: "#0b1324"
  night-pen-wash: "#1a2a52"
  night-stamp: "#f0766a"
  night-stamp-wash: "#3a1d22"
  night-mark-1: "#5a82f2"
  night-mark-2: "#e8624f"
  night-mark-3: "#25a27b"
typography:
  name-display:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.8rem, 8vw, 5.4rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "0"
    fontVariation: "'wdth' 68"
  page-title:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.2rem, 5vw, 3.6rem)"
    fontWeight: 800
    lineHeight: 1
    fontVariation: "'wdth' 68"
  form-heading:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.55rem"
    fontWeight: 800
    lineHeight: 1.1
    fontVariation: "'wdth' 68"
  value-core:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.1
    fontVariation: "'wdth' 68"
  value:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    fontFeature: "'tnum'"
  body:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum'"
  field-label:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 700
rounded:
  hairline: "2px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "36px"
  topbar-h: "56px"
  sheet-w: "320px"
components:
  button:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    height: "38px"
    padding: "0 14px"
  button-primary:
    backgroundColor: "{colors.pen}"
    textColor: "{colors.pen-on}"
    rounded: "{rounded.hairline}"
    height: "38px"
  button-hover:
    backgroundColor: "{colors.pen-wash}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    height: "38px"
    padding: "0 10px"
  stamp:
    textColor: "{colors.stamp}"
    rounded: "{rounded.hairline}"
    padding: "12px 16px 14px"
  chip-stamp:
    textColor: "{colors.stamp}"
    rounded: "{rounded.hairline}"
    padding: "0 6px"
  field-cell:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    padding: "8px 12px 10px"
  register-row-selected:
    backgroundColor: "{colors.pen-wash}"
---

# Design System: ScoutAI

## Overview

**Creative North Star: "Dossier dello scout"**

ScoutAI is a scout's observation dossier made interactive. Measured facts are typeset in printed ink; every judgment is a mark placed on a scale. The surface is cool white paper with hairline rules, ruled field boxes at 2px radius, and a single soft lift under the floating comparison tray. It is a working tool for long, repeated sessions: dense, quiet, and honest about thin data.

Three accents, one meaning each. Ink is printed fact. Pen blue is whatever the user marks or selects. Stamp red is any uncertain state (missing percentile, small sample, error). Nothing else carries color. The night variant keeps the same rules on desk-lamp navy paper with brighter pen and stamp.

The system refuses the dark dashboard with radar chart and the grid of identical tiles. Facts live in ruled grids and a register table; judgments live on 0 to 100 scale rows.

**Key Characteristics:**
- Cool paper and sheet surfaces, ink text, 1px hairlines, 2px corners.
- Archivo Variable only: condensed 68% width at weight 800 for names and headings, normal width with tabular figures for values.
- Pen marks (X, circle, square) on a ruled scale are the signature; red rubber stamps own every uncertain state.
- Italian and English, light and dark, keyboard focus always visible.

## Colors

A cool blue-grey paper palette with one biro blue and one stamp red, nothing else.

### Primary
- **Biro Pen Blue** (`pen`, #2455d9; night #6f93ff): the user's hand. Selected nav underline, selected segment, primary button, ticked boxes and their X, percentile numbers, hover on names, best-value underline in compare, text selection and caret. Hover and selected-row washes use **Pen Wash** (`pen-wash`); text on solid pen uses `pen-on`.

### Secondary
- **Rubber Stamp Red** (`stamp`, #c8312b; night #f0766a): uncertain or failed state only. Red stamp block, N/D chip, error state border and title. `stamp-wash` exists as a token for tinted state backgrounds.

### Tertiary
- **Compare Marks** (`mark-1` #2455d9, `mark-2` #c8312b, `mark-3` #0e8a6b; night #5a82f2, #e8624f, #25a27b): identity of players 1, 2, 3 in compare, always paired with a shape (X, circle, square) so color is never the only signal. Dataviz validation run: light on #fbfcfe and dark on #101a2e, both pass all pairs. Marks are a separate identity channel and do not replace the pen and stamp meanings elsewhere.

### Neutral
- **Cool Paper** (`paper`, #f4f6fa; night #0b1324): page ground, input fill, sticky register header.
- **Sheet** (`sheet`, #fbfcfe; night #101a2e): top bar, filter sheet, field cells, compare heads, tray, buttons.
- **Dossier Ink** (`ink`, #14233f; night #e8edf7): printed facts, heavy 2px heading rules.
- **Ink 2 / Ink 3** (`ink-2` #44526f, `ink-3` #62708d; night #a9b6cf, #8a99b6): labels and secondary text; hints, units and placeholders.
- **Rule / Rule Strong** (`rule` #cfd6e4, `rule-strong` #7a89a6; night #27375a, #5a6d96): row dividers; box borders, field grids, scale track and ticks.

### Named Rules
**The One Meaning Rule.** Pen = user marks and selection. Stamp red = uncertain state. Ink = printed facts. A new accent or a second use of an accent for decoration is a defect.
**The Night Twin Rule.** Every token has a night value in `:root[data-theme='dark']`; components reference tokens only, never raw hex.

## Typography

**Display Font:** Archivo Variable (Segoe UI, system-ui fallback), width axis via `@fontsource-variable/archivo/wdth.css`
**Body Font:** Archivo Variable at normal width
**Label/Mono Font:** none; tabular figures from the same family

**Character:** One family, two widths. The condensed heavy cut reads like stamped typewriter headings on a form; the normal width keeps numbers wide, even and comparable.

### Hierarchy
- **Name display** (800, 68% width, clamp(2.8rem, 8vw, 5.4rem), 0.92): the player's name in the dossier head.
- **Page title** (800, 68%, clamp(2.2rem, 5vw, 3.6rem), 1): reading pages and compare title.
- **Form heading** (800, 68%, 1.55 to 1.6rem, 1.1): sheet title, dossier part titles over a 2px ink rule; results count uses clamp(1.8rem, 3vw, 2.4rem). Group titles 1.1rem in ink-2.
- **Core value** (800, 68%, 1.75rem): the headline stats in the core field grid.
- **Value** (700, normal width, 16px, tabular): field values, register metrics, compare cells (15px).
- **Body** (400, 15px, 1.5): running text; reading pages 66ch at 1.65.
- **Label** (700, 12.5px, ink-2, sentence case): field labels, register column heads, hints in ink-3 12.5px.

### Named Rules
**The Two Widths Rule.** Names and headings are condensed 68% at 800. Values are normal width with tabular figures. Never swap them, never add a second family.
**The Sentence Case Rule.** Labels are sentence case. Uppercase with tracking appears only inside the red stamp and the N/D chip, where the stamp is the object.

## Layout

Two working layouts. Search: a 320px sticky form sheet on the left (filters stack 18px apart, role boxes in two columns) and a fluid results register on the right (24px 28px padding, 120px bottom room for the tray). Dossier and compare: a centered page, 980px (compare 1120px, reading 760px), 24px 28px padding, parts separated by 36px. The top bar is one line at 56px with wordmark, nav Cerca and Confronta, then IT/EN and theme controls.

Data grids are ruled, not carded. Bio and stat fields sit in a fixed-column hairline grid (6 columns on desktop, 2 on phone) with empty cells completing the last row. Metric rows are a four-part line: label, scale, value, percentile, with dotted rule dividers.

Responsive: at 1180px optional register columns drop; at 900px the sheet collapses behind a toggle above the results; at 760px the top bar wraps to two rows (92px) and metric rows put the scale on its own full-width line; at 700px every register row becomes a compact multi-line row (check, name, role, team, labeled values); at 560px compare heads become one-line rows.

## Elevation & Depth

Flat. Depth is carried by hairline borders and the paper/sheet tonal step. The single exception is the compare tray, which floats at the bottom with a 1px ink border and one soft sheet lift (`0 1px 0 rgb(20 35 63 / 6%), 0 8px 24px -12px rgb(20 35 63 / 22%)`; night is darker and stronger).

### Named Rules
**The One Lift Rule.** Only the floating tray lifts. Cards, buttons and sheets stay flat; no hard offset shadows, no glow.

## Shapes

Printed-form geometry. Radius is 2px everywhere (`rounded.hairline`); there are no pills and no circles except the compare circle mark. Borders are 1px (`rule-strong` for boxes and grids, `rule` for dividers), 1.5px on checkbox boxes and the error state, 2px ink for heading rules. The rubber stamp is a 2px red border with a second 1px outline offset 3px, rotated -0.7deg; the N/D chip is rotated -2deg. Portraits are passport-format boxes (30x38, 56x72, 104x134) with top-aligned crop and initials in condensed heavy as fallback.

## Components

### Buttons
- **Shape:** 2px corners, 38px tall, 1px `rule-strong` border, 14px semibold.
- **Default:** sheet fill, ink text. Hover: pen-wash fill and pen border. Active: 1px downward nudge. Disabled: 50% opacity.
- **Primary:** solid pen with pen-on text. **On:** pen-wash with pen border and text. **Quiet:** transparent, pen text, underlined. **Add:** dashed border, pen text.
- **Icon button:** 40px (32px small), transparent, pen-wash on hover. Segmented selector (language, season, team): joined hairline box, selected segment solid pen.

### Inputs / Fields
- **Style:** 38px, paper fill, 1px `rule-strong` border, 2px radius; sentence-case 12.5px bold label above.
- **Focus:** 2px pen-colored outline (`focus`) plus pen border; the same 2px outline offset 2px on every focusable element.
- **Disabled:** 55% opacity, transparent fill.

### X-ticked boxes (checkbox and radio)
18px paper box, 1.5px `rule-strong` border. Checked: pen border, pen-wash fill, and a hand-drawn pen X (2.8px round stroke). Role filters use labeled boxes in two columns; the register check uses a 32px touch target around the 18px box (44px column).

### Scale row
The signature. A 28px row with a 1.5px `rule-strong` baseline, hairline tick every 10, taller ticks at 0, 50 and 100, and a mark at the exact percentile: pen X, or circle and square in compare. Marks are 16px, 2.4 to 2.8px strokes in `mark-1..3`. Unknown percentile: dashed baseline, no ticks, no mark (the stamp explains why). Compact variant 104px wide (96px on phone) inside the register with a bold pen percentile of fixed width. Each scale is `role="img"` with a spoken description of owners and values.

### Stamp and N/D chip
The Stamp is the only way uncertainty is stated: red border block with condensed uppercase title and an ink body line. The N/D chip is the inline version in a register cell. Error states use a 1.5px red border and red title; empty states use a dashed `rule-strong` border.

### Ruled field grids
Dossier facts sit in a hairline grid: sheet cells, 12.5px ink-3 label over 16px bold value; core stats use the condensed 1.75rem cut. No shadows, no gaps between cells.

### Register table
Dense rows (8px 10px padding, 1px `rule` dividers) under a sticky paper header that sticks below the top bar. Columns: tick, passport photo, name (bold, pen underline on hover) with age line, role, team, minutes, goals, assists, rating, chosen metric cells with scale and percentile. Hover is a 6% pen tint; selected rows are pen-wash. While loading the table drops to 55% opacity and skeleton rows pulse. On phone the header hides and each player is a compact flex row with labeled values.

### Compare columns
Player heads in sheet boxes with a mark-shape swatch, name in condensed heavy, team line, remove button. Rows share a grid: label, a shared scale carrying every player's mark, then one right-aligned value and percentile cell per player (up to 3). The best value is bold with a 2px pen underline. A legend pairs shape and name; on phone it is dropped in favor of column heads. The tray offsets to center on the results column when the filter sheet is open on desktop.

### Navigation
Top bar on sheet with a 1px `rule-strong` bottom border. Wordmark in condensed heavy with a pen-colored letter span. Nav links 600 weight in ink-2; the current page is ink with a 3px pen underline. On phone the nav drops to a second row.

### Motion
The only authored motion is the pen-stroke draw-in of scale marks: 0.5s `cubic-bezier(0.16, 1, 0.3, 1)`, staggered 40ms per mark after 100ms. Hover and state transitions are 0.15s on color. Skeleton pulse is also gated. Everything is removed under `prefers-reduced-motion: reduce`.

## Do's and Don'ts

### Do:
- **Do** use ink for printed facts, pen for what the user marks or selects, stamp red only for uncertain or failed states.
- **Do** set names and headings in Archivo at 68% width, weight 800; set values at normal width with tabular figures.
- **Do** show missing percentiles and small cohorts with a red stamp or N/D chip rather than an empty cell.
- **Do** keep corners at 2px, borders at 1px hairlines, heading rules at 2px ink.
- **Do** pair every compare color with its shape (X, circle, square) and use the validated `mark-1..3` values.
- **Do** keep the pen-stroke draw-in the single animated moment and honor `prefers-reduced-motion`.
- **Do** write labels in sentence case and keep Italian and English strings equally short.

### Don't:
- **Don't** add kickers, eyebrows or small uppercase section labels above headings.
- **Don't** use decorative gradients, glow, glass, or card grids of identical tiles.
- **Don't** use em dashes in interface copy.
- **Don't** introduce a second accent or color a state with pen; do not use stamp red for emphasis or branding.
- **Don't** add shadows beyond the single tray lift, or hard offset shadows.
- **Don't** use a second typeface, or widen names and condense values.
- **Don't** present fake AI output; AI treatment is not built and has no visual slot yet.
