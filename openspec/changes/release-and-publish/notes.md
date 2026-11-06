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
- The only Node 20 deprecation warning in the earlier run came from the workflow's
  `actions/upload-artifact@v5`, not from this Action. `upload-artifact` was bumped to
  `v6` and `download-artifact` to `v7` (both `node24`).
- Verified on run `42268018081` (push `main`, `9b826c6`): `success`, the scan step ran
  `uses: ./`, `upload-artifact@v6` was fetched, and the run contains no
  `Node.js 20 is deprecated` warning. Remaining `DEP0040` punycode warnings come from
  `actions/setup-node`'s own post-run, not the Action runtime.
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

## 2026-11-07 status after the first ops pass

- Push `9b826c6` is on `main`; `Checks` (`42268018041`), `Bundle parity`
  (`42268017943`), and `LeapScore scan` (`42268018081`) all completed `success`.
- npm package owner: `nareshaggarwal-legacyleap <naresh.aggarwal@legacyleap.ai>`.
  Published versions: `0.0.0-stage` (18:27:27Z, "Temporary package placeholder for
  staged publishing") and `1.0.0-rc.1` (18:29:35Z).
- 1.3 verified: `npm profile get` reports `two-factor auth: auth-and-writes`, and the
  account has published rights (both versions above were published by it).
- Repository posture: Actions enabled, default workflow permissions `read`, and
  `GET /actions/secrets` returns `total_count: 0` (no registry write token).
- `1.0.0-rc.1` tarball: SHA256 `d7451b750b309e2b871bc62265598d6215fd7e8c49fffe0d2f352a39c1385562`;
  5 files (`LICENSE`, `package.json`, `README.md`, `bin/leapscore-scan.mjs`,
  `dist/leapscore-scan.mjs`); package version `1.0.0-rc.1`.
- Installed that tarball from the registry in a clean directory and scanned a fixture
  offline: `engine_version=1.0.0-rc.1`, all three report files sealed,
  `score_fingerprint=da8fda1bee13daff996cf8b6dabbcd283b729dbff06445ef2047429ba0f63f22`.
- **Resolved — `latest` on the prerelease is unavoidable, not a defect:** `dist-tags` is
  `{ latest: 1.0.0-rc.1, next: 1.0.0-rc.1 }`. The registry rejects
  `npm dist-tag rm leapscore-scan latest` with `400 Bad Request`
  ([npm/cli#8490](https://github.com/npm/cli/issues/8490)): a package must always have
  `latest`, so it only ever moves. D11, the migration step, task 5.1, and the runbook now
  say so; 5.5's publish moves `latest` off the prerelease.
- **Cleanup pending — `0.0.0-stage`:** published first without `--tag`, so it created
  `latest` and held it until the rc publish moved it. It is a 2-file placeholder with no
  `bin`, so `npx leapscore-scan` fails against it. `npm unpublish
  leapscore-scan@0.0.0-stage --force` inside the 72-hour window from 18:27:27Z leaves
  `1.0.0-rc.1` as the only version.
- **Resolved — `release` environment:** the repository now has exactly one environment,
  `release`, with required reviewers (`nareshaggarwal-legacyleap`, `srajat-leap`) and one
  custom tag policy `v*.*.*` (type `tag`). The misnamed `v*.*.*` environment is gone, so
  the publish job can no longer auto-create an unprotected environment.
- Local `docs/releases/README.md`, `design.md`, `tasks.md`, and this file still have
  uncommitted changes (runbook corrections plus the `latest`/environment findings);
  commit and push them before tagging `v1.0.0`.

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

- 1.1 old-path redirect check (needs the pre-transfer repository path, or confirmation
  that the repository was created at `open-legacyleap/leapscore`)
- 1.3 2FA confirmation for `nareshaggarwal-legacyleap` (publish rights are proven)
- 3.5 second private-repository consumer run
- 4.6 / 4.7 / 4.8 verification against a real release (4.8's dispatch is also outstanding)
- 5.1 / 5.2 post-flip ordering waiver (both ran after the repository was already public)
- 5.4 trusted-publisher configuration (needs npm + admin)
- 5.5 / 5.6 publish `1.0.0`, create `v1.0.0`, move `v1` (needs write access)
- 5.7 Marketplace listing (needs release UI access)
- 5.8 external public-repository consumer run
- 5.9 release evidence (blocked on 5.5)
- 6.1 verification from an empty directory (blocked on 5.5)
- 7.2 / 7.3 / 7.4 released-tag checks, rollback rehearsal, and posture audit
