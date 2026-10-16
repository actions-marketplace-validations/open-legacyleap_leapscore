## Context

See `proposal.md` — Why. `apps/scanner/src/index.ts` header contradicts `server.ts` + `scanner-service` / `scan-api` specs (stateless, no store). No behavior change; comment-only alignment.

## Goals / Non-Goals

**Goals:**
- Header states stateless truth: no disk, no served reports, terminal frame is sole artefact.
- Point persistence ownership at workflow artifact + future site backend.

**Non-Goals:**
- No runtime, protocol, token, or boundary-check change.
- No site durable backend in this change.

## Decisions

- Edit the header comment only, keep exports unchanged (why: zero blast radius over doc rewrite).
- No spec delta (why: specs already require stateless; `skip_specs: true` set).

## Risks / Trade-offs

- [Risk] Future reader re-adds store to scanner → Mitigation: header names the owner (workflow + site backend), specs stay normative.
