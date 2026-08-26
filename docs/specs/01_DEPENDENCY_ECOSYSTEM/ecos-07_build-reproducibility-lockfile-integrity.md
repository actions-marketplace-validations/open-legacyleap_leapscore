# ECOS-07 — Build Reproducibility & Lockfile Integrity — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | ⚡ ≤ 30 min (double-build 🔶 excluded from v1 — no execution) |
| Thresholds & 0–3 criteria | see encyclopedia §ECOS-07 |

## 1. Inputs

- **Planes:** static-src + gh-api (CI config)
- **Tools:** git tree enumeration; lockfile/manifest parsers; CI YAML parser
- **Rate-cost:** none
- **Ecosystems:** npm/yarn/pnpm (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) · pip/poetry/uv (`poetry.lock`, `requirements*.txt` pin-scan, `uv.lock`) · `go.sum` · `Gemfile.lock` · Maven (`maven-shade-plugin` versions, no true lockfile → flag) · Gradle (`gradle.lockfile`)
- **Applicability:** `na_when: zero manifests of any kind` → unknown, never N/A (a build exists even unpinned). Actually: clause-b N/A when tree contains zero build/config files at all (docs-only repo).

## 2. Detection recipe

1. `git ls-files` → lockfile presence per ecosystem.
2. Pin ratio: % of manifest entries with exact pins vs ranges (`>=`, `*`, `latest`, floating tags).
3. Staleness: lockfile mtime vs manifest mtime in git history (lock older than last manifest change = stale).
4. CI immutability scan: install commands matching immutable set (`npm ci`, `pip install --require-hashes`, `--frozen-lockfile`, `yarn --immutable`, `go mod download` w/ go.sum) vs mutable (`npm install`, bare `pip install -r`).
5. Registry-pin checks: integrity-hash fields present in lockfile schema version.

## 3. Fact schema

```json
{"ecos07": {
  "lockfiles": [{"path": "package-lock.json", "ecosystem": "npm", "stale": false, "integrity_hashes": true}],
  "pin_ratio": 96.2,
  "ci_immutable_install": {"enforced": true, "evidence": ".github/workflows/ci.yml:31 npm ci"},
  "mutable_install_sites": []}}
```

## 4. Statusing rules

```yaml
measured_when:  >=1 manifest detected            # presence/absence of lockfile is itself the fact
estimated_when: never                             # this row is fully decidable statically
unknown_when:   zero build/config files AND zero manifests (clause-b -> na instead) or tree un-enumerable
na_when:        docs-only/no-build tree (clause-b, reason recorded)
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium
```

## 5. Score mapping (predicates)

Thresholds/criteria: see encyclopedia §ECOS-07.

- `3`: all ecosystems locked ∧ stale=false ∧ `ci_immutable_install.enforced`
- `2`: locked ∧ (`stale` ∨ ¬enforced)
- `1`: some services/dirs locked, others not (multi-manifest partial coverage)
- `0`: no lockfile for a prod manifest ∨ `pin_ratio < R_PIN%` ∨ mutable CI installs on prod path

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- History unavailable (shallow clone budget) → staleness check dropped, note in evidence; status stays measured (presence facts intact)

## 8. Evidence string

```
evidence: "git+ci-parse: lockfile={present|absent} ({paths}); pin_ratio={p}%; ci={'npm ci' @ ci.yml:31}"
```

## 9. Scope/overlaps echo

Lockfile presence and build reproducibility; registry/provenance hardening is ECOS-10.
