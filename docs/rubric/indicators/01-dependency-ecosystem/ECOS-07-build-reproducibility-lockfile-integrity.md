# ECOS-07 — Build Reproducibility & Lockfile Integrity

> **Category:** [Dependency & Ecosystem Health](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | ECOS-07 |
| Name | Build Reproducibility & Lockfile Integrity |
| Category | ECOS — Dependency & Ecosystem Health |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | ⚡ ≤ 30 min — git ls-files + CI config check; double build is 🔶. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The build is not reproducible or not pinned: no lockfile, floating/mutable version ranges, builds that differ between machines/times, or a lockfile that is ignored or unmaintained.
- **Why it signals obsolescence:** Reproducibility is the foundation of trust — for security (you don't know what you shipped), for debugging (prod ≠ local), and for reliability (the build that worked Friday may fail Monday). Its absence is a hallmark of an era before supply-chain discipline, and it blocks almost every modernization step (safe upgrades, CI caching, SBOMs, canary rollouts).
- **Where it manifests:** No `package-lock.json`/`yarn.lock`/`poetry.lock`/`Gemfile.lock`/`go.sum`/`Cargo.lock` committed; `requirements.txt` without pins; version ranges (`>=1.0,<2`) in manifests; CI that does fresh installs into mutable registries; Docker builds without `--immutable`/`--frozen-lockfile`; builds that pull latest (`@latest`, `latest` tags).
- **Objective metric:** `lockfile committed & current?`; `CI uses immutable install?`; `build artifact hash identical across two clean builds?`; `% of pinned vs. floating version specs`.
- **Yellow flag (warning):** Lockfile present but stale/partial, or immutable-install not enforced in CI. *(Rationale: a stale lockfile is worse than none — false confidence with drift.)*
- **Red flag (critical):** No lockfile at all, floating ranges in prod-critical deps, or CI installs mutably from a live registry with no integrity pins. *(Rationale: you cannot know what you shipped — a supply-chain and reliability blind spot.)*
- **Example symptom:** "CI has no lockfile; `npm install` pulls whatever the registry has. A transitive dep's maintainer publishes a breaking patch. Tuesday's build works, Wednesday's fails. Someone adds an empty `package-lock.json` 'to fix it' and commits it without running npm."
- **Blast radius:** Reproducible debugging, security forensics, cache efficiency, artifact provenance, canary/bisect operations, compliance.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = lockfile + immutable CI + reproducible; 2 = lockfile but stale or not enforced; 1 = lockfile absent in some services; 0 = no lockfile, floating ranges, mutable installs in core path.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: commit the lockfile, switch CI to `npm ci`/`pip install --require-hashes`/`--frozen-lockfile`, add a "lockfile up-to-date" CI check. Structural fix: adopt content-hash pinning, build from clean containers, produce provenance attestations (SLSA level 1→2), verify registry integrity.
- **Gold standard / target state:** Lockfile committed and current; CI immutable install; two clean builds produce byte-identical artifacts; SLSA provenance generated per release.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src + gh-api (CI config)
- **Tools:** git tree enumeration; lockfile/manifest parsers; CI YAML parser
- **Rate-cost:** none
- **Ecosystems:** npm/yarn/pnpm (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) · pip/poetry/uv (`poetry.lock`, `requirements*.txt` pin-scan, `uv.lock`) · `go.sum` · `Gemfile.lock` · Maven (`maven-shade-plugin` versions, no true lockfile → flag) · Gradle (`gradle.lockfile`) · NuGet (`packages.lock.json` is lock evidence; classic `packages.config` has **no lockfile mechanism** → disclosed as structural, generalizing the Maven precedent)
- **Applicability:** `na_when: zero manifests of any kind` → unknown, never N/A (a build exists even unpinned). Actually: clause-b N/A when tree contains zero build/config files at all (docs-only repo).

## 6. Detection recipe

- **Detection method:** File audit — check for committed lockfiles in git (`git ls-files | grep lock`), `npm ci`/`pip install -r` vs. `npm install`, CI logs for "added X packages" churn; reproducibility test: build twice in clean containers and diff output hashes; `npm shrinkwrap` diff; registry-pin checks (`--registry`, integrity hashes in lockfile v2/v3).

1. `git ls-files` → lockfile presence per ecosystem; an ecosystem with no lockfile mechanism (Maven, classic NuGet `packages.config`) is recorded in `lockfile_mechanism_absent` — absence is structural, never scored as a missing lockfile.
2. Pin ratio: % of manifest entries with exact pins vs ranges (`>=`, `*`, `latest`, floating tags) — for mechanism-absent ecosystems this is the primary reproducibility signal.
3. Staleness: lockfile mtime vs manifest mtime in git history (lock older than last manifest change = stale).
4. CI immutability scan: install commands matching immutable set (`npm ci`, `pip install --require-hashes`, `--frozen-lockfile`, `yarn --immutable`, `go mod download` w/ go.sum) vs mutable (`npm install`, bare `pip install -r`).
5. Registry-pin checks: integrity-hash fields present in lockfile schema version.

## 7. Fact schema

```json
{"ecos07": {
  "lockfiles": [{"path": "packages.lock.json", "ecosystem": "csharp", "stale": false, "integrity_hashes": true, "packages": 42}],
  "lockfile_mechanism_absent": ["csharp:packages.config"],
  "pin_ratio": 96.2,
  "ci_immutable_install": {"enforced": true, "evidence": ".github/workflows/ci.yml:31 npm ci"},
  "mutable_install_sites": []}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  >=1 manifest detected            # presence/absence of lockfile is itself the fact
estimated_when: never                             # this row is fully decidable statically
unknown_when:   zero build/config files AND zero manifests (clause-b -> na instead) or tree un-enumerable
na_when:        docs-only/no-build tree (clause-b, reason recorded)
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium; low when git history is unavailable (staleness dropped)
```

### Score mapping predicates

Thresholds/criteria: see §3.

- `3`: all ecosystems locked ∧ stale=false ∧ `ci_immutable_install.enforced`
- `2`: locked ∧ (`stale` ∨ ¬enforced)
- `1`: some services/dirs locked, others not (multi-manifest partial coverage)
- `0`: no lockfile for a prod manifest ∨ `pin_ratio < R_PIN%` ∨ mutable CI installs on prod path

Mechanism-absent ecosystems (`lockfile_mechanism_absent`: Maven, classic NuGet) are exempt from the missing-lockfile limb of `0` — absence is structural; their pin ratio carries the reproducibility judgment.

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- History unavailable (shallow clone budget) → staleness check dropped, note in evidence; status stays measured (presence facts intact)
- A mechanism-absent ecosystem demotes nothing; the disclosure travels in `lockfile_mechanism_absent` + a basis pointer

## 10. Evidence and output

### Evidence string

```
evidence: "lockfile-parse: lockfile={present|absent} ({paths}); pin_ratio={p}%; ci={'npm ci' @ ci.yml:31}"
basis:    "lockfile-parse: no lockfile mechanism for {ecosystems} — absence is structural"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Lockfile presence and build reproducibility; registry/provenance hardening is ECOS-10.
