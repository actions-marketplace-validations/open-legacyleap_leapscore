# Release verification notes

Evidence recorded while applying `release-and-publish`. Entries name the task they
close and the commit/run they were checked against. Anything not listed as closed is
still open; see "Open blockers" at the end.

## Environment checked

- Date: 2026-11-06
- Commit: `c6783b698d83db4684fb9d0e493c3064a0e95667` (`main`)
- Repository: `open-legacyleap/leapscore`, already public
- Remote tags: none (`git ls-remote --tags origin` is empty)
- Registry: `npm view leapscore-scan` returns `E404` (name still unclaimed)

## 1.2 Actions and default branch

- Default branch is `main` (`gh repo view` reports `defaultBranchRef.name = main`).
- Actions is enabled: `Checks`, `Bundle parity`, and `LeapScore scan` all completed
  successfully on the latest push to `main` (runs `42101790299`, `42101790346`,
  `42101790786`).
- The dogfood workflow needs no PAT: its only secret reference is
  `secrets.GITHUB_TOKEN` (`SURFACE_TOKEN`), and `permissions` is `contents: read` +
  `issues: write` for surfacing.
- Standard-runner metering note is superseded: the repository is already public.

## 3.2 Dogfood uses the root Action

- `.github/workflows/leapscore-scan.yml` declares `uses: ./` after
  `actions/checkout@v5`.
- Run `42101790786` (push, `main`, `c6783b6`) completed `success`; the
  `Scan working tree with LeapScore` step also completed `success`.

## 3.3 Action runtime is node24

- `action.yml` declares `runs.using: node24`, `runs.main: action/dist/index.js`.
- The hosted run above reached and completed the scan step.
- The only Node 20 deprecation warning in that run came from the workflow's
  `actions/upload-artifact@v5`, not from this Action. `upload-artifact` was bumped to
  `v6` and `download-artifact` to `v7` (both `node24`) so the next hosted run is
  warning-free; the bump is unverified until a push is allowed.
- The self-hosted-runner caveat is recorded in `action/README.md` under
  "Runner requirements".

## 5.2 Pre-flip audit (performed post-flip)

The repository was already public when this audit ran, so the "before visibility
changes" ordering condition cannot be satisfied. Findings:

- No live secret patterns in the full history (`git log --all -p`): no private-key
  blocks, `ghp_`/`github_pat_`/`npm_`/`AKIA`/`xox*`/`sk-` tokens. The single `AKIA...`
  hit is the synthetic placeholder in
  `apps/scanner/src/scan/__tests__/detector-honesty.test.ts`.
- No long-lived registry credential in the tree or workflows: only
  `secrets.GITHUB_TOKEN` is referenced; no `NPM_TOKEN`/`NODE_AUTH_TOKEN`.
- Commit author emails: the only author address in history is
  `rajat.singhal@legacyleap.ai`, now public.
- Internal/private references: the only hits are the intentional dev default
  `http://localhost:4100` in `apps/site/lib/scanner.ts` and the synthetic
  `.example` host in the legacy-stacks fixture.

## 7.1 Release gate run (pre-tag)

`npm run release:gates` passed on `c6783b6`:

```
release-gates: PASS — 10 check:* commands, bundle parity, and the workspace suites all passed
```

This is the same command the `verify` job runs. It was not executed on a `v1.0.0` tag
because no tag exists yet.

## Ordering caveats found while preparing the ops handoff

- **5.4 cannot verify OIDC with a `1.0.1` dry run.** The `publish` job is tag-only by
  design, and `workflow_dispatch` skips it, so no OIDC token is requested on a dry run.
  The first real OIDC publish is 5.5 (`1.0.0`). Either treat 5.5 as the OIDC verification
  or publish a throwaway stable version first (which would become `latest`).
- **4.7's "failing smoke on a prerelease" cannot use a prerelease tag.** The workflow
  accepts only stable `vX.Y.Z` tags and the version guard rejects prereleases on a tag
  push; prereleases are published manually under `next` (5.1) and never run `finalize`.
  Practical verification: dispatch the dry run with a nonexistent `smoke_version` and
  confirm `smoke` fails while `finalize` is not scheduled, then confirm during 5.5 that
  `finalize` waits for `smoke`.

## Open blockers

These require credentials or repository authority this session does not have (the
GitHub token is read-only: `pull: true`, `admin: false`, `push: false`; npm is not
authenticated):

- 1.1 old-path redirect check (needs the pre-transfer repository path)
- 1.3 npm account name, 2FA, and publish rights
- 1.4 / 5.3 protected `release` environment (needs admin)
- 3.5 second private-repository consumer run
- 4.6 / 4.7 / 4.8 verification against a real release
- 5.1 publish `1.0.0-rc.1` under `next` (needs a maintainer npm credential)
- 5.4 trusted-publisher configuration (needs npm + admin)
- 5.5 / 5.6 publish `1.0.0`, create `v1.0.0`, move `v1` (needs write access)
- 5.7 Marketplace listing (needs release UI access)
- 5.8 external public-repository consumer run
- 5.9 release evidence (blocked on 5.5)
- 6.1 verification from an empty directory (blocked on 5.5)
- 7.2 / 7.3 / 7.4 released-tag checks, rollback rehearsal, and posture audit
