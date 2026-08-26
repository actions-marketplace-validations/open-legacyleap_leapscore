# ECOS-01 — Runtime/Language EOL — Implementation Spec

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

- **Planes:** static-src (runtime pins) + ecosystem (`endoflife.date`)
- **Tools:** manifest/glob parsers; HTTP client → `GET https://endoflife.date/api/{product}.json`
- **Rate-cost:** api-budgeted (endoflife.date free tier; cache responses per scan-day)
- **Ecosystems:** agnostic — per-language pin extractors
- **Applicability:** `na_when: never` — every system runs on a runtime. If no pins are found, the row is `unknown`, not N/A.

## 2. Detection recipe

1. Extract runtime pins from an enumerated tree:
   - version-manager files: `.nvmrc`, `.node-version`, `.ruby-version`, `.tool-versions`, `.python-version`, `runtime.txt`, `.java-version`
   - manifests: `package.json#engines`, `pyproject.toml requires-python` / `setup.py python_requires`, `go.mod` `go` directive, `Gemfile` ruby directive, `pom.xml` (`maven.compiler.*`, `<java.version>`), `build.gradle*` (`sourceCompatibility`)
   - containers/CI: `Dockerfile*` `FROM` base tags, `.github/workflows/*.yml` matrix keys (`python-version`, `node-version`, `jdk`), `bitbucket-pipelines.yml` image tags
2. Map each `(ecosystem, major.minor)` to an endoflife.date product slug via the engine's static slug table.
3. Fetch cycles; take the cycle matching the pinned minor (fallback: nearest lower minor).
4. Compute `days_until_eol = eol_date − scan_date`; set `is_past_eol`.
5. Pin precedence on conflict: Dockerfile > version-manager file > CI matrix > language manifest. All pins recorded; conflicting versions → most conservative (lowest) wins and sets `conflict: true`.

Preconditions: none beyond a completed tree enumeration.

## 3. Fact schema

```json
{"ecos01": {
  "runtimes": [{"product": "python", "version": "3.6", "pin_source": ".tool-versions",
                 "eol_date": "2021-12-23", "days_until_eol": -1337, "is_past_eol": true}],
  "conflict": false,
  "unmapped_pins": ["some-product@9.1"],
  "lookup_ok": true}}
```

## 4. Statusing rules

```yaml
measured_when:  runtimes.len >= 1 and lookup_ok == true
estimated_when: runtimes.len >= 1 and (lookup_ok == false or unmapped_pins.len > 0)   # clamp [1,2], confidence low
unknown_when:   runtimes.len == 0          # no pins anywhere in an enumerated tree
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
- endoflife.date unreachable/timeout → `estimated` (pin facts stand; freshness unknown), retry ×2 then degrade
- Slug-table miss → runtime excluded from scoring, retained in `unmapped_pins`; if *all* runtimes unmapped → `unknown`

## 8. Evidence string

```
evidence: "endoflife.date: {product} {version} EOL {days_until_eol}d ({pin_source})"
```

## 9. Scope/overlaps echo

Runtime EOL dates only; framework lifecycle/status is ECOS-08.
