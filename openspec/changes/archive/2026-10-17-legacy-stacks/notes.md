# legacy-stacks — change notes

Working notes for review: dogfood records and findings that are not part of the specs.

## 5.1 Dogfood: canonical-walk skip-dir change (before/after file counts)

Design D6 adds `obj`, `target`, `.gradle`, `.vs`, `__history`, `__recovery` to
`walkSortedTree`'s `SKIP_DIRS` (`apps/scanner/src/scan/tree.ts`). Since the change
moves `fileCount` → `computeSampleN` inputs, the effect was measured on this repo
itself with `npx tsx tooling/scripts/dogfood-skipdirs.ts` (2026-10-17):

| Metric | Before | After |
| --- | --- | --- |
| Files in walk (repo root) | 869 | 869 |
| Path entries in walk | 1195 | 1195 |
| Files skipped by the new dirs | — | 0 |

Per-dir counts in this repo: `obj` 0 · `target` 0 · `.gradle` 0 · `.vs` 0 ·
`__history` 0 · `__recovery` 0.

Notes for the reviewer:

- `.gradle` and `.vs` were already excluded by the walk's dot-directory rule; the
  explicit SKIP_DIRS entries are intent-documenting additions, not behavior changes.
- `obj`/`target`/`__history`/`__recovery` are the behavior-changing additions; this
  repo has none, hence delta 0. The mechanism (and the `fileCount` effect) is
  asserted on a fixture in `legacy-stacks.test.ts` (5.1 block): exactly the kept
  files are counted, skipped dirs never appear in `paths`.
- `bin/` and `packages/` stay walked by design (unix `bin/` holds real source;
  `packages/` is a workspace convention) — asserted in the same fixture.

## 7.3 Dogfood: CLI before/after (suite + local scan)

Full suite: 22 files / 239 tests green (`apps/scanner`, `SCANNER_NO_LISTEN=1 npx vitest run`).

Before/after method: the same targets scanned offline through the real CLI
(`npx tsx apps/scanner/bin/scan.ts scan <target> --out <dir>`, default budget) with
the pre-change engine (clean worktree at `ba82f47`, the detector-honesty commit
that precedes this change) and with the change worktree; identical target trees,
machine, and datasets.

| Target | Headline before → after | Suppressed | Coverage m/e/u/n-a/not-impl | Renorm. | Row moves |
| --- | --- | --- | --- | --- | --- |
| repo itself | 11.67 → 10.56 | true → false | 12/1/14/4/71 → 13/1/13/4/71 | 44.44 → 37.04 | ECOS-01 unknown→measured |
| webforms-vbnet | 2.22 → 10.95 | true → false | 8/0/17/6/71 → 16/1/9/5/71 | 17.78 → 28.04 | DATA-01 n/a→measured; ECOS-01/02/03/06/07/08 + SEC-01 unknown→measured; ECOS-05 unknown→estimated |
| delphi | 2.22 → 2.70 | true → true | 8/0/17/6/71 → 9/0/16/6/71 | 17.78 → 22.22 | ECOS-01 unknown→measured |

Notes for the reviewer:

- The .NET/VB.NET estate now clears the coverage floor (16m+1e of 26 requested)
  and renders a real headline; VB6/Delphi stay `insufficient-signal` by design
  (thin estates, design.md risk row) with the renormalized reference visible.
- Self-scan fixture inflation (dogfood finding): the repo's own committed fixture
  estates sit inside the scan target, so the self-scan legitimately measures
  `delphi@XE8` / `vb6@6.0` pins from `__tests__/fixtures/legacy-stacks/**`
  (`ECOS-01 unknown→measured`). That single row is what moves the self-scan
  across the coverage floor (12m+1e/27 = 48.1% → 13m+1e/27 = 51.9%) and flips
  the repo headline from suppressed to displayed. Not a regression — an honest
  reading of the tree — but it sharpens the frozen-denominator/headline-display
  question carried into 8.2/8.3.
