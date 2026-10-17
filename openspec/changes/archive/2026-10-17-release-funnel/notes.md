# release-funnel — verification notes

Recorded during apply (2026-10-17). Sequence shipped as one commit series: contracts → scanner (stdout + emitters) → site (redirect, band, labels, chrome) → docs.

## 5.1 — Full gate (all pass)

| Gate | Command | Result |
|------|---------|--------|
| Rubric consistency | `npm run check:rubric-consistency` | ok (102 indicators, `6f88ddc`) — compiled `tiers` keys and thresholds 80/53/27 unchanged |
| Detector isolation | `npm run check:detector-isolation` | ok (no raw fetch/fs outside `gh.ts`) |
| Contracts tests | `npm run test -w packages/contracts` | 22/22 pass |
| Scanner tests | `npm run test -w apps/scanner` | 247/247 pass (22 files) |
| Site tests | `npm run test -w apps/site` | 50/50 pass (8 files) |
| Site build | `npm run build -w apps/site` | green; `/methodology` in the route list |
| `/methodology` route | dev server `GET /methodology` | `308 → /method`; `GET /method` `200` |
| Positioning-sentence sweep | `grep -rn "LeapScore sees the structure"` (excl. `node_modules`/`.next`/`out`) | only the contracts constant + its test, this change's own artifacts, and two pre-existing release-brief notes in `docs/notes/` that quote the sentence while recording it was absent — no emitter/component copy |
| Band-label sweep | `grep -rn "Healthy\|High Risk" packages apps` | only machine-only aliases (`tier_legacy` values, `LEGACY_TIER_ALIASES`, legacy color-map keys), the `3 — Healthy` row taxonomy, and tests |
| Rubric-docs sweep | `grep -rn "High Risk\|Healthy\|Obsolete\|Legacy Failure" docs/rubric` | only the `11` §3 mapping note and the `3 — Healthy` / `3 = Healthy` row-taxonomy legends |
| Relative rubric-link sweep | `grep -rn "\.\./rubric/README.md" apps/site` | none; the only `../rubric` match left is the legitimate relative *import* `"../rubric-sidebar"` |

## 5.2 — Dogfood (scan of this monorepo) and site report view

`LEAPSCORE_KILLER_MS=120000 npx tsx apps/scanner/bin/scan.ts scan . --out <tmp>` → exit 0, all three files written.

stdout — one line, status prefix first, sentence once, tracked URL final and once:

```
insufficient-signal gates:2/8 unevaluable:5/8 coverage:12m/0e/15u — Significant modernisation risk — book a $0 Assessment to scope the fix. https://leapscore.dev/assessment?utm_campaign=cli-scan-v1&band=critical
```

(Headline suppressed because this repo only measures 12 of the 27 local rows — honest output; the sentence and link still cite the sealed band.)

`report.html` tail:

```html
<p class="meta">Methodology: <a href="https://leapscore.dev/methodology">https://leapscore.dev/methodology</a></p>
<div class="cta"><strong>Next step:</strong> Significant modernisation risk — book a $0 Assessment to scope the fix.<br><a href="https://leapscore.dev/assessment?utm_campaign=cli-scan-v1&amp;band=critical">Continue to the assessment</a></div>
<p class="positioning">LeapScore sees the structure. The assessment understands what the code does.</p>
</body>
</html>
```

`report.md` tail:

```md
Methodology: https://leapscore.dev/methodology

> Next step: Significant modernisation risk — book a $0 Assessment to scope the fix.
>
> https://leapscore.dev/assessment?utm_campaign=cli-scan-v1&band=critical

LeapScore sees the structure. The assessment understands what the code does.
```

Tracked-URL count per artifact: `report.html` 1 · `report.md` 1 · stdout 1.

Site report view (dev server, `/reports/django__django__506fc82__2026-08-12T000000-000Z`, sealed band `Moderate`):

```html
<section class="mt-10 rounded-lg border border-hairline bg-panel/30 p-5" aria-label="Next step"><p class="text-sm text-muted">Risk is concentrated in a few areas — a $0 Assessment clarifies what to fix first.</p><a href="https://leapscore.dev/assessment?utm_campaign=cli-scan-v1&amp;band=moderate" ...>Continue to the assessment</a><p class="mt-4 text-xs text-faint">LeapScore sees the structure. The assessment understands what the code does.</p></section>
```

On that rendered page: tracked URL count 1; `High Risk` 0; `Healthy` 20 — all `3 — Healthy` row-taxonomy verdicts, 0 band labels.

Note on link form: the CLI HTML CTA and the site band carry the URL only as the link target (label text "Continue to the assessment") so the URL occurs exactly once per artifact; the Markdown report prints the bare URL once as the link line (pasteable).

## 5.3 — Deferred scope stayed deferred; release blockers

- **No `/assessment` route or funnel wiring was added.** `apps/site/app` routes: `/`, `/live`, `/method`, `/methodology`, `/product`, `/report/live`, `/report/sample`, `/reports`, `/reports/[runId]`, `/rubric`, `/rubric/[categoryId]`. No booking destination, no click-through measurement, no analytics wiring (the only `analytics` strings in the site are indicator names in the generated registry); the changed funnel files make no network request — clicking is the only telemetry.
- **Release blockers before public launch:** (1) the follow-up `assessment-funnel` change must land — it owns the `/assessment` landing page, the booking destination, and click-through measurement; until then the tracked link resolves nowhere; (2) `leapscore.dev` domain bring-up — NXDOMAIN today, so both the tracked link and `https://leapscore.dev/methodology` (now a real in-repo route) stay publicly dead until the domain and deploy exist.
- Still deferred per the proposal's non-goals: README/LICENSE/Action/npm packaging (`release-packaging`), offline-by-default flip (`offline-default`), home/product launch-story refresh, benchmark/opt-in comparison, detector/scoring math.

## Notes for the archive

- One file beyond the impact list needed the same fix: `apps/site/app/product/page.tsx` carried a third `../rubric/README.md` link. The capability spec requires that no relative rubric link remains in the site, and task 4.1's sweep covers all of `apps/site`, so it was migrated to `/rubric` with the homepage and footer.
- Site `vitest.config.ts` include was extended to `lib/*.test.tsx` and `components/*.test.tsx` so the new rendered-surface tests (band vocabulary, next-step band, chrome honesty) run.
- `apps/site/AGENTS.md` and `apps/site/CLAUDE.md` are generated by `next dev` and are untracked; committing them with the work keeps the tree clean.
