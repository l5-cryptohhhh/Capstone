---
name: ScoutAI
description: A calm, soft scouting tool. Premium light base with strong pastel glows, floating glass surfaces, fluid motion, every judgment a mark on a percentile scale.
colors:
  paper: "#f5f5f7"
  sheet: "#ffffff"
  glass: "rgb(255 255 255 / 58%)"
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
  glow-lavender: "rgb(190 172 255 / 78%)"
  glow-peach: "rgb(255 186 158 / 72%)"
  glow-sky: "rgb(150 205 255 / 72%)"
  glow-mint: "rgb(150 232 205 / 68%)"
  night-paper: "#0b0b0f"
  night-sheet: "#1c1c22"
  night-glass: "rgb(44 44 58 / 52%)"
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
  topbar-offset: "76px"
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

ScoutAI is a working tool for scouts, drawn the way Apple draws its interfaces: a quiet light base, large pastel glows, floating translucent glass, generous rounded corners and motion that responds instantly and settles smoothly. Nothing is hard-edged. Depth comes from blur, a bright top edge and one family of soft shadows, never from heavy rules.

Three accents, one meaning each. Ink is fact. Blue is whatever the user marks or selects. Orange is any uncertain state (missing percentile, small sample, error). The pastel glows are atmosphere only and never carry meaning. The night variant keeps the same rules on a near-black base with the same glows, dimmer.

The product rule behind the look is unchanged: facts are shown as numbers, judgments as marks on a 0 to 100 percentile scale, and uncertainty is stated in plain words.

**Key Characteristics:**
- Base `#f5f5f7` (night `#0b0b0f`) with four large fixed radial glows: lavender, peach, sky, mint.
- Glass surfaces: translucent fill, `backdrop-filter: blur(28px) saturate(190%)`, a light 1px border, a bright top edge (`--edge`) and a soft lift.
- A floating pill-shaped top bar, and a first screen with an oversized gradient headline.
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
`glow-lavender`, `glow-peach`, `glow-sky`, `glow-mint` are the four radial gradients of the page background (70rem wide, anchored at the corners), fixed while the page scrolls. They are the main source of color and stay static: nothing in the background moves.

### Brand gradient
`--brand` (ink to indigo to violet; night: pale to violet) fills only the headline of the first screen. It is the single decorative gradient; every other text is flat ink.

### Named Rules
**The One Meaning Rule.** Pen = user marks and selection. Orange = uncertain state. Ink = fact. Glows are atmosphere. A new accent or a decorative second use of an accent is a defect.
**The Night Twin Rule.** Every token has a night value in `:root[data-theme='dark']`; components reference tokens only, never raw colors.

## Typography

**Font:** system stack (`-apple-system`, `BlinkMacSystemFont`, `SF Pro Text`, `Segoe UI Variable Text`, `Segoe UI`, `system-ui`). No web font is loaded.

### Hierarchy
- **Hero title** (700, clamp(2.8rem, 8.5vw, 6rem), line-height 1.02, tracking -0.045em, brand gradient): the first screen headline. The clipped gradient needs 0.14em of bottom padding so descenders are not cut.
- **Name display** (700, clamp(2.6rem, 7vw, 4.6rem), line-height 1, tracking -0.035em): the player's name in the head.
- **Page title** (700, clamp(2.6rem, 6.5vw, 4.6rem), tracking -0.035em): compare and reading pages.
- **Form heading** (700, 1.4 to 1.75rem, tracking -0.02 to -0.03em): panel title and part titles; the results count is 1.6 to 2.1rem. Group titles are 1.05rem in ink-2.
- **Core value** (700, 1.6rem): the headline stats in the core group.
- **Value** (700, 16px, tabular figures): field values, register metrics, compare cells.
- **Body** (400, 15px, 1.5): running text; reading pages 66ch at 1.65.
- **Label** (600, 12.5px, ink-2): field labels and register column heads.

### Named Rules
**The Tracking Rule.** Large text is tightened, small text is left alone. Never use one letter-spacing for every size.
**The Sentence Case Rule.** Labels and chips are sentence case; there is no uppercase styling.

## Layout