- ECOS-01 on the self-scan scored 1 (EOL runtime confined outside the core path);
  fixture pins are not in any import closure.

## 8.1 Two-estate validation: selection, provenance, sealed scans

### Selection and provenance

| Estate | Upstream (release tag) | Commit | License | Checkout | What it is |
| --- | --- | --- | --- | --- | --- |
| Orchard CMS 1.10.3 | `OrchardCMS/Orchard` @ `1.10.3` | `cb0011c307f15be6600f3ecf40f521fed5b17a3f` | New BSD (3-clause, .NET Foundation) | 101 MB | real .NET Framework 4.x WebForms/ASP.NET CMS — 90 `.csproj`, 165 dependency manifests, 80 test files |
| Apache Roller 5.2.2 | `apache/roller` @ `roller-5.2.2` | `bb34cad62d8fab281d1e7ce83f73c7817c38fa26` | Apache-2.0 | 23 MB | real Java 6/7-era Maven multi-module web app — lockless Maven tree, 80 test files |

Clones are shallow (depth 1) and live outside the repo
(`~/legacyleap/legacy-stacks-estates/<estate>/`; not committed). Both are public
OSS at release tags. History-dependent rows read the shallow history honestly
(e.g. ARCH-05 "1 commits / NNNNd"); a deep clone is a follow-up option if churn
evidence is wanted.

### Method — sealed, zero-socket

```
SCANNER_NO_LISTEN=1 npx tsx apps/scanner/bin/scan.ts scan <estate> --strict \
  --out ~/legacyleap/legacy-stacks-estates/packet/<estate>
```

(from repo root; local path only, no `--repo`). `--strict` aborts on any network
attempt — vendored snapshots only (`eol-2026.10-1c0bd1337838`,
`adv-2026.10-ad855d8189da`); contract v1, fingerprint v2,
`engineSha7=unknown` (uncommitted working tree); each run seals
`report.json` + `report.html` + `report.md`.

| Estate | runId (sealed, post-fix) | Fingerprint (64-char) | Duration / budget |
| --- | --- | --- | --- |
| orchard-1.10.3 | `orchard-1.10.3__unknown__2026-10-17T143341-789Z` | `331ada9f…39fd4248d` | 4.1 s / 240 s |
| roller-5.2.2 | `roller-5.2.2__unknown__2026-10-17T143338-439Z` | `8039222c…fd60fb8d` | 0.8 s / 240 s |

### Headline + coverage (sealed)

| Estate | Headline (frozen) | Renormalized ref | Suppressed | Coverage (m/e/u of requested) | N/A | Not impl. |
| --- | --- | --- | --- | --- | --- | --- |
| orchard | 3.81 · Critical | 28.57 | yes — 9/28 = 32% < 50% floor | 9/0/19 of 28 | 3 | 71 |
| roller | 7.94 · Critical | 26.54 | yes — 13/29 = 45% < 50% floor | 11/2/16 of 29 | 2 | 71 |

