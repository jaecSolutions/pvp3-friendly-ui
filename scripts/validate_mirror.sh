#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_DIR="${SITE_DIR:-$ROOT_DIR/site}"

if [[ ! -d "$SITE_DIR/fr" ]]; then
  echo "Error: $SITE_DIR/fr does not exist. Run ./scripts/mirror_fr.sh first." >&2
  exit 1
fi

missing=0

check_path() {
  local path="$1"
  local local_path="$SITE_DIR${path}"

  if [[ -d "$local_path" && -f "$local_path/index.html" ]]; then
    return 0
  fi

  if [[ -f "$local_path" ]]; then
    return 0
  fi

  if [[ -f "$local_path.html" ]]; then
    return 0
  fi

  echo "Missing local target: $path"
  missing=$((missing + 1))
}

echo "Checking internal /fr links..."
while IFS= read -r link; do
  clean="${link%%\#*}"
  clean="${clean%%\?*}"
  check_path "$clean"
done < <(
  rg -o --no-filename 'href="/fr/[^"]*"' "$SITE_DIR/fr" -g '*.html' \
    | sed -E 's/^href="([^"]*)"$/\1/' \
    | sort -u
)

echo "Checking local stylesheet/script/image references..."
while IFS= read -r link; do
  clean="${link%%\#*}"
  clean="${clean%%\?*}"
  check_path "$clean"
done < <(
  rg -o --no-filename '(href|src)="/(fr|templates|js|images|files|font)/[^"]*"' "$SITE_DIR" -g '*.html' \
    | sed -E 's/^(href|src)="([^"]*)"$/\2/' \
    | sort -u
)

if [[ "$missing" -gt 0 ]]; then
  echo "Validation failed with $missing missing targets."
  exit 1
fi

echo "Validation passed: no missing local targets found."
