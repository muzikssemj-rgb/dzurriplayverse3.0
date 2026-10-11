#!/usr/bin/env bash
# Ujian hujung-ke-hujung tempatan (tanpa akaun Firebase — guna storan tempatan).
#   bash tests/e2e/run-local.sh      (perlukan Chromium Playwright; set CHROMIUM_PATH jika perlu)
set -euo pipefail
cd "$(dirname "$0")/../.."
export DZ_LOCAL_STORE=1
export DZ_LOCAL_DB_FILE="$(pwd)/.data/e2e-db.json"
export ADMIN_PASSWORD=dzurrihensem
export SITE_URL=http://localhost:3100
unset FIREBASE_SERVICE_ACCOUNT || true
rm -f "$DZ_LOCAL_DB_FILE"
npm run build
npx next start -p 3100 & NEXT=$!
trap 'kill $NEXT 2>/dev/null || true' EXIT
sleep 4
BASE_URL=http://localhost:3100 SHOT_DIR=test-results node tests/e2e/e2e.mjs
