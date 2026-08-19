# 10 — Frontend & Client Health *(conditional module)*

> **Weight:** annex only (never in the system total) · **Standard:** FE-01…06 · **Deep-dive:** FE-07
>
> **One-line thesis:** The frontend is the product's face — and a client that predates its era shows the same decay class as the backend, plus its own: bundles the size of satellites, accessibility scored in single digits, and a framework the ecosystem left behind.

**Category summary:** This module is scored **only if the system has a user-facing client** (web app, mobile, desktop, or embedded UI). If none exists, skip entirely — it is an annex score recorded separately, not weighted into the system total. Covers the UI's framework health, performance, accessibility, platform currency, client architecture, design consistency, and run-time adaptation.

---

## Standard indicators

### FE-01 — UI Framework / Stack EOL & Deprecation
- **Definition:** The client is built on a framework or toolchain that is EOL, in maintenance mode, or legacy-generational (AngularJS, jQuery-era SPA, Flash/Flex, React 15, Vue 2 pre-EOL) — with no documented migration path and shrinking community/tooling support.
- **Why it signals obsolescence:** The frontend is the user's daily experience; a dead framework means security patches stop (XSS classes stay open), hiring collapses, the ecosystem's gear (component libs, tooling, AI assistance) stops fitting, and every new feature is built in an abandoned era. (This is ECOS-01/08, aimed at the client.)
- **Where it manifests:** `package.json` framework version, EOL trackers (endoflife for Angular/Vue/React), framework support pages, bundle of legacy polyfills, "don't upgrade" tickets, no component lib compatible with the stack, job postings for the stack drying up.
- **Detection method:** Framework lifecycle audit — version matrix vs. EOL calendar (endoflife.date), tooling compatibility check (does the current build toolchain support the framework?), community signals (release cadence, Stack Overflow trend), staffing check (how long to hire for this stack).
- **Objective metric:** `framework support status (active/maintenance/EOL)`; `major-version gap`; `tooling compatibility (build/router/SSR)?`; `time-to-hire for the stack`.
- **Yellow flag (warning):** Framework in maintenance mode / one generation back, with an upgrade path underway. *(Rationale: warning — the window to leave is still open, cost is rising.)*
- **Red flag (critical):** Framework EOL (or vendor-end-of-life) with no migration in progress, or security patches unavailable. *(Rationale: unfixable client vulnerabilities + a frozen evolution path — the client is now a terminal.)*
- **Example symptom:** "The admin UI is AngularJS 1.8 — Google retired it. A reflected-XSS class needs a patch that only exists in the modern framework. The team 'migrations'd twice, both stalls. Every new screen is built on a skeleton nobody will extend."
- **Blast radius:** Client security, user experience growth, hiring, feature velocity, ecosystem fit (design systems, monitoring, a11y tooling).
- **Remediation playbook:** Quick win: a written migration brief (target framework, timeline, budget), framework-but-the-patterns upgrade where feasible, freeze risky features. Structural fix: incremental migration (module-shell pattern, route-by-route strangler), contract with the backend (API-01) kept stable during migration, the client on a support-meeting framework within two quarters.
- **Gold standard / target state:** Framework is current-to-recent, security-supported, ecosystems integrable; migration is an ordinary roadmap item if ever needed.
- **Scoring guidance:** (annex) 3 = supported/current; 2 = maintenance mode with plan; 1 = EOL in isolated surface; 0 = EOL with no path.
- **Verify effort:** ⚡ ≤ 30 min — version + EOL check.

