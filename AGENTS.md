# Nguvu Pamoja Online Platform — Agent Instructions

## What this project is
A companion website for a faith-based support group's Friday sessions, for
participants who can't attend in person. Full context: `nguvu-pamoja-sot.md`
and `nguvu-pamoja-implementation-plan.md` in the project docs.

## Stack
- Eleventy (11ty) for templating — one layout + `src/_data/sessions.json`
  generates all 8 week pages. Do not hand-duplicate week pages.
- Supabase (Postgres, auto REST API, Row Level Security) for check-ins,
  journal entries, and forum posts — called directly from the frontend.
  No custom backend server, ever.
- Jitsi Meet, embedded via external_api.js, for video.
- Cloudflare Pages for hosting.

## Non-negotiable constraints
- No accounts tied to real identity. Participants are identified only by a
  random, client-generated token (a memorable three-word phrase).
- No public forum. Forum access is gated by a facilitator-distributed
  passphrase, separate from the personal token.
- No leaderboards, ranks, or public reputation of any kind.
- Only the Supabase `anon` key is ever allowed in frontend code. The
  `service_role` key must never appear in any file in this repo.
- Every new Supabase table needs a Row Level Security policy before any
  frontend code reads or writes it. Do not ship a table without one.

## Design conventions
- 12px corner radius on cards, consistent across every screen.
- One primary action per screen. Secondary actions get equal visual weight,
  never ranked against each other.
- Calm, warm visual tone — not competitive or gamified.
- Follow Shneiderman's Eight Golden Rules (see SOT Section 5) for any new
  screen: consistency, feedback, closure, error prevention, reversibility,
  user control, low memory load.

## Commands
- `npx @11ty/eleventy --serve` — local dev server
- `npx @11ty/eleventy` — build to `_site/`

## Working style
Small, deterministic changes over large speculative ones. If a design or
architecture decision isn't already established in the SOT or implementation
plan, ask rather than invent one — this project has an explicit decision log
for a reason.
