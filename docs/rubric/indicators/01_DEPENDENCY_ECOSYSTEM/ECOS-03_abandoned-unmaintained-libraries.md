# ECOS-03 — Abandoned / Unmaintained Libraries

> **Category:** [Dependency & Ecosystem Health](../../01_DEPENDENCY_ECOSYSTEM.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | ECOS-03 |
| Name | Abandoned / Unmaintained Libraries |
| Category | ECOS — Dependency & Ecosystem Health |
| Engine tier | B |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | ⚡ ≤ 30 min — scanner output + last-release dates. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Direct or deep transitive dependencies that are archived, revoked, or effectively unmaintained (no commits, no releases, no maintainer response) — yet still load-bearing.
- **Why it signals obsolescence:** An unmaintained library is a permanent, unfixable risk: bugs and CVEs accumulate with no upstream to fix them. It also signals the codebase froze at a point in time — the ecosystem moved on, and this system didn't.
- **Where it manifests:** `package.json` deps with dead GitHub repos; deprecated npm packages (`npm deprecate` flags); PyPI packages with no releases in years; archived GitHub repos (`archived: true`); Socket.dev/OpenSSF reports; libraries whose GitHub page shows "this repository has been archived by the owner."
- **Objective metric:** Count of load-bearing deps with `last_release > 24 months ago` or `archived == true`; fraction of the *core dependency surface* that is unmaintained.
- **Yellow flag (warning):** Unmaintained for 12–24 months, or single-maintainer bus-factor-1 libraries, in peripheral modules. *(Rationale: still a warning window — fork or replace before it compounds.)*
- **Red flag (critical):** Unmaintained > 24 months, or repo archived, or package revoked/unpublished, in *core* logic or on the auth/data path. *(Rationale: this is now permanent unpatched risk in the most sensitive code.)*
- **Example symptom:** "Our PDF generator's GitHub repo was archived two years ago. Last month a crafted PDF crashed the render worker. There's no fix to pull, and we now own the parser. Nobody had even noticed the repo was archived."
- **Blast radius:** Security (unpatchable CVEs), stability (bugs never fixed), legal (unclear maintenance), team morale (maintaining a stranger's library).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = all maintained; 2 = abandoned libs in peripheral code with replacement planned; 1 = abandoned lib in a non-critical service or recent; 0 = abandoned lib in core/auth/data path.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: audit the dependency surface for abandoned libs and create a removal/swap ticket with a date. Structural fix: replace load-bearing abandoned libs with maintained alternatives or fork-and-own with a maintenance budget; pin to the exact version and wrap it behind your own interface so it's swappable.
- **Gold standard / target state:** Every load-bearing dependency either actively maintained or deliberately forked-and-owned; a quarterly "library health" review is on the calendar; no archived repos in the dependency surface.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** ecosystem (vendored package metadata) + static-src (lockfiles, source imports)
- **Tools:** lockfile/manifest parsers; vendored package-metadata table (`last_release` per package; part of the eol snapshot); source-import scan for the `in_core_path` join. The GH-API `archived`/`pushed_at` check is out of scope for the offline release — entries carry `archived: false` (not asserted, never guessed into a Red).
- **Rate-cost:** none (offline; load-bearing = prod direct deps)
- **Ecosystems:** npm · pip · go · Maven · bundler · NuGet (`packages.lock.json` + `packages.config`/`PackageReference` manifests)
- **Applicability:** same as ECOS-02 (no manifests/lockfile → N/A clause-b).

## 6. Detection recipe

- **Detection method:** Supply-chain scanners — `socket.dev` project scan, `ossf/scorecard` (`scorecard --repo <repo>`), `osv-scanner`, `npm audit`, `pip-audit`; manual: check last release date vs. 24 months on each load-bearing dep. Distinguish *mature-stable* (maintained slowly, fine) from *abandoned* (no activity, no response to issues).

1. Parse lockfile/direct surface; select the load-bearing set = prod direct deps (dev-only fallback when no prod scope is declared).
2. Per package: look up `last_release` in the vendored metadata table → `months_since_release`; a package absent from the table is counted `unresolvable` and named in `unresolvable_names` — never guessed.
3. Join `in_core_path` against the parsed source-import graph (JS/TS/Py/Go/Java/Ruby/PHP/Rust + C# `using` / VB `Imports`; source set includes `.vb`).
4. Classify `abandoned = months_since_release > R_months` (thresholds by ID; never restated here).

Preconditions: parsed lockfile (no lockfile → `unknown`, "pin your deps" — abandonment is not knowable per-version from floating specs).

## 7. Fact schema

```json
{"ecos03": {
  "load_bearing_total": 142,
  "abandoned": [{"name": "pdfkit", "version": "1.2.3", "months_since_release": 30, "archived": false, "in_core_path": false}],
  "bus_factor_1_count": 0,
  "unresolvable": 2,
  "unresolvable_names": ["internal-sdk"],
  "resolvable_ratio": 0.986}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  load_bearing_total > 0, resolvable_ratio >= 0.7, and the import scan is not truncated
estimated_when: 0 < resolvable_ratio < 0.7, OR the source-import scan was truncated   # clamp [1,2], confidence low
unknown_when:   no lockfile (floating install -> abandonment unknowable per-version); no load-bearing dependency; or every load-bearing dep unresolvable against the table
na_when:        ECOS-02 applicability fired
clamp:          [1,2]
confidence:     medium (exhaustive lockfile surface); low on partial resolvability / truncation
scope_limited:  partial resolvability or truncated import scan -> estimated + scope-limited
```

### Score mapping predicates

- `3`: `abandoned.len == 0`
- `2`: only peripheral abandoned with `12 <= months <= Y_MONTHS` or bus-factor-1 flags (Y/R values: see §3)
- `1`: abandoned in isolated/non-critical service path, or recent abandonment (<12mo)
- `0`: `any(abandoned where in_core_path ∧ (archived ∨ months > R_MONTHS))`

## 9. Gate, failure, and budget behavior

### Gate hooks

none (portfolio-level concern stays in-category).

### Failure and budget semantics

- Budget class: `fast`
- Metadata-table misses → `unresolvable` (named); ratio-driven degrade as above
- Truncated/aborted source-import scan → the `in_core_path` join is partial → estimated + scope-limited (import evidence is disclosed)
- No lockfile → `unknown` with emission text (pin your deps first)

## 10. Evidence and output

### Evidence string

```
evidence: "lockfile-parse+snapshot: {k}/{n} load-bearing deps unmaintained; worst: {name} last release {months}mo"
basis:    "lockfile-parse: only {k}/{n} deps resolvable against the metadata table (low confidence)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Abandoned-lib maintenance risk only; malware/provenance risk is ECOS-10, license posture is ECOS-05.