### FE-02 — Bundle Size & Load Performance
- **Definition:** The client ships fat bundles — megabytes of JS/CSS, no code splitting, render-blocking churn, heavy images — so load/LCP/interaction metrics are slow, mobile suffers, and the "page load" is a growing tax on conversion.
- **Why it signals obsolescence:** Client performance is a user-decision metric (half the abandonments on load-time). Legacy clients universally carry unforked bundles (everything loaded on every route), absence of code-splitting, no measurement, and an app that "works fine on the office MacBook." It's also the cheapest modernization win available.
- **Where it manifests:** Bundle analysis (webpack-bundle-analyzer/rollup), Lighthouse scores (< 50 perf), no code-splitting (one giant chunk), no caching strategy, no CDN, images unoptimized, page loads every asset on first paint, no Core Web Vitals tracking.
- **Detection method:** Performance measurement — Lighthouse/PageSpeed (lab), Core Web Vitals field data (CrUX/RUM), bundle analyzer output (total + per-route), network waterfall inspection (blocking, duplication), mobile-device throttled test vs. target.
- **Objective metric:** `initial JS/CSS bytes (KB)`; `LCP/CLS/INP (field P75)`; `code-split coverage % (per-route chunks)`; `Lighthouse perf score`; `image weight %`.
- **Yellow flag (warning):** Bundle 500 KB–1.5 MB initial, LCP 3–4s on mobile, splitting partial. *(Rationale: warning — exceeds budgets, users already paying.)*
- **Red flag (critical):** > 1.5 MB initial, LCP > 4s, no code splitting, no measurement at all — "the app is slow" shows up in churn/refunds. *(Rationale: the client is its own growth blocker; users feel it every session.)*
- **Example symptom:** "The dashboard loads 2.1 MB of JS on every route — including three charting libs. Mobile LCP is 7s. Lighthouse: 34. Sales: 'users bounce from the dashboard.' Nobody has ever opened the bundle analyzer."
- **Blast radius:** Conversion/revenue, mobile reach, user retention, infra (bandwidth), SEO/rankings, support ("slow app" tickets).
- **Remediation playbook:** Quick win: code-split the routes, defer non-critical vendors, compress/optimize images, set a bundle budget in CI (regression gate), measure with Lighthouse in CI. Structural fix: a performance budget (bytes + core vitals) enforced, RUM for field data, on-demand vs. bundled loading for heavy features, service-worker caching.
- **Gold standard / target state:** Initial JS < 300 KB, LCP < 2.5s on mobile field-data, code-split by route, budget-enforced in CI, vitals tracked on a dashboard.
- **Scoring guidance:** (annex) 3 = budgets + fast; 2 = over budget, splitting partial; 1 = > 1 MB, no split; 0 = massively overweight, uncounted, users suffering.
- **Verify effort:** 🔶 ~2–4 h — Lighthouse + bundle analytics.

### FE-03 — Accessibility Deficits
- **Definition:** The client fails accessibility basics — no semantic markup, missing ARIA/labels, keyboard-unusable controls, contrast failures, no focus management, no a11y testing — and there's no accessibility standard or enforcement.
- **Why it signals obsolescence:** Accessibility is both a legal liability (ADA/WCAG/EN 301 549 — suits are real) and a *product reach* issue (roughly a fifth of users). Its absence marks a client built before accessibility became a baseline, and it's a rare case where the "modernization" is strictly additive — a cheap, high-return fix. Also a regulatory gate: WCAG 2.1 AA is legally required in many markets.
- **Where it manifests:** Lighthouse a11y < 70, div-spam instead of semantic elements, unlabeled inputs, modals without focus traps/dismiss, color-only status indicators, no keyboard order, no a11y lint or automated checks, screen-reader users unreachable.
- **Detection method:** Automated a11y scan (axe-core, Lighthouse, WAVE, linting), manual keyboard walkthrough (tab through a critical flow), screen-reader smoke (VoiceOver/NVDA on core journeys), contrast checks (axe color-contrast), check for automated a11y checks in CI.
- **Objective metric:** `Lighthouse a11y score`; `axe critical-serious violations count`; `keyboard-navigable coverage % of flows`; `a11y CI gate present?`; `contrast failures count`.
- **Yellow flag (warning):** Score 70–90, some serious violations on secondary flows, no a11y gate. *(Rationale: warning — functional but non-compliant risk remains.)*
- **Red flag (critical):** Score < 70, critical flows keyboard-unusable, or no automated a11y checking at all with visible violations. *(Rationale: legal exposure + an unusable-product class is excluded — dual liability.)*
- **Example symptom:** "The search/booking flow is a maze of unstyled divs and unlabeled selects. A screen-reader evaluation: 'I can't tell what anything is, and focus jumps around.' Legal risk registers the audit; revenue records the lost users."
- **Blast radius:** Legal action (accessibility suits), market reach, public-sector procurement eligibility, brand, UX quality (a11y fixes help everyone).
- **Remediation playbook:** Quick win: run axe, fix the top serious/critical violations (labels, semantics, focus, contrast), add a11y lint to CI. Structural fix: a11y standards + automated gate (axe in CI failing new violations), keyboard/contrast reviews, component-library a11y defaults, screen-reader smoke tests on core journeys.
- **Gold standard / target state:** a11y score ≥ 95, zero critical/serious violations, keyboard + screen-reader flows pass in review, a11y gate enforced in CI.
- **Scoring guidance:** (annex) 3 = ≥ 95, enforced; 2 = 70–90, some violations; 1 = < 70 on part of app; 0 = unusable-by-keyboard, no checks, legal exposure.
- **Verify effort:** 🔶 ~2–4 h — axe run + keyboard walkthrough.

