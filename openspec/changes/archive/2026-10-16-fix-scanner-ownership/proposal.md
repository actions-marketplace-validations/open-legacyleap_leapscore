## Why

`apps/scanner/src/index.ts` claims the scanner owns "report permalinks, and the canonical report store", contradicting the stateless scanner-service contract. The comment invites future persistence work in the wrong place.

## What Changes

* Fix `apps/scanner/src/index.ts` header to state stateless operation: no permanent disk, no served reports, no permalinks; terminal `report` frame is the sole artefact.
* Record ownership decision: artefact persistence stays in workflow artifact (`envelope.json`) + future site backend, explicitly never in scanner.
* No runtime, protocol, or API change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None — `scanner-service` (stateless, no permanent disk) and `scan-api` (terminal frame is sole artefact) already require this; the fix aligns the code comment with existing requirements.

## Impact

* One comment-only edit in `apps/scanner/src/index.ts`.
* No effect on scanner service, site, surface, contracts, workflow, or checks.
* Follow-up site durable backend remains out of scope for this change.
