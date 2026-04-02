#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_URL="${TARGET_URL:-https://www.lespetitesvoixduplateau.com/fr/}"
LIVE_BASE_URL="${LIVE_BASE_URL:-https://www.lespetitesvoixduplateau.com}"
WORK_DIR="${WORK_DIR:-$ROOT_DIR/.cache/httrack-fr}"
SITE_DIR="${SITE_DIR:-$ROOT_DIR/site}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
RUN_DIR="$WORK_DIR/run-$TIMESTAMP"

if ! command -v httrack >/dev/null 2>&1; then
  echo "Error: httrack is required but not installed." >&2
  exit 1
fi

mkdir -p "$RUN_DIR" "$SITE_DIR"

echo "Starting mirror from: $TARGET_URL"
httrack "$TARGET_URL" \
  -O "$RUN_DIR" \
  "+https://www.lespetitesvoixduplateau.com/fr/*" \
  "+https://www.lespetitesvoixduplateau.com/templates/*" \
  "+https://www.lespetitesvoixduplateau.com/js/*" \
  "+https://www.lespetitesvoixduplateau.com/files/*" \
  "+https://www.lespetitesvoixduplateau.com/images/*" \
  "+https://cdn.ca.yapla.com/*" \
  "+https://fonts.googleapis.com/*" \
  "+https://fonts.gstatic.com/*" \
  "+https://kit.fontawesome.com/*" \
  "+https://www.googletagmanager.com/*" \
  "-https://www.lespetitesvoixduplateau.com/fr/admin*" \
  "-https://www.lespetitesvoixduplateau.com/fr/connexion*" \
  "-https://www.lespetitesvoixduplateau.com/fr/compte*" \
  "-https://www.lespetitesvoixduplateau.com/fr/panier*" \
  "-https://www.lespetitesvoixduplateau.com/fr/mot-de-passe*" \
  "--robots=0" \
  "--near" \
  "--keep-alive" \
  "--disable-security-limits" \
  "--can-go-down" \
  "--sockets=4" \
  "--retries=2" \
  "$@"

SOURCE_TREE="$RUN_DIR/www.lespetitesvoixduplateau.com"
if [[ ! -d "$SOURCE_TREE" ]]; then
  echo "Error: expected mirrored output not found at $SOURCE_TREE" >&2
  exit 1
fi

echo "Preparing site directory: $SITE_DIR"
rm -rf "$SITE_DIR"
mkdir -p "$SITE_DIR"

# Main site files should be rooted at /fr, /templates, /js, etc.
rsync -a "$SOURCE_TREE/" "$SITE_DIR/"

# Keep mirrored third-party host folders because HTTrack rewrites many references to local copies.
while IFS= read -r -d '' external_dir; do
  rsync -a "$external_dir/" "$SITE_DIR/$(basename "$external_dir")/"
done < <(
  find "$RUN_DIR" -mindepth 1 -maxdepth 1 -type d \
    ! -name "www.lespetitesvoixduplateau.com" \
    ! -name "hts-cache" \
    -print0
)

# Replace HTTrack-generated root index with a stable redirect to /fr/.
cat > "$SITE_DIR/index.html" <<'HTML'
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=/fr/" />
    <title>Redirect</title>
    <link rel="canonical" href="/fr/" />
  </head>
  <body>
    <p>Redirecting to <a href="/fr/">/fr/</a>...</p>
  </body>
</html>
HTML

echo "Post-processing HTML for static hosting..."
while IFS= read -r -d '' file; do
  perl -0pi -e "s{(href|action)=(['\"])\/(fr\/(?:panier|donner(?:-[^\/'\"?#]*)?|inscriptions|nous-joindre|soutenir-le-choeur)(?:[^'\"#]*)?)\\2}{\$1=\$2$LIVE_BASE_URL\/\$3\$2}g" "$file"
done < <(find "$SITE_DIR" -type f -name '*.html' -print0)

# Some mirrored registration/component pages require these defaults but HTTrack may skip them.
mkdir -p "$SITE_DIR/templates/default/css" "$SITE_DIR/templates/default/image"
curl -fsSL "$LIVE_BASE_URL/templates/default/css/main-ui.css" -o "$SITE_DIR/templates/default/css/main-ui.css"
curl -fsSL "$LIVE_BASE_URL/templates/default/image/favicon.ico" -o "$SITE_DIR/templates/default/image/favicon.ico"

echo "Mirror complete."
echo "Published files location: $SITE_DIR"
echo "Suggested GitHub Pages embed URL: https://<github-user>.github.io/<repo>/fr/"
