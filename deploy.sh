#!/bin/sh
# Deploy the site to Cloudflare Pages (project: mat-rix1-dev, domain: mat.rix1.dev).
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir dist
cp index.html oppskrifter.html handleliste.html handleliste-data.js styles.css nav.js dist/
npx --yes wrangler pages deploy dist --project-name mat-rix1-dev --commit-dirty=true
