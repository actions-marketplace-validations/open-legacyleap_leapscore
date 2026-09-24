## 1. Tracker primitives (pure, unit-tested)

- [x] 1.1 Implement target slug normalization (lowercase, `owner/repo`→`owner-repo`, illegal→`-`, collapse, trim, 64-cap) and verify unit tests cover collisions (`a/b-c` vs `a-b/c`), uppercase, dots, and length-capping
- [x] 1.2 Implement identity token build/parse (`<!-- leapscore:v1 target=<owner/repo> indicator=<ID> -->`) plus title render (`[LeapScore] <owner/repo> <ID>: <name>`) and verify unit tests cover round-trip, renamed titles, missing/malformed tokens, and extra whitespace
- [x] 1.3 Implement row selection from the sealed envelope (applicable + `measured`/`estimated` + score 0–2; exclude `unknown`, not-applicable, Green) and verify unit tests cover a mixed `full_table` fixture incl. tranche-a rows
- [x] 1.4 Implement ticket body render (status, evidence snippet, remediation, sha/links, `<!-- leapscore:human -->` split with byte-for-byte preservation of the human zone) and verify unit tests cover regeneration over an edited body
- [x] 1.5 Implement label-set computation (namespace + severity + category + gate + target labels; severity swap on band change) and verify unit tests cover Red→Yellow relabel and gate-participation flagging

## 2. REST sync module (isolated, mocked transport)

- [x] 2.1 Implement the isolated REST client (label-scoped issue listing with pagination, open/comment/reopen/close, label ensure-if-missing tolerating 422-exists) separate from `gh.ts` and verify `npm run check:detector-isolation` still passes
- [x] 2.2 Implement sequential/≤3 throttle with backoff on 429/abuse-limit + single retry then warn-only shortfall, and verify unit tests with a stubbed transport cover retry-once-then-record behavior
- [x] 2.3 Implement discovery map build (label listing → token parse → `indicator → number`, token `target=` authoritative, tokenless issues ignored, duplicate tokens first-match-wins + warning) and verify unit tests cover slug-collision targets and human lookalikes

## 3. Lifecycle sync + guardrail

- [x] 3.1 Implement lifecycle diff (open / band-change comment+reopen-close / wobble comment / Green auto-close / immediate reopen / deleted-recreate) with per-action payloads carrying transition, sha, engine ref, run link, and verify unit tests cover each transition on scripted before/after fixtures
- [x] 3.2 Implement the private-target guardrail (visibility check up front; private-T × public-A non-self → zero writes + `surface-skipped` line) and verify unit tests cover all four cells of the plan §4 table
- [x] 3.3 Implement summary contract (`surface: N opened / M commented / K closed / J skipped` + burst notes + skip reasons to stdout and `$GITHUB_STEP_SUMMARY`) and verify unit tests assert exact line format

## 4. CLI wiring

- [x] 4.1 Add the surface phase behind the CLI surface flag (runs only with sealed envelope + exit-0 scan; envelope file itself never rewritten) and verify CLI tests cover flag-off parity, refused-scan skip, and warn-only exit preservation on write failures
- [x] 4.2 Wire typecheck/lint/tests for all new modules and verify `npm run check:rubric-consistency` is unaffected (no rubric/generated-file changes)

## 5. Workflow

- [x] 5.1 Extend `.github/workflows/leapscore-scan.yml` (`surface` input default `true`, surface step gated on sealed envelope, `issues: write` permission) and verify YAML parses and the step graph matches plan §11 (scan → surface → upload-artifact `if: always()`)
- [x] 5.2 Verify E2E self-scan: two consecutive runs against a scratch repo, second run opens 0 issues and all lifecycle comments carry sha/engine-ref/run links
- [x] 5.3 Verify E2E two-target isolation: one runner, two targets, `target-a` rows never touch `target-b` tickets (incl. colliding-slug pair if available)
- [ ] 5.4 Verify E2E guardrail + burst: private-T × public-A run produces artifact with zero writes and the skip line; rough-target run prints burst counts and duplicate-token warnings where applicable
