# 09 — Monetization & Tiering (historical proposal)

> **Status:** Historical pricing and packaging hypotheses. The tiers, customer journeys, cost assumptions, and open items below are not current offers or commitments. Verify current product capabilities in [`PRODUCT.md`](../PRODUCT.md) and [OpenSpec](../../openspec/specs/) before using these ideas externally. Original dependencies: `01` (proposed buyers), `04` (proposed first release), and `07` (time-sensitive market snapshot).

---

## 1. Pricing principles

1. **The free tier must be launch-safe**, not loss-leader (no code execution, capped budget — `04`/`05`).
2. **The paid tiers must sell certainty** (`measured`), **depth** (deep-scan rows), and **scale** (private repos, batch), never the trick of a higher number.
3. **M&A is a different currency**: they don't pay per report; they pay for a *scoped diligence capability* — the machine-generated `deep_dive_scope` + hard gates + `measured`-only tallies.
4. Pricing ladder is anchored on the *coverage band* (measured/estimated/unknown share, `02`), which is the honest escalation unit.

---

## 2. Freemium ladder (public door)

| Tier | Trigger | What you get | Rationale |
|---|---|---|---|
| **Free** | Open URL, no account (or trial account) | Full report on any *public* repo: measured+estimated score, coverage bar, per-row evidence + remediation, gate table, unknown-list | Brand + data moat (every public scan trains detectors). Rate-limit + budget-capped (`05` §4) |
| **Pro** (per-seat) | Logged-in, wants more scans + concurrency | More scans/mo, higher concurrency, priority queue, scheduled re-scans (diff tracking), report history, export (HTML/PDF), `measured`-only view | Sells scale + workflow, not certainty |
| **Deep Scan** (per-scan, the certainty-mover) | Wants rows off the `unknown` list | Runs **v2 capability** (test-execution in isolated sandbox → TEST-* measured; CI/checks history pull; optional Dependency/SBOM-export; live-env probe kit for C-tier rows) | **This is the real revenue engine**: it converts `unknown` → `measured`, i.e. it *sells the honesty model*. Heaviest compute → highest margin gate |
| **Team/Org** | Teams scoring many repos | All Pro + shared dashboards, portfolio view (sort by tier), drift alerts, baseline history | Portfolio scoring is the freemium→paid natural motion |

**Anchor the message:** *"The free report tells you the truth about what's provable. Deep Scan turns unknown into measured — that's what you're paying for."* Free = marketing; Deep = money; Pro/Team = conventions.

---

## 3. M&A offering (private door)

A bundled **due-diligence engagement** rather than a self-serve unit:

| Deliverable | What it is | Price shape |
|---|---|---|
| **Repos scanned** (per-repo report) | Full report (`measured`+`estimated` view or `measured`-only) + gate table + top blockers | Per-repo unit price with volume steps |
| **Portfolio pack** (org-scope) | Every repo scored, weighted by criticality (the 00 rubric *system roll-up*), sorted by tier, one command | A flat "portfolio" package; the system roll-up (Part B/C of the rubric) is *the* artifact |
| **Due-diligence brief** | Machine-generated `deep_dive_scope` as a work-order: which rows are unprovable, what the target must stand up to prove them, estimated verify-effort from the 🔷/🔶 tags | Premium — this is the "go find a deep-scan partner / scope the engagement" product |
| **Measured-only tallies** | For arm's-length buyers (OQ2) | Converts any report; no extra price, higher trust |

M&A is sold as **"we tell you what we can and can't prove from code, and turn the can't-prove into a scoped work-item list — before your advisors start the manual audit."** That's the wedge over manual diligence (`07` §3).

---

## 4. Cost model anchors (the freemium-defining constraint)

| Variable | Target | Source |
|---|---|---|
| Free-scan budget | ~1–5 min wall-clock | `05` §4; also OQ4 |
| Free-scan infra cost | < a rounding-error margin per scan (public repo clones are cheap when blob-filtered) | measurement at open |
| Deep-scan cost | Test-execution sandbox dominates; price accordingly | `08` §2 sandbox + `10` v2 |
| Portfolio (M&A) | Batch scan + report assembly; the *brief* is the margin | manual diligence delta |

**OQ4** decides the free-budget ceiling; every increase is a direct constraint on the freemium funnel.

---

## 5. The "honesty-as-pricing" funnels

| Question buyer asks | Free answer | Paid answer |
|---|---|---|
| "What's the score?" | 41/100 with coverage 65% measured | Same score, more rows `measured` (Deep Scan) |
| "Why?" | Row-by-row evidence | Re-scan history + diff tracking (Pro) |
| "Which rows are fake?" | Every `estimated` labeled, every `unknown` explained | Deep Scan removes the label |
| "Is it my whole portfolio?" | One URL at a time | Portfolio pack (M&A) / Team dashboards |
| "Will you stand behind it?" | Reproducible score from sealed report | `measured`-only tallies for arm's-length deals |

No funnels promise a *better score*; they sell *more truth, more scope, more scale* — which is why the model survives an honest buyer.

---

## 6. Open pricing items (for the sales plan, not this doc)

- Currency of the Deep-Scan upsell: per-repo/per-row? (Recommend: per-repo with row-package add-ons.)
- Whether free reports expire (recall policy) so a stale `measured` can't be quoted in a deal.
- M&A volume pricing floor; whether the brief is sold *before* (as scoping) or *after* (as deep-dive) a scan.
- Reseller/SI channel for the Deep-Scan execution (the `deep_dive_scope` needs *someone* to run the environment probes — that's a partnership, not competition).
