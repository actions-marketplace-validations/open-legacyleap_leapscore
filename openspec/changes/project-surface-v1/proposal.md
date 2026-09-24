## Why

The workflow scan (`14`) seals an honest report into an artifact nobody watches: findings live in the Actions tab, never where maintainers triage work. Surfacing the sealed report as deduplicated, lifecycle-managed issues in the runner repo turns the scan from an audit artifact into a remediation tracker — with zero new secrets and no GitHub App.

## What Changes

- New `surface` workflow input (default `true`); `false` preserves exact `14` execution-only behavior.
- New surface step after the scan: reads the sealed envelope and syncs one issue per applicable non-Green row (measured + estimated, score 0–2); `unknown`/`N/A`/Green rows never mint.
- Workflow permissions grow to `contents: read` + `issues: write`; REST-only, all on the `GITHUB_TOKEN` passthrough. No GraphQL, no Projects board, no check runs, no website links.
- Surfacing is warn-only: issue/label failures never rewrite the sealed scan verdict (exit map untouched); counts and skip reasons land in stdout + `$GITHUB_STEP_SUMMARY`.
- Private-target guardrail: private target × public runner degrades to execution-only with a loud `surface-skipped` disclosure; private evidence is never copied cross-boundary.
- New thin CLI surface (`packages/engine/bin/surface.ts`, or `scan --surface`): envelope in, label-scoped discovery + lifecycle sync out, summary counts printed.

## Capabilities

### New Capabilities
- `issue-surfacing`: the remediation tracker — identity token grammar (`target=` + `indicator=`), REST label-scoped discovery (Search API forbidden), open/comment/reopen/close lifecycle with immediate reopen and no debounce, ticket body + fixed label taxonomy with per-target label, sequential throttled writes with backoff, first-scan burst disclosure, human append zone preservation.

### Modified Capabilities
- `workflow-scan`: gains the `surface` input and the surface step (runs only when the envelope exists and scan exit is `0`); permissions add `issues: write`; exit-code map extended with warn-only surfacing semantics and the `surface-skipped` disclosure path. Scan behavior itself (triggers, targets, sha refusal, artifact) is unchanged.

## Impact

- Affected code: new `packages/engine/bin/surface.ts` (+ tests); `.github/workflows/leapscore-scan.yml` (input + step + permissions); no scorer/orchestrator/seal changes.
- Affected systems: runner repo issue tracker (first scan on a rough repo opens ~dozens of labeled issues — disclosed, not silencable); Actions job summaries carry surface counts.
- Dependencies: GitHub REST API (issues, labels) only. Explicitly not touched: Projects v2 API, Checks API, website, rubric/engine scoring.