### FE-04 — Browser / Platform Support Drift
- **Definition:** The client targets a stale or wrong platform matrix — still promising IE11/old browsers, or alternatively, no declared support matrix at all, breaking on current browsers, no responsive layouts, no desktop/mobile parity, and platform support is a rumor.
- **Why it signals obsolescence:** The platform matrix is the client's forward-compatibility contract. Supporting dead browsers forces stagnation (no modern CSS/JS); supporting nothing means users break in the real world. Modern practice: a known, current matrix (browserlist) + responsive across breakpoints + feature detection. Its absence marks a client frozen at the era it was built.
- **Where it manifests:** Hardcoded IE11/legacy promises in docs, polyfill sprawl for long-dead browsers, no browserlist file, fixed-width layouts (desktop-only), no responsive breakpoints, "works on Chrome only" acceptance, no device testing, transdyn failures on exports.
- **Detection method:** Support-matrix audit — browserlist/browsers config present + current? Responsive implementation (breakpoints, mobile test)? Device/browser test coverage in QA? Browser usage analytics (what do real users use) vs. what's tested? Try the app on a current mobile browser + a recent-only build.
- **Objective metric:** `browserlist currency`; `responsive coverage % of flows`; `polyfill-for-obsolete count`; `real-user browser matrix vs. tested matrix overlap`; `mobile breakage incidents`.
- **Yellow flag (warning):** Stale matrix or partial responsive; polyfill cruft; mobile tested sporadically. *(Rationale: warning — friction, real-user breakage ticking up.)*
- **Red flag (critical):** Desktop-only/fixed-width (or a matrix that excludes where users are), or no matrix at all with recurring "breaks in my browser" reports. *(Rationale: the client isn't built for the present — it's built for its own archive. Users are being told to upgrade to the app's remembered world.)*
- **Example symptom:** "The ordering portal is a 1280px desktop layout. On a phone it's a 300px scrollable ghost town. Browser analytics say 61% of the audience is mobile. 'We're resolving it one ticket at a time' — for three years."
- **Blast radius:** Reach, mobile revenue, user trust, QA coverage, support load, brand.
- **Remediation playbook:** Quick win: declare the matrix + enforce browserlist, add a responsive bootstrap for the top user journey, test mobile on the core path. Structural fix: responsive-first design standards, device/browser QA in the pipeline, analytics-informed matrix reviews twice a year, cut the obsolete matrix (drop IE11 promises, shed polyfills).
- **Gold standard / target state:** Declared + enforced current matrix, responsive across breakpoints, browser/device tested in QA, matrix reviewed against real usage.
- **Scoring guidance:** (annex) 3 = current + responsive; 2 = stale or partial responsive; 1 = broken on current/mobile for some flows; 0 = desktop-only museum or no matrix with real breakage.
- **Verify effort:** 🔶 ~2–4 h — browserlist + device test session.

### FE-05 — Client-Side Architecture Debt
- **Definition:** The client's internal structure is legacy-modal — global state sprawl (a dozen stores, mutable globals), prop-drilling and god-components, anemic architecture where UI logic invents the domain, no component model/testable seams, and every feature is a new global.
- **Why it signals obsolescence:** Client architecture debt is ARCH on the frontend: the app grows by global mutation, state is untestable, components are untestable, and refactoring the client (a natural prelude to any modernization) is met with "too risky to touch." It's the reason FE-01/02 migrations stall.
- **Where it manifests:** Global state object/store sprawl, giant god-components (1000+ line components), prop drilling through 6 layers, logic-in-render (`render` computing things), no separation of data/view/state, hundreds of `useEffect`/effects, state-that-can't-be-test, no component architecture.
- **Detection method:** Component/graph analysis — component LOC distribution (god-components), state-management inventory (global stores, context providers, mutations outside stores), testability experiment (can you test a component in isolation? component testing coverage — from TEST-01 by component), hooks/effects density, data-flow tracing for a nontrivial feature.
- **Objective metric:** `max/mean component LOC`; `# of global stores/contexts`; `prop-drill depth`; `component test coverage %`; `state-mutation-outside-store count`.
- **Yellow flag (warning):** Some god-components, 1–3 global stores, prop drilling in places; light component tests. *(Rationale: warning — still navigable, but structure is degrading.)*
- **Red flag (critical):** 5+ unmanaged globals, 2,000-line components as normal, no component tests, unmappable data flow — "the frontend can't be reasoned about." *(Rationale: the client has no architecture worth modernizing incrementally — it's one shot glass of god-components.)*
- **Example symptom:** "The checkout is one 3,500-line component reading 4 global stores, mutating them directly, fluffing 12 styles of prop drilling. A developer adds a field — and two unrelated pages change. 'We feared touching it' is the standing review note."
- **Blast radius:** Client velocity, bug density, test feasibility, migration risk, UX bugs (state races), onboarding.
- **Remediation playbook:** Quick win: mark the top 3 god-components, extract their clearest slice with a test, introduce a singular state pattern with actions. Structural fix: a deliberately small client architecture (one store, typed, actions-only), component decomposition by responsibility, testable seams with a component test budget, codegen for new screens (VEL-09-style).
- **Gold standard / target state:** God-components ≤ modern norms, single main state path, components testable in isolation with coverage, "touch one page breaks another" is a historical anecdote.
- **Scoring guidance:** (annex) 3 = clean architecture + tests; 2 = some globals/god-components; 1 = a few unmanageables; 0 = unroutable god component sprawl.
- **Verify effort:** 🔶 ~2–4 h — component/LOC + state inventory.

### FE-06 — Design System / UI Consistency Drift
- **Definition:** The client has no (effective) design system — every screen hand-styles controls, colors/typography/spacing vary by feature, duplicated component implementations, no shared tokens — so "just another screen" always implies custom styling and visual drift.
- **Why it signals obsolescence:** A design system is the client's shared language; without it, the UI is a "many separate clients story," accessible-ish by accident, and each feature pays a full styling tax. Its absence signals a client that grew by addition before design-systems discipline — a marker of the same era as FE-01's framework.
- **Where it manifests:** Duplicated button/input/modal implementations, hardcoded color hexes scattered, no design tokens, no component library (or an abandoned one), docs/wireframes vs. shipped UI mismatch, "which button should we use? build one."
- **Detection method:** Duplication audit — grep for repeated styles/colors/components, count component implementations per UI element, check design tokens (CSS variables/theme) adoption %, Figma/DS link usage, a "time to clone a button" benchmark, visual consistency audit on a few screens.
- **Objective metric:** `# of implementations of core primitives (button/input/modal)`; `design-token coverage %`; `hardcoded-color count`; `component library adoption % of screens`; `visual-consistency score (audit)`.
- **Yellow flag (warning):** 2–3 implementations of primitives, some tokens, ad hoc styles in places. *(Rationale: warning — inconsistency is compounding feature cost.)*
- **Red flag (critical):** No design system, 5+ ways to render a button, zero tokens — every feature re-invents the UI. *(Rationale: the client has no shared foundation — velocity and consistency are both structural losers.)*
- **Example symptom:** "There are six date pickers in the app, three of them hand-rolled, each with its own error UX. The design team emails a Figma spec; engineers hand-implement it differently every time. A brand refresh would be months of texture edits."
- **Blast radius:** Feature velocity (every screen restyled), UX quality, a11y (inconsistent controls), brand integrity, QA load, FE-01 migration (DS is the anchor).
- **Remediation playbook:** Quick win: build a token layer (design tokens → styled primitives), consolidate the top 2 duplicate controls, adopt one primitive set for new work. Structural fix: a small living component library (owned, versioned), tokens adopted across screens, "no new hand-rolled primitive" rule, design ↔ engineering parity checks.
- **Gold standard / target state:** One primitive set, tokens everywhere, new screens composed not styled, visual parity across the app by construction.
- **Scoring guidance:** (annex) 3 = system + tokens; 2 = partial library; 1 = duplicates common; 0 = no shared foundation, reinvented per screen.
- **Verify effort:** 🔶 ~2–4 h — duplication audit + consistency sample.

---

## Deep-dive indicator

### FE-07 — Mobile / Responsive Adaptation & Offline Support
- **Definition:** The client doesn't adapt to the contexts real users are in — no meaningful offline/progressive capability for a product that needs it, heavy always-online dependence, no mobile-specific performance, no low-bandwidth consideration, and state-loss on navigation — while user data (from FE-04/analytics) shows a mobile-first world.
- **Why it signals obsolescence:** "Responsive + offline-aware + mobile-perf" is the modern client baseline; a client that expects a desktop, wired, Chrome-18 machine is building for an audience that has moved. Offline/PWA support matters where connectivity is real (mobile users, tunnels, travel) — and its absence occasionally turns perfectly-normal usage into data loss.
- **Where it manifests:** No service worker/PWA, forms lose unsaved data on refresh, hard dependency on network for static shell, no mobile perf budget (heavy assets on phones), no manifest/installability, desktop-first flows that collapse on mobile UX, connectivity-agnostic code.
- **Detection method:** Context audit — check PWA/service-worker/offline scaffolding existence, form-state persistence across refresh, static-asset CDN/cache behavior, mobile throttled performance (Lighthouse mobile), connectivity-loss experiment (reload while offline), usage analytics (share of mobile/travel context), state-loss bug count tied to navigation.
- **Objective metric:** `PWA/offline capability present?`; `unsaved-data-loss incidents`; `mobile LCP (throttled) vs. budget`; `% of users impacted by no-offline/mobile gaps`; `installability/manifest present?`.
- **Yellow flag (warning):** Some offline/progressive features exist, mobile perf over budget, occasional data-loss on network blips. *(Rationale: warning — the app functions, context-fit is leaky.)*
- **Red flag (critical):** No offline capability for a product users depend on in real connectivity, data loss on common navigation/refresh, mobile experience broken/unweighted. *(Rationale: the client loses what real users do — a crisis of context, not of polish.)*
- **Example symptom:** "The field sales team fills quotes in tunnels and parking garages. A refresh — even an accidental one — wipes the draft. 'The app eats my work' is a repeated theme in feedback. No service worker, 9 MB mobile JS. Connectivity is the enemy."
- **Blast radius:** Field/mobile productivity, data loss, user trust, engagement, app-store rating territory, growth.
- **Remediation playbook:** Quick win: add a service worker + shell caching (static shell offline), persist draft state, cut mobile payload for the core path, cache-first for static assets. Structural fix: PWA/progressive economics by design (offline-first where core), mobile perf budget (Lighthouse gate), reconnect/resume semantics (idempotent submit ties into API-09), context-tiered asset serving.
- **Gold standard / target state:** Core flows work offline (or degrade meaningfully well), draft data survives navigation, mobile perf within budget, progressive capability measured and tracked.
- **Scoring guidance:** (deep-dive — no rubric row) 3 = offline-capable, mobile-fit; 2 = partial progression; 1 = no offline, mobile over budget; 0 = connectivity-dependent data loss in user-facing flows.
- **Verify effort:** 🔷 ~1–2 days — offline experiments + mobile audit.