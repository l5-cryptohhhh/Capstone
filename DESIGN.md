---
name: ScoutAI
description: A calm, soft scouting tool. Premium light base with pastel glows, glass surfaces, every judgment a mark on a percentile scale.
colors:
  paper: "#f5f5f7"
  sheet: "#ffffff"
  glass: "rgb(255 255 255 / 68%)"
  ink: "#1d1d1f"
  ink-2: "#515154"
  ink-3: "#6e6e73"
  rule: "rgb(0 0 0 / 8%)"
  rule-strong: "rgb(0 0 0 / 22%)"
  pen: "#0071e3"
  pen-on: "#ffffff"
  pen-wash: "rgb(0 113 227 / 10%)"
  stamp: "#b9380f"
  stamp-wash: "rgb(255 149 0 / 14%)"
  mark-1: "#0071e3"
  mark-2: "#c8312b"
  mark-3: "#0e8a6b"
  glow-lavender: "rgb(196 181 253 / 55%)"
  glow-peach: "rgb(255 196 170 / 50%)"
  glow-sky: "rgb(173 214 255 / 50%)"
  glow-mint: "rgb(167 232 214 / 50%)"
  night-paper: "#0b0b0f"
  night-sheet: "#1c1c22"
  night-glass: "rgb(40 40 50 / 58%)"
  night-ink: "#f5f5f7"
  night-ink-2: "#c7c7cc"
  night-ink-3: "#98989d"
  night-rule: "rgb(255 255 255 / 10%)"
  night-rule-strong: "rgb(255 255 255 / 28%)"
  night-pen: "#2997ff"
  night-pen-on: "#00101f"
  night-pen-wash: "rgb(41 151 255 / 16%)"
  night-stamp: "#ffb27a"
  night-stamp-wash: "rgb(255 149 0 / 16%)"
  night-mark-1: "#5aaaff"
  night-mark-2: "#e8624f"
  night-mark-3: "#25a27b"
typography:
  name-display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 7vw, 4.6rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
  page-title:
    fontSize: "clamp(2.2rem, 5vw, 3.6rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  form-heading:
    fontSize: "1.4rem to 1.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  value-core:
    fontSize: "1.6rem"
    fontWeight: 700
    letterSpacing: "-0.02em"
  value:
    fontSize: "16px"
    fontWeight: 700
    fontFeature: "'tnum'"
  body:
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum'"
  field-label:
    fontSize: "12.5px"
    fontWeight: 600
rounded:
  control: "12px"
  card: "24px"
  pill: "999px"
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
    rounded: "{rounded.pill}"
    height: "38px"
    padding: "0 14px"
  button-primary:
    backgroundColor: "{colors.pen}"
    textColor: "{colors.pen-on}"
    rounded: "{rounded.pill}"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 12px"
  glass-card:
    backgroundColor: "{colors.glass}"
    rounded: "{rounded.card}"
  stamp:
    backgroundColor: "{colors.stamp-wash}"
    textColor: "{colors.stamp}"
    rounded: "{rounded.card}"
  chip-stamp:
    backgroundColor: "{colors.stamp-wash}"
    textColor: "{colors.stamp}"
    rounded: "{rounded.pill}"
---

# Design System: ScoutAI

## Overview

**Creative North Star: "Strumento calmo e premium"**

ScoutAI is a working tool for scouts, drawn the way Apple draws its interfaces: a quiet light base, soft pastel glows in the corners, translucent glass surfaces and generous rounded corners. Nothing is hard-edged. Depth comes from blur, light borders and one family of soft shadows, never from heavy rules.

Three accents, one meaning each. Ink is fact. Blue is whatever the user marks or selects. Orange is any uncertain state (missing percentile, small sample, error). The pastel glows are atmosphere only and never carry meaning. The night variant keeps the same rules on a near-black base with the same glows, dimmer.

The product rule behind the look is unchanged: facts are shown as numbers, judgments as marks on a 0 to 100 percentile scale, and uncertainty is stated in plain words.

**Key Characteristics:**
- Base `#f5f5f7` (night `#0b0b0f`) with four fixed radial glows: lavender, peach, sky, mint.
- Glass surfaces: translucent fill, `backdrop-filter: blur(24px) saturate(180%)`, a light 1px border and a soft lift.
- Rounded everywhere: 12px controls, 24px cards and panels, pills for buttons, tabs and chips.
- System font stack (SF Pro on Apple devices, Segoe UI Variable on Windows), tight tracking on large text.
- Italian and English, light and dark, keyboard focus always visible.

