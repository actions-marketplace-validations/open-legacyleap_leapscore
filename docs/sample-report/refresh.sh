#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
FIXTURE="$ROOT_DIR/apps/scanner/src/scan/__tests__/fixtures/legacy-stacks/maven-multi-module"
OUT_DIR="$(mktemp -d)"
trap 'rm -rf "$OUT_DIR"' EXIT HUP INT TERM

node "$ROOT_DIR/apps/scanner/dist/leapscore-scan.mjs" scan "$FIXTURE" --out "$OUT_DIR" --strict
python3 "$ROOT_DIR/docs/sample-report/capture.py" \
  "$OUT_DIR/report.html" "$ROOT_DIR/docs/sample-report.png"
