# ECOS-01 — Runtime/Language EOL — Implementation Spec

> **Authority:** This file defines the ECOS-01 implementation contract. The [ECOS rubric category](../../rubric/01_DEPENDENCY_ECOSYSTEM.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | **G3** — Runtime EOL, no path out |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | ⚡ ≤ 30 min |
| Thresholds & 0–3 criteria | see `docs/rubric/01_DEPENDENCY_ECOSYSTEM.md` §ECOS-01 (canonical; not restated here) |

## 1. Inputs

- **Planes:** static-src (runtime pins) + vendored eol snapshot (`endoflife.date`-derived, refreshed offline)
- **Tools:** manifest/project-file parsers; eol-snapshot loader (`../snapshots.ts`; dataset refreshed via `tooling/scripts/refresh-snapshots.ts`). No socket — the live `GET endoflife.date/api/{product}.json` is replaced by the pinned dataset (detector-honesty, `offline-data-snapshots`).
- **Rate-cost:** none (offline; dataset id pinned per scan and fingerprinted)
- **Ecosystems:** agnostic — per-language pin extractors; legacy-stacks adds `.NET` (`dotnet` / `dotnetfx`), VB6 (`vb6`, toolchain framing per design D4) and Delphi, plus the `build.gradle` Java level
- **Applicability:** `na_when: never` — every system runs on a runtime. If no pins are found, the row is `unknown`, not N/A.

## 2. Detection recipe

1. Extract runtime pins from an enumerated tree:
   - version-manager files: `.nvmrc`, `.node-version`, `.ruby-version`, `.tool-versions`, `.python-version`, `runtime.txt`, `.java-version`
   - manifests: `package.json#engines`, `pyproject.toml requires-python` / `setup.py python_requires`, `go.mod` `go` directive, `Gemfile` ruby directive, `pom.xml` (`maven.compiler.*`, `<java.version>`, and the `maven-compiler-plugin` `<configuration><source>` form — legacy-stacks 8.3), `build.gradle*` (`sourceCompatibility`/`targetCompatibility`, `JavaVersion.VERSION_x[_y]`, `JavaLanguageVersion.of(n)`)
   - .NET: `<TargetFramework>` / `<TargetFrameworkVersion>` in `.csproj`/`.vbproj` (moniker split per design D7 — `netcoreapp*` / `netX.Y` → `dotnet`; the `net4xx` digit form → `dotnetfx`; `netstandard*` is a contract moniker, never a pin), `global.json#sdk` (secondary)
   - census stacks: `.vbp` → `vb6@6.0`; Delphi `.dproj` `ProjectVersion` / `.dof` `[FileVersion]` → release cycle via the version-graded mapping table (unmappable values stay unmapped → `unknown`, never resolved to a lower cycle)
   - containers/CI: `Dockerfile*` `FROM` base tags, `.github/workflows/*.yml` matrix keys (`python-version`, `node-version`, `jdk`), `bitbucket-pipelines.yml` image tags
2. Resolve each `(product, version)` against the eol snapshot via the engine's static slug/alias table: take the cycle matching the pinned minor (fallback: nearest lower minor). Version-graded vendor datasets (Delphi) are exact-cycle only — an unmappable version stays `null`, never a lower cycle.
3. A pin the snapshot cannot resolve is retained in `unmapped_pins` — disclosed, never guessed into a supported reading.
4. Compute `days_until_eol = eol_date − scan_date`; set `is_past_eol`.
5. Conflicting pins for one product → most conservative (lowest) wins, numeric-aware (`4.10` > `4.9`), and sets `conflict: true`. All pins are recorded: a product with conflicting sources carries `conflict_sources` (every participating pin source, sorted) and each source file appears in the evidence pointers — the losing file is evidence too (legacy-stacks 8.3).

Preconditions: none beyond a completed tree enumeration.

## 3. Fact schema

```json
{"ecos01": {
  "runtimes": [{"product": "python", "version": "3.6", "cycle": "3.6", "pin_source": ".tool-versions",
                 "eol_date": "2021-12-23", "days_until_eol": -1337, "is_past_eol": true,
                 "conflict_sources": [".tool-versions", "Dockerfile:FROM"]}],
  "conflict": false,
  "unmapped_pins": ["some-product@9.1"],
  "lookup_ok": true}}
```

## 4. Statusing rules

```yaml
measured_when:  runtimes.len >= 1 and unmapped_pins.len == 0   # every pin resolved from the snapshot
estimated_when: runtimes.len >= 1 and unmapped_pins.len > 0    # clamp [1,2], confidence low
unknown_when:   zero pins found, or every pin unmappable in the snapshot (unmapped list disclosed)
scope_limited:  partial lookup failure -> estimated + scope-limited note listing unmapped products
clamp:          [1,2]                       # applies only in estimated branch
confidence:     medium (exhaustive pin surface); low if conflict unresolved
```

## 5. Score mapping (predicates)

Threshold values live in the encyclopedia entry (`thresholds: see ECOS-01`). Predicate shapes:

- `3`: `all(r.days_until_eol > YELLOW_MARGIN)` for all scored runtimes
- `2`: `any(days_until_eol <= YELLOW_MARGIN)` or extended-support-only runtime with upgrade evidence (recent upgrade commits touching pins)
- `1`: `any(is_past_eol)` ∧ affected runtime's pins resolve outside core paths
- `0`: `any(is_past_eol)` ∧ runtime pin resolves in core deploy path (Dockerfile/prod CI)
Core membership: files carrying the pin joined against computed core-path set.

## 6. Gate hooks (G3)

- `proven`: `any(is_past_eol)` ∧ core-path join true ∧ no-upgrade evidence (no open upgrade PRs/branches touching pins in last 180d)
- `not-proven`: all runtimes within support window
- `needs-verification`: past-EOL detected but core-path join or "no path out" unresolvable from URL (per `docs/plans/04` §6, G3 proven-state is conservative)

## 7. Failure & budget semantics

- Budget class: `fast`
- Per-detector read budget exhausted during pin extraction → `unknown` with the read coverage (`n of m` pin-source reads) and the measure path (a narrower sub-tree or a raised read budget); the deterministic prefix is never graded (legacy-stacks 8.3 — extends the 8.1 honesty contract to pin surfaces)
- Vendored snapshot → no network failure mode; a pin the dataset cannot resolve is retained in `unmapped_pins` and demotes per §4; when *all* pins are unmapped → `unknown` with the snapshot-refresh hint
- Slug-table miss → runtime excluded from scoring, retained in `unmapped_pins`

## 8. Evidence string

```
evidence: "eol-snapshot: {product} {version} EOL {days_until_eol}d ({pin_source})"
```

## 9. Scope/overlaps echo

Runtime EOL dates only; framework lifecycle/status is ECOS-08.