## Colors

### Primary
- **Pen Blue** (`pen`, #0071e3; night #2997ff): selection and action. Active nav pill, selected segment, primary button, ticked boxes and their X, percentile numbers, best value in compare, focus ring, text selection. Hover and selected rows use **Pen Wash**; text on solid pen uses `pen-on`.

### Secondary
- **Warning Orange** (`stamp`, #b9380f; night #ffb27a): uncertain or failed state only. The warning card, the N/D chip, the error state border and title. Tinted backgrounds use `stamp-wash`.

### Tertiary
- **Compare Marks** (`mark-1` #0071e3, `mark-2` #c8312b, `mark-3` #0e8a6b; night #5aaaff, #e8624f, #25a27b): identity of players 1, 2, 3 in compare, always paired with a shape (X, circle, square) so color is never the only signal. `mark-2` and `mark-3` keep their previously validated values; `mark-1` follows the pen.

### Neutral
- **Paper** (`paper`) is the page base and **Sheet** (`sheet`) the solid fill for inputs, buttons and boxes. **Glass** is the translucent fill of the top bar, filter panel, tray, cards and field groups.
- **Ink / Ink 2 / Ink 3** (#1d1d1f, #515154, #6e6e73; night #f5f5f7, #c7c7cc, #98989d): text, labels, hints. All pass AA on the base.
- **Rule / Rule Strong**: black at 8% and 22% (night white at 10% and 28%). Dividers and control borders.

### Glows
`glow-lavender`, `glow-peach`, `glow-sky`, `glow-mint` are the four radial gradients of the page background, fixed while the page scrolls. They are decoration and must stay low in contrast.

### Named Rules
**The One Meaning Rule.** Pen = user marks and selection. Orange = uncertain state. Ink = fact. Glows are atmosphere. A new accent or a decorative second use of an accent is a defect.
**The Night Twin Rule.** Every token has a night value in `:root[data-theme='dark']`; components reference tokens only, never raw colors.

## Typography

**Font:** system stack (`-apple-system`, `BlinkMacSystemFont`, `SF Pro Text`, `Segoe UI Variable Text`, `Segoe UI`, `system-ui`). No web font is loaded.

### Hierarchy
- **Name display** (700, clamp(2.6rem, 7vw, 4.6rem), line-height 1, tracking -0.035em): the player's name in the head.
- **Page title** (700, clamp(2.2rem, 5vw, 3.6rem), tracking -0.035em): compare and reading pages. The results count uses the same tracking.
- **Form heading** (700, 1.4 to 1.5rem, tracking -0.02em): panel title, part titles. Group titles are 1.05rem in ink-2.
- **Core value** (700, 1.6rem): the headline stats in the core group.
- **Value** (700, 16px, tabular figures): field values, register metrics, compare cells.
- **Body** (400, 15px, 1.5): running text; reading pages 66ch at 1.65.
- **Label** (600, 12.5px, ink-2): field labels and register column heads.

### Named Rules
**The Tracking Rule.** Large text is tightened, small text is left alone. Never use one letter-spacing for every size.
**The Sentence Case Rule.** Labels and chips are sentence case; there is no uppercase styling.

## Layout

Search: a sticky floating glass panel on the left (320px column, 16px inset) and a fluid results register on the right (24px 28px padding, 120px bottom room for the tray). Dossier and compare: a centered page, 980px (compare 1120px, reading 760px), 24px 28px padding, parts separated by 36px. The top bar is one line at 56px with the wordmark, the nav pills, then the IT/EN and theme controls.

Facts sit in rounded glass groups, divided by 1px rules, not in loose cards. Bio and stat fields use a fixed-column grid (6 columns on desktop, 2 on phone) with empty cells completing the last row. Metric rows are a four-part line: label, scale, value, percentile.

Responsive: at 1180px optional register columns drop; at 900px the panel collapses behind a toggle above the results; at 760px the top bar wraps to two rows (92px) and metric rows put the scale on its own line; at 700px every register row becomes a compact multi-line row; at 560px compare heads become one-line rows.

## Elevation & Depth

Depth is blur plus one soft shadow family. `--lift` (`0 1px 2px rgb(0 0 0 / 4%), 0 12px 32px -8px rgb(60 50 120 / 14%)`) is used by panels, cards, the tray and field groups; `--lift-hover` is reserved for raised hover states. Night uses darker, stronger values. The register header and the top bar are glass with a hairline, not a shadow.

### Named Rules
**The Glass Rule.** A translucent surface sits on the base or on a glow, never on another translucent surface. Do not stack glass on glass.

## Shapes

Radius tokens: `--radius` 12px (inputs, selects), `--radius-lg` 24px (panels, cards, tray, field groups, warning card), `--radius-pill` for buttons, tabs, segmented selectors, counters and chips. Icon buttons and compare swatches are circles. Check boxes are 6px. Portraits keep the passport format (30x38, 56x72, 104x134) with 10px corners (16px for the large one) and a top-aligned crop, with initials as fallback.

## Components

### Buttons
- 38px tall pills, 1px `rule-strong` border, 14px semibold. Hover: pen-wash fill and pen border. Press: scale 0.97 in 100ms. Disabled: 50% opacity.
- **Primary:** solid pen. **On:** pen-wash with pen text. **Quiet:** transparent with pen text and a wash on hover. **Add:** same as default with pen text.
- **Icon button:** 40px circle (32px small), grey wash on hover, scales down on press.
- **Segmented selector** (language, season, team): glass pill track, selected segment solid pen.

### Inputs
40px, sheet fill, 1px `rule` border, 12px radius, 12.5px semibold label above. Focus: pen border plus a 4px pen-wash ring. Disabled: 55% opacity.

### Ticked boxes
18px boxes with a 6px radius and a pen X when checked. The register check keeps a 32px touch target. Role filters are labeled boxes in two columns.

### Scale row
A 28px row with a 4px rounded baseline, faint ticks every 10, taller faint ticks at 0, 50 and 100, and a mark at the exact percentile: pen X, or circle and square in compare. Marks are 16px with 2.4 to 2.8px strokes. Unknown percentile: dashed baseline, no mark. Each scale is `role="img"` with a spoken description.

### Warning card and N/D chip
Uncertainty is always stated. The warning card is an orange-wash rounded card with a semibold title and an ink body line. The N/D chip is its inline pill in a register cell. Error states use an orange border and title on a glass card.

### Field groups
Rounded glass groups with 1px dividers: 12.5px ink-3 label over a 16px bold value; core stats use the 1.6rem cut.

### Register table
Dense rows (8px 10px, 1px `rule` dividers) under a sticky glass header that sits below the top bar. Hover is a 6% pen tint, selected rows use pen-wash, and the table dims to 55% while loading. On phone the header hides and each player is a compact row with labeled values.

### Compare
Player heads are glass cards with a circular mark swatch. Rows share a grid: label, a shared scale with every player's mark, then one value and percentile per player (up to 3). The best value is shown in pen blue. The tray floats centered on the results column when the panel is open.

### Navigation
Glass top bar with a hairline. Nav links are pills: ink-2 text, a grey wash on hover, pen text on a pen-wash pill for the current page.

### Motion
Hover and state transitions are 0.2s with `cubic-bezier(0.22, 1, 0.36, 1)`; presses are 100ms. Scale marks draw in once (0.5s, staggered 40ms). Everything is reduced to near zero under `prefers-reduced-motion: reduce`. Under `prefers-reduced-transparency` glass becomes solid sheet fills with a stronger border, and under `prefers-contrast: more` dividers and secondary text use their strong values.

## Do's and Don'ts

### Do:
- **Do** use ink for facts, blue for what the user marks or selects, orange only for uncertain or failed states.
- **Do** keep corners soft: 12px controls, 24px cards, pills for buttons and tabs.
- **Do** pair every compare color with its shape (X, circle, square).
- **Do** state missing percentiles and small cohorts in the warning card or N/D chip rather than leaving an empty cell.
- **Do** tighten tracking as text grows and keep body text near zero.
- **Do** write labels in sentence case and keep Italian and English strings equally short.

### Don't:
- **Don't** put glass on glass, or glass over busy content without a border.
- **Don't** use hard rules heavier than 1px, uppercase labels, rotated stamps or dashed boxes.
- **Don't** make the glows brighter or add a fifth one; they must not compete with content.
- **Don't** use em dashes in interface copy.
- **Don't** introduce a second accent or color a state with blue.
- **Don't** present fake AI output; the AI is not in the interface yet.

## Open points

- `.impeccable/design.json` and `.impeccable/surfaces/frontend-src-app-tsx.md` were generated for the previous "dossier" direction and are out of date. Regenerate them rather than editing by hand.
