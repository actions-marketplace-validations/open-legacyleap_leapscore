## 1. Prepare the maintainer reference and public README

- [x] 1.1 Reconcile the root README's architecture, implementation-status, scoring, development, and CI-boundary material into `AGENTS.md`; verify the existing maintainer rules remain present and the detailed capability review no longer leads the README.
- [x] 1.2 Rewrite the root README in the six-section order from the spec, including the verbatim positioning line and an exact currently runnable CLI command with prerequisites; verify section order, command spelling, and all README links.
- [x] 1.3 Verify privacy wording against the local and remote scan paths; ensure the README distinguishes local zero-network scanning from explicit `--repo` network activity and describes the assessment URL as click-only.

## 2. Produce and publish the sample report visual

- [x] 2.1 Select a checked-in fixture suitable for a representative local report and document an offline refresh procedure that runs the CLI and captures its self-contained HTML report; verify the procedure does not fabricate or edit score findings.
- [x] 2.2 Generate and commit the screenshot under `docs/` and reference it from the README with descriptive alt text and an illustrative-sample label; verify the image resolves in repository Markdown and exposes no repository identity, source, or absolute machine path.
- [x] 2.3 Re-run the documented screenshot refresh procedure in a network-disabled environment and compare the resulting report content and screenshot for reproducibility and privacy.

## 3. Contribution scope and license

- [x] 3.1 Add `CONTRIBUTING.md` with issue and pull-request guidance, reproducible evidence expectations, relevant checks, canonical-versus-derived rubric guidance, and every section-8 exclusion; verify each out-of-scope item is explicitly named.
- [x] 3.2 Add the complete unmodified Apache License 2.0 text at root `LICENSE`; verify the file includes the patent grant and matches the standard license text.
- [x] 3.3 Set applicable root and scanner package manifest license metadata to `Apache-2.0`; verify manifests have no conflicting declaration and the scanner's existing private status is unchanged.

## 4. Release-materials integration checks

- [x] 4.1 Review the final README from the perspective of a first-time visitor; verify the six requested sections appear first and in order, links and screenshot resolve, the primary command is truthful, and the next step preserves the LeapScore / `$0 Assessment` boundary.
- [x] 4.2 Run relevant repository documentation, package-wiring, and existing test checks; verify no scanner behavior, report contract, network policy, or generated rubric artifact changed as part of this documentation-and-license work.
