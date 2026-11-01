# ECOS-01 — Runtime/Language EOL

> **Category:** [Dependency & Ecosystem Health](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | ECOS-01 |
| Name | Runtime/Language EOL |
| Category | ECOS — Dependency & Ecosystem Health |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | **G3** — Runtime EOL, no path out |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | ⚡ ≤ 30 min — read pins, compare to EOL calendar. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The language runtime or interpreter the system runs on (e.g., Python 3.6, Node 14, Ruby 2.7, .NET Framework, PHP 7.x) is at or past its official end-of-life date.
- **Why it signals obsolescence:** An EOL runtime receives no security patches. Any vulnerability found after EOL is permanent, and the security team has no fix to apply. It also blocks hiring (engineers won't fight an old toolchain), blocks library upgrades (new libraries drop EOL runtimes), and violates almost every compliance framework's "supported software" control.
- **Where it manifests:** CI container images (`FROM python:3.6`), `.nvmrc`/`.ruby-version`/`.tool-versions` files, `Dockerfile` base images, runtime configs in `package.json engines`, `pyproject.toml requires-python`, deployment manifests, EOL tickers (`endoflife.date`, `python.org/dev/peps/pep-0537`).
- **Objective metric:** `days_until_eol` for each production runtime; `is_past_eol` boolean per runtime.
- **Yellow flag (warning):** Active version within 6 months of EOL, or on EOL but with a funded, resourced upgrade path already started. *(Rationale: 6 months is barely enough to plan+execute a runtime upgrade through QA; it's a warning, not a fire.)*
- **Red flag (critical):** Past official EOL with extended/vendor-only support (or none), and no upgrade in progress. *(Rationale: unpatched vulnerabilities are permanent; this is a gate — see G3.)*
- **Example symptom:** "The image we ship runs Python 3.6. A CVE lands in urllib3's parse. Our 3.6 wheels can't take the patched version. Security blocks the release; the team spends three weeks backporting instead of building the roadmap."
- **Blast radius:** Security posture, compliance audits, hiring/retention, ability to install any current dependency, CI infrastructure compatibility, third-party SaaS deprecations.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = all runtimes current; 2 = EOL approaching / one runtime in extended support but upgrade planned; 1 = EOL runtime in an isolated path; 0 = EOL runtime in core logic (triggers G3).

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: document the gap, create the upgrade ticket with a date. Structural fix: parallel runtime upgrade plan — run new runtime in CI behind a feature gate, migrate one service at a time, dual-run in prod. For truly stuck runtimes, isolate behind a facade and treat like a rewrite candidate.
- **Gold standard / target state:** Every production runtime within its vendor-supported window; CI builds a canary job on the current runtime; a deprecation calendar exists and is reviewed quarterly.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src (runtime pins) + vendored eol snapshot (`endoflife.date`-derived, refreshed offline)
- **Tools:** manifest/project-file parsers; eol-snapshot loader (`../snapshots.ts`; dataset refreshed via `tooling/scripts/refresh-snapshots.ts`). No socket — the live `GET endoflife.date/api/{product}.json` is replaced by the pinned dataset (detector-honesty, `offline-data-snapshots`).
- **Rate-cost:** none (offline; dataset id pinned per scan and fingerprinted)
- **Ecosystems:** agnostic — per-language pin extractors; legacy-stacks adds `.NET` (`dotnet` / `dotnetfx`), VB6 (`vb6`, toolchain framing per design D4) and Delphi, plus the `build.gradle` Java level
- **Applicability:** `na_when: never` — every system runs on a runtime. If no pins are found, the row is `unknown`, not N/A.

## 6. Detection recipe

- **Detection method:** Version matrix audit — read runtime pins and cross-check against `endoflife.date`; `pip list` / `npm ls` / `gem list` vs. current releases; container image scanners report the base OS/runtime; `docker run --rm <image> <runtime> --version`. Cross-check the system's own support window against the vendor's.

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

## 7. Fact schema

```json
{"ecos01": {
  "runtimes": [{"product": "python", "version": "3.6", "cycle": "3.6", "pin_source": ".tool-versions",
                 "eol_date": "2021-12-23", "days_until_eol": -1337, "is_past_eol": true,
                 "conflict_sources": [".tool-versions", "Dockerfile:FROM"]}],
  "conflict": false,
  "unmapped_pins": ["some-product@9.1"],
  "lookup_ok": true}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  runtimes.len >= 1 and unmapped_pins.len == 0   # every pin resolved from the snapshot
estimated_when: runtimes.len >= 1 and unmapped_pins.len > 0    # clamp [1,2], confidence low
unknown_when:   zero pins found, or every pin unmappable in the snapshot (unmapped list disclosed)
scope_limited:  partial lookup failure -> estimated + scope-limited note listing unmapped products
clamp:          [1,2]                       # applies only in estimated branch
confidence:     medium (exhaustive pin surface); low if conflict unresolved
```

### Score mapping predicates

Threshold values live in §3 and `model/config.md`. Predicate shapes:

- `3`: `all(r.days_until_eol > YELLOW_MARGIN)` for all scored runtimes
- `2`: `any(days_until_eol <= YELLOW_MARGIN)` or extended-support-only runtime with upgrade evidence (recent upgrade commits touching pins)
- `1`: `any(is_past_eol)` ∧ affected runtime's pins resolve outside core paths
- `0`: `any(is_past_eol)` ∧ runtime pin resolves in core deploy path (Dockerfile/prod CI)
Core membership: files carrying the pin joined against computed core-path set.

## 9. Gate, failure, and budget behavior

### Gate hooks

- `proven`: `any(is_past_eol)` ∧ core-path join true ∧ no-upgrade evidence (no open upgrade PRs/branches touching pins in last 180d)
- `not-proven`: all runtimes within support window
- `needs-verification`: past-EOL detected but core-path join or "no path out" unresolvable from URL (per the catalog gate conventions, G3 proven-state is conservative)

### Failure and budget semantics

- Budget class: `fast`
- Per-detector read budget exhausted during pin extraction → `unknown` with the read coverage (`n of m` pin-source reads) and the measure path (a narrower sub-tree or a raised read budget); the deterministic prefix is never graded (legacy-stacks 8.3 — extends the 8.1 honesty contract to pin surfaces)
- Vendored snapshot → no network failure mode; a pin the dataset cannot resolve is retained in `unmapped_pins` and demotes per §4; when *all* pins are unmapped → `unknown` with the snapshot-refresh hint
- Slug-table miss → runtime excluded from scoring, retained in `unmapped_pins`

## 10. Evidence and output

### Evidence string

```
evidence: "eol-snapshot: {product} {version} EOL {days_until_eol}d ({pin_source})"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Runtime EOL dates only; framework lifecycle/status is ECOS-08.
