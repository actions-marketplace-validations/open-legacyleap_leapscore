## Why

The rubric's `Verify effort` field answers "how long does it take to **measure** this row" — SEC-07's `⚡ ≤30 min` is *"bot dashboard + lockfile dates"*, VEL-06's is *"git author stats"*, SEC-09's `🔷 ~1–2 days` is *"harness setup + timed campaign"* (`docs/rubric/indicators/04-security-compliance/SEC-07-patch-cadence-update-workflow.md:19`, `.../VEL-06-bus-factor-knowledge-concentration.md:19`, `.../SEC-09-input-robustness-fuzzing.md:19`). Every consumer then presents that same string as the cost of **fixing** the row: the sealed next-band path prints `⚡ ≤30 min: enable Dependabot/Renovate with auto-merge…`, and the site's row detail prints it inside a box headed `Remediation` (`apps/site/components/category-section.tsx:240-247`). One string, two referents, and nothing in the catalog or the specs governs which one a surface is allowed to assert.

On top of that mismatch sits a second one the cost-class labels manufacture. Class identity is a *per-step* tag (band-path D3), but the rendered heading is a *class* duration borrowed from the calendar — `Sprint (⚡ ≤30 min)`, `Quarter (🔶 2–4 h)`, `Structural (🔷 1–2 days)` (`packages/contracts/src/index.ts:801-805`). A reader sees "Sprint" (two weeks) and "Quarter" (three months) bracketed by numbers that are neither, and the block's headline claim — *"Sprint alone reaches High"* — reads as a schedule promise the data does not license. The metaphor was chosen to smooth that unit ambiguity (archived band-path design D3), and it fails exactly at the sentence the block exists to say.

Why now: the sealed report is the product's entire output, and the first generated scan artefact shows the damage plainly — a Critical `15.14` report telling the reader that 20.5 pp of recovery is reachable in "2–4 h" via steps whose tags measure *auditing*, not *fixing*.

## What Changes

- **Keep D3's mapping, drop its implication.** Cost class still derives from the verify-effort tag (⚡ / 🔶 / 🔷), because the tag is present on every row including placeholders. What changes is what the class is *called* and what the report *claims* for it: a verification-depth grouping, ordered cheapest-to-verify first, never a remediation estimate.
- **Duration-free class labels.** Replace `Sprint` / `Quarter` / `Structural` with commitment words that make no calendar promise and collide with neither `remediation.quick_win` nor `remediation.structural` (both are already user-visible: `category-section.tsx:250-256` renders "Quick win." / "Structural."). Exact words land in design; the acceptance test is the arrival sentence grammar — `"<class> alone reaches <band>"` must read true when the class total crosses, and must not imply an elapsed time.
- **One vocabulary on every surface.** `formatBandPathClause()` currently emits the raw enum (`"next:Moderate +5pp via sprint+quarter"`, `index.ts` in the band-path clause block) while the HTML emits the label; a label-only change would ship two vocabularies in one product. The stdout clause SHALL derive its words from the same class metadata.
- **Verify framing wherever `effort` is rendered.** The path block's per-step line, the row-detail chip (`category-section.tsx:247`), the blockers chip (`blockers.tsx:23-34`), and both CLI emitters SHALL present the tag as verification effort, not remediation effort, and SHALL NOT concatenate it with remediation prose in a way that reads as a fix duration.
- **An absent tag is unknown cost, not cheap cost.** `blockers.tsx:23` falls back to `"⚡ ≤30 min"` when a row has no registry entry; a missing tag SHALL render as unknown rather than defaulting to the cheapest bracket.
- **A guardrail requirement.** `report-rendering` gains the missing rule: no surface may render the verify-effort tag as, adjacent to, or inside a label asserting remediation cost or remediation duration. The absence of such a rule is what allowed the drift to reach every surface at once.
- **No class-effort totals.** The obvious next step — `Quarter (🔶 2–4 h each · ~14–28 h total)` — is explicitly rejected: it prints an arithmetic sum over *verification* times and labels it fix cost, and it requires parsing free-text tags to get a number. It is the error this change exists to remove, multiplied by seven.

**Non-goals.**

- **Authoring a real remediation-effort field** across the 102 canonical indicator files (canonical doc row → compiler → `rubric.json`/`rubric.ts` → sheets → schema/consistency checks). That is the only path that would ever license publishing a fix-cost number, and it is a separate change with its own authoring burden.
- **Renaming the persisted enum** (`BandPathCostClass = "sprint" | "quarter" | "structural"`) or changing the `next_band_path` envelope shape. The labels are presentation; the sealed field, the committed site fixture, and the envelope grammar stay byte-compatible.
- **Touching the derivation.** Step candidacy, recoverable-points arithmetic, class ordering, cumulative arrival, shortfall and unreached disclosure are all unchanged. The path is still `15.14 → High, 11.86pp needed` with the same steps and the same totals.
- **Touching scoring.** No threshold, weight, formula, gate, rubric artifact, or fingerprint input changes; `npm run check:rubric-consistency` is expected to pass untouched.
- **Editing generated artefacts by hand.** `report/report.{html,md,json}` is an untracked local scan output, not a fixture; it is regenerated, never edited.

## Capabilities

### New Capabilities

None. This change renames and re-scopes an existing presentation contract; it does not introduce a capability.

### Modified Capabilities

- `band-path`: the cost-class requirement keeps the verify-effort tag as its input and the sprint→quarter→structural derivation order, but the class is defined as a verification-depth grouping with a duration-free identity, and the class vocabulary is single-sourced so stdout and every report surface speak the same words. Arrival sentences lose any calendar or remediation-duration implication.
- `report-rendering`: the path block renders the duration-free class label alongside each step's verify tag; every row-level `effort` chip is labelled as verification effort; an absent tag renders as unknown instead of the cheapest bracket; and no surface may present the verify-effort tag as remediation cost or duration.

## Impact

- `packages/contracts/src/index.ts` — `BAND_PATH_CLASS_META` (labels only, keys unchanged), the arrival-sentence branch in `bandPathBlock()`, and `formatBandPathClause()` (stdout vocabulary).
- `apps/scanner/src/scan/render.ts` — class heading and step line in both emitters; the block model already carries the wording, so no new derivation.
- `apps/site/components/band-path.tsx`, `blockers.tsx`, `category-section.tsx` — class label, verify framing, and removal of the `⚡ ≤30 min` fallback.
- Wording-pinning tests: `packages/contracts/src/index.test.ts`, `apps/site/components/band-path.test.tsx`, `apps/scanner/src/scan/__tests__/band-path-cli.test.ts`, `apps/scanner/src/scan/__tests__/bandpath.test.ts` (enum assertions survive; label and arrival assertions move to the new vocabulary).
- Unchanged: `docs/rubric/**` and the compiled registry, `apps/scanner/src/scan/scoring/bandpath.ts` derivation, the `next_band_path` field, the committed site fixture, scoring/gates/thresholds/fingerprint.
