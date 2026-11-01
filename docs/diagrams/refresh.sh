#!/bin/sh
set -eu

# Re-render every diagram spec and report whether the committed viewer still matches.
# Never rewrites a committed artifact: a DIFF means review the spec, re-render
# deliberately, and commit the pair together.
ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
DIAGRAMS_DIR="$ROOT_DIR/docs/diagrams"
ARCHIFY="${ARCHIFY:-archify}"
OUT_DIR="$(mktemp -d)"
trap 'rm -rf "$OUT_DIR"' EXIT HUP INT TERM

if ! command -v "$ARCHIFY" >/dev/null 2>&1; then
  echo "error: archify 3.2.0 is required on PATH (or set ARCHIFY=/path/to/archify.mjs)" >&2
  exit 2
fi

cd "$ROOT_DIR"

matched=0
differed=0
for spec in "$DIAGRAMS_DIR"/*.json; do
  stem="$(basename "$spec" .json)"
  type="${stem%%-*}"
  rendered="$OUT_DIR/$stem.html"
  "$ARCHIFY" render "$type" "$spec" "$rendered" --quality showcase --repo-root . >/dev/null
  if cmp -s "$rendered" "$DIAGRAMS_DIR/$stem.html"; then
    echo "MATCH $stem"
    matched=$((matched + 1))
  else
    echo "DIFF  $stem (re-render, review, and commit both files)"
    differed=$((differed + 1))
  fi
done

echo "$matched matched, $differed differed"
[ "$differed" -eq 0 ]
