#!/bin/sh
# Deploy the site to Cloudflare Pages (project: mat-rix1-dev, domain: mat.rix1.dev).
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir dist
cp index.html oppskrifter.html handleliste.html handleliste-data.js styles.css nav.js dist/

# Cache-busting: rename each asset to include a hash of its content and rewrite
# the references in the HTML. A changed file gets a new URL, so a browser can
# never pair fresh HTML with a stale cached script or stylesheet.
for f in styles.css nav.js handleliste-data.js; do
  h=$(shasum -a 256 "dist/$f" | cut -c1-10)
  hashed="${f%.*}.$h.${f##*.}"
  mv "dist/$f" "dist/$hashed"
  sed -i '' "s|\"$f\"|\"$hashed\"|g" dist/*.html
done

# The HTML itself must always revalidate, or old pages would keep pointing at
# old asset URLs. Clean URLs are how Pages serves these pages.
cat > dist/_headers <<'EOF'
/
  Cache-Control: no-cache
/oppskrifter
  Cache-Control: no-cache
/handleliste
  Cache-Control: no-cache
EOF

npx --yes wrangler pages deploy dist --project-name mat-rix1-dev --commit-dirty=true