Search opens with a centered hero (headline and one line of context, with generous space above and below), then a sticky floating glass panel on the left (320px column, 16px inset) and a fluid results register on the right inside a glass card. Dossier and compare: a centered page, 980px (compare 1120px, reading 760px), 40px 28px padding, parts separated by 48px. The top bar is a floating pill 56px tall, 16px from the sides and 12px from the top, with the wordmark, the nav pills, then the IT/EN and theme controls. Everything that sticks below it uses `--topbar-offset`.

The player head is one large glass card (32px radius). Facts sit in rounded glass groups, divided by 1px rules, not in loose cards. Bio and stat fields use a fixed-column grid (6 columns on desktop, 2 on phone) with empty cells completing the last row. Metric rows are a four-part line: label, scale, value, percentile.

Responsive: at 1180px optional register columns drop; at 900px the panel collapses behind a toggle above the results; at 760px the top bar wraps to two rows (92px) and metric rows put the scale on its own line; at 700px every register row becomes a compact multi-line row; at 560px compare heads become one-line rows.

## Elevation & Depth

Depth is blur, a bright top edge and one soft shadow family. `--edge` is a 1px inset highlight on top of every glass surface. `--lift` (edge plus `0 1px 2px` and `0 18px 44px -10px` in a violet-tinted shadow) is used by the top bar, panels, cards, the tray and field groups; `--lift-hover` is reserved for raised hover states. Night uses a dim edge and darker shadows. The register header is transparent over its glass card.

### Named Rules
**The Glass Rule.** A translucent surface sits on the base or on a glow, never on another translucent surface. Do not stack glass on glass.

## Shapes

Radius tokens: `--radius` 12px (inputs, selects), `--radius-lg` 24px (panels, cards, tray, field groups, warning card), `--radius-pill` for the top bar, buttons, tabs, segmented selectors, counters and chips. The player head card uses 32px. Icon buttons and compare swatches are circles. Check boxes are 6px. Portraits keep the passport format (30x38, 56x72, 104x134) with 10px corners (16px for the large one) and a top-aligned crop, with initials as fallback.

## Components

### Buttons
- 38px tall pills, 1px `rule-strong` border, top edge highlight, 14px semibold. Hover: pen-wash fill and pen border. Press: scale 0.96, responding in 80ms; release returns through the spring curve. Disabled: 50% opacity.
- **Primary:** solid pen. **On:** pen-wash with pen text. **Quiet:** transparent with pen text and a wash on hover. **Add:** same as default with pen text.
- **Icon button:** 40px circle (32px small), grey wash on hover, scales to 0.9 on press and springs back.
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
A floating glass pill that stays at the top while the page scrolls under it. Nav links are pills: ink-2 text, a grey wash on hover, pen text on a pen-wash pill for the current page. On phone it becomes a 24px-radius card in two rows.

### Motion
Two curves. `--ease-out` (`cubic-bezier(0.22, 1, 0.36, 1)`, critically damped, no overshoot) is the default for hover and state changes (0.2 to 0.5s) and for entrances. `--spring` (a CSS `linear()` curve with about 10% overshoot) is used only for the release of a press, where the touch carried momentum. Presses respond in 80 to 200ms and are plain transitions, so they retarget from the current value if interrupted. Pages rise in once (16px, 0.8s), the hero staggers its lines by 80ms, the compare tray rises into place, and compare cards lift 3px on hover. Scale marks draw in once (0.5s, staggered 40ms). Nothing in the background moves. Everything is reduced to near zero under `prefers-reduced-motion: reduce`. Under `prefers-reduced-transparency` glass becomes solid sheet fills with a stronger border, and under `prefers-contrast: more` dividers and secondary text use their strong values.

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
- **Don't** animate the background, add overshoot to hovers or entrances, or lock input during a transition.
- **Don't** use hard rules heavier than 1px, uppercase labels, rotated stamps or dashed boxes.
- **Don't** add a fifth glow or let a glow sit behind body text without a glass layer; content stays readable first.
- **Don't** use the brand gradient anywhere except the first-screen headline.
- **Don't** use em dashes in interface copy.
- **Don't** introduce a second accent or color a state with blue.
- **Don't** present fake AI output; the AI is not in the interface yet.

## Open points

- `.impeccable/design.json` and `.impeccable/surfaces/frontend-src-app-tsx.md` were generated for the previous "dossier" direction and are out of date. Regenerate them rather than editing by hand.
