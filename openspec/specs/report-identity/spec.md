## Purpose

Gives every sealed report a target identity — what the code *is* — so a score can be calibrated against the size, stack, and shape of the thing it describes, without identity ever becoming a second scoring surface.

## Requirements

### Requirement: Identity is context, never a scored input

The sealed report SHALL carry a target-identity block describing what the scanned code is. No identity value SHALL enter a row score, a category score, the headline, a tier, a gate status, the coverage counts, the score fingerprint, the next-band path, or a run diff. Rendering, resealing, or omitting the block SHALL leave every sealed graded quantity byte-identical.

Membership SHALL be governed by a single exclusion rule: an identity field SHALL NOT carry a fact that any indicator row grades. A candidate field whose value is an indicator's objective metric SHALL be rejected even when it would read naturally as context.

#### Scenario: Dependency mass is not identity

- **WHEN** the identity block is derived for a target whose lockfiles record 611 transitive packages
- **THEN** the block carries no dependency count, because `ECOS-06`'s objective metric is total transitive dependency count and stating it unscored above the score would contradict that row

#### Scenario: Test surface is not identity

- **WHEN** the target's tree contains 391 test files split across unit, integration, and e2e
- **THEN** the identity block carries no test-file counts or test-tier split, because that surface is graded by `TEST-03`

#### Scenario: Identity cannot move the score

- **WHEN** the same sealed report is rendered with the identity block present and with it absent
- **THEN** the headline, tier, coverage counts, gate statuses, category scores, and `score_fingerprint` are identical in both renderings

#### Scenario: Popularity and activity are excluded

- **WHEN** the scan target is remote and star count, fork count, contributor count, and last-commit recency are available from the API
- **THEN** none of them appears in the identity block, because none is a property of the code and all are time-varying

### Requirement: Identity contents

The identity block SHALL describe the target along exactly these axes, and SHALL carry no other field:

- **subject** — repository slug or local directory slug, the sealed commit identity, and the scan instant
- **shape** — archetype and confidence, the plane inventory, per-root archetype entries when the target has more than one root
- **size** — file count, directory count, and one line magnitude
- **stack** — languages with their share of the tree, ecosystems with a recognized manifest, frameworks, and the legacy-stack census

Every value SHALL originate from the scan's own traversal or manifest sniff of the target. A value that would require history, an external API, or a second pass over content outside the identity allocation SHALL be absent rather than approximated.

#### Scenario: Full identity for a remote target

- **WHEN** a remote scan of a polyglot repository seals
- **THEN** the block reports the slug, commit, scan instant, archetype with confidence and planes, file and directory counts, the line magnitude, the language shares, the ecosystems whose manifests were sniffed, the detected frameworks, and any legacy-stack census entry

#### Scenario: History-derived fields are absent, not guessed

- **WHEN** the target was cloned with a single-commit history
- **THEN** the block carries no repository age, commit count, or last-activity field, and no substitute estimate of them

#### Scenario: Multi-root targets keep their per-root identity

- **WHEN** the target is a monorepo whose roots classify to different archetypes
- **THEN** the block reports the aggregate archetype and the per-root entries, each with its own archetype, confidence, and planes

#### Scenario: Languages are shares of the tree

- **WHEN** the target contains 72% Python, 18% JavaScript, and 10% other source files
- **THEN** the language entries report those shares and a primary language, and no entry reports a runtime version or an end-of-life judgement

### Requirement: Line magnitude is one undecomposed number with a named scope

The identity block SHALL carry at most one line-magnitude value. It SHALL be a count of physical lines (newline count) over a named, versioned source scope, and the block SHALL record that scope identifier.

The value SHALL NOT be a per-file distribution, a percentile, a maximum, or a per-module figure, and the block SHALL NOT decompose it into code, comment, and blank shares. Those are other measurements' subject matter and SHALL remain absent from identity even when the counting pass could produce them for free.

#### Scenario: No decomposition is published

- **WHEN** the identity block reports a line magnitude
- **THEN** no code/comment/blank split, comment ratio, or per-module line count accompanies it anywhere in the rendered report

#### Scenario: No distribution is published

