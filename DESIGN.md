---
name: Scout AI
description: A dark, precise scouting tool in the Scout AI brand: near-black base, one signal green, thin-bordered cards, pill buttons, every judgment a mark on a percentile scale.
colors:
  paper: "#0b0f14"
  sheet: "#1f2937"
  glass: "#121922"
  glass-border: "rgb(255 255 255 / 9%)"
  ink: "#e5e7eb"
  ink-2: "#b4bac4"
  ink-3: "#8b94a1"
  rule: "rgb(255 255 255 / 9%)"
  rule-strong: "rgb(255 255 255 / 20%)"
  pen: "#39d353"
  pen-on: "#04130a"
  pen-wash: "rgb(57 211 83 / 13%)"
  stamp: "#f5b544"
  stamp-wash: "rgb(245 181 68 / 13%)"
  mark-1: "#39d353"
  mark-2: "#ff8a5c"
  mark-3: "#5aa9ff"
  day-paper: "#f3f5f7"
  day-sheet: "#ffffff"
  day-ink: "#0b0f14"
  day-ink-2: "#3d4652"
  day-ink-3: "#5c6573"
  day-pen: "#14803a"
  day-pen-on: "#ffffff"
  day-stamp: "#9a5b00"
  day-mark-1: "#14803a"
  day-mark-2: "#c2410c"
  day-mark-3: "#1d6fd1"
typography:
  hero-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Inter Variable, Inter, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 7vw, 4.75rem)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.04em"
  page-title:
    fontSize: "clamp(2.2rem, 5vw, 3.6rem)"
    fontWeight: 700
    letterSpacing: "-0.035em"
  form-heading:
    fontSize: "1.4rem to 1.5rem"
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
  card: "18px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "36px"
  topbar-h: "64px"
  topbar-offset: "72px"
  sheet-w: "320px"
components:
  button:
    backgroundColor: "transparent"
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
  card:
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

# Design System: Scout AI

## Overview

**Creative North Star: "Il talento giusto, al momento giusto"**

Scout AI is a working tool for scouts in the Scout AI brand identity: a near-black base, one signal green, cards with a thin hairline border, pill buttons, outline icons and a slanted S as the mark. The brand board (colors, Inter / SF Pro Display, icon set, UI components, landing and pricing layouts) is the reference; this file records how it is applied to the product screens.

One accent, one meaning. Ink is fact. Green is whatever the user acts on or marks: primary actions, the current page, selection, percentile numbers, the best value in a comparison. Amber is any uncertain state (missing percentile, small sample, error). The AI is always shown apart from the data, in a labelled green-washed box.

The night theme is the brand and the default. The light theme is its daytime twin: same structure, a darker green for text and buttons so contrast holds on white.

**Key Characteristics:**
- Base `#0b0f14` with two very faint green glows fixed to the corners; cards `#121922` with a 1px 9% white border; elements `#1f2937`.
- Flat surfaces. No glass blur except the sticky top bar and the compare tray, where content scrolls underneath.
- Full-width top bar (64px) with a hairline bottom border; the current page is marked by a 2px green line on that border.
- Pill buttons: primary is solid green with near-black text; secondary is an outline.
- 12px controls, 18px cards, pills for buttons, tabs and chips.
- Inter Variable (self-hosted) after the Apple system faces, tight tracking on large text, tabular figures.
- Italian and English, dark and light, keyboard focus always visible.

## Colors

