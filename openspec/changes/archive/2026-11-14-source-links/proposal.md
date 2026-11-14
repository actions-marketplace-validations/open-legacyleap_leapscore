## Why

The site asserts "Apache-2.0", "no telemetry", and "not a black box", but publishes no link to the repository that backs any of it. A reader deciding whether to trust a score cannot reach the engine, the canonical rubric, or the report schema — every claim is one missing click from being auditable.

## What Changes

- The footer gains a `Source` link to `https://github.com/open-legacyleap/leapscore`, alongside the existing Samples / Method / Rubric links.
- The home hero's existing `Apache-2.0` badge text becomes a link to the same repository (the claim is already made; this makes it checkable).
- `/method` gains one line naming the repository as the home of the scanner, the canonical rubric catalog, and the report schema.
- The header is unchanged: it keeps exactly three nav links (`Samples`, `Method`, `Rubric`), so the existing `site-shell` header requirement still holds.
- The repository URL is declared once in a site-local constant module rather than typed into three components.

Non-goals: no GitHub API calls, no live star/fork counts, no repository-derived data at build time, no change to the header navigation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-shell`: adds a footer source-link requirement (the footer SHALL link the public repository), while the existing "header renders exactly 3 nav links" requirement is preserved unchanged.

## Impact

- `apps/site/components/footer.tsx` — one link.
- `apps/site/app/page.tsx` — the hero coverage badge becomes an anchor.
- `apps/site/app/method/page.tsx` — one sentence.
- New `apps/site/lib/*.ts` constant module for the repository URL.
- `openspec/specs/site-shell/spec.md` — one added requirement.
- Tests: `apps/site/lib/claim-honesty.test.tsx` renders the home and method pages, so the added anchors are covered by the existing surface assertions; a footer/header assertion may need extending so the "exactly 3 nav links" rule keeps its guard.
- No scanner, contract, Action, or rubric-compiler change.
