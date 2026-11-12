# Security policy

LeapScore is an open-source, local-first scanner. It runs on the operator's machine
and, for a local path scan, makes no network requests. This policy covers the
scanner package and CLI (`leapscore-scan`), the GitHub Action, and the public site.

## Supported versions

| Version | Supported |
| --- | --- |
| `1.0.x` (current major tag `v1`) | ✅ security fixes |
| `< 1.0.0` | ❌ upgrade to `1.0.x` |

Security fixes land on the newest `1.0.x` release. The moving `v1` Action tag follows
the newest compatible release; pin an exact `vX.Y.Z` tag or commit SHA if you need an
immutable reference.

## Report a vulnerability privately

**Do not open a public issue for a vulnerability.**

Use GitHub's private vulnerability reporting for this repository:

<https://github.com/open-legacyleap/leapscore/security/advisories/new>

Include, where you can:

- the affected version (`npx leapscore-scan --version`, or the banner in `report.json`);
- the command or Action configuration you ran;
- a minimal reproduction, and the impact you believe it has;
- whether the issue is already public anywhere.

If private reporting is unavailable to you, email the maintainers at
<security@leapscore.dev> and say that you are reporting a vulnerability. Do not send
customer code, secrets, or absolute paths; a sanitized reproduction is enough.

## What to expect

- **Acknowledgement** within 3 business days.
- **Initial assessment** within 10 business days, with a severity and a plan.
- **Fix and disclosure** coordinated with you; we will credit you unless you ask us
  not to. We publish an advisory once a fixed release is available.
- We will not ask you to keep a confirmed vulnerability secret indefinitely. If we
  cannot agree on a disclosure date, we will state our reasoning in the advisory.

No bug bounty is offered, and no response SLA is promised for non-security issues.

## Scope

**In scope:**

- the scanner package and CLI (`leapscore-scan`): local scan, `--repo` remote scan,
  `--strict` offline mode, report and badge emission;
- the GitHub Action (`action/`) and its checkout-first runner;
- the public site (`apps/site`) at <https://leapscore.dev>, including the assessment
  route and report rendering.

**Out of scope:**

- third-party dependencies — report those to the upstream project, though we will
  take a fix or a pin;
- findings that require a compromised local machine, a malicious `node`, `git`, or
  shell on `PATH`, or an attacker who already controls the repository being scanned;
- the content of a scanned codebase, and any score or band it produces;
- social engineering, denial of service against a third-party host, and reports
  generated only by automated scanners without a demonstrated impact.

## Safe harbour

We will not pursue legal action against good-faith research that follows this
policy, avoids privacy violations and data destruction, and gives us a reasonable
window to fix the issue before public disclosure.
