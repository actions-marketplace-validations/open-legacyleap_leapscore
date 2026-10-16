# @leapscore/surface

Standalone issue-surfacing app: sealed envelope in → GitHub issues out.
Split out of `packages/engine` so the `contents:read` scanner and the
`issues:write` writer run in separate processes with separate tokens.

## Usage

```sh
surface --from <envelope.json> --repo <owner/repo> [--repo-a <owner/repo>] [--run-url <url>]
```

- `--from <envelope.json>` — sealed envelope file (`{ report: { full_table, gates }, meta }`).
- `--repo <owner/repo>` — scan subject (defaults to `meta.repo` in the envelope).
- `--repo-a <owner/repo>` — runner repo hosting issues (defaults to `--repo`).
- `--run-url <url>` — workflow run link for ticket provenance (else `GITHUB_*` env or omitted).

## Token

The surface process reads `SURFACE_TOKEN`, falling back to `GH_TOKEN` /
`GITHUB_TOKEN` for local single-token dev. In CI the scan job keeps
`contents:read` only and the surface step alone gets `issues:write`.

## Contract (warn-only + exit codes)

- Surfacing never rewrites a sealed verdict: every write shortfall is recorded
  as a `surface warn:` stderr line, the stdout summary line still prints, and
  the process exits 0 on sealed input — even when all writes fail.
- Exit 0: sealed envelope surfaced (or skipped by guardrail, still warn-only).
- Exit 2: invalid envelope file (unreadable / wrong shape) or invalid
  `--repo` / `--repo-a` — nothing was surfaced.
