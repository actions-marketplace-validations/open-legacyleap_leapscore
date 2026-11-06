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

## 2026-11-07 release run and trust status

- **4.8 verified:** Release workflow run `42275135527` (`workflow_dispatch`,
  `ca3f028`, `smoke_version=1.0.0-rc.1`) completed `success`. `verify` passed every
  gate on the release commit; `smoke` installed from the registry with no checkout,
  printed usage, sealed `engine_version=1.0.0-rc.1`, fingerprint
  `da8fda1bee13daff996cf8b6dabbcd283b729dbff06445ef2047429ba0f63f22`, and asserted
  exit codes 2 (usage) and 3 (threshold trip). `publish` and `finalize` were correctly
  skipped on the dry run.
- **5.1 / 5.2 accepted post-flip:** both executed after the repository was already
  public. The reservation still secured the name and proved the publish path, and the
  audit found nothing to rotate or rewrite; the only consequence is the `latest` pin
  documented in D11. Recorded rather than reordered.
- **5.4 blocked on an OTP:** `npm trust github` requires the account's one-time
  password (`two-factor auth: auth-and-writes`). `--dry-run` confirms the intended
  relationship: package `leapscore-scan`, file `release.yml`, repository
  `open-legacyleap/leapscore`, environment `release`, permission `publish`.
- **3.5 blocked on org authority:** the admin token can manage `open-legacyleap/leapscore`
  but cannot create repositories in the organization (`403 Need admin access to the
  organization`), and the organization has no existing private repository to use.
- **5.8 staging:** created `nareshaggarwal-legacyleap/leapscore-consumer-public` (public,
  empty) for the external-consumer run after `v1` exists.

## 2026-11-07 release evidence (1.0.0)

- Release workflow run: <https://github.com/open-legacyleap/leapscore/actions/runs/42276050661>
  on tag `v1.0.0` (commit `4975b15`). `verify`, `publish`, `smoke`, and `finalize` all
  completed `success` after the rerun described below.
- npm: `leapscore-scan@1.0.0` is live; `dist-tags` are `{ latest: "1.0.0", next:
  "1.0.0-rc.1" }`; publisher is `GitHub Actions <npm-oidc-no-reply@github.com>`.
  Provenance: <https://registry.npmjs.org/-/npm/v1/attestations/leapscore-scan@1.0.0>
  (SLSA provenance names the repository, `refs/tags/v1.0.0`, and `release.yml`).
- Tarball SHA256: `6f421afb663692a0206094a829dba57020fd7db3961f0f6017c71379ab629c4d`.
  The registry tarball and the GitHub release asset are byte-identical; `SHA256SUMS`
  verifies.
- Tags: annotated `v1.0.0` = tag object `de6ce08e726021e36db18fe6cb25716040f16742`,
  commit `4975b15`; `v1` = `4975b15`. `v1.0.0^{}` and `v1` both resolve to the release
  commit.
- Smoke: `engine_version=1.0.0`,
  `fingerprint=6dc4441a8a027252bcb874cd587f2c172dc2bcbc6e52db5d88e8eded100580e6`,
  exit codes 2 (usage) and 3 (threshold trip).
- **Registry-propagation race found and fixed:** the first smoke attempt failed with
  `ETARGET` because npm accepted the publish and then said the version was "being
  processed". `finalize` correctly stayed skipped, so `v1` did not move while the smoke
  was failing. After `1.0.0` appeared in the registry, re-running the failed smoke
  (without republishing) passed and `finalize` moved `v1`. The smoke job now polls
  `npm view <pkg>@<version> --prefer-online` before installing, so the next release does
  not fail on propagation lag.
- 7.1: the tagged run's `verify` job executed `npm run release:gates` on `4975b15`:
  every `check:*`, bundle parity, and the workspace suites passed.
- 7.4: repository has zero Actions secrets, default workflow permissions are `read`,
  the publish job ran behind the protected `release` environment (approval recorded on
  deployment `7608458388`), and the published tarball is the artifact packed by the
  tagged `verify` job.
- 6.1 / 7.2 (registry path): from a directory that is not a LeapScore checkout,
  `npx -y leapscore-scan . --out leapscore-report` sealed `engine=1.0.0`, score `3.33`,
  tier `Critical`, fingerprint
  `55abba40cde2458a444e844c05fdb44bee8c17e65c502daaddcbfabea1aa38c6`, and all three
  report files; `--help` exited 0.
- 5.8 / 7.2 (Action path): public consumer run
  <https://github.com/nareshaggarwal-legacyleap/leapscore-consumer-public/actions/runs/42277426186>
  used `actions/checkout@v5` then `uses: open-legacyleap/leapscore@v1`, and sealed
  `engine=1.0.0`, score `3.33`, tier `Critical`, status `degraded`, fingerprint
  `a7df60e2ffb40558b48c653efc21fc866b529139ccf1d94d9471bbe0b1b15a9a`.
- 7.3 (partial): the documented `v1` rollback command was exercised against the release
  commit and `v1` still resolves to `4975b15` (`refs/tags/v1` = `4975b15`). The
  deprecation half needs the account OTP (`npm deprecate` returned `EOTP`).

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
