## Why

Surfacing (envelope-in → GitHub-issues-out) currently lives inside `packages/engine/surface/` and runs in the same process as the scanner (`bin/scan.ts --surface`). That couples a `contents:read` measurement job with an `issues:write` privileged writer, sharing one token, one budget, and one deploy. A standalone third app isolates secrets and failure modes.

## What Changes

- Add `apps/surface/` as a third workspace app alongside `apps/site` (marketing/viewer) and the scanner (`packages/engine` + service).
- Move the 11 `packages/engine/surface/*.ts` modules (sync, guardrail, discover, lifecycle, rest, rows, body, labels, identity, slug, summary) into the new app with no lifecycle-semantics change.
- Give `apps/surface` its own entrypoint starting as a CLI (`envelope file in → issues out`, preserving `--surface-from` behavior); design the HTTP seam (`POST /surface`) but do not build it in this change.
- Rewire `action/` and `bin/scan --surface` to call the new app instead of the in-engine path; engine keeps `seal.ts` as the envelope producer and becomes read-only after sealing.
- Add a boundary check (precedent: `tooling/checks/site-boundary.ts`) so the engine cannot import from `apps/surface` and the site cannot hold an `issues:write` token.

## Capabilities

### New Capabilities
- None — no new user-visible behavior; this is a packaging move.

### Modified Capabilities
- None — `issue-surfacing` (ticket scope, identity token, discovery, lifecycle, labels, throttling, guardrail) and `workflow-scan` (exit codes, envelope shape) requirements are unchanged. This change sets `skip_specs: true` in `.openspec.yaml`.

## Impact

- Affected code: `packages/engine/surface/*`, `packages/engine/bin/scan.ts` (`--surface` / `--surface-from`), `action/dist/`, root `package.json` workspaces (already `apps/*`), new `apps/surface/package.json`.
- Systems: GitHub Actions workflow (token split: scanner `contents:read`, surface `issues:write`), scanner service (:4100) untouched, site untouched (never triggers surfacing).
- Dependencies: `@leapscore/contracts` stays the shared envelope/runId contract; no new runtime deps.