- **WHEN** the identity block reports a line magnitude of 420k
- **THEN** it reports no file-count-over-threshold, no p95, and no largest-file figure, because per-file line distribution is `ARCH-01`'s graded subject

#### Scenario: The scope is named and versioned

- **WHEN** the identity block is read by a consumer or a differ
- **THEN** it carries the identifier of the source-scope rule under which the count was taken, so a later change to that rule is distinguishable from a change in the target

#### Scenario: Lockfiles and generated files are outside the scope

- **WHEN** the target's tree contains a 20k-line lockfile and minified bundles
- **THEN** neither contributes to the line magnitude, and the block's scope identifier denotes the inclusion/exclusion rule that excluded them

#### Scenario: A target with no recognized source is not zero lines

- **WHEN** the tree matches no extension in the source scope, as with a docs-only or infrastructure-only target
- **THEN** the line magnitude is reported as unknown with a reason naming the empty scope, and never as zero

### Requirement: Three statuses, emitted by the producer, presented by rule

Every identity value SHALL carry a status of exactly `measured`, `estimated`, or `unknown`. The block SHALL NOT use `not_applicable` or `not_implemented`, because every listed field applies to every target and the block is only built from producers that ran.

`estimated` SHALL mean that the value is an extrapolated magnitude. It SHALL NOT invoke or imply the scoring clamp that restricts estimated indicator rows to the middle of the scale; identity carries no score to clamp.

`unknown` SHALL be accompanied by a reason naming the lane or limit that prevented measurement, and SHALL NOT be represented by a zero, a blank, or a silently omitted field.

The status SHALL be emitted by the producer and consumed verbatim. A consumer SHALL NOT derive a status from a method field, a coverage ratio, or a lane.

#### Scenario: An estimate is presented as an estimate

- **WHEN** a value carries status `estimated` with a stored magnitude of 420000
- **THEN** every surface presents it with an approximation marker and at no more than two significant figures, and the marker is produced by the rendering rule rather than stored with the value

#### Scenario: A measurement is presented without qualification

- **WHEN** a value carries status `measured`
- **THEN** every surface presents it at no more than two significant figures without an approximation marker, while the exact stored magnitude remains available in JSON

#### Scenario: Unknown states its reason

- **WHEN** a value carries status `unknown`
- **THEN** the rendered block states the value as not measured and names the lane or limit responsible, rather than showing a dash, a zero, or nothing

#### Scenario: The scoring clamp does not travel

- **WHEN** an identity value is `estimated`
- **THEN** no clamp to a bounded range is applied to it, and no consumer treats it as an indicator row's estimated status

#### Scenario: Consumers do not infer status

- **WHEN** a consumer has the method and the coverage ratio for a value but not its status
- **THEN** the contract is violated; the consumer SHALL NOT compute `measured` or `estimated` from those inputs

### Requirement: Deterministic, bounded measurement

The scan SHALL derive identity within a read allocation reserved before the detector byte budget is partitioned, so that identity measurement cannot starve a detector and a detector cap cannot be mistaken for an identity cap.

Identity measurement SHALL be a pass of its own rather than a detector run, and SHALL follow the archetype-classification precedent of being computed by the scan driver and sealed into the report.

The line magnitude SHALL be measured by a ladder whose status follows coverage, not remaining budget:

- when every in-scope file was read, the magnitude is `measured`, in either lane
- when a bounded sample was read, the magnitude is `estimated`, and the block records how many in-scope files were read against how many exist
- when neither was possible, the magnitude is `unknown`

The sample SHALL be drawn by a fixed, deterministic stride over the canonically ordered traversal, and extrapolation SHALL be weighted by the extension distribution of the whole tree. Two scans of identical content with identical flags SHALL produce identical identity values.

#### Scenario: A small target is measured on either lane

- **WHEN** the target has fewer in-scope files than the sample size and is scanned remotely
- **THEN** the magnitude is `measured`, because coverage is complete and no extrapolation occurred

#### Scenario: A large target is estimated with its coverage disclosed

- **WHEN** the target has 1,247 in-scope files and 40 were read
- **THEN** the magnitude is `estimated` and the block records 40 read against 1,247 in scope