- **Signal Green** (`pen`, #39d353; light #14803a): action and selection. Primary button, current nav item, selected segment, ticked boxes, percentile numbers, best value in compare, focus ring, the key word of the hero title, the S mark. Text on solid green uses `pen-on` (near-black in the dark theme, white in the light one).
- **Amber** (`stamp`, #f5b544; light #9a5b00): uncertain or failed state only: the warning card, the N/D chip, errors.
- **Compare marks** (`mark-1` green, `mark-2` #ff8a5c, `mark-3` #5aa9ff; light #14803a, #c2410c, #1d6fd1): identity of players 1, 2 and 3, always paired with a shape (X, circle, square).
- **Neutrals**: `paper` base, `glass` cards and panels, `sheet` inputs and elements. Ink / Ink 2 / Ink 3 (#e5e7eb, #b4bac4, #8b94a1) all pass AA on the base. Rules are white at 9% and 20%.
- **Glow**: `--glow`, green at 11%, two radial gradients in the page corners. Atmosphere only.

### Named Rules
**The One Meaning Rule.** Green = what the user acts on or marks. Amber = uncertain state. Ink = fact. A second accent, or green used as decoration, is a defect.
**The Twin Rule.** Components reference tokens only; the light theme is `:root[data-theme='light']` in `tokens.css`.
**The Apart Rule.** AI text sits in its own labelled box ("Generato dall'AI") and is never mixed into a data table.

## Typography

**Font:** `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter Variable', Inter, 'Segoe UI Variable Text', 'Segoe UI', system-ui`. Inter Variable is loaded from `@fontsource-variable/inter`, so Windows and Linux match the brand board.

- **Hero title** (800, clamp(2.6rem, 7vw, 4.75rem), tracking -0.04em): ink, with the key word between asterisks in the i18n string rendered green. No gradient text.
- **Page title** and **name display** (700, tracking -0.035em).
- **Form heading** (700, 1.4 to 1.5rem, tracking -0.02em); results count 1.6 to 2.1rem.
- **Value** (700, 16px, tabular). **Body** (400, 15px, 1.5). **Label** (600, 12.5px, ink-2).

### Named Rules
**The Tracking Rule.** Large text is tightened, small text is left alone.
**The Sentence Case Rule.** Labels and chips are sentence case.

## Layout

Search: top bar, centered hero (headline with a green key word, one line of context), the AI search card (max 1100px), then a sticky 320px filter panel on the left and a fluid results register on the right. Dossier and compare: a centered page (980px; compare 1120px; reading 760px). Login: on 960px and wider a brand panel on the left (mark, wordmark, slogan, four feature lines) and the form card on the right; below that, the brand block (mark, wordmark, slogan) stacked above the form card. A footer closes every app page: mark, slogan and the data-source line.

Responsive: at 1180px optional register columns drop; at 900px the filter panel collapses behind a toggle; at 760px the top bar wraps to two rows (96px) and metric rows put the scale on its own line; at 700px each register row becomes a compact multi-line row.

## Elevation & Depth

Depth is a hairline border plus one dark shadow family. `--edge` is a 4% white inset highlight; `--lift` adds `0 1px 2px` and `0 16px 36px -14px` in black; `--lift-hover` is for raised hover states (similar-player cards, compare heads). The light theme uses the same shapes with cool grey shadows.

## Shapes

`--radius` 12px (inputs, selects), `--radius-lg` 18px (cards, panels, tray, field groups, warning card), `--radius-pill` for buttons, tabs, segmented selectors, counters and chips. Icon buttons and compare swatches are circles. Check boxes are 6px. Portraits keep the passport format with 10px corners and initials as fallback.

## Components

- **Bouncing ball** (login, every width): the 3D ball from the former hero model, alone, hops between the A and the I of "AI" in the large wordmark. Decorative, transparent, loaded lazily, still under `prefers-reduced-motion`. After a successful login it becomes the page transition: the ball leaves the wordmark, spirals (1.75 turns, 1.7s) to the center while growing to cover the screen, dissolves into `--paper`, and the app shell fades that same flat color out over the dashboard (`.curtain`). Skipped under reduced motion, where the route changes at once. On narrow screens the brand block (mark, wordmark, slogan) sits above the form so the ball has its own letters; the feature list appears from 960px.
- **Wordmark**: the S mark (a single slanted stroke, `BrandMark`) in green, then "Scout" in ink and "AI" in green. Favicon: the mark on `#0b0f14`.
- **Buttons**: 38px pills, 1px `rule-strong` outline, transparent; hover pen-wash fill with a green border; press scales to 0.96 and returns through the spring curve. Primary: solid green. On: pen-wash with green text. Quiet: transparent with green text.
- **Segmented selector** (language, season, team, login mode): pill track on `glass`, selected segment solid green.
- **Inputs**: 40px, `sheet` fill, 1px `rule` border, 12px radius; focus is a green border with a 4px pen-wash ring.
- **Cards**: `glass` fill, 1px `glass-border`, 18px radius, `--lift`. No glass on glass.
- **Chips**: pen-wash pills for the filters the AI understood and for the similarity score; amber pills for N/D.
- **Icons**: Phosphor, regular weight, 16 to 20px, one outline style; the only bold glyphs are sort carets and the check mark.
- **Scale row**: a 28px row with a rounded baseline, ticks every 10 and a mark at the exact percentile (green X, or circle and square in compare). Unknown percentile: dashed baseline, no mark.
- **AI box**: green-wash rounded box with a "Generato dall'AI" badge and a note that the text uses only the data of the page. Used by the player report and the compare verdict.
- **Similar players**: cards with portrait, team and league, minutes and a "Somiglianza N%" chip. Calculated on percentiles, no AI, and it says so.
- **Register**: dense rows under a sticky header; hover is a 6% green tint, selected rows use pen-wash.
- **Footer**: centered mark, slogan and one line of data attribution.

### Motion
`--ease-out` (`cubic-bezier(0.22, 1, 0.36, 1)`) for hover and state changes (0.2 to 0.5s) and entrances; `--spring` only for the release of a press. The hero rises in once, scale marks draw in once, the compare tray rises into place. Nothing in the background moves. Everything is reduced to near zero under `prefers-reduced-motion`; under `prefers-reduced-transparency` the blurred bars become solid, and under `prefers-contrast: more` dividers and secondary text use their strong values.

## Do's and Don'ts

### Do:
- **Do** use ink for facts, green for what the user acts on or marks, amber only for uncertain or failed states.
- **Do** keep AI text in the labelled box, apart from the data.
- **Do** pair every compare color with its shape.
- **Do** state missing percentiles and small cohorts in the warning card or N/D chip.
- **Do** write labels in sentence case, short in both Italian and English.

### Don't:
- **Don't** use gradient text, glow halos, or green as decoration.
- **Don't** stack cards inside cards or blur a surface that has nothing scrolling beneath it.
- **Don't** animate the background or add overshoot to hovers.
- **Don't** use em dashes in interface copy, uppercase labels or kicker text above headings.
- **Don't** show pricing, testimonials or numbers that do not exist in the product.

## Open points

- `.impeccable/design.json` and `.impeccable/surfaces/` describe the earlier directions and are out of date. Regenerate them with `/impeccable document` rather than editing by hand.
- The brand board also shows a landing page, pricing and an app icon. Those surfaces do not exist in the product yet; only the identity (colors, type, icons, components, slogan) is applied.
