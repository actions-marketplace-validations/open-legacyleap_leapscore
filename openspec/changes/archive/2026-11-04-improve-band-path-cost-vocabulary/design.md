## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **The class input is fixed.** Cost class derives from the row's `effort` string, which is present on every row including placeholders (`apps/scanner/src/scan/scoring/bandpath.ts:21-29`). `remediation` is absent by design on `unknown` / `not_applicable`, so it cannot be the classifier (archived band-path design D3 stands).
- **What the string means is not fixed.** The canonical field is `Verify effort` and its values are measurement statements: `⚡ ≤ 30 min — bot dashboard + lockfile dates` (SEC-07), `⚡ ≤ 30 min — git author stats` (VEL-06), `🔷 ~1–2 days — harness setup + timed campaign` (SEC-09). Every surface currently presents the same string as remediation cost, including a row-detail box whose heading is literally `Remediation` (`apps/site/components/category-section.tsx:240-247`).
- **One model, five renderings.** `bandPathBlock()` in `packages/contracts/src/index.ts` is the single source; `apps/scanner/src/scan/render.ts` maps it to HTML and Markdown, `apps/site/components/band-path.tsx` maps it to JSX, and `formatBandPathClause()` produces the stdout clause. No surface re-derives.
- **The arrival sentence is the only reason a class needs a name.** Three states must render as grammatical sentences: reached alone, reached only in combination, not reached.
- **The enum is persisted; the labels are not.** `BandPathCostClass = "sprint" | "quarter" | "structural"` (`packages/contracts/src/index.ts:139`) is sealed into envelopes and committed in `apps/site/lib/fixtures/django__django__506fc82__2026-08-12T000000-000Z.json:4528`. `BAND_PATH_CLASS_META` (`:801-805`) is presentation only.

## Goals / Non-Goals

**Goals:**

- One class vocabulary, defined once in the contract, spoken identically by the site block, CLI HTML, CLI Markdown, and stdout.
- Every rendering of `effort` states that the value measures verification, and no surface presents it as a fix duration.
- Arrival sentences stay truthful and grammatical in all three states without borrowing a calendar noun.
- Preserve every existing arithmetic outcome: same steps, same class membership, same `pp` / `cumulative_pp` / arrival, same unreached count.

**Non-Goals:**

- No authoring of a remediation-effort field in the rubric (102 canonical files + compiler + generated artefacts).
- No class-level duration arithmetic of any kind.
- No change to `bandpath.ts` derivation, the envelope shape, the committed fixture, or the fingerprint.
- No redesign of the row-detail remediation block beyond its verify-tag chip.

## Decisions

### D1 — A class is delimited by its tag and carries no name of its own

**Chosen:** the class header renders the tag with explicit per-step framing — `Verify in ≤30 min`, `Verify in 2–4 h`, `Verify in 1–2 days` — and the arrival sentence refers to the class by the rows it contains: `These rows alone reach High`, `These rows cross only with the classes before it`, `These rows stay short of High`.

**Rationale:** the class *is* a set of rows sharing one tag. Naming it was the original error: every candidate name either asserts a duration the tag cannot support (`Sprint`, `Quarter`) or collides with the remediation vocabulary already visible in the same row detail (`Quick win`, `Structural`). Removing the name removes both failure modes at once, and the tag is the one identity the class genuinely has.

**Alternatives:** (a) `Low lift / Medium lift / High lift` — duration-free, but "lift" is a synonym for effort, which is the quantity we cannot quantify; (b) `Quick win / Bounded / Structural` — collides with `remediation.quick_win` and `remediation.structural` rendered four lines below in `category-section.tsx:250-256`; (c) `Cheapest / Mid / Deep` — "Cheapest alone reaches High" fails singular-verb agreement in the arrival grammar; (d) keep the names and append `each` — fixes the unit ambiguity but leaves the calendar metaphor and the fix-cost assertion intact.

### D2 — `effort` is presented as verification effort everywhere it appears

**Chosen:** the tag chip/line carries the verify framing, and the step line separates the tag from remediation prose with an explicit label instead of the current `— ⚡ ≤30 min: enable Dependabot…` construction, which reads as the fix duration.

