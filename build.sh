#!/usr/bin/env bash
CONF_NAME="th30z"
INDEX_HREF="/"
ng build --configuration=${CONF_NAME} --base-href=${INDEX_HREF} --source-map=false
deno run --allow-all build-feeds.ts

rm -rf dist-pages
mkdir -p dist-pages
cp -r dist/angular18/browser/* dist-pages/
cp BingSiteAuth.xml dist-pages/
cp blog.xml dist-pages/
cp sitemap.xml dist-pages/