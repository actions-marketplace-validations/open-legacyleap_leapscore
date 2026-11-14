## REMOVED Requirements

### Requirement: List page columns and affordances

**Reason**: The site keeps no run history and no longer has a live page to rerun into. A list of previously-run scans is exactly the surface the static site drops, and its "Rerun" affordance pointed at the live page this change removes. The illustrative sample is not history — it is a committed envelope — and it is curated by `sample-reports` instead.

**Migration**: `/reports` is replaced by `/samples` (`sample-reports`). The gallery lists only committed sealed envelopes, carries no rerun action, and offers no raw-JSON route. Any external link to `/reports` resolves through the site's not-found document.

### Requirement: Detail view reuses sealed report rendering

**Reason**: The requirement is written around a history entry addressed by `runId` and a `/report/sample` → `/reports/<runId>` redirect. Neither exists on a static site, and the `permanentRedirect` that implemented the sample redirect cannot be exported. The presentation contract it describes (identity, verdict, coverage, gates, category scorecard, full table, provenance, trace as scan log) is preserved by `sample-reports`.

**Migration**: Sample detail is served at a pre-rendered path under `/samples`, driven by the committed envelope. Trace rendering, provenance, and the sealed-report layout move with it unchanged.

### Requirement: Empty and error states

**Reason**: The empty state directs visitors to a live scan or the home-page repository input, both removed by this change. The gallery's empty state and the not-found document are specified by `sample-reports` and `static-hosting`.

**Migration**: An empty sample set renders an empty state that points at the local install command. An unknown sample path renders the not-found document, which links home.
