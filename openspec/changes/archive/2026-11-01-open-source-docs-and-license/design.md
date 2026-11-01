## Context

See `proposal.md` for the release motivation and `specs/open-source-release-materials/spec.md` for the observable documentation and licensing contract. The current root README is a capability review; `AGENTS.md` already contains the canonical maintainer architecture and repository rules. The CLI supports local directory scans and a distinct networked `--repo` mode. Reports are self-contained HTML, Markdown, and JSON, and the site has an authored illustrative report fixture. The scanner package currently declares itself private, so the README must not imply a public package install is already available.

## Goals / Non-Goals

**Goals:**
- Make the README a short public entry point in the brief's exact order, while retaining detailed engineering context for agents and maintainers.
- Make the report visual verifiable and safe to publish, rather than a hand-composed score claim.
- State a narrow, reviewable contribution boundary and make the Apache license discoverable to both humans and package tools.

**Non-Goals:**
- Changing CLI command names, required flags, install topology, scanner network behavior, telemetry, or report rendering.
- Publishing the npm package, GitHub Action, or repository under a new owner; these remain release-shape decisions.
- Changing the rubric, scoring semantics, assessment funnel behavior, or website routes.

## Decisions

### README content is the public front door; AGENTS.md remains the maintainer reference

Put the six brief sections first and in order. Keep only short, visitor-relevant explanations in the README; move or consolidate the detailed architecture, implementation status, scoring internals, development commands, and CI boundaries in `AGENTS.md`, which already serves that role. Do not duplicate the full architecture tree in the README. The primary command must reflect the CLI as it exists during this change; do not claim a no-setup installation path while the scanner package remains private and `--out` is required.

**Alternative considered:** Keep the present long README and add a short introductory block. Rejected because it does not honor the requested order and leaves the public front door framed as an internal capability review.

### Use a checked-in local fixture as screenshot source

Generate the screenshot by scanning a checked-in fixture with the built CLI in local mode, then capturing the resulting self-contained `report.html`. Treat it explicitly as illustrative, and include the fixture and refresh procedure in the repository so maintainers can regenerate it without network access. Before committing, ensure the image does not expose the temporary absolute path or imply the fixture is a customer's codebase. Prefer a screenshot of the CLI-produced report over a screenshot of a site view because the README's command produces that artifact.

**Alternative considered:** Screenshot the authored site sample. Rejected as the primary visual because it is not produced by the CLI path that README visitors are being shown. If the fixture report cannot be captured without leaking machine-specific details, use an explicitly labeled illustrative site sample and record that limitation rather than altering or inventing findings.

### Keep Apache licensing canonical at repository root

Add the unmodified standard Apache License 2.0 text to root `LICENSE`. Declare `Apache-2.0` in the root and scanner package manifests where license metadata applies; do not copy or customize the legal text. The package remains private unless a separate release-shape decision changes publication status.

**Alternative considered:** Add a short license notice or custom summary only. Rejected because legal tooling expects the complete canonical license text and the brief specifically values the standard patent grant.

### CONTRIBUTING.md mirrors section 8 and existing repo rules

Welcome issues and PRs with reproducible evidence, require relevant checks, and explain canonical-versus-generated rubric files. State each section-8 exclusion explicitly, including no upload/storage of customer code and no default-on telemetry. Keep contribution triage expectations factual; do not invent an issue-response SLA because the brief leaves ownership and response time open.

**Alternative considered:** Add a broad generic open-source contributor guide. Rejected because the brief calls for narrow scope and explicitly reserves functional analysis and modernization planning for the assessment.

## Risks / Trade-offs

- [The current supported install command is less frictionless than the brief's ideal `leapscore scan <path>`] -> Document the exact working command and prerequisites without implying a package is published; treat command/install changes as separate scope.
- [A fixture screenshot can be mistaken for a measured customer result] -> Label it illustrative in both README text and the asset, use only checked-in fixture code, and avoid performance or score claims unsupported by the fixture.
- [A browser capture may include local paths or other environment details] -> Inspect the final image before commit and crop or select a safe report region without changing report facts.
- [Apache license metadata can be inconsistent across workspaces] -> Check root and scanner manifests and ensure both match the root `LICENSE`.

## Migration Plan

1. Reorganize maintainer detail into `AGENTS.md`, then write the short README in the agreed six-section order.
2. Generate and inspect the illustrative report screenshot from the checked-in fixture; commit its reproducible refresh instructions with the asset.
3. Add `CONTRIBUTING.md`, the standard root `LICENSE`, and consistent package license metadata.
4. Validate README links and screenshot resolution, verify the screenshot refresh path offline, inspect licensing metadata, and run relevant repository checks. No runtime migration or rollback is required; reverting the documentation and license commit restores the prior presentation.

## Open Questions

- The public distribution path and repository ownership remain undecided in the existing release notes. This change documents only a command runnable in the current repository/package context and does not claim registry or Marketplace availability.