**Rationale:** the canonical values describe auditing, not editing. The mismatch is the reason the calendar metaphor was introduced, so fixing the wording in one place fixes the root.

**Alternatives:** rename the canonical field to `Measurement effort` — rejected for this change: it touches 102 canonical files, the compiler, `rubric.json`, `rubric.ts`, and three generated sheets for the same behavioral outcome. Recorded as a possible follow-up if the disconnect resurfaces.

### D3 — Stdout speaks the class identity, not the enum key

**Chosen:** `formatBandPathClause()` emits the emoji stem — `next:High +11.86pp via ⚡`, `via ⚡+🔶` — in place of `via sprint+quarter`.

**Rationale:** the emoji is already the class's identity as carried by the sealed tag, is unambiguous at one character, and keeps stdout aligned with the block. Leaving the enum words in stdout while the block drops them would ship two vocabularies in one product — exactly the drift this change exists to prevent.

**Alternatives:** keep enum keys in stdout as machine identifiers — rejected on the two-vocabulary ground above; spell the tag out (`via ≤30min`) — rejected as noisier for no clarity gain.

### D4 — An absent tag is unknown cost, not cheap cost

**Chosen:** `apps/site/components/blockers.tsx:23` drops the `"⚡ ≤30 min"` fallback; a row with no registry entry renders `effort unknown`.

**Rationale:** defaulting the least-known row to the cheapest bracket inverts measurement honesty — the row we have no cost data for is asserted to be the cheapest to close.

**Alternatives:** omit the chip entirely — rejected because absence is then indistinguishable from "not rendered yet"; a `?` glyph — rejected as unexplained.

### D5 — No class-effort totals

**Chosen:** the block SHALL NOT publish a summed or ranged duration for a class.

**Rationale:** summing verification times does not produce a fix estimate, and computing it requires parsing free-text tags into numbers.

**Alternatives:** `Quarter (2–4 h each · 14–28 h total)` — rejected: false precision that compounds the semantic error by an order of magnitude; `7 fixes × ≤30 min` — rejected: arithmetically safer but still invites the aggregate-duration read the change removes.

### D6 — Labels are presentation; the enum is frozen

**Chosen:** `BandPathCostClass` keeps `sprint | quarter | structural`; only `BAND_PATH_CLASS_META`, the arrival branch, and the clause builder change.

**Rationale:** the enum is sealed into envelopes and committed in the site fixture. Renaming it is a persisted-artifact migration (fixture regeneration, old-envelope rendering, test churn) for a word the reader never sees.

**Alternatives:** rename to `quick | standard | structural` — rejected as above; add a parallel `label` field to the envelope — rejected: duplicates grammar that `report-envelope` forbids.

## Risks / Trade-offs

- [The scannable phrase "Sprint alone reaches High" is lost] → the deictic sentence sits directly beneath a tag heading, so its antecedent is unambiguous; a test asserts all three arrival states render as grammatical sentences.
- [Readers hunting for "quick wins" lose the word] → the tag remains the affordance and classes are ordered cheapest-first; the trade is recorded in D1's alternatives rather than discovered in the field.
- [`Verify in ≤30 min` still reads as a promise when the step's quick win is a multi-day job] → the step line separates tag from remediation text and the block keeps its applicability-assumption line; the durable fix is the follow-up remediation-effort field, which the proposal names as the only path to a published fix-cost number.
- [The path block and the row chips drift apart again] → the new `report-rendering` requirement makes verify framing a spec obligation rather than a styling choice, so a future surface that renders `effort` as remediation cost fails a scenario rather than shipping.

## Migration Plan

None required. Presentation-only: no envelope field, no fixture, no fingerprint input, and no derivation changes. Rollback is restoring the class metadata map and the arrival branch — no stored artifact becomes unreadable either way.

## Open Questions

None. The row-detail block heading (`Remediation`) is left in place because it accurately describes the `quick_win` / `structural` / `gold_standard` prose beside it; only the effort chip inside it is re-framed.
