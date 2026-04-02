# Les Petites Voix du Plateau `/fr` Mirror for Google Sites

This repo builds a static mirror of:

- `https://www.lespetitesvoixduplateau.com/fr/`

The output is generated into `site/` so it can be published with GitHub Pages and embedded into Google Sites.

## Requirements

- `httrack` (already available on this machine)
- `rsync`
- `perl`
- `curl`

## Build The Mirror

Run:

```bash
./scripts/mirror_fr.sh
./scripts/validate_mirror.sh
```

Optional:

```bash
# Override defaults
TARGET_URL="https://www.lespetitesvoixduplateau.com/fr/" \
LIVE_BASE_URL="https://www.lespetitesvoixduplateau.com" \
./scripts/mirror_fr.sh

# Pass extra HTTrack flags if needed
./scripts/mirror_fr.sh --depth=3
```

What this does:

1. Crawls `/fr/*` and required assets with `httrack`.
2. Writes final static output to `site/`.
3. Rewrites selected dynamic routes (`panier`, `donner*`, `inscriptions`, `nous-joindre`, `soutenir-le-choeur`) so those actions still open the live site.

## Publish To GitHub Pages (main branch + /site)

Use one standard convention:

1. Push this repo to GitHub.
2. In GitHub: `Settings` -> `Pages`
3. Set:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/site`
4. Save and wait for deployment.

Final URL pattern:

- `https://<github-user>.github.io/<repo>/fr/`

Embed that URL in Google Sites:

1. In Google Sites, choose `Insert` -> `Embed` -> `By URL`.
2. Paste the GitHub Pages URL above.
3. Resize the embed block and publish.

## Refresh / Maintenance Workflow

Use this sequence each refresh cycle:

```bash
./scripts/mirror_fr.sh
git status
git add -A
git commit -m "Refresh mirrored /fr site"
git push
```

Recommended cadence:

- Monthly, or
- Right before major concerts/events/registration periods.

## Validation Checklist

After each refresh:

1. Open `site/fr/` pages in a static server and check navigation.
2. Verify CSS, images, and fonts load.
3. Confirm dynamic actions (contact/donation/cart/newsletter) open the live domain.
4. Verify embedded page renders correctly in Google Sites on desktop and mobile.

Quick local preview:

```bash
cd site
python3 -m http.server 8080
# open http://localhost:8080/fr/
```
