# Refresh the illustrative report screenshot

The sample is produced from the checked-in synthetic Java/Maven fixture at `apps/scanner/src/scan/__tests__/fixtures/legacy-stacks/maven-multi-module`. It is a local path scan; it does not clone a repository or contact GitHub.

## Prerequisites

- Node.js 20 or newer, installed repository dependencies, and the built scanner CLI (`npm run build:cli`). Complete dependency installation before going offline.
- Python 3 with the Playwright package, plus a local Chrome or Chromium executable. Set `CHROME_BIN` if it is not on Playwright's default path.

## Offline refresh

From the repository root, run:

```bash
docs/sample-report/refresh.sh
```

The script scans the fixture with `--strict`, writes the CLI-produced report to a temporary directory, then captures its top-level HTML report view to `docs/sample-report.png`. The capture blocks non-file browser requests and omits the report's metadata line, which contains the absolute scan path, commit, timestamp, run ID, and fingerprint. Score findings and report content are not edited or synthesized; only the metadata is excluded from the image. The generated report is temporary and is not committed.

Only update the screenshot when the report content and visible findings have been reviewed. The README labels the image illustrative because it measures the synthetic fixture, not a customer repository.
