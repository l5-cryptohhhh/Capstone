# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript (frontend in `frontend/`), consuming the Spring Boot REST API in `backend/` (`/api/v1`). Confirmed by the user. Deploy target: free tiers (Vercel/Cloudflare Pages for the frontend).

## Users

Primary: scouts and analysts at small and mid-size clubs. They work in long sessions, searching for players who fit a profile, shortlisting candidates and comparing them, and need to understand strengths and weaknesses fast. Secondary (not the design priority): advanced fans (Football Manager, fantasy football). Confirmed by the user.

## Product Purpose

ScoutAI helps a scout move from "who do I need?" to a short list of real candidates. It searches real player statistics, ranks each player against positional peers (percentiles), and, in later phases, lets an AI interpret natural-language requests and explain the numbers. Success: a scout finds, understands and compares candidates faster than with a generic stats site. It is also a portfolio capstone that its author must be able to explain end to end at a demo day.

## Positioning

Unlike a stats site that answers "what did player X do?", ScoutAI answers "who fits this profile?". The database decides who exists and what the numbers are; the AI only interprets requests into structured filters and narrates real numbers. It never invents statistics. Every figure is traceable to the data source and every AI statement is distinguished from data.

## Operating Context

Data comes from API-Football (free plan: 100 requests/day, seasons 2022-2024 only, no xG or progressive passes). Currently imported: top 5 European leagues (Serie A, Ligue 1, Bundesliga, Premier League, La Liga), season 2024 first, then 2023. Import is incremental over about six days, so the UI must work with partial data (small cohorts, missing percentiles). Metrics are per-90 and percentile-based, with percentiles computed per position, league and season for players with at least 450 minutes.

## Capabilities and Constraints

- Backend endpoints available now: `GET /players` (filters: q, position, age, league, team, season, minutes, metric value/percentile filters, sort, paging), `GET /players/{id}`, `GET /leagues`, `GET /leagues/{id}/teams`, `GET /metrics`.
- Not available yet (do not fake in the UI): natural-language search, AI scout report, AI comparison verdict, similar players, auth, shortlist sync.
- Missing values are null, never 0. Percentiles may be null (cohort or minutes too small): the UI must say why.
- Player age is computed today, while statistics belong to a past season: label seasons explicitly ("2024/25").
- Players who changed team appear once per team.
- Interface languages: Italian and English with a language selector (confirmed by the user). Default Italian.
- Football terminology to keep consistent: per 90 minutes, percentile, cohort (positional peers), minutes played.

## Brand Commitments

Name: ScoutAI. No logo or brand assets exist yet. The user asked for the visual identity (colors, style) to be chosen by the designer's own judgment.

## Evidence on Hand

Real data: players, teams and statistics imported from API-Football into PostgreSQL (partial: first pages of Serie A 2024 at the time of writing). No testimonials, customers, benchmarks or pricing exist and none may be invented.

## Product Principles

1. Data first, AI second: real numbers are always visible and visually distinct from AI interpretation.
2. Show uncertainty honestly: small samples, missing data and partial imports are stated plainly, never hidden or faked.
3. Search is a conversation with the data: filters are always visible and editable, never a black box.
4. Fast for repeat use: a scout who comes back daily should reach a candidate shortlist in few steps.
5. Explainable end to end: every screen should be defensible by the author in front of a technical jury.

## Accessibility & Inclusion

Keyboard-navigable, visible focus, WCAG AA contrast in both themes, reduced-motion respected, color never the only carrier of meaning (percentiles also show numbers). Italian and English.
