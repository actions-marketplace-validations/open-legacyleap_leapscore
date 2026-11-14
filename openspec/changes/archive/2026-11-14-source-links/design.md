## Context

See `proposal.md` — Why. Current state that shapes the approach:

- `apps/site/components/site-header.tsx` exports a `NAV` array of three entries and renders a text-only nav; `openspec/specs/site-shell/spec.md` pins that count.
- `apps/site/components/footer.tsx` already mixes route links (`next/link`) with one absolute external link (`mailto:hello@leapscore.dev`), so an absolute `https://` anchor is an established pattern there.
- `apps/site/app/page.tsx` renders the licence claim as a static `<span>` inside the hero badge.
- The site is a server-free static export; `lib/base-path.ts` is the only module that reads deployment input, and internal URLs must go through `next/link`.
- `packages/contracts` carries deployment URLs (`SITE_BASE_URL`, `REPORT_BASE_URL`, `ASSESSMENT_BASE_URL`) but no repository URL.

## Goals / Non-Goals

**Goals:**
- One place in the site that names the repository, so the three surfaces cannot drift.
- The licence and auditability claims become checkable where they are made.

**Non-Goals:**
- Promoting the repository URL into `@leapscore/contracts`. The scanner's `package.json` remains the producer-side source; a cross-package constant is a separate concern with its own release surface.
- Changing the header, the nav array, or any scan/report behavior.

## Decisions

**D1 — `apps/site/lib/source-links.ts` owns the URL.** A single exported constant (plus the display label), imported by the footer, the hero badge, and the method line. Alternative considered: a bare literal in each component — three copies that can drift, and no place for the claim-honesty test to assert one value. Alternative considered: `@leapscore/contracts` — rejected for scope, since the contracts package is producer-owned and versioned with the scanner.

**D2 — Footer gets the link in its existing nav row, not a new row.** The footer nav already reads as the site's full map (Samples / Method / Rubric / email); `Source` is the fifth item in the same list, so the layout does not change.

**D3 — The hero badge becomes an anchor, not a new badge.** The badge already says `Local-first · Apache-2.0 · no telemetry`. Wrapping its existing text in an anchor to the repository preserves the hero's visual weight and turns an existing claim into evidence. The link label stays the licence word so the affordance is unambiguous.

**D4 — `/method` gets one sentence, in the closing section.** The page already invites auditing the arithmetic ("exactly, no guestimates"); the sentence names the repository as the home of the scanner, the canonical catalog, and the report schema, and links it once.

## Risks / Trade-offs

- [Header spec regression] The `site-shell` requirement counts nav links; adding a repository affordance elsewhere could be read as a fourth nav item → Mitigation: the delta spec states the requirement against the footer and open-source claims, and the tasks include a guard assertion that the header nav still renders exactly three links.
- [Claim-honesty test drift] `lib/claim-honesty.test.tsx` renders the home and method pages; a new anchor is fine, but the banned-claim register must stay untouched → Mitigation: no new copy beyond the source label and the method sentence.
- [Dead external link if the repository moves] → Mitigation: one constant, so the fix is a single edit; the Apache-2.0 licence text and `repository` metadata in `apps/scanner/package.json` already point at the same home.

## Migration Plan

Presentation-only. No persisted data, no deployment input change, no rollback path beyond reverting the commit. The static export rebuilds with the same `SITE_BASE`.
