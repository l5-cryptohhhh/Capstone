---
version: 1
slug: "frontend-src-app-tsx"
primary_target: "frontend/src/App.tsx"
related_targets: []
---

# Surface brief: ScoutAI web app (search, player dossier, compare)

Mode: Operate (a scout's working tool; sessions are long and repeated).
Audience and job: scouts and analysts at small and mid clubs; find candidates, understand strengths and weaknesses, compare.
Action: open a player's dossier and add players to a comparison.
Proof/content: real imported statistics only; partial import means small cohorts and missing percentiles, shown honestly.
Constraints: Italian and English; light and dark; keyboard accessible; no fake AI features (AI is not built yet).
Memorable moment: the percentile scale rows, where a pen "X" is marked on a 0 to 100 ruled scale, and red rubber stamps own every uncertain state.
Unresolved: AI annotation treatment (later phase).

## Direction contract

THESIS: ScoutAI is the scout's observation dossier made interactive. Measured facts are typeset in printed ink; every judgment is a mark placed on a scale. It refuses the dark-dashboard-with-radar arrangement and the card-grid of identical tiles.

OWN-WORLD: Cool white paper #F4F6FA page, #FBFCFE sheets, ink #14233F, biro pen blue #2455D9 for everything the user marks or selects, red stamp #C8312B for states and warnings. Hairline 1px rules, ruled field boxes with 0-2px radius, no shadows except a single soft sheet lift. Archivo variable: condensed heavy for names and form headings, normal width with tabular figures for values; sentence-case field labels. Night variant: desk-lamp ink #101A2E with the same rules in pale paper tone and brighter pen. Compare marks use X, circle and square in blue, red and green (validated palette).

STORY: A scout lands on a ruled search form and a results register, understands within seconds that this searches real data, trusts the numbers because each is a printed value with its scale, and acts by opening a dossier or ticking players into a comparison.

FIRST VIEWPORT: One-line top bar (wordmark in condensed heavy, nav Cerca and Confronta, IT/EN, theme). Left 320px "form sheet" for the search (name, role boxes, league, season, age, minutes, feature rows). Right: a ruled results register with a count line, sticky header and dense rows (checkbox, photo, name and age, role, team, minutes, goals, assists, rating, chosen metric cells). First result rows visible without scrolling; filters apply live.

FORM: Scouting dossier forms (position 1 on my ordered list, the pick), seed key b6443d1a, kind pick.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