#### Scenario: Identity is reproducible

- **WHEN** the same content is scanned twice with the same release and flags
- **THEN** both identity blocks carry the same values and statuses, in the same order, with no dependence on file-system enumeration order

#### Scenario: Identity does not consume a detector's budget

- **WHEN** a scan runs with an identity pass and a full detector slice
- **THEN** each detector's byte partition is unchanged from the same scan without the identity pass, and an identity read cap is reported as an identity limit rather than a detector cap

### Requirement: Sealed, non-fingerprinted, absent-tolerant

The identity block SHALL be produced by the sealing side as part of the sealed report and typed by the shared contract. It SHALL be optional, so envelopes written before it existed remain readable and renderable.

The block SHALL be excluded from `score_fingerprint`. This exclusion is required, not stylistic: the same commit can yield a measured magnitude in one lane and an estimated one in another, so a fingerprinted identity value would break the guarantee that identical content with an identical release yields an identical fingerprint.

#### Scenario: Lanes agree on the fingerprint

- **WHEN** the same commit is scanned locally, where the line magnitude is measured, and remotely, where it is estimated
- **THEN** both envelopes carry the same `score_fingerprint` while their identity blocks differ

#### Scenario: Older envelopes still render

- **WHEN** an envelope written before the block existed is rendered
- **THEN** the report renders normally without a card and without an error, and no surface fabricates identity values to fill the gap

#### Scenario: No consumer recomputes identity

- **WHEN** a consumer needs an identity value
- **THEN** it reads the sealed block, and does not re-walk the tree, re-sniff manifests, or re-derive archetype

### Requirement: Identity is the anchor when the score is withheld

When the headline is suppressed for insufficient signal, the identity block SHALL render in full. It SHALL NOT be suppressed, blanked, or reduced because the score is absent.

When a report self-describes as an authored sample, the identity card SHALL state that before presenting any identity value.

#### Scenario: Identity survives suppression

- **WHEN** a scan measures too few rows and the headline is withheld with an insufficient-signal verdict
- **THEN** the identity card renders with its values and statuses, and the page still answers what the target is even though it cannot answer how good it is

#### Scenario: Sample identity is stated first

- **WHEN** the report carries the authored-sample marker
- **THEN** the identity card states that the figures illustrate a sample before the first identity value, rather than in a footer or trailing meta line

### Requirement: One derivation across every surface, ordered subject first

Every surface SHALL render the identity block from the same sealed values under the same presentation rules, so the site, the CLI markdown report, and the raw JSON never disagree about a value, a status, or an approximation marker.

Rendered reports SHALL order their content as subject, then verdict, then evidence, then provenance: the identity card appears before the headline, and the run-provenance detail (schema, rubric, engine identity, run id, duration, budget, scan time) SHALL NOT appear above the headline.

#### Scenario: Site and CLI agree

- **WHEN** the same sealed report is rendered by the site and by the CLI
- **THEN** both present the same identity values with the same statuses and the same approximation markers

#### Scenario: The subject precedes the verdict

- **WHEN** any sealed report renders
- **THEN** the identity card appears above the headline score, and no schema, rubric, engine, duration, or run-identifier line appears above it

#### Scenario: Provenance remains reachable

- **WHEN** a reader wants the instrument's receipt
- **THEN** the schema, rubric, engine, run, duration, and scan-time values remain available in a provenance detail below the evidence sections or in the raw JSON

### Requirement: Local identity subject is a name

For a local path scan, the identity block's subject SHALL be the scanned directory's basename, not an absolute path or a `file://` URL. The identity card and every report emitter SHALL render that name.

#### Scenario: Nested local directory

- **WHEN** a local scan targets a nested directory with the basename `claims-core`
- **THEN** the identity subject reads `claims-core` and no absolute path appears in the identity card, `report.html`, or `report.md`

#### Scenario: Remote identity is unchanged

- **WHEN** a remote scan targets `owner/repo`
- **THEN** the identity subject remains `owner/repo`

#### Scenario: Suppressed identity still renders

- **WHEN** a local scan is suppressed for insufficient signal
- **THEN** the identity subject still renders as the directory basename, and the identity card remains the anchor before the verdict