Verdict `insufficient-signal` on both — the design risk row ("thin estate →
honest insufficient-signal; not a regression") met with real evidence; this is
also the carried frozen-denominator headline-display question (see review
questions below and 8.2).

### 8.1 finding: silent read-budget starvation → fabricated claims (fixed in this change)

The first sealed pass exposed a real-estate-only bug: the per-detector read
budget (`partitionByteCap(4 MB, ~31 detectors)` → 256 KiB floor) starves
manifest/test reads on a large estate, and `readText` swallowed the
`QuotaExceededError` — detectors graded, or made substantive claims about, the
deterministic prefix. Orchard pre-fix, verbatim: ECOS-02 `unknown` — "every
direct dependency is unresolvable against the vendored package table (18 deps,
fully private ecosystem)" (the 18 entries came from the starved prefix — the
estate's JS build manifests/gulp tooling); TEST-03 — "only 0% of 80 test files
could be tier-classified"; ECOS-07 graded pinning from the prefix; ECOS-08 read
as `not_applicable` (no frameworks in the prefix). A scratch simulation
reproduced the starved read bit-exact (17 of 165 manifests); reading the full
surface yields 54 unique production deps, 5 resolvable in the curated table.

Fix: manifest/test reads that hit the budget are tracked
(`DependencyScan.manifestsTotal`/`readBudgetExhausted`,
`TestScan.unreadByBudget`); every affected row is `unknown` with read coverage +
measure path ("reads hit the per-detector read budget after 17 of 165 dependency
manifests — … scan a narrower sub-tree (or raise the scan read budget)") — the
prefix is never graded. Spec scenario added ("Read-budget truncation is a
disclosed unknown, never a partial verdict"); regressions in
`legacy-stacks.honesty.test.ts`.

| Estate | Pre-fix (superseded) | Post-fix (sealed) |
| --- | --- | --- |
| orchard | 7.22 / renorm 40.74 · 11m/0e/16u+4na (41%) · fp `03400a8f17ea7ea5…` · runId `…T141522-947Z` | 3.81 / 28.57 · 9m/0e/19u+3na (32%) · fp `331ada9f…` · runId `…T143341-789Z` |
| roller | 11.27 / renorm 39.9 · 12m/2e/15u+2na (48%) · fp `840b94eb93c8cf66…` · runId `…T141528-531Z` | 7.94 / 26.54 · 11m/2e/16u+2na (45%) · fp `8039222c…` · runId `…T143338-439Z` |

Both estates were suppressed before and after — the fix corrected *what* the
unknowns and claims say, not the suppression state. Row moves (post-fix):
orchard ECOS-07 measured(0)→unknown, TEST-05 measured(3)→unknown, ECOS-08
n/a→unknown; ECOS-02/03/05/06 + SEC-01 + TEST-03 stay `unknown` with the starved
claim replaced by the budget disclosure. Roller TEST-05 measured(3)→unknown;
TEST-03 unknown→unknown with the budget note. The headline deltas explain
exactly: orchard −3.41pp (TEST-05's TEST contribution 3.33 + ECOS denominator
0.08); roller −3.33pp (TEST-05). Pre-fix outputs were overwritten by the sealed
rescans; the pre-fix numbers above are from the runs' stdout records (no
retained artifacts).

### Unknowns (post-fix) — by cause

| Cause | Orchard | Roller | Measure path |
| --- | --- | --- | --- |
| GH-API lane absent offline | 6 (VEL-06/08/09/10, SEC-07, TEST-08) | 6 (same) | run against a `--repo` / GH-API lane |
| Read budget (256 KiB/detector) | 9 (ECOS-02/03/05/06/07/08, SEC-01 "after 17 of 165"; TEST-03/05 "after 29 of 80") | 2 (TEST-03/05 "after 34 of 80") | narrower sub-tree or raised scan read budget |
| Lockless / no-pin design | — | 4 (ECOS-01 no pin; ECOS-03/SEC-01/ECOS-06 no lockfile) | per-row note (pin the tree / add a lockfile) |
| Offline tooling not shipped / thin history | 4 (SEC-06, ARCH-01/05/08) | 4 (same) | per-row note (analyzer / resolver / history) |

Review packet: `~/legacyleap/legacy-stacks-estates/packet/` — `README.md`
(provenance, method, headline-display + read-budget-scaling questions),
`coverage.md` (per-category + measured/n-a rows), `unknowns.md` (per-row
verbatim measure paths). Pre-fix vs post-fix row moves are in the tables above.

### Candidate findings (for the 8.3 review — not fixed here)

1. **ECOS-01 partial-surface claim.** Orchard's ECOS-01 is `measured(1)` from a
   pin set drawn under the same starved read — the retained evidence names a
   single test-project csproj (`Orchard.Azure.Tests.csproj`, dotnetfx@4.0),
   `conflict: true` is set but only the winning pin source is kept (compounds
   the 7.1 finding). 90 project files (~1.28 MB) vs the 256 KiB detector budget;
   ECOS-01 has no read-coverage disclosure. Candidate fix: mirror the
   `deps.ts` tracked-read pattern in `ecos01.ts`.
2. **`readText` still swallows budget errors for every other consumer.** The fix
   covered the deps + testfiles consumers; `detectors/common.readText` (used by
   many others) still returns `null` on quota errors, so any unlisted detector
   silently degrades on large estates. Candidate: distinguish budget errors in
   `readText` (or audit all consumers).
3. **`.Tests`-suffixed projects don't classify at high confidence.** TEST-03's
   ≥60% high-confidence bar is unreachable for Orchard's `src/Orchard.Tests/**`
   layout even with full reads (0% high-confidence in the unpartitioned
   contrast) — the high-confidence path patterns lack a `.Tests`-directory /
   `…Tests.cs` rule. Candidate classifier widening (5.2-adjacent).
4. **Roller ECOS-01 pin gap (spec §2 list).** Java 1.7 is declared via
   `maven-compiler-plugin` `<configuration><source>1.7</source>`, which is not
   in the ECOS-01 spec's pom pin list (`maven.compiler.*` / `<java.version>`),
   so the row honestly reports "no runtime pin found". Candidate spec extension
   + extractor + fixture for the compiler-plugin form.
5. **Headline-display + read-budget scaling (carried to 8.2/8.3).** Both estates
   stay `insufficient-signal` at 32%/45% < the 50% floor. Two components: 6 of
   28/29 requested rows are structurally unknown offline (GH-API lane); and the
   256 KiB/detector floor makes real repositories ~55–68% unknown, so the floor
   is missed for budget reasons, not estate thinness. Should per-detector caps
   scale deterministically with tree size, and/or should the offline
   presentation treat structurally-unknown lanes differently?
   (Frozen-denominator headline-display policy carried into this validation.)
6. **Design D1 (rubric-row question) — for the 8.3 revisit.** Observation
   feeding it: even with full reads, Orchard resolves only 5 of 54 unique
   production deps against the curated NuGet table, so package-level rows stay
   estimated/unknown on real .NET estates while the *toolchain* exit signal
   (netfx/vb6/delphi/JDK level) is measurable from pins. Does the evidence argue
   for a dedicated legacy-platform toolchain row (e.g. ECOS-11+ deep-dive)
   instead of only extending the ECOS rows?

## 8.3 External review session — findings record

Session 2026-10-17: the packet (`~/legacyleap/legacy-stacks-estates/packet/`)
was walked question-by-question and each open item decided (all recommendations
accepted). Candidate findings 1–4 were then fixed in this change (review-fix
package); the headline/floor and D1 questions were resolved as decisions; two
follow-ups were chartered with no code here. No further findings were raised.

### Decisions

**Q1 — headline display / 50% floor (packet Q1): keep `COVERAGE_FLOOR` as-is;
record the evidence.** The floor keeps every unknown cause in the denominator.
Documented-not-implemented option, recorded for the next offline-presentation
decision: exclude the *mode-structural* GH-API-lane rows (6 per estate — offline
has no network) from the floor denominator; as presented on the §8.1-sealed runs
that flips Roller to displayed (13/23 = 56.5%) while Orchard stays suppressed
(9/22 = 40.9%), and the review-fix reseal keeps the same outcome
(14/23 = 60.9% · 8/22 = 36.4%). **Budget-truncated rows must not be excluded**
even under that option — they are the scan's own partial surface (disclosed via
the honesty contract), not a structural property of offline mode. The
renormalized reference stays as designed: secondary, reference-only, never gated.

**Q2 — read-budget scaling (packet Q2): chartered as a follow-up change** (see
charter below); no engine change in legacy-stacks.

**Q3 — design D1 revisit (candidate 6): D1 stands.** The full-read Orchard
contrast (54 unique production deps; 5 resolvable against the curated NuGet
table) confirms package-level .NET rows stay estimated/unknown on real estates,
while the toolchain exit signal (netfx/VB6/Delphi/JDK level) is pin-measurable.
An N/A-gated `ECOS-11+` deep-dive row is the right shape, but a new rubric row
needs the canonical→derived march — chartered as its own future change (below).
Nothing changes in legacy-stacks.

**Q4 — candidate findings 1–4: fix now.**

- **Q4.1 ECOS-01 partial-surface claim (finding 1) — fixed.** `extractPins` now
  runs on tracked reads (`makeReadBudgetTracker`); pin extraction ended by the
  budget → `unknown` + `readBudgetNote(reads, reads+blocked, 'runtime pin
  sources')`, never graded over the prefix. Conflict honesty restored in the
  same fix: a product with conflicting pins keeps **both** sources
  (`conflict_sources` on the runtime entry, sorted) and the losing file appears
  in the evidence pointers (spec §2.5: "All pins are recorded").
- **Q4.2 `readText` systemic budget swallow (finding 2) — fixed at the seam.**
  `readText(ctx, path, tracker?)` is budget-aware: content reads increment
  `reads`; `isReadBudgetError` quota throws increment `budgetBlocked` (per-call
  `null` semantics unchanged). Wired where full coverage is claimed: ECOS-01
  (runtime pin sources) and ECOS-05 (license supplementary reads) — both gate
  the row to `unknown` with the coverage note when blocked. The audit of direct
  `ctx.readFile` bounded sites rides the Q2 follow-up.
- **Q4.3 `.Tests`-suffix classification (finding 3) — fixed.** `testfiles.ts`
  gains `DOTNET_TEST_FILE = /Tests?\.(cs|vb)$/` and
  `DOTTED_TEST_PROJECT_DIR = /(^|\/)[^/]*\.tests?\//i`, applied in the
  content-fallback branch only (NUnit/MSTest/xUnit markers and
  e2e/integration forms keep precedence), so `src/Orchard.Tests/**`-style
  layouts classify `unit` at high confidence and the TEST-03 bar is reachable.
  Spec: change spec scenario "Dotted .NET test-project layout is classifiable";
  `test-03` §1/§2 convention note.
- **Q4.4 Roller ECOS-01 pom pin gap (finding 4) — fixed.** `ecos-01` §2 extends
  the pom pin list with the `maven-compiler-plugin` `<configuration><source>`
  form (extractor: plugin block → `<source>`; fixture + test). Resealed Roller:
  ECOS-01 `measured(1)` — `java@1.7` cycle 7, EOL 2022-07-19, pin `pom.xml`;
  was `unknown` "no runtime pin".

Tests/specs touched: `legacy-stacks.test.ts` (5.2 mstest high-confidence;
dotted-layout classifier incl. `WebApplicationFactory` precedence; conflict
`conflict_sources` + dual pointers; pom compiler-plugin form),
`legacy-stacks.honesty.test.ts` (ECOS-01 budget note + measured-with-conflict
control; ECOS-05 supplementary-read gate), change spec (read-budget scenario now
"dependency-manifest, test-file, or runtime-pin source surface"; new
dotted-layout scenario), `ecos-01` §2/§2.5/§3/§7-level read-budget line,
`test-03` §1/§2. Verification: `apps/scanner` suite 22 files / 245 tests green;
`tsc --noEmit` clean. No threshold/weight/framing values changed → no `11` §5
calibration-log rows; `docs/rubric/` untouched.

### Resealed estates (supersede the §8.1 sealed numbers)

Both estates were rescanned with the review-fix engine, offline and strict; the
packet's `coverage.md`/`unknowns.md` were regenerated from these reports and the
packet `README.md` updated to them.

| Estate | runId | Fingerprint | Headline / renorm | Coverage m/e/u of requested | Suppressed |
| --- | --- | --- | --- | --- | --- |
| orchard-1.10.3 | `orchard-1.10.3__unknown__2026-10-17T152830-866Z` | `f5e0066f…d8eeda33` | 3.33 / 26.67 · 4.1 s / 240 s | 8/0/20 of 28 (+3 n/a) | yes — 8/28 = 29% |
| roller-5.2.2 | `roller-5.2.2__unknown__2026-10-17T152838-764Z` | `8f3d0523…4fe97f0b` | 8.41 / 26.17 · 0.7 s / 240 s | 12/2/15 of 29 (+2 n/a) | yes — 14/29 = 48.3% |

Row moves vs the §8.1 seal (all other rows unchanged; both estates suppressed
before and after, verdict `insufficient-signal`):

- orchard: ECOS-01 `measured(1)` → `unknown` — the budget note names the pin
  surface ("after 16 of 85 runtime pin sources"); headline −0.48, renorm −1.90.
- roller: ECOS-01 `unknown` → `measured(1)` — `java@1.7` via the newly extracted
  pom pin (Q4.4); headline +0.47, renorm −0.37.

Reproduce with the packet command; repeated runs must reproduce the same
fingerprints.

### Follow-up charter — deterministic tree-size-scaled read budget (Q2)

- **Evidence:** `partitionByteCap(4 MB, N≈31)` → 256 KiB/detector floor starves
  real estates: Orchard read 17/165 manifests, 29/80 test files, 16/85 runtime
  pin sources; Roller 34/80 test files; ECOS/test coverage is unknown for budget
  reasons, not estate thinness.
- **Direction:** scale the per-detector cap deterministically with the scanned
  tree (or an explicit `--read-budget` override) so a 101 MB estate is not
  judged through a 256 KiB window.
- **Constraints:** the split stays a pure function of the tree (deterministic
  even partition); any change that alters facts moves the score fingerprint
  (deterministic-scoring 1.3); scanning stays budget-bounded.
- **Scope additions from the 8.3 fixes:** audit direct `ctx.readFile`
  bounded-site consumers (Q4.2 deferral) — every bounded reader should route
  through the tracked seam.

### Follow-up charter — legacy-platform toolchain row (Q3 / D1)

- **Evidence:** full-read Orchard resolves only 5 of 54 unique production deps
  against the curated table (package-level rows estimated/unknown), while the
  toolchain level is pin-measurable and is the load-bearing legacy signal.
- **Shape:** N/A-gated `ECOS-11+` deep-dive row (N/A where no legacy toolchain
  signals; folds into the ECOS category when run — never a bonus).
- **Process requirement:** canonical→derived march in one change — encyclopedia
  row (`docs/rubric/01_…`), `00_EXECUTIVE_RUBRIC.md` Part 2, the matching
  `docs/specs/…` file, both weight sets (`11` §1) if category math changes,
  then `npm run compile:rubric` + the consistency gate.

## Findings during implementation (for review)

- 4.3 exposed a dead signal from the detector-honesty refactor: `deps.ts`
  collapsed each lockfile to `name → one version`, so `LockfileInfo.duplicates`
  could never fire for any ecosystem (the pre-refactor npm path did detect nested
  `node_modules` duplicates). Fixed by keeping a multi-version record
  (`versionSets` → `LockfileInfo.versions`) and having ECOS-06 aggregate
  duplicates across all lockfiles — which also makes the .NET multi-project
  signal real (same transitive locked at different versions in two
  `packages.lock.json` files). Regression-guarded for npm (nested duplicate) and
  NuGet (cross-project duplicate).
- 4.2/4.3: uncovered packages are now *named* in the facts
  (`unresolvable_names` on ECOS-02/03, `license_unknown_names` on ECOS-05),
  satisfying the honesty requirement that an uncovered package is disclosed —
  a bare count disclosed *that* something was unscanned, not *what*.
- Candidate finding (7.1, deferred to the 8.x review): ECOS-01's conflict
  scenario ("conflicting pins → lowest wins + conflict flag") records only the
  winning pin's `pin_source` in evidence; the losing pin's file is dropped from
  the pointers. The fact is honest (conflict flag + conservative runtime), but a
  reviewer cannot see *which* file lost from the report alone. Candidate fix:
  keep both pin sources on the runtime entry (or as secondary pointers) when
  `conflict` is true. **Resolved in 8.3 (Q4.1):** both sources are kept
  (`conflict_sources` + losing-file evidence pointer).
