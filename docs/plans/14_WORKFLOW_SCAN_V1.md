# 14 — Workflow Scan v1 (self or target via GitHub Actions)

> Execution-only slice: run LeapScore checks from a GitHub workflow against a self repo or a public target repo. No in-repo surfacing (checks/projects/comments) — that stays in `12_GITHUB_SURFACE_PLAN.md`.
> Builds on: `05` (orchestrator), `08` (token model), `12` §2/§9 (triggers, rejected `workflow_dispatch` plumbing — re-scoped here to runner-side dispatch only).
> Status: **SHIPPED (openspec `workflow-scan-v1`)** — engine seam live: shared composer `packages/engine/seal.ts`, thin CLI `apps/scanner/bin/scan.ts`, runner workflow `.github/workflows/leapscore-scan.yml`; `/api/scan` rewired to the composer.
> Engine truth today: `packages/engine/orchestrator.ts:82` (`runUnifiedScan(repoUrl)`), `packages/engine/seal.ts` (shared `sealScan` composer used by both `/api/scan` and the CLI), `clone.ts:25` (`--filter=blob:none --depth 1`, always default-branch HEAD), `ingest.ts:58-61` (private → `private_requires_app` refusal), `gh.ts:118` (auth header only `if token`).

---

## 1. Mode (v2-Q1, Q5)

- One workflow, `workflow_dispatch`-only. No `push`/`pull_request`, no `schedule` in v1.
- **Self** = `target_repo` omitted → scans `github.repository`. **Target** = `target_repo: owner/repo` passed explicitly → same code path, different URL string.
- Runner repo (A, hosts the workflow) vs target repo (T, scanned subject) are the only two roles. No write-back into T in v1.

## 2. Inputs (v2-Q1, Q5–Q6)

| Input | Required | Default | Meaning |
|---|---|---|---|
| `target_repo` | no | `github.repository` | Scan subject as `owner/repo`. No `https://` prefix, no `.git` suffix |
| `sha` | no | empty (= HEAD) | Empty = default-branch HEAD at trigger time. Covers self-HEAD and target-`main` uniformly; never hardcode `main` (`master` repos exist) |

- Non-empty `sha` in v1: CLI accepts the flag, then **fails loudly `exit 2`** (`--sha pinning not yet supported`). Same honesty rule as `12` §7 paid-keys disclosure. Pinning (fetch-pinned-sha + GH `?ref=` plumbing in `clone.ts`/`gh.ts`) is deferred engine work, not silently ignored.

## 3. Auth (v2-Q2)

| Target | Token | Reason |
|---|---|---|
| Public | `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` passthrough, zero extra secrets | Clone is anon-capable; GH API works unauthenticated at 60/hr, token lifts quota. `GITHUB_TOKEN` from A reads public T fine — cross-repo scope bites only on private |
| Private | PAT / App token with `contents:read` on T (e.g. `LEAPSCORE_TOKEN` secret); fail loudly if missing | `GITHUB_TOKEN` from A has zero access to private T; engine refuses `private_requires_app` today |

- Workflow `permissions: contents: read` (minimal). Engine needs nothing else in v1 — no checkout, no `checks:write`, no `issues:write`.

## 4. Execution (v2-Q3, Q4)

- **No `actions/checkout` of T.** Engine clones internally from URL (v2-Q3 revert; local-path `runLocalScan` dropped).
- New thin CLI `apps/scanner/bin/scan.ts`: `scan --repo <owner/repo> [--sha <sha>] --out leapscore-report.json`. Reuses `runUnifiedScan` + `scoreMvp` exactly as `/api/scan` does. No Docker, no reusable-workflow in v1.
- 3-step workflow: `setup-node` → `npx … scan` → `upload-artifact`. Pinned engine ref (`#<sha>`) in the `npx` line.

```yaml
# A's workflow (sketch — pins TBD at implementation)
permissions:
  contents: read
on:
  workflow_dispatch:
    inputs:
      target_repo:
        description: 'owner/repo to scan (default: self)'
        required: false
        default: ''
      sha:
        description: 'reserved — non-empty is rejected in v1'
        required: false
        default: ''
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
      - run: npx -p github:legacyleap/leapscore#<pinned-sha> leapscore-scan --repo "${{ inputs.target_repo || github.repository }}" --out leapscore-report.json
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: leapscore-${{ inputs.target_repo || github.repository }}-${{ github.run_number }}
          path: leapscore-report.json
          retention-days: 30
```

## 5. Exit codes (v2-Q7)

- Report seals (`complete` or `degraded`, any score, gates fired or not) → **exit 0**. Gate/score verdicts live inside `report.json` (`headline.tier`, `gates[]`), never in the step conclusion. (`12` §4 `failure-iff-gate-fires` belongs to the surfacing world, explicitly out of scope here.)
- No report → non-zero: `1` crash (clone fail, API down), `2` refused/unsupported-input (not-found, private-without-token, rate-limited, non-empty `--sha`).

## 6. Artifact (v2-Q8)

- File `leapscore-report.json`, envelope `{ report, meta, trace }` mirroring the website (`report_schema: "1"`, `meta.runId`, `snapshot.repoSha`, `trace[]`, trace-truncate >200 — `route.ts:217-226`).
- Stdout stays human (one line: `score/tier/gates/coverage`); file stays machine.
- Artifact name per-run (`leapscore-<slug>-<run_number>`, no overwrite collisions), `retention-days: 30`, `if: always()`.

## 7. Engine tasks (to make v1 real)

1. `apps/scanner/bin/scan.ts` — arg parse, `runUnifiedScan("https://github.com/"+repo)`, `scoreMvp`, envelope write, exit-code map (§5), `--sha` non-empty → `exit 2` with message.
2. E2E: one public self-scan + one public target-scan from a runner A; assert artifact shape + exit 0.
3. Deferred (not v1): SHA pinning, private-T PAT flow, schedule/push triggers, markdown `$GITHUB_STEP_SUMMARY`, Docker/reusable packaging.

## 8. Non-goals

Per-push scanning, scheduled re-scans, check runs / projects / PR comments in either repo, website deep links for private targets, multi-target matrix fan-out. All deferred to `12` or a later workflow revision.

## 9. Open items

- Log R1–R8 (this grill) into `docs/plans/00_MASTER_INDEX.md`; add this doc to the `00` documents table (next free number — written as `14_` because `13_` is taken by `13_MVP_SLICE.md`).
- Pin the engine ref + `setup-node`/`upload-artifact` versions at implementation time.
