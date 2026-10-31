# LeapScore

Turns a codebase — a local directory, or any public GitHub repo — into a **legacy / maintainability score (0–100)** with a band, per-indicator evidence, kill-switch gates, and a cost-weighted fix plan. The scoring runs against a public, written rubric of **102 indicators across 10 categories**; every claim in a report traces to a fact a detector emitted, and everything not measured is disclosed as unmeasured rather than silently scored.

This README is the capability review: what LeapScore actually does today, what it does not, and how the pieces fit. Layout and editing rules live in `AGENTS.md`; the product view is `docs/PRODUCT.md`; `openspec/specs/*` is current truth for scan/report behavior.

## What it does

- **Two scan paths, one seal.** `leapscore-scan scan <path>` runs offline against a directory (25 clone-capable detectors, zero network, zero external binaries beyond `git`). `leapscore-scan --repo owner/repo` (or the scanner service's `GET /scan`) runs the unified remote scan: GitHub-API lane + shallow clone (`--filter=blob:none`) under one indicator-count-driven deadline (10 s–240 s). Both paths terminate in the same composer, `apps/scanner/src/scan/scoring/seal.ts`, so CLI, service, Action, and site all seal the identical envelope.
- **A sealed report, not just a number.** Every run writes `report.json` + `report.html` + `report.md`: headline score + band, the gates cockpit, category scorecards with per-row evidence, top blockers, a derived next-band path (what each recovery class costs, in percentage points), coverage honesty, a provenance manifest (engine/rubric/tool versions, commit SHA), and a deterministic `score_fingerprint`.
- **Bands with a real kill-switch.** Bands are `Low ≥80 · Moderate 53–79 · High 27–52 · Critical <27`. Eight gates (G1 credential exposure, G2 critical CVE >14d, G3 runtime EOL, G4 OWASP reachable, G5 untested core, G6 delivery on fire, G7 data-rescue risk, G8 copyleft in core) are evaluated as `proven` / `not-proven` / `needs-verification` / `unevaluable`. **A proven gate caps the sealed band at High** whatever the average says — a codebase with a live secret in it is not "Moderate" because the rest scored well. The cap lowers the *band* and never the *score*: the report keeps its honest number and discloses `gate_capped`, `uncapped_tier`, and `capped_by_gates` on the headline, stated identically in the CLI, HTML/MD reports, and the site. A score already in Critical stays there — the cap is a ceiling, never a floor. A gate whose source rows are all unknown is `unevaluable` and is stated as such, never counted as clear.
- **Honest arithmetic.** The headline uses the frozen denominator: `unknown` rows stay in the denominator as disclosed-unscored; `not_applicable`/`not_implemented` are excluded from both sides. `estimated` rows are clamped so an estimate can never claim Green/Red. If fewer than half of attempted rows come back gradeable, the headline is **suppressed** with an `insufficient-signal` verdict instead of printing a number.
- **Determinism.** `score_fingerprint` hashes sorted facts (timings normalized out) + rubric/engine version + engine sha7 + snapshot versions + semantic flags. `runId`, timestamps, and machine identity are excluded, so identical content + identical release ⇒ identical fingerprint. That is what makes `--baseline` diffs and `--ratchet` gate checks trustworthy.
- **Surfaces.** A stateless scanner service (`GET /scan` versioned NDJSON · `GET /health`), a zero-dependency CLI bundle (`action/dist/leapscore-scan.mjs`), a checkout-first GitHub Action, a `--badge` SVG for READMEs, and `apps/surface` — a separate process with its own token that turns a sealed envelope into labeled GitHub issues, warn-only.
- **Presentation site** (`apps/site`): marketing, `/live` (streams the scanner's NDJSON cross-origin), `/reports` history, `/rubric` browser over all 102 indicators, `/method` publishing the scoring model including the gate cap. The site never executes a scan; CI-enforced boundaries keep it that way.

## What it does not (yet)

- **Coverage is 31 of 102 indicators.** 6 GH-API detectors + 25 clone/local detectors run live; the other 71 seal as `not_implemented` and render as honest "what it takes to measure" stubs. The old 19-row MVP slice is a subset of what ships.
- **Gates G4, G5, G7 are permanently `unevaluable`** today — no detector feeds their source rows. They are disclosed as unevaluable, never silently passed.
- **The scanner is stateless**: no permanent disk, no served permalinks. Run history is a site-owned concern (v1 = committed static fixtures), not a scanner database.
- **No private-repo scanning via the service** (public GitHub URLs, or your own checkout via CLI/Action), no PDF export, no org/portfolio rollups.
- The deep-dive rows (18) and FE-conditional rows (8) fold into categories when run, but most of them are in the unimplemented 71.

## Architecture

```
packages/contracts/          producer-owned single source: report envelope, runId grammar, band
                             vocabulary + thresholds, gate cap (gateCapForTier / GATE_CAPPED_TIER),
                             badge model, next-band-path grammar, funnel copy, METHODOLOGY_URL.
                             No deps. Every producer + consumer imports it.

apps/scanner/                PRODUCE side — engine colocated with its entry points
  src/scan/                    orchestrator.ts (unified remote) · local.ts (offline path scan) ·
                               budget · clone · gh (the ONLY fetch site) · ingest · archetype ·
                               snapshots (vendored EOL + advisory data — scans work offline)
  src/scan/detectors/          31 engine-native detectors
  src/scan/scoring/            scorer/ (mvp, rollup + gates, applicability) · bandpath ·
                               fingerprint · provenance · seal.ts (the single terminal composer)
  src/server.ts                GET /scan (NDJSON meta→progress→trace→report|refused) · /health
  bin/scan.ts                  leapscore-scan CLI (scan · --repo · gates · badge · baseline)
  dist/leapscore-scan.mjs      shipped artifact: one readable ESM bundle, zero runtime deps

apps/surface/                sealed envelope → GitHub issues (separate process, separate token)
apps/site/                   PRESENT side — Next.js static site; never executes a scan
action/                      checkout-first GitHub Action over the committed dist
docs/rubric/                 the rubric (canonical): 102 indicators + weights/config
docs/specs/                  per-indicator implementation specs (all 102)
openspec/                    built-system specs — specs/ is current truth
tooling/                     CI checks + rubric compiler + snapshot refresh
```

Key boundary decisions, each enforced by a `tooling/checks/*` gate:

- **One seal.** Both scan entries and both artifact emitters go through `sealScan`; there is no second scoring path. The gate cap lives in the contract, so the seal and every surface state it from the same definition.
- **Producer-owned contract.** Band names, thresholds, cap semantics, the next-band-path block, the cap sentence, funnel copy, and the methodology URL are exported by `@leapscore/contracts`. Surfaces that restate them drift; surfaces that import them can't.
- **Detection isolation.** Only `src/scan/gh.ts` may call `fetch`; detectors get data through a read-only, byte-capped `readFile` and the injected GH client.
- **Site carries no scan runtime**; **surface never shares a process or token with the scanner.**

## Scoring model (summary)

| Piece | Rule |
|---|---|
| Row states | 5-valued, precedence `not_implemented > not_applicable > unknown > estimated > measured`; `estimated` clamped, `unknown` carries a measure path |
| Category % | (Σ applicable row scores ÷ applicable count × 3) × 100, frozen denominator |
| System score | Σ(category % × weight); base weights + FE-active set (FE 10 %, others ×0.9) |
| Bands | ≥80 Low · 53–79 Moderate · 27–52 High · <27 Critical |
| Gate cap | A `proven` gate caps the band at High (ceiling only); score unchanged; cap disclosed on the headline |
| Coverage floor | <50 % gradeable → headline suppressed as `insufficient-signal` |
| Next-band path | `points_needed = threshold − sealed score`, steps cost-classed by verify effort (⚡ sprint · 🔶 quarter · 🔷 structural) |

## Using it

```bash
# offline scan of a checkout
npx leapscore-scan scan . --out report/

# remote scan of a public repo
leapscore-scan --repo owner/repo --out report/

# CI gate + trend + badge
leapscore-scan scan . --out report/ --fail-under-band moderate \
  --baseline report/baseline.json --ratchet --badge badge.svg
```

The GitHub Action wraps the same CLI over your checked-out tree (`action/`). The scanner service streams NDJSON for `apps/site`'s `/live`; start it with the scanner app's `src/server.ts`.

## Development

```bash
npm install
npm run compile:rubric            # canonical rubric → engine rubric.json + site registry
npm test                          # per-workspace vitest suites
npm run check:rubric-consistency  # + check:detector-isolation · site-boundary ·
                                  #   surface-boundary · bin-wiring · dist-freshness
```

Canonical vs. derived is the cardinal rule: thresholds and semantics are edited in `docs/rubric/`, implementation recipes in `docs/specs/`, and everything generated (`rubric.json`, `lib/generated/rubric.ts`, the Action dist) is regenerated, never hand-edited.
