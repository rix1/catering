#!/bin/sh
# Deploy the site to Cloudflare Pages (project: mat-rix1-dev, domain: mat.rix1.dev).
# Project name, output dir and D1-binding come from wrangler.jsonc; the
# functions/ directory (API for delt handleliste-avkryssing) deploys with it.
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir dist
cp index.html oppskrifter.html handleliste.html handleliste-data.js styles.css nav.js dist/
npx --yes wrangler pages deploy --commit-dirty=true
